import re
import unicodedata
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from module.downloader import DownloadClient
from module.manager import TorrentManager
from module.models import APIResponse, Bangumi, BangumiUpdate, DownloadedEpisode
from module.parser import TitleParser
from module.security.api import UNAUTHORIZED, get_current_user

from .response import u_response

router = APIRouter(prefix="/bangumi", tags=["bangumi"])


def _normalized_match_text(value: str | None) -> str:
    text = unicodedata.normalize("NFKC", str(value or "")).casefold()
    return re.sub(r"[^0-9a-z\u4e00-\u9fff\u3040-\u30ff]", "", text)


def _match_rule_torrents(
    bangumi: Bangumi,
    torrents: list,
    generated_path: str,
    seed_titles: list[str] | None = None,
):
    candidate_paths = {
        str(path).rstrip("/") for path in (bangumi.save_path, generated_path) if path
    }
    path_matches = [
        torrent
        for torrent in torrents
        if str(torrent.save_path or "").rstrip("/") in candidate_paths
    ]

    aliases = {
        _normalized_match_text(bangumi.official_title),
        _normalized_match_text(bangumi.title_raw),
        *{
            _normalized_match_text(title)
            for title in (seed_titles or [])
        },
    }
    aliases = {alias for alias in aliases if len(alias) >= 3}
    title_matches = [
        torrent
        for torrent in torrents
        if any(alias in _normalized_match_text(torrent.name) for alias in aliases)
    ]
    matched = {}
    for torrent in path_matches + title_matches:
        matched[getattr(torrent, "hash", None) or id(torrent)] = torrent
    return list(matched.values())


def _parse_local_episode(name: str, default_season: int):
    explicit = re.search(
        r"(?i)(?:^|[^0-9a-z])S(\d{1,2})E(\d+(?:\.\d+)?)",
        name,
    )
    if explicit:
        return int(explicit.group(1)), float(explicit.group(2))

    parsed = TitleParser.torrent_parser(name, season=default_season)
    if not parsed or parsed.episode is None:
        return None
    return int(parsed.season), float(parsed.episode)


def _episode_response(data: DownloadedEpisode):
    episode_text = (
        str(int(data.episode))
        if float(data.episode).is_integer()
        else str(data.episode).rstrip("0").rstrip(".")
    )
    return {
        "label": f"S{data.season:02d}E{episode_text.zfill(2)}",
        "season": data.season,
        "episode": data.episode,
        "name": data.name,
        "size": data.size,
        "completedAt": data.completed_at,
        "completedTime": (
            datetime.fromtimestamp(data.completed_at).isoformat()
            if data.completed_at > 0
            else ""
        ),
    }


def _scan_local_episodes(
    bangumi: Bangumi,
    known_seed_titles: list[str] | None = None,
) -> list[DownloadedEpisode]:
    episodes = {}
    with DownloadClient() as client:
        torrents = client.get_torrent_info(category=None, status_filter=None)
        generated_path = client._gen_save_path(bangumi)
        candidate_paths = {
            str(path).rstrip("/")
            for path in (bangumi.save_path, generated_path)
            if path
        }
        path_seed_titles = [
            TitleParser.torrent_title_parser(torrent.name)
            for torrent in torrents
            if str(torrent.save_path or "").rstrip("/") in candidate_paths
        ]
        matched = _match_rule_torrents(
            bangumi,
            torrents,
            generated_path,
            (known_seed_titles or []) + path_seed_titles,
        )
        for torrent in matched:
            completed_at = int(getattr(torrent, "completion_on", 0) or 0)
            torrent_episode = TitleParser.torrent_episode_parser(torrent.name)
            if (
                torrent_episode is not None
                and float(getattr(torrent, "progress", 0) or 0) >= 1
            ):
                item = DownloadedEpisode(
                    bangumi_id=bangumi.id,
                    season=bangumi.season,
                    episode=torrent_episode,
                    name=str(torrent.name or ""),
                    torrent_hash=torrent.hash,
                    size=int(
                        getattr(torrent, "total_size", 0)
                        or getattr(torrent, "size", 0)
                        or 0
                    ),
                    completed_at=completed_at,
                )
                current = episodes.get((bangumi.season, torrent_episode))
                if current is None or item.size > current.size:
                    episodes[(bangumi.season, torrent_episode)] = item
                continue
            for file in client.get_torrent_files(torrent.hash):
                name = str(file.name or "")
                if not name.lower().endswith((".mkv", ".mp4")):
                    continue
                if float(getattr(file, "progress", 0) or 0) < 1:
                    continue
                parsed = _parse_local_episode(name, bangumi.season)
                if not parsed:
                    continue
                season_number, episode_number = parsed
                item = DownloadedEpisode(
                    bangumi_id=bangumi.id,
                    season=season_number,
                    episode=episode_number,
                    name=name,
                    torrent_hash=torrent.hash,
                    size=int(getattr(file, "size", 0) or 0),
                    completed_at=completed_at,
                )
                current = episodes.get((season_number, episode_number))
                if current is None or item.size > current.size:
                    episodes[(season_number, episode_number)] = item
    return sorted(
        episodes.values(),
        key=lambda item: (item.season, item.episode),
    )


def str_to_list(data: Bangumi):
    data.filter = data.filter.split(",")
    data.rss_link = data.rss_link.split(",")
    return data


@router.get(
    "/get/all", response_model=list[Bangumi], dependencies=[Depends(get_current_user)]
)
async def get_all_data():
    with TorrentManager() as manager:
        return manager.bangumi.search_all()


@router.get(
    "/get/{bangumi_id}",
    response_model=Bangumi,
    dependencies=[Depends(get_current_user)],
)
async def get_data(bangumi_id: str):
    with TorrentManager() as manager:
        resp = manager.search_one(bangumi_id)
    return resp


@router.get(
    "/local/{bangumi_id}",
    dependencies=[Depends(get_current_user)],
)
async def get_local_episodes(bangumi_id: int, refresh: bool = False):
    with TorrentManager() as manager:
        bangumi = manager.bangumi.search_id(bangumi_id)
    if not bangumi:
        return JSONResponse(
            status_code=404,
            content={"msg_en": "Bangumi not found.", "msg_zh": "未找到番剧。"},
        )

    with TorrentManager() as manager:
        cached = manager.downloaded_episode.search_bangumi(bangumi.id)
    if refresh or not cached:
        known_seed_titles = [
            TitleParser.torrent_title_parser(item.name)
            for item in cached
            if item.name
        ]
        scanned = _scan_local_episodes(bangumi, known_seed_titles)
        if scanned:
            with TorrentManager() as manager:
                manager.downloaded_episode.upsert_all(scanned)
                cached = manager.downloaded_episode.search_bangumi(bangumi.id)
    items = [_episode_response(item) for item in cached]
    return {
        "title": bangumi.official_title,
        "savePath": bangumi.save_path or "",
        "items": items,
        "count": len(items),
    }


@router.patch(
    "/update/{bangumi_id}",
    response_model=APIResponse,
    dependencies=[Depends(get_current_user)],
)
async def update_rule(
    bangumi_id: int,
    data: BangumiUpdate,
):
    with TorrentManager() as manager:
        resp = manager.update_rule(bangumi_id, data)
    return u_response(resp)


@router.delete(
    path="/delete/{bangumi_id}",
    response_model=APIResponse,
    dependencies=[Depends(get_current_user)],
)
async def delete_rule(bangumi_id: str, file: bool = False):
    with TorrentManager() as manager:
        resp = manager.delete_rule(bangumi_id, file)
    return u_response(resp)


@router.delete(
    path="/delete/many/",
    response_model=APIResponse,
    dependencies=[Depends(get_current_user)],
)
async def delete_many_rule(bangumi_id: list, file: bool = False):
    with TorrentManager() as manager:
        for i in bangumi_id:
            resp = manager.delete_rule(i, file)
    return u_response(resp)


@router.delete(
    path="/disable/{bangumi_id}",
    response_model=APIResponse,
    dependencies=[Depends(get_current_user)],
)
async def disable_rule(bangumi_id: str, file: bool = False):
    with TorrentManager() as manager:
        resp = manager.disable_rule(bangumi_id, file)
    return u_response(resp)


@router.delete(
    path="/disable/many/",
    response_model=APIResponse,
    dependencies=[Depends(get_current_user)],
)
async def disable_many_rule(bangumi_id: list, file: bool = False):
    with TorrentManager() as manager:
        for i in bangumi_id:
            resp = manager.disable_rule(i, file)
    return u_response(resp)


@router.get(
    path="/enable/{bangumi_id}",
    response_model=APIResponse,
    dependencies=[Depends(get_current_user)],
)
async def enable_rule(bangumi_id: str):
    with TorrentManager() as manager:
        resp = manager.enable_rule(bangumi_id)
    return u_response(resp)


@router.get(
    path="/refresh/poster/all",
    response_model=APIResponse,
    dependencies=[Depends(get_current_user)],
)
async def refresh_all_posters():
    with TorrentManager() as manager:
        resp = manager.refresh_poster()
    return u_response(resp)


@router.get(
    path="/refresh/poster/{bangumi_id}",
    response_model=APIResponse,
    dependencies=[Depends(get_current_user)],
)
async def refresh_one_poster(bangumi_id: int):
    with TorrentManager() as manager:
        resp = manager.refind_poster(bangumi_id)
    return u_response(resp)


@router.get(
    "/reset/all", response_model=APIResponse, dependencies=[Depends(get_current_user)]
)
async def reset_all():
    with TorrentManager() as manager:
        manager.downloaded_episode.delete_all()
        manager.bangumi.delete_all()
        return JSONResponse(
            status_code=200,
            content={
                "msg_en": "Reset all rules successfully.",
                "msg_zh": "重置所有规则成功。",
            },
        )
