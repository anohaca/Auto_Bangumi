import logging
import re

from module.conf import settings
from module.models import Bangumi
from module.models.bangumi import Episode
from module.parser.analyser import (
    OpenAIParser,
    mikan_parser,
    raw_parser,
    tmdb_parser,
    torrent_parser,
)

logger = logging.getLogger(__name__)


class TitleParser:
    def __init__(self):
        pass

    @staticmethod
    def torrent_title_parser(raw: str) -> str:
        text = re.sub(r"^\s*\[[^\]]+\]\s*", "", str(raw or "")).strip()
        matches = list(
            re.finditer(
                r"\s+-\s+(\d+(?:\.\d+)?)(?:v\d+)?"
                r"(?=\s*(?:\[|\.(?:torrent|mkv|mp4)|$))",
                text,
                re.IGNORECASE,
            )
        )
        if matches:
            text = text[: matches[-1].start()].strip()
        candidates = [
            candidate.strip()
            for candidate in re.split(r"\s+-\s+", text)
            if candidate.strip()
        ]
        cjk_candidates = [
            candidate
            for candidate in candidates
            if re.search(r"[\u3400-\u9fff\u3040-\u30ff]", candidate)
        ]
        return (cjk_candidates[-1] if cjk_candidates else text).strip()

    @staticmethod
    def torrent_episode_parser(raw: str) -> float | None:
        matches = list(
            re.finditer(
                r"\s+-\s+(\d+(?:\.\d+)?)(?:v\d+)?"
                r"(?=\s*(?:\[|\.(?:torrent|mkv|mp4)|$))",
                str(raw or ""),
                re.IGNORECASE,
            )
        )
        return float(matches[-1].group(1)) if matches else None

    @staticmethod
    def torrent_parser(
        torrent_path: str,
        torrent_name: str | None = None,
        season: int | None = None,
        file_type: str = "media",
    ):
        try:
            return torrent_parser(torrent_path, torrent_name, season, file_type)
        except Exception as e:
            logger.warning(f"Cannot parse {torrent_path} with error {e}")

    @staticmethod
    def tmdb_parser(
        title: str,
        season: int,
        language: str,
        episode_number: int | None = None,
    ):
        tmdb_info = tmdb_parser(
            title,
            language,
            season_number=season,
            episode_number=episode_number,
        )
        if tmdb_info:
            logger.debug(f"TMDB Matched, official title is {tmdb_info.title}")
            tmdb_season = tmdb_info.last_season if tmdb_info.last_season else season
            return (
                tmdb_info.title,
                tmdb_season,
                tmdb_info.year,
                tmdb_info.poster_link,
                tmdb_info.poster_source_link,
            )
        else:
            logger.warning(f"Cannot match {title} in TMDB. Use raw title instead.")
            logger.warning("Please change bangumi info manually.")
            return title, season, None, None, None

    @staticmethod
    def tmdb_poster_parser(bangumi: Bangumi):
        tmdb_info = tmdb_parser(bangumi.official_title, settings.rss_parser.language)
        if tmdb_info:
            logger.debug(f"TMDB Matched, official title is {tmdb_info.title}")
            bangumi.poster_link = tmdb_info.poster_link
            bangumi.poster_source_link = tmdb_info.poster_source_link
        else:
            logger.warning(
                f"Cannot match {bangumi.official_title} in TMDB. Use raw title instead."
            )
            logger.warning("Please change bangumi info manually.")

    @staticmethod
    def raw_parser(raw: str) -> Bangumi | None:
        language = settings.rss_parser.language
        try:
            # use OpenAI ChatGPT to parse raw title and get structured data
            if settings.experimental_openai.enable:
                kwargs = settings.experimental_openai.dict(exclude={"enable"})
                gpt = OpenAIParser(**kwargs)
                episode_dict = gpt.parse(raw, asdict=True)
                episode = Episode(**episode_dict)
            else:
                episode = raw_parser(raw)

            titles = {
                "zh": episode.title_zh,
                "en": episode.title_en,
                "jp": episode.title_jp,
            }
            title_raw = episode.title_en if episode.title_en else episode.title_zh
            if titles[language]:
                official_title = titles[language]
            elif titles["zh"]:
                official_title = titles["zh"]
            elif titles["en"]:
                official_title = titles["en"]
            elif titles["jp"]:
                official_title = titles["jp"]
            else:
                official_title = title_raw
            _season = episode.season
            logger.debug(f"RAW:{raw} >> {title_raw}")
            return Bangumi(
                official_title=official_title,
                title_raw=title_raw,
                season=_season,
                season_raw=episode.season_raw,
                group_name=episode.group,
                dpi=episode.resolution,
                source=episode.source,
                subtitle=episode.sub,
                eps_collect=False if episode.episode > 1 else True,
                offset=0,
                filter=",".join(settings.rss_parser.filter),
            )
        except Exception as e:
            logger.debug(e)
            logger.warning(f"Cannot parse {raw}.")
            return None

    @staticmethod
    def mikan_parser(homepage: str) -> tuple[str, str]:
        return mikan_parser(homepage)
