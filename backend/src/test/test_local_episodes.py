from types import SimpleNamespace

from module.api.bangumi import _match_rule_torrents, _parse_local_episode
from module.models import Bangumi
from module.parser import TitleParser


def test_local_episode_parser_handles_renamed_file():
    parsed = TitleParser.torrent_parser(
        "测试番剧 S01E03.mkv",
        season=1,
    )

    assert parsed is not None
    assert parsed.season == 1
    assert float(parsed.episode) == 3


def test_local_episode_parser_prefers_explicit_season_episode_marker():
    assert _parse_local_episode(
        "GRAND BLUE 碧藍之海 3 S03E04.mp4",
        default_season=3,
    ) == (3, 4.0)


def test_torrent_name_parsers_keep_chinese_title_and_episode():
    name = (
        "[ANi] Azur Lane Bisoku Zenshin - "
        "碧藍航線 微速前進！2！！ - 04 "
        "[1080P][Baha][WEB-DL][AAC AVC][CHT].torrent"
    )

    assert TitleParser.torrent_title_parser(name) == "碧藍航線 微速前進！2！！"
    assert TitleParser.torrent_episode_parser(name) == 4.0


def test_torrent_name_parser_leaves_collection_for_file_fallback():
    name = "[ANi] 測試番劇 - 01-12 [1080P].torrent"

    assert TitleParser.torrent_episode_parser(name) is None


def test_local_episode_match_uses_generated_path_when_database_path_is_empty():
    bangumi = Bangumi(
        official_title="测试番剧",
        title_raw="Test Anime",
        season=1,
        save_path=None,
    )
    torrent = SimpleNamespace(
        name="[ANi] Test Anime - 01.mp4",
        save_path="/downloads/测试番剧/Season 1",
    )

    assert _match_rule_torrents(
        bangumi,
        [torrent],
        "/downloads/测试番剧/Season 1",
    ) == [torrent]


def test_local_episode_match_falls_back_to_original_torrent_title():
    bangumi = Bangumi(
        official_title="我家的弟弟们真是让您费心了",
        title_raw="我家的弟弟們真是讓您費心了",
        season=1,
        save_path=None,
    )
    torrent = SimpleNamespace(
        name="[ANi] 我家的弟弟們真是讓您費心了 - 01.mp4",
        save_path="/downloads/うちの弟どもがすみません/Season 1",
    )

    assert _match_rule_torrents(
        bangumi,
        [torrent],
        "/downloads/我家的弟弟们真是让您费心了/Season 1",
    ) == [torrent]


def test_local_episode_match_combines_path_and_original_title_results():
    bangumi = Bangumi(
        official_title="虽然我是不完美恶女～雏宫蝶鼠替换传～",
        title_raw="我是不才惡女",
        season=1,
        save_path="/downloads/虽然我是不完美恶女/Season 1",
    )
    current = SimpleNamespace(
        hash="episode-3",
        name="[ANi] 我是不才惡女 - 03.mp4",
        save_path="/downloads/虽然我是不完美恶女/Season 1",
    )
    older = SimpleNamespace(
        hash="episode-1",
        name="[ANi] 我是不才惡女 - 01.mp4",
        save_path="/downloads/旧目录/Season 1",
    )

    assert _match_rule_torrents(
        bangumi,
        [current, older],
        "/downloads/虽然我是不完美恶女/Season 1",
    ) == [current, older]


def test_local_episode_match_uses_title_from_recorded_seed_name():
    bangumi = Bangumi(
        official_title="碧蓝航线：微速前行！",
        title_raw="Azur Lane Bisoku Zenshin",
        season=2,
        save_path="/downloads/碧蓝航线/Season 2",
    )
    older = SimpleNamespace(
        hash="episode-1",
        name="[ANi] 碧藍航線 微速前進！2 - 01 [1080P].mp4",
        save_path="/downloads/旧目录/Season 2",
    )

    assert _match_rule_torrents(
        bangumi,
        [older],
        "/downloads/碧蓝航线/Season 2",
        ["碧藍航線 微速前進！2！！"],
    ) == [older]
