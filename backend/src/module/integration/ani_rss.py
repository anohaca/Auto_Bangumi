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

import requests

from module.database import Database
from module.parser.analyser import tmdb_parser, tmdb_season_parser

logger = logging.getLogger(__name__)


class AniRssMetadataCache:
    cache_path = Path("data/ani-rss-metadata-cache.json")
    cache_lock = threading.Lock()
    refresh_lock = asyncio.Lock()
    success_ttl = 30 * 86400
    failure_ttl = 6 * 3600
    ani_rss_timeout = 8
    ani_rss_match_version = 2

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
    def _ani_rss_origin(cls) -> str:
        return os.getenv("ANI_RSS_ORIGIN", "http://192.168.64.1:7789").rstrip("/")

    @classmethod
    def _ani_rss_post(cls, path: str) -> Any:
        error = None
        for attempt in range(2):
            try:
                with requests.Session() as session:
                    session.trust_env = False
                    response = session.post(
                        f"{cls._ani_rss_origin()}/api/{path}",
                        timeout=cls.ani_rss_timeout,
                    )
                response.raise_for_status()
                payload = response.json()
                if not 200 <= int(payload.get("code") or 0) < 300:
                    raise LookupError(
                        payload.get("message") or "ANI-RSS request failed"
                    )
                return payload.get("data")
            except (requests.RequestException, ValueError) as exc:
                error = exc
                if attempt == 0:
                    time.sleep(0.7)
        raise error

    @classmethod
    def _exact_candidate(
        cls, candidates: Any, field: str, expected: str, season: int
    ) -> dict | None:
        exact = [
            candidate
            for candidate in (candidates if isinstance(candidates, list) else [])
            if str(candidate.get(field) or "") == expected
        ]
        if not exact:
            return None
        return next(
            (
                candidate
                for candidate in exact
                if int(candidate.get("season") or 1) == season
            ),
            exact[0],
        )

    @classmethod
    def _query_ani_rss(cls, rule, jp_title: str = "") -> dict[str, Any]:
        season = int(rule.season or 1)
        chinese_title = str(rule.official_title or "")
        candidates = cls._ani_rss_post(
            f"searchBgm?name={requests.utils.quote(chinese_title)}"
        )
        selected = cls._exact_candidate(
            candidates, "nameCn", chinese_title, season
        )
        matched_by = "中文"

        if selected is None and jp_title:
            candidates = cls._ani_rss_post(
                f"searchBgm?name={requests.utils.quote(jp_title)}"
            )
            selected = cls._exact_candidate(candidates, "name", jp_title, season)
            matched_by = "日文"

        if selected is None:
            raise LookupError("ANI-RSS not found")

        detail = cls._ani_rss_post(
            f"getAniBySubjectId?id={requests.utils.quote(str(selected['id']))}"
        ) or {}
        return {
            "bgmId": int(selected["id"]),
            "bgmName": selected.get("name") or "",
            "score": float(detail.get("score") or 0),
            "currentEpisodeNumber": int(detail.get("currentEpisodeNumber") or 0),
            "totalEpisodeNumber": int(detail.get("totalEpisodeNumber") or 0),
            "matchedBy": matched_by,
        }

    @classmethod
    def _verify_with_ani_rss(
        cls, metadata: dict[str, Any], rule
    ) -> dict[str, Any]:
        total = int(metadata.get("totalEpisodeNumber") or 0)
        score = float(metadata.get("score") or 0)
        if total >= 12 and score > 0:
            return metadata

        verified = cls._query_ani_rss(rule, str(metadata.get("jpTitle") or ""))
        metadata["bgmId"] = verified["bgmId"]
        metadata["bgmName"] = verified["bgmName"]
        metadata["aniRssMatchedBy"] = verified["matchedBy"]
        if score <= 0 and verified["score"] > 0:
            metadata["score"] = round(verified["score"], 1)
        if total < 12 and verified["totalEpisodeNumber"] > 0:
            metadata["totalEpisodeNumber"] = verified["totalEpisodeNumber"]
        metadata["aniRssCheckedAt"] = int(time.time())
        metadata["aniRssMatchVersion"] = cls.ani_rss_match_version
        logger.info(
            "[Calendar] ANI-RSS verified by %s: %s | episodes %s -> %s | score %s -> %s",
            verified["matchedBy"],
            rule.official_title,
            total or "未知",
            metadata.get("totalEpisodeNumber") or "未知",
            score or "无",
            metadata.get("score") or "无",
        )
        return metadata

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
    def _query_rule(cls, rule) -> dict[str, Any]:
        info = tmdb_parser(rule.official_title, "zh", test=True)
        if not info:
            raise LookupError("not found")

        season_number = int(rule.season or 1)
        season = next(
            (
                item
                for item in info.season
                if int(item.get("season_number") or -1) == season_number
            ),
            None,
        )
        release_date = (season or {}).get("air_date") or ""
        if not release_date:
            raise LookupError(f"TMDB season {season_number} has no air date")

        from datetime import date

        parsed = date.fromisoformat(str(release_date)[:10])
        season_details = tmdb_season_parser(info.id, season_number, "zh") or {}
        episodes = season_details.get("episodes") or []
        today = date.today()
        aired_episode_count = sum(
            1
            for episode in episodes
            if episode.get("air_date")
            and date.fromisoformat(str(episode["air_date"])[:10]) <= today
        )
        total_episode_count = int(
            (season or {}).get("episode_count") or len(episodes) or 0
        )
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
            "[TMDB Calendar] %s -> %s | %s | %s",
            rule.official_title,
            info.title,
            week_label or "未确定星期",
            f"TMDB S{season_number} {release_date}",
        )
        metadata = {
            "tmdbId": str(info.id),
            "title": info.title,
            "jpTitle": info.original_title,
            "season": season_number,
            "score": round(float(getattr(info, "score", 0) or 0), 1),
            "currentEpisodeNumber": aired_episode_count,
            "totalEpisodeNumber": total_episode_count or None,
            "image": info.poster_link or "",
            "releaseDate": release_date,
            "weekLabel": week_label,
            "cachedAt": int(time.time()),
        }
        if total_episode_count < 12 or not metadata["score"]:
            try:
                metadata = cls._verify_with_ani_rss(metadata, rule)
            except Exception as exc:
                metadata["aniRssCheckedAt"] = int(time.time())
                metadata["aniRssMatchVersion"] = cls.ani_rss_match_version
                metadata["aniRssError"] = str(exc)
                logger.warning(
                    "[Calendar] ANI-RSS verification failed: %s (%s)",
                    rule.official_title,
                    exc,
                )
        return metadata

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
                missing_episode_metadata = (
                    entry
                    and not entry.get("notFound")
                    and (
                        "currentEpisodeNumber" not in entry
                        or "totalEpisodeNumber" not in entry
                        or "score" not in entry
                    )
                )
                needs_ani_verification = (
                    entry
                    and not entry.get("notFound")
                    and (
                        int(entry.get("totalEpisodeNumber") or 0) < 12
                        or not float(entry.get("score") or 0)
                        or "aniRssCheckedAt" in entry
                    )
                    and entry.get("aniRssMatchVersion")
                    != cls.ani_rss_match_version
                )
                if (
                    force
                    or not entry
                    or missing_episode_metadata
                    or needs_ani_verification
                    or now - int(entry.get("cachedAt", 0)) >= ttl
                ):
                    missing.append((rule, key))

            semaphore = asyncio.Semaphore(2)

            async def refresh(rule, key):
                async with semaphore:
                    try:
                        metadata = await asyncio.to_thread(cls._query_with_retry, rule)
                    except Exception as exc:
                        metadata = {
                            "notFound": True,
                            "error": str(exc),
                            "cachedAt": int(time.time()),
                        }
                        logger.warning(
                            "[TMDB Calendar] %s -> 未匹配 (%s)",
                            rule.official_title,
                            exc,
                        )
                    entries[key] = metadata
                    cls._save(cache)

            logger.info(
                "[TMDB Calendar] %d rules, %d cache hits, %d to refresh",
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
                "[TMDB Calendar] Ready: %d items (%d resolved)",
                len(items),
                sum(not item["metadata"].get("notFound") for item in items),
            )
            return result
