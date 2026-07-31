import time

from sqlmodel import SQLModel, create_engine
from sqlmodel.pool import StaticPool

from module.database.combine import Database
from module.models import Bangumi, RSSItem, Torrent

# sqlite mock engine
engine = create_engine(
    "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
)


def test_bangumi_database():
    test_data = Bangumi(
        official_title="无职转生，到了异世界就拿出真本事",
        year="2021",
        title_raw="Mushoku Tensei",
        season=1,
        season_raw="",
        group_name="Lilith-Raws",
        dpi="1080p",
        source="Baha",
        subtitle="CHT",
        eps_collect=False,
        offset=0,
        filter="720p,\\d+-\\d+",
        rss_link="test",
        poster_link="/test/test.jpg",
        poster_source_link="https://image.tmdb.org/t/p/w780/test.jpg",
        added=False,
        rule_name=None,
        save_path="downloads/无职转生，到了异世界就拿出真本事/Season 1",
        deleted=False,
    )
    with Database(engine) as db:
        db.create_table()
        # insert
        db.bangumi.add(test_data)
        assert db.bangumi.search_id(1) == test_data

        # update
        test_data.official_title = "无职转生，到了异世界就拿出真本事II"
        db.bangumi.update(test_data)
        assert db.bangumi.search_id(1) == test_data

        # search poster
        assert (
            db.bangumi.match_poster("无职转生，到了异世界就拿出真本事II (2021)")
            == "/test/test.jpg"
        )
        assert (
            db.bangumi.match_poster_source("无职转生，到了异世界就拿出真本事II (2021)")
            == "https://image.tmdb.org/t/p/w780/test.jpg"
        )

        # match torrent
        result = db.bangumi.match_torrent(
            "[Lilith-Raws] 无职转生，到了异世界就拿出真本事 / Mushoku Tensei - 11 [Baha][WEB-DL][1080p][AVC AAC][CHT][MP4]"
        )
        assert result.official_title == "无职转生，到了异世界就拿出真本事II"

        # delete
        db.bangumi.delete_one(1)
        assert db.bangumi.search_id(1) is None


def test_torrent_database():
    test_data = Torrent(
        name="[Sub Group]test S02 01 [720p].mkv",
        url="https://test.com/test.mkv",
    )
    with Database(engine) as db:
        # insert
        db.torrent.add(test_data)
        assert db.torrent.search(1) == test_data

        # update
        test_data.downloaded = True
        db.torrent.update(test_data)
        assert db.torrent.search(1) == test_data

        incoming = Torrent(name=test_data.name, url=test_data.url)
        assert db.torrent.check_new([incoming]) == []

        test_data.bangumi_id = 1
        test_data.downloaded = False
        db.torrent.update(test_data)
        assert db.torrent.check_new([incoming]) == [test_data]

        retry_started_at = int(time.time())
        db.torrent.schedule_retry(test_data, now=retry_started_at)
        assert test_data.retry_count == 1
        assert test_data.retry_after == retry_started_at + 600
        assert db.torrent.check_new([incoming]) == []

        test_data.retry_after = 0
        assert db.torrent.check_new([incoming]) == [test_data]

        db.torrent.mark_downloaded(test_data)
        db.torrent.update(test_data)
        assert test_data.retry_count == 0
        assert test_data.retry_after == 0
        assert db.torrent.check_new([incoming]) == []


def test_rss_database():
    rss_url = "https://test.com/test.xml"

    with Database(engine) as db:
        db.rss.add(RSSItem(url=rss_url))
