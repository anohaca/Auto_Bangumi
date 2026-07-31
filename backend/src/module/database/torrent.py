import logging
import time

from sqlmodel import Session, select

from module.models import Torrent

logger = logging.getLogger(__name__)


class TorrentDatabase:
    retry_delays = (600, 1800, 3600, 10800, 21600)

    def __init__(self, session: Session):
        self.session = session

    def add(self, data: Torrent):
        self.session.add(data)
        self.session.commit()
        self.session.refresh(data)
        logger.debug(f"Insert {data.name} in database.")

    def add_all(self, datas: list[Torrent]):
        self.session.add_all(datas)
        self.session.commit()
        logger.debug(f"Insert {len(datas)} torrents in database.")

    def update(self, data: Torrent):
        self.session.add(data)
        self.session.commit()
        self.session.refresh(data)
        logger.debug(f"Update {data.name} in database.")

    def update_all(self, datas: list[Torrent]):
        self.session.add_all(datas)
        self.session.commit()

    def update_one_user(self, data: Torrent):
        self.session.add(data)
        self.session.commit()
        self.session.refresh(data)
        logger.debug(f"Update {data.name} in database.")

    def search(self, _id: int) -> Torrent:
        return self.session.exec(select(Torrent).where(Torrent.id == _id)).first()

    def search_all(self) -> list[Torrent]:
        return self.session.exec(select(Torrent)).all()

    def search_rss(self, rss_id: int) -> list[Torrent]:
        return self.session.exec(select(Torrent).where(Torrent.rss_id == rss_id)).all()

    def check_new(self, torrents_list: list[Torrent]) -> list[Torrent]:
        new_torrents = []
        old_torrents = self.search_all()
        old_by_url = {torrent.url: torrent for torrent in old_torrents}
        for torrent in torrents_list:
            old = old_by_url.get(torrent.url)
            if old is None:
                new_torrents.append(torrent)
            elif (
                old.bangumi_id is not None
                and not old.downloaded
                and int(old.retry_after or 0) <= int(time.time())
            ):
                new_torrents.append(old)
        return new_torrents

    def schedule_retry(self, data: Torrent, now: int | None = None):
        data.retry_count = int(data.retry_count or 0) + 1
        delay = self.retry_delays[
            min(data.retry_count - 1, len(self.retry_delays) - 1)
        ]
        data.retry_after = int(now or time.time()) + delay
        self.update(data)
        logger.warning(
            "[Torrent] Retry %s in %d minutes (attempt %d).",
            data.name,
            delay // 60,
            data.retry_count,
        )

    def mark_downloaded(self, data: Torrent):
        data.downloaded = True
        data.retry_count = 0
        data.retry_after = 0
