import importlib
from datetime import date

tmdb_parser = importlib.import_module("module.parser.analyser.tmdb_parser")


def test_single_candidate_is_selected_without_episode_lookup(monkeypatch):
    candidate = {"id": 1, "name": "唯一候选"}
    monkeypatch.setattr(tmdb_parser, "is_animation", lambda *_: True)
    monkeypatch.setattr(
        tmdb_parser,
        "_episode_air_date",
        lambda *_: (_ for _ in ()).throw(AssertionError("must not query episode")),
    )

    selected = tmdb_parser.select_tmdb_candidate(
        [candidate], "种子标题", "zh", 1, 4, date(2026, 7, 26)
    )

    assert selected == candidate


def test_episode_air_date_disambiguates_multiple_candidates(monkeypatch):
    old = {"id": 10, "name": "浣熊拉斯卡尔"}
    current = {"id": 20, "name": "轻松熊"}
    monkeypatch.setattr(tmdb_parser, "is_animation", lambda *_: True)
    monkeypatch.setattr(
        tmdb_parser,
        "_episode_air_date",
        lambda tv_id, *_: {
            10: date(1977, 4, 5),
            20: date(2026, 7, 24),
        }[tv_id],
    )

    selected = tmdb_parser.select_tmdb_candidate(
        [old, current], "拉拉熊", "zh", 1, 17, date(2026, 7, 26)
    )

    assert selected == current


def test_missing_episode_dates_preserves_exact_title_match(monkeypatch):
    exact = {"id": 10, "name": "不愉快的妖怪庵"}
    fuzzy = {"id": 20, "name": "其他作品"}
    monkeypatch.setattr(tmdb_parser, "is_animation", lambda *_: True)
    monkeypatch.setattr(tmdb_parser, "_episode_air_date", lambda *_: None)

    selected = tmdb_parser.select_tmdb_candidate(
        [fuzzy, exact], "不愉快的妖怪庵", "zh", 2, 13, date(2026, 7, 26)
    )

    assert selected == exact
