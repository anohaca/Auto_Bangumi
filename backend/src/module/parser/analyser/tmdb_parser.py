import re
import time
from dataclasses import dataclass
from datetime import date

from module.conf import TMDB_API
from module.network import RequestContent
from module.utils import save_image

TMDB_URL = "https://api.themoviedb.org"


@dataclass
class TMDBInfo:
    id: int
    title: str
    original_title: str
    season: list[dict]
    last_season: int
    year: str
    poster_link: str = None
    score: float = 0


LANGUAGE = {"zh": "zh-CN", "jp": "ja-JP", "en": "en-US"}


def search_url(e, language="zh"):
    return (
        f"{TMDB_URL}/3/search/tv?api_key={TMDB_API}&page=1&query={e}"
        f"&include_adult=false&language={LANGUAGE[language]}"
    )


def info_url(e, key):
    return f"{TMDB_URL}/3/tv/{e}?api_key={TMDB_API}&language={LANGUAGE[key]}"


def season_info_url(tv_id, season_number, language="zh"):
    return (
        f"{TMDB_URL}/3/tv/{tv_id}/season/{season_number}"
        f"?api_key={TMDB_API}&language={LANGUAGE[language]}"
    )


def tmdb_season_parser(tv_id, season_number, language="zh") -> dict:
    with RequestContent() as req:
        return req.get_json(season_info_url(tv_id, season_number, language))


def is_animation(tv_id, language) -> bool:
    url_info = info_url(tv_id, language)
    with RequestContent() as req:
        type_id = req.get_json(url_info)["genres"]
        for type in type_id:
            if type.get("id") == 16:
                return True
    return False


def _normalized_title(title: str | None) -> str:
    return re.sub(r"\s+", "", str(title or "")).casefold()


def _is_animation_candidate(content: dict, language: str) -> bool:
    genre_ids = content.get("genre_ids")
    if isinstance(genre_ids, list):
        return 16 in genre_ids
    return is_animation(content["id"], language)


def _episode_air_date(
    tv_id: int,
    season_number: int,
    episode_number: int,
    language: str,
) -> date | None:
    season = tmdb_season_parser(tv_id, season_number, language)
    for episode in season.get("episodes") or []:
        if episode.get("episode_number") != episode_number:
            continue
        air_date = episode.get("air_date")
        if air_date:
            return date.fromisoformat(str(air_date)[:10])
    return None


def select_tmdb_candidate(
    contents: list[dict],
    title: str,
    language: str,
    season_number: int | None = None,
    episode_number: int | None = None,
    reference_date: date | None = None,
) -> dict | None:
    """Keep the old match unless multiple animated candidates need disambiguation."""
    animated = [
        content for content in contents if _is_animation_candidate(content, language)
    ]
    if not animated:
        return None
    if len(animated) == 1 or not season_number or not episode_number:
        normalized_title = _normalized_title(title)
        return min(
            animated,
            key=lambda content: _normalized_title(content.get("name"))
            != normalized_title,
        )

    observed = reference_date or date.today()
    dated_candidates = []
    for content in animated:
        try:
            air_date = _episode_air_date(
                content["id"], season_number, episode_number, language
            )
        except (KeyError, TypeError, ValueError):
            air_date = None
        if air_date is not None:
            dated_candidates.append((abs((observed - air_date).days), content, air_date))

    if dated_candidates:
        dated_candidates.sort(
            key=lambda item: (
                item[0],
                _normalized_title(item[1].get("name")) != _normalized_title(title),
            )
        )
        return dated_candidates[0][1]

    normalized_title = _normalized_title(title)
    return min(
        animated,
        key=lambda content: _normalized_title(content.get("name")) != normalized_title,
    )


def get_season(seasons: list) -> tuple[int, str]:
    ss = [s for s in seasons if s["air_date"] is not None and "特别" not in s["season"]]
    ss = sorted(ss, key=lambda e: e.get("air_date"), reverse=True)
    for season in ss:
        if re.search(r"第 \d 季", season.get("season")) is not None:
            date = season.get("air_date").split("-")
            [year, _, _] = date
            now_year = time.localtime().tm_year
            if int(year) <= now_year:
                return int(re.findall(r"\d", season.get("season"))[0]), season.get(
                    "poster_path"
                )
    return len(ss), ss[-1].get("poster_path")


def tmdb_parser(
    title,
    language,
    test: bool = False,
    season_number: int | None = None,
    episode_number: int | None = None,
    reference_date: date | None = None,
) -> TMDBInfo | None:
    with RequestContent() as req:
        url = search_url(title, language)
        contents = req.get_json(url).get("results")
        if contents.__len__() == 0:
            url = search_url(title.replace(" ", ""), language)
            contents = req.get_json(url).get("results")
        # 判断动画
        if contents:
            selected = select_tmdb_candidate(
                contents,
                title,
                language,
                season_number,
                episode_number,
                reference_date,
            )
            if not selected:
                return None
            id = selected["id"]
            url_info = info_url(id, language)
            info_content = req.get_json(url_info)
            season = [
                {
                    "season": s.get("name"),
                    "season_number": s.get("season_number"),
                    "air_date": s.get("air_date"),
                    "episode_count": s.get("episode_count"),
                    "poster_path": s.get("poster_path"),
                }
                for s in info_content.get("seasons")
            ]
            last_season, poster_path = get_season(season)
            if poster_path is None:
                poster_path = info_content.get("poster_path")
            original_title = info_content.get("original_name")
            official_title = info_content.get("name")
            year_number = info_content.get("first_air_date").split("-")[0]
            if poster_path:
                if not test:
                    img = req.get_content(f"https://image.tmdb.org/t/p/w780{poster_path}")
                    poster_link = save_image(img, "jpg")
                else:
                    poster_link = "https://image.tmdb.org/t/p/w780" + poster_path
            else:
                poster_link = None
            return TMDBInfo(
                id,
                official_title,
                original_title,
                season,
                last_season,
                str(year_number),
                poster_link,
                float(info_content.get("vote_average") or 0),
            )
        else:
            return None


if __name__ == "__main__":
    print(tmdb_parser("魔法禁书目录", "zh"))
