from unittest.mock import Mock, patch

from qbittorrentapi.exceptions import Conflict409Error

from module.downloader.client.qb_downloader import QbDownloader
from module.models.config import Config, Downloader


def test_downloader_api_key_config_alias_and_environment(monkeypatch):
    monkeypatch.setenv("TEST_QB_API_KEY", "secret")
    config = Downloader(api_key_enable=True, api_key="$TEST_QB_API_KEY")

    assert config.api_key_enable
    assert config.api_key == "secret"
    assert Config(downloader=config).dict()["downloader"]["api_key"] == "$TEST_QB_API_KEY"


@patch("module.downloader.client.qb_downloader.Client")
def test_qb_api_key_uses_bearer_header_and_skips_cookie_auth(client_class):
    client = Mock()
    client.app_version.return_value = "v5.2.3"
    client_class.return_value = client

    downloader = QbDownloader(
        "127.0.0.1:8080", "admin", "password", False, "qbt_test"
    )

    assert downloader.auth(retry=1)
    downloader.logout()
    assert client_class.call_args.kwargs["EXTRA_HEADERS"] == {
        "Authorization": "Bearer qbt_test"
    }
    assert client_class.call_args.kwargs["username"] is None
    assert client_class.call_args.kwargs["password"] is None
    client.app_version.assert_called_once_with()
    client.auth_log_in.assert_not_called()
    client.auth_log_out.assert_not_called()


@patch("module.downloader.client.qb_downloader.Client")
def test_qb_password_auth_remains_unchanged(client_class):
    client = Mock()
    client_class.return_value = client

    downloader = QbDownloader("127.0.0.1:8080", "admin", "password", False)

    assert downloader.auth(retry=1)
    downloader.logout()
    assert client_class.call_args.kwargs["EXTRA_HEADERS"] is None
    client.auth_log_in.assert_called_once_with()
    client.auth_log_out.assert_called_once_with()


@patch("module.downloader.client.qb_downloader.Client")
def test_disabled_api_key_uses_password_even_when_key_is_saved(client_class):
    client = Mock()
    client_class.return_value = client

    downloader = QbDownloader(
        "127.0.0.1:8080", "admin", "password", False, "qbt_saved", False
    )

    assert downloader.auth(retry=1)
    assert client_class.call_args.kwargs["EXTRA_HEADERS"] is None
    assert client_class.call_args.kwargs["username"] == "admin"
    assert client_class.call_args.kwargs["password"] == "password"
    client.auth_log_in.assert_called_once_with()


@patch("module.downloader.client.qb_downloader.Client")
def test_qb_torrent_conflict_is_treated_as_already_added(client_class):
    client = Mock()
    client.torrents_add.side_effect = Conflict409Error("Conflict")
    client_class.return_value = client
    downloader = QbDownloader("127.0.0.1:8080", "admin", "password", False)

    assert downloader.add_torrents(
        torrent_urls="https://example.test/file.torrent",
        torrent_files=None,
        save_path="/downloads/Bangumi",
        category="Bangumi",
    )
