from types import SimpleNamespace

from module.integration.ani_rss import AniRssMetadataCache


def make_rule(season=1):
    return SimpleNamespace(
        id=1,
        official_title="测试番剧",
        title_raw="Test Anime",
        rule_name="测试番剧",
        season=season,
        year="2026",
    )


def test_query_rule_uses_requested_tmdb_season_date(monkeypatch, caplog):
    info = SimpleNamespace(
        id=123,
        title="测试番剧",
        original_title="テストアニメ",
        poster_link="https://image.tmdb.org/t/p/w780/cover.jpg",
        season=[
            {"season_number": 1, "air_date": "2025-04-07"},
            {"season_number": 2, "air_date": "2026-07-10"},
        ],
    )
    monkeypatch.setattr(
        "module.integration.ani_rss.tmdb_parser",
        lambda title, language, test: info,
    )

    with caplog.at_level("INFO"):
        metadata = AniRssMetadataCache._query_rule(make_rule(season=2))

    assert metadata["tmdbId"] == "123"
    assert metadata["releaseDate"] == "2026-07-10"
    assert metadata["weekLabel"] == "星期五"
    assert metadata["image"].endswith("/cover.jpg")
    assert (
        "[TMDB Calendar] 测试番剧 -> 测试番剧 | 星期五 | TMDB S2 2026-07-10"
        in caplog.text
    )


def test_query_rule_rejects_missing_tmdb_season(monkeypatch):
    info = SimpleNamespace(
        id=123,
        title="测试番剧",
        original_title="テストアニメ",
        poster_link="",
        season=[{"season_number": 1, "air_date": "2025-04-07"}],
    )
    monkeypatch.setattr(
        "module.integration.ani_rss.tmdb_parser",
        lambda title, language, test: info,
    )

    try:
        AniRssMetadataCache._query_rule(make_rule(season=2))
    except LookupError as error:
        assert str(error) == "TMDB season 2 has no air date"
    else:
        raise AssertionError("missing TMDB season must not use another season")


def test_query_rule_rejects_missing_tmdb_title(monkeypatch):
    monkeypatch.setattr(
        "module.integration.ani_rss.tmdb_parser",
        lambda title, language, test: None,
    )

    try:
        AniRssMetadataCache._query_rule(make_rule())
    except LookupError as error:
        assert str(error) == "not found"
    else:
        raise AssertionError("missing TMDB title must be rejected")


def test_rule_key_changes_when_matching_fields_change():
    rule = make_rule()
    original = AniRssMetadataCache._rule_key(rule)
    rule.season = 2
    assert AniRssMetadataCache._rule_key(rule) != original
