import asyncio
import json
import logging
import os
import re
import threading
import time
import unicodedata
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests

from module.database import Database
from module.parser.analyser import tmdb_parser

logger = logging.getLogger(__name__)


class AniRssMetadataCache:
    cache_path = Path("data/ani-rss-metadata-cache.json")
    cache_lock = threading.Lock()
    refresh_lock = asyncio.Lock()
    success_ttl = 30 * 86400
    failure_ttl = 6 * 3600

    @classmethod
    def _origin(cls) -> str:
        return os.getenv("ANI_RSS_ORIGIN", "http://192.168.64.1:7789").rstrip("/")

    @staticmethod
    def _normalize(value: Any) -> str:
        text = unicodedata.normalize("NFKC", str(value or "")).lower()
        text = re.sub(r"\[(?:tmdbid=)?\d+\]", "", text)
        text = re.sub(r"\((?:19|20)\d{2}\)", "", text)
        text = re.sub(r"(?:season|part|第)\s*[0-9ivx]+\s*(?:季|部)?", "", text)
        return re.sub(r"[\s\-_:~!,.'\"：·・～！？，。]", "", text)

    @classmethod
    def _rule_key(cls, rule) -> str:
        return ":".join(
            [
                str(rule.id),
                cls._normalize(rule.official_title),
                cls._normalize(rule.title_raw),
                str(rule.season or 1),
                str(rule.year or ""),
            ]
        )

    @classmethod
    def _load(cls) -> dict[str, Any]:
        with cls.cache_lock:
            try:
                return json.loads(cls.cache_path.read_text(encoding="utf-8"))
            except (FileNotFoundError, json.JSONDecodeError):
                return {"entries": {}}

    @classmethod
    def _save(cls, cache: dict[str, Any]) -> None:
        with cls.cache_lock:
            cls.cache_path.parent.mkdir(parents=True, exist_ok=True)
            temporary = cls.cache_path.with_suffix(".tmp")
            temporary.write_text(
                json.dumps(cache, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )
            temporary.replace(cls.cache_path)

    @classmethod
    def _post(cls, path: str) -> Any:
        response = requests.post(cls._origin() + "/api/" + path, timeout=8)
        response.raise_for_status()
        result = response.json()
        if not 200 <= int(result.get("code", 500)) < 300:
            raise RuntimeError(result.get("message") or "ANI-RSS request failed")
        return result.get("data")

    @staticmethod
    def _exact_text(value: Any) -> str:
        return unicodedata.normalize("NFKC", str(value or "")).strip()

    @classmethod
    def _tmdb_original_title(cls, rule) -> str:
        for title in (rule.official_title, rule.title_raw):
            if not title:
                continue
            try:
                info = tmdb_parser(title, "jp", test=True)
            except Exception as exc:
                logger.warning(
                    "[ANI-RSS Match] rule=%s TMDB query=%r failed: %s",
                    rule.id,
                    title,
                    exc,
                )
                continue
            if info and info.original_title:
                logger.info(
                    "[ANI-RSS Match] rule=%s TMDB query=%r original=%r",
                    rule.id,
                    title,
                    info.original_title,
                )
                return info.original_title
            logger.info(
                "[ANI-RSS Match] rule=%s TMDB query=%r has no original title",
                rule.id,
                title,
            )
        return ""

    @classmethod
    def _search_exact(
        cls, rule, query: str, candidate_field: str, stage: str
    ) -> dict[str, Any] | None:
        items = cls._post("searchBgm?name=" + quote(query))
        items = items if isinstance(items, list) else []
        expected = cls._exact_text(query)
        matches = [
            item
            for item in items
            if cls._exact_text(item.get(candidate_field)) == expected
        ]
        logger.info(
            "[ANI-RSS Match] rule=%s stage=%s query=%r candidates=%d exact=%d",
            rule.id,
            stage,
            query,
            len(items),
            len(matches),
        )
        return matches[0] if matches else None

    @classmethod
    def _query_rule(cls, rule) -> dict[str, Any]:
        chinese_queries = list(
            dict.fromkeys(
                value
                for value in [rule.official_title, rule.title_raw, rule.rule_name]
                if value and re.search(r"[\u3400-\u9fff]", value)
            )
        )
        candidate = None
        matched_stage = ""
        for query in chinese_queries:
            candidate = cls._search_exact(rule, query, "nameCn", "chinese")
            if candidate:
                matched_stage = "chinese"
                break

        if not candidate:
            japanese_title = cls._tmdb_original_title(rule)
            if japanese_title:
                candidate = cls._search_exact(
                    rule, japanese_title, "name", "tmdb-japanese"
                )
                if candidate:
                    matched_stage = "tmdb-japanese"

        if not candidate:
            logger.warning(
                "[ANI-RSS Match] rule=%s title=%r rejected: no exact Chinese or TMDB Japanese match",
                rule.id,
                rule.official_title,
            )
            raise LookupError("not found")
        logger.info(
            "[ANI-RSS Match] rule=%s title=%r selected id=%s name=%r stage=%s",
            rule.id,
            rule.official_title,
            candidate.get("id"),
            candidate.get("nameCn") or candidate.get("name"),
            matched_stage,
        )
        detail = cls._post("getAniBySubjectId?id=" + quote(str(candidate["id"]))) or {}
        release_date = detail.get("releaseDate") or candidate.get("date") or ""
        week_label = detail.get("weekLabel") or ""
        if not week_label and release_date:
            from datetime import date

            parsed = date.fromisoformat(str(release_date)[:10])
            week_label = [
                "星期一",
                "星期二",
                "星期三",
                "星期四",
                "星期五",
                "星期六",
                "星期日",
            ][parsed.weekday()]
        logger.info(
            "[ANI-RSS Match] rule=%s id=%s release=%s weekday=%s",
            rule.id,
            candidate.get("id"),
            release_date or "-",
            week_label or "unknown",
        )
        return {
            **detail,
            "bgmId": str(candidate["id"]),
            "bgmName": candidate.get("name"),
            "title": candidate.get("nameCn")
            or detail.get("title")
            or candidate.get("name"),
            "jpTitle": candidate.get("name") or detail.get("jpTitle"),
            "season": detail.get("season") or candidate.get("season"),
            "score": detail.get("score")
            or (candidate.get("rating") or {}).get("score")
            or 0,
            "image": detail.get("image")
            or (candidate.get("images") or {}).get("large")
            or "",
            "releaseDate": release_date,
            "weekLabel": week_label,
            "cachedAt": int(time.time()),
        }

    @classmethod
    def _query_with_retry(cls, rule) -> dict[str, Any]:
        error = None
        for attempt in range(2):
            try:
                return cls._query_rule(rule)
            except LookupError:
                raise
            except Exception as exc:
                error = exc
                if attempt == 0:
                    time.sleep(0.8)
        raise error

    @classmethod
    async def get_all(cls, force: bool = False) -> dict[str, Any]:
        async with cls.refresh_lock:
            with Database() as database:
                rules = database.bangumi.search_all()
                rule_payloads = [rule.dict() for rule in rules]
            cache = cls._load()
            entries = cache.setdefault("entries", {})
            now = int(time.time())
            missing = []
            for rule in rules:
                key = cls._rule_key(rule)
                entry = entries.get(key)
                ttl = cls.failure_ttl if entry and entry.get("notFound") else cls.success_ttl
                if force or not entry or now - int(entry.get("cachedAt", 0)) >= ttl:
                    missing.append((rule, key))

            semaphore = asyncio.Semaphore(2)

            async def refresh(rule, key):
                async with semaphore:
                    try:
                        metadata = await asyncio.to_thread(cls._query_with_retry, rule)
                        logger.info(
                            "[ANI-RSS Cache] %s -> %s",
                            rule.official_title,
                            metadata.get("weekLabel") or "unknown",
                        )
                    except Exception as exc:
                        metadata = {
                            "notFound": True,
                            "error": str(exc),
                            "cachedAt": int(time.time()),
                        }
                        logger.warning(
                            "[ANI-RSS Cache] Cannot resolve %s: %s",
                            rule.official_title,
                            exc,
                        )
                    entries[key] = metadata
                    cls._save(cache)

            logger.info(
                "[ANI-RSS Cache] %d rules, %d cache hits, %d to refresh",
                len(rules),
                len(rules) - len(missing),
                len(missing),
            )
            await asyncio.gather(*(refresh(rule, key) for rule, key in missing))
            items = []
            for rule, payload in zip(rules, rule_payloads):
                items.append(
                    {
                        "rule": payload,
                        "metadata": entries.get(cls._rule_key(rule), {}),
                    }
                )
            result = {
                "items": items,
                "cached": len(items) - len(missing),
                "refreshed": len(missing),
                "updatedAt": int(time.time()),
            }
            logger.info(
                "[ANI-RSS Cache] Ready: %d items (%d resolved)",
                len(items),
                sum(not item["metadata"].get("notFound") for item in items),
            )
            return result
