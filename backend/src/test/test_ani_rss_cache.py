from types import SimpleNamespace

from module.integration.ani_rss import AniRssMetadataCache


def test_query_rule_builds_weekday_and_metadata(monkeypatch):
    rule = SimpleNamespace(
        id=1,
        official_title="测试番剧",
        title_raw="Test Anime",
        rule_name="测试番剧",
        season=1,
        year="2026",
    )

    def fake_post(path):
        if path.startswith("searchBgm"):
            return [
                {
                    "id": "123",
                    "name": "Test Anime",
                    "nameCn": "测试番剧",
                    "season": 1,
                    "images": {"large": "https://example.test/cover.jpg"},
                }
            ]
        return {
            "title": "测试番剧",
            "releaseDate": "2026-07-23",
            "season": 1,
            "score": 8.2,
        }

    monkeypatch.setattr(AniRssMetadataCache, "_post", fake_post)
    metadata = AniRssMetadataCache._query_rule(rule)

    assert metadata["bgmId"] == "123"
    assert metadata["weekLabel"] == "星期四"
    assert metadata["score"] == 8.2
    assert metadata["image"] == "https://example.test/cover.jpg"


def test_rule_key_changes_when_matching_fields_change():
    rule = SimpleNamespace(
        id=1,
        official_title="测试番剧",
        title_raw="Test Anime",
        season=1,
        year="2026",
    )
    original = AniRssMetadataCache._rule_key(rule)
    rule.season = 2
    assert AniRssMetadataCache._rule_key(rule) != original
