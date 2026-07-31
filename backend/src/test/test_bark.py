from module.models import Notification
from module.models.config import Notification as NotificationConfig
from module.notification import notification as notification_module
from module.notification.plugin.bark import BarkNotification


class Response:
    status_code = 200


def test_bark_sends_source_poster_as_icon(monkeypatch):
    sent = {}

    def fake_post_data(self, url, data):
        sent.update(data)
        return Response()

    monkeypatch.setattr(BarkNotification, "post_data", fake_post_data)
    notifier = BarkNotification(token="test-device-key")
    poster = "https://image.tmdb.org/t/p/w780/poster.jpg"
    notify = Notification(
        official_title="测试番剧", season=1, episode=2, poster_path=poster
    )

    assert notifier.post_msg(notify)
    assert sent["icon"] == poster
    assert sent["device_key"] == "test-device-key"
    assert poster not in sent["body"]


def test_bark_omits_empty_poster(monkeypatch):
    sent = {}

    def fake_post_data(self, url, data):
        sent.update(data)
        return Response()

    monkeypatch.setattr(BarkNotification, "post_data", fake_post_data)
    notifier = BarkNotification(token="test-device-key")
    notify = Notification(
        official_title="测试番剧", season=1, episode=2, poster_path=None
    )

    assert notifier.post_msg(notify)
    assert "icon" not in sent


def test_test_notification_uses_unsaved_config_and_source_poster(monkeypatch):
    received = {}

    class FakeNotifier:
        def __init__(self, token, chat_id):
            received["token"] = token
            received["chat_id"] = chat_id

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            return None

        def post_msg(self, notify):
            received["notify"] = notify
            return True

    monkeypatch.setattr(notification_module, "getClient", lambda _: FakeNotifier)
    config = NotificationConfig(
        enable=True,
        type="bark",
        token="unsaved-device-key",
        chat_id="",
    )
    poster = "https://image.tmdb.org/t/p/w780/original.jpg"

    assert notification_module.send_test_notification(config, poster)
    assert received["token"] == "unsaved-device-key"
    assert received["notify"].poster_path == poster
