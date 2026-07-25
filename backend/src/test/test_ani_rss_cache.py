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


def test_query_rule_uses_tmdb_japanese_after_chinese_miss(monkeypatch, caplog):
    rule = SimpleNamespace(
        id=23,
        official_title="描绘直至生命尽头",
        title_raw="Kore Kaite Shine",
        rule_name="",
        season=1,
        year="2026",
    )

    def fake_post(path):
        if path.startswith("searchBgm"):
            if "%E3%81%93%E3%82%8C%E6%8F%8F%E3%81%84%E3%81%A6%E6%AD%BB%E3%81%AD" in path:
                return [
                    {
                        "id": "638888",
                        "name": "これ描いて死ね",
                        "nameCn": "画完这个再去死",
                        "season": 1,
                    }
                ]
            return [
                {
                    "id": "wrong",
                    "name": "ハックルベリー・フィン物語",
                    "nameCn": "哈克贝利·芬历险记",
                    "season": 1,
                }
            ]
        return {
            "title": rule.official_title,
            "releaseDate": "2026-07-10",
            "score": 6.8,
        }

    monkeypatch.setattr(AniRssMetadataCache, "_post", fake_post)
    monkeypatch.setattr(
        AniRssMetadataCache,
        "_tmdb_original_title",
        lambda _rule: "これ描いて死ね",
    )
    with caplog.at_level("INFO"):
        metadata = AniRssMetadataCache._query_rule(rule)

    assert metadata["bgmId"] == "638888"
    assert metadata["weekLabel"] == "星期五"
    assert "stage=chinese" in caplog.text
    assert "exact=0" in caplog.text
    assert "stage=tmdb-japanese" in caplog.text
    assert "selected id=638888" in caplog.text


def test_query_rule_rejects_non_exact_candidate(monkeypatch, caplog):
    rule = SimpleNamespace(
        id=44,
        official_title="提欧奥特曼",
        title_raw="Ultraman Teo",
        rule_name="",
        season=1,
        year="2026",
    )

    monkeypatch.setattr(
        AniRssMetadataCache,
        "_post",
        lambda path: [
            {
                "id": "137377",
                "name": "Animator Expo",
                "nameCn": "动画大师 第二季",
                "season": 1,
            }
        ],
    )
    monkeypatch.setattr(
        AniRssMetadataCache, "_tmdb_original_title", lambda _rule: ""
    )
    with caplog.at_level("INFO"):
        try:
            AniRssMetadataCache._query_rule(rule)
        except LookupError as error:
            assert str(error) == "not found"
        else:
            raise AssertionError("low-confidence candidate must be rejected")

    assert "rejected" in caplog.text


def test_tmdb_fallback_only_uses_official_chinese_title(monkeypatch):
    rule = SimpleNamespace(
        id=50,
        official_title="千年血戰篇-禍進譚-",
        title_raw="BLEACH 死神",
    )
    queried = []

    def fake_tmdb(title, language, test):
        queried.append(title)
        return None

    monkeypatch.setattr(
        "module.integration.ani_rss.tmdb_parser",
        fake_tmdb,
    )

    assert AniRssMetadataCache._tmdb_original_title(rule) == ""
    assert queried == ["千年血戰篇-禍進譚-"]
