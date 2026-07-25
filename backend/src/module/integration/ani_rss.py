import asyncio
from difflib import SequenceMatcher
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

logger = logging.getLogger(__name__)


class AniRssMetadataCache:
    cache_path = Path("data/ani-rss-metadata-cache.json")
    cache_lock = threading.Lock()
    refresh_lock = asyncio.Lock()
    success_ttl = 30 * 86400
    failure_ttl = 6 * 3600
    minimum_match_score = 45

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

    @classmethod
    def _score(cls, candidate: dict[str, Any], rule) -> int:
        targets = {
            cls._normalize(rule.official_title),
            cls._normalize(rule.title_raw),
            cls._normalize(rule.rule_name),
        }
        targets.discard("")
        names = {
            cls._normalize(candidate.get("name")),
            cls._normalize(candidate.get("nameCn")),
        }
        names.discard("")
        score = 100 if names & targets else 0
        for name in names:
            for target in targets:
                if name in target or target in name:
                    score = max(score, 70)
                score = max(
                    score,
                    round(SequenceMatcher(None, name, target).ratio() * 100),
                )
        if rule.year and str(candidate.get("date", "")).startswith(str(rule.year)):
            score += 8
        if rule.season and int(candidate.get("season") or 0) == int(rule.season):
            score += 8
        candidate_title = " ".join(
            str(candidate.get(key) or "") for key in ("name", "nameCn")
        )
        if int(rule.season or 1) == 2 and re.search(
            r"(?:续|續|続|第\s*二|第\s*2|season\s*2|2nd|(?:^|\W)ii(?:\W|$))",
            unicodedata.normalize("NFKC", candidate_title),
            re.IGNORECASE,
        ):
            score += 12
        return score

    @classmethod
    def _query_rule(cls, rule) -> dict[str, Any]:
        queries = list(
            dict.fromkeys(
                value
                for value in [rule.official_title, rule.title_raw, rule.rule_name]
                if value
            )
        )
        candidate = None
        candidate_score = -1
        for query in queries:
            items = cls._post("searchBgm?name=" + quote(query))
            items = items if isinstance(items, list) else []
            query_best = None
            query_best_score = -1
            for item in items:
                score = cls._score(item, rule)
                if score > query_best_score:
                    query_best = item
                    query_best_score = score
                if score > candidate_score:
                    candidate = item
                    candidate_score = score
            logger.info(
                "[ANI-RSS Match] rule=%s query=%r candidates=%d best=%r score=%d",
                rule.id,
                query,
                len(items),
                (query_best or {}).get("nameCn")
                or (query_best or {}).get("name")
                or "-",
                query_best_score,
            )
            if candidate_score >= 100:
                break
        if not candidate or candidate_score < cls.minimum_match_score:
            logger.warning(
                "[ANI-RSS Match] rule=%s title=%r rejected: best=%r score=%d",
                rule.id,
                rule.official_title,
                (candidate or {}).get("nameCn")
                or (candidate or {}).get("name")
                or "-",
                candidate_score,
            )
            raise LookupError("not found")
        logger.info(
            "[ANI-RSS Match] rule=%s title=%r selected id=%s name=%r score=%d",
            rule.id,
            rule.official_title,
            candidate.get("id"),
            candidate.get("nameCn") or candidate.get("name"),
            candidate_score,
        )
        detail = cls._post("getAniBySubjectId?id=" + quote(str(candidate["id"]))) or {}
        release_date = detail.get("releaseDate") or candidate.get("date") or ""
        if (
            int(rule.season or 1) == 1
            and rule.year
            and release_date
            and not str(release_date).startswith(str(rule.year))
        ):
            logger.warning(
                "[ANI-RSS Match] rule=%s id=%s rejected: release year %s != %s",
                rule.id,
                candidate.get("id"),
                str(release_date)[:4],
                rule.year,
            )
            raise LookupError("release year mismatch")
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
