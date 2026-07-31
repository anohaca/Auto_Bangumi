from sqlalchemy import inspect, text
from sqlmodel import create_engine
from sqlmodel.pool import StaticPool

from module.database.combine import Database
from module.models import DownloadedEpisode


def test_adds_poster_source_link_without_losing_existing_data():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE bangumi "
                "(id INTEGER PRIMARY KEY, official_title VARCHAR, poster_link VARCHAR)"
            )
        )
        connection.execute(
            text(
                "INSERT INTO bangumi (id, official_title, poster_link) "
                "VALUES (1, '测试番剧', 'posters/local.jpg')"
            )
        )

    with Database(engine) as database:
        database.ensure_schema()

    columns = {item["name"] for item in inspect(engine).get_columns("bangumi")}
    assert "poster_source_link" in columns
    with engine.connect() as connection:
        row = connection.execute(
            text("SELECT poster_link, poster_source_link FROM bangumi WHERE id = 1")
        ).one()
    assert row.poster_link == "posters/local.jpg"
    assert row.poster_source_link is None


def test_creates_and_updates_downloaded_episode_cache():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE bangumi "
                "(id INTEGER PRIMARY KEY, official_title VARCHAR)"
            )
        )
        connection.execute(
            text(
                "INSERT INTO bangumi (id, official_title) "
                "VALUES (1, '测试番剧')"
            )
        )

    with Database(engine) as database:
        database.ensure_schema()
        database.downloaded_episode.upsert(
            DownloadedEpisode(
                bangumi_id=1,
                season=1,
                episode=2,
                name="测试番剧 S01E02.mp4",
            )
        )
        database.downloaded_episode.upsert(
            DownloadedEpisode(
                bangumi_id=1,
                season=1,
                episode=2,
                name="测试番剧 S01E02.mp4",
                size=1024,
            )
        )
        cached = database.downloaded_episode.search_bangumi(1)
        latest = database.downloaded_episode.latest_all()

    assert len(cached) == 1
    assert cached[0].episode == 2
    assert cached[0].size == 1024
    assert latest == {1: 2.0}


def test_adds_torrent_retry_columns_without_losing_data():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE torrent "
                "(id INTEGER PRIMARY KEY, name VARCHAR, downloaded BOOLEAN)"
            )
        )
        connection.execute(
            text(
                "INSERT INTO torrent (id, name, downloaded) "
                "VALUES (1, '测试种子', 0)"
            )
        )

    with Database(engine) as database:
        database.ensure_schema()

    columns = {item["name"] for item in inspect(engine).get_columns("torrent")}
    assert {"retry_count", "retry_after"} <= columns
    with engine.connect() as connection:
        row = connection.execute(
            text(
                "SELECT name, retry_count, retry_after "
                "FROM torrent WHERE id = 1"
            )
        ).one()
    assert row.name == "测试种子"
    assert row.retry_count == 0
    assert row.retry_after == 0
