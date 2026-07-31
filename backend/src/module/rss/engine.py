import logging
import re
from typing import Optional

from module.database import Database, engine
from module.downloader import DownloadClient
from module.models import Bangumi, DownloadedEpisode, ResponseModel, RSSItem, Torrent
from module.network import RequestContent
from module.parser.analyser.raw_parser import raw_parser as parse_episode

logger = logging.getLogger(__name__)


class RSSEngine(Database):
    def __init__(self, _engine=engine):
        super().__init__(_engine)
        self._to_refresh = False

    @staticmethod
    def _get_torrents(rss: RSSItem) -> list[Torrent]:
        with RequestContent() as req:
            torrents = req.get_torrents(rss.url)
            # Add RSS ID
            for torrent in torrents:
                torrent.rss_id = rss.id
        return torrents

    def get_rss_torrents(self, rss_id: int) -> list[Torrent]:
        rss = self.rss.search_id(rss_id)
        if rss:
            return self.torrent.search_rss(rss_id)
        else:
            return []

    def add_rss(
        self,
        rss_link: str,
        name: str | None = None,
        aggregate: bool = True,
        parser: str = "mikan",
    ):
        if not name:
            with RequestContent() as req:
                name = req.get_rss_title(rss_link)
                if not name:
                    return ResponseModel(
                        status=False,
                        status_code=406,
                        msg_en="Failed to get RSS title.",
                        msg_zh="无法获取 RSS 标题。",
                    )
        rss_data = RSSItem(name=name, url=rss_link, aggregate=aggregate, parser=parser)
        if self.rss.add(rss_data):
            return ResponseModel(
                status=True,
                status_code=200,
                msg_en="RSS added successfully.",
                msg_zh="RSS 添加成功。",
            )
        else:
            return ResponseModel(
                status=False,
                status_code=406,
                msg_en="RSS added failed.",
                msg_zh="RSS 添加失败。",
            )

    def disable_list(self, rss_id_list: list[int]):
        for rss_id in rss_id_list:
            self.rss.disable(rss_id)
        return ResponseModel(
            status=True,
            status_code=200,
            msg_en="Disable RSS successfully.",
            msg_zh="禁用 RSS 成功。",
        )

    def enable_list(self, rss_id_list: list[int]):
        for rss_id in rss_id_list:
            self.rss.enable(rss_id)
        return ResponseModel(
            status=True,
            status_code=200,
            msg_en="Enable RSS successfully.",
            msg_zh="启用 RSS 成功。",
        )

    def delete_list(self, rss_id_list: list[int]):
        for rss_id in rss_id_list:
            self.rss.delete(rss_id)
        return ResponseModel(
            status=True,
            status_code=200,
            msg_en="Delete RSS successfully.",
            msg_zh="删除 RSS 成功。",
        )

    def pull_rss(self, rss_item: RSSItem) -> list[Torrent]:
        torrents = self._get_torrents(rss_item)
        new_torrents = self.torrent.check_new(torrents)
        return new_torrents

    def match_torrent(self, torrent: Torrent) -> Optional[Bangumi]:
        matched: Bangumi = self.bangumi.match_torrent(torrent.name)
        if matched:
            torrent.bangumi_id = matched.id
            if matched.filter == "":
                return matched
            _filter = matched.filter.replace(",", "|")
            if not re.search(_filter, torrent.name, re.IGNORECASE):
                return matched
        return None

    def record_downloaded_torrent(self, torrent: Torrent, bangumi: Bangumi):
        parsed = parse_episode(torrent.name)
        if not parsed or parsed.episode is None:
            logger.warning("[Engine] Cannot cache episode: %s", torrent.name)
            return
        self.downloaded_episode.upsert(
            DownloadedEpisode(
                bangumi_id=bangumi.id,
                season=bangumi.season,
                episode=float(parsed.episode),
                name=torrent.name,
            )
        )
        logger.debug(
            "[Engine] Cached %s S%02dE%s",
            bangumi.official_title,
            bangumi.season,
            parsed.episode,
        )

    def refresh_rss(self, client: DownloadClient, rss_id: Optional[int] = None):
        # Get All RSS Items
        if not rss_id:
            rss_items: list[RSSItem] = self.rss.search_active()
        else:
            rss_item = self.rss.search_id(rss_id)
            rss_items = [rss_item] if rss_item else []
        # From RSS Items, get all torrents
        logger.debug(f"[Engine] Get {len(rss_items)} RSS items")
        for rss_item in rss_items:
            new_torrents = self.pull_rss(rss_item)
            downloaded = []
            # Get all enabled bangumi data
            for torrent in new_torrents:
                matched_data = self.match_torrent(torrent)
                if matched_data:
                    if client.add_torrent(torrent, matched_data):
                        logger.debug(f"[Engine] Add torrent {torrent.name} to client")
                        self.torrent.mark_downloaded(torrent)
                        downloaded.append((torrent, matched_data))
                    else:
                        self.torrent.schedule_retry(torrent)
            # Add all torrents to database
            self.torrent.add_all(new_torrents)
            for torrent, bangumi in downloaded:
                self.record_downloaded_torrent(torrent, bangumi)

    def download_bangumi(self, bangumi: Bangumi):
        with RequestContent() as req:
            torrents = req.get_torrents(
                bangumi.rss_link, bangumi.filter.replace(",", "|")
            )
            if torrents:
                with DownloadClient() as client:
                    added = client.add_torrent(torrents, bangumi)
                    if added:
                        for torrent in torrents:
                            torrent.bangumi_id = bangumi.id
                            torrent.downloaded = True
                    self.torrent.add_all(torrents)
                    if added:
                        for torrent in torrents:
                            self.record_downloaded_torrent(torrent, bangumi)
                    return ResponseModel(
                        status=True,
                        status_code=200,
                        msg_en=f"[Engine] Download {bangumi.official_title} successfully.",
                        msg_zh=f"下载 {bangumi.official_title} 成功。",
                    )
            else:
                return ResponseModel(
                    status=False,
                    status_code=406,
                    msg_en=f"[Engine] Download {bangumi.official_title} failed.",
                    msg_zh=f"[Engine] 下载 {bangumi.official_title} 失败。",
                )
