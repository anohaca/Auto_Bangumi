from sqlalchemy.sql import func
from sqlmodel import Session, delete, select

from module.models import DownloadedEpisode


class DownloadedEpisodeDatabase:
    def __init__(self, session: Session):
        self.session = session

    def search_bangumi(self, bangumi_id: int) -> list[DownloadedEpisode]:
        statement = (
            select(DownloadedEpisode)
            .where(DownloadedEpisode.bangumi_id == bangumi_id)
            .order_by(DownloadedEpisode.season, DownloadedEpisode.episode)
        )
        return self.session.exec(statement).all()

    def latest_all(self) -> dict[int, float]:
        statement = (
            select(
                DownloadedEpisode.bangumi_id,
                func.max(DownloadedEpisode.episode),
            )
            .group_by(DownloadedEpisode.bangumi_id)
        )
        return {
            int(bangumi_id): float(episode)
            for bangumi_id, episode in self.session.exec(statement).all()
        }

    def upsert(self, data: DownloadedEpisode):
        statement = select(DownloadedEpisode).where(
            DownloadedEpisode.bangumi_id == data.bangumi_id,
            DownloadedEpisode.season == data.season,
            DownloadedEpisode.episode == data.episode,
        )
        current = self.session.exec(statement).first()
        if current:
            if data.name:
                current.name = data.name
            if data.torrent_hash:
                current.torrent_hash = data.torrent_hash
            if data.size >= current.size:
                current.size = data.size
            if data.completed_at:
                current.completed_at = data.completed_at
            data = current
        self.session.add(data)
        self.session.commit()
        self.session.refresh(data)
        return data

    def upsert_all(self, datas: list[DownloadedEpisode]):
        for data in datas:
            self.upsert(data)

    def delete_bangumi(self, bangumi_id: int):
        self.session.exec(
            delete(DownloadedEpisode).where(
                DownloadedEpisode.bangumi_id == bangumi_id
            )
        )
        self.session.commit()

    def delete_all(self):
        self.session.exec(delete(DownloadedEpisode))
        self.session.commit()
