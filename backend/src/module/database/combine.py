from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel

from module.models import Bangumi, DownloadedEpisode, User

from .bangumi import BangumiDatabase
from .downloaded_episode import DownloadedEpisodeDatabase
from .engine import engine as e
from .rss import RSSDatabase
from .torrent import TorrentDatabase
from .user import UserDatabase


class Database(Session):
    def __init__(self, engine=e):
        self.engine = engine
        super().__init__(engine)
        self.rss = RSSDatabase(self)
        self.torrent = TorrentDatabase(self)
        self.bangumi = BangumiDatabase(self)
        self.downloaded_episode = DownloadedEpisodeDatabase(self)
        self.user = UserDatabase(self)

    def create_table(self):
        SQLModel.metadata.create_all(self.engine)
        self.ensure_schema()

    def ensure_schema(self):
        DownloadedEpisode.__table__.create(self.engine, checkfirst=True)
        inspector = inspect(self.engine)
        if "torrent" in inspector.get_table_names():
            torrent_columns = {
                column["name"] for column in inspector.get_columns("torrent")
            }
            with self.engine.begin() as connection:
                if "retry_count" not in torrent_columns:
                    connection.execute(
                        text(
                            "ALTER TABLE torrent "
                            "ADD COLUMN retry_count INTEGER DEFAULT 0"
                        )
                    )
                if "retry_after" not in torrent_columns:
                    connection.execute(
                        text(
                            "ALTER TABLE torrent "
                            "ADD COLUMN retry_after INTEGER DEFAULT 0"
                        )
                    )
        if "bangumi" not in inspector.get_table_names():
            return
        columns = {column["name"] for column in inspector.get_columns("bangumi")}
        if "poster_source_link" not in columns:
            with self.engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE bangumi ADD COLUMN poster_source_link VARCHAR")
                )

    def drop_table(self):
        SQLModel.metadata.drop_all(self.engine)

    def migrate(self):
        # Run migration online
        bangumi_data = self.bangumi.search_all()
        user_data = self.exec("SELECT * FROM user").all()
        readd_bangumi = []
        for bangumi in bangumi_data:
            dict_data = bangumi.dict()
            del dict_data["id"]
            readd_bangumi.append(Bangumi(**dict_data))
        self.drop_table()
        self.create_table()
        self.commit()
        bangumi_data = self.bangumi.search_all()
        self.bangumi.add_all(readd_bangumi)
        self.add(User(**user_data[0]))
        self.commit()
