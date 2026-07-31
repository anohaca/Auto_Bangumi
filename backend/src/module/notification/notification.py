import logging

from module.conf import settings
from module.database import Database
from module.models import Notification
from module.models.config import Notification as NotificationConfig

from .plugin import (
    BarkNotification,
    ServerChanNotification,
    TelegramNotification,
    WecomNotification,
)

logger = logging.getLogger(__name__)


def getClient(type: str):
    if type.lower() == "telegram":
        return TelegramNotification
    elif type.lower() == "server-chan":
        return ServerChanNotification
    elif type.lower() == "bark":
        return BarkNotification
    elif type.lower() == "wecom":
        return WecomNotification
    else:
        return None


def send_test_notification(
    config: NotificationConfig, poster_path: str | None = None
) -> bool:
    notifier_class = getClient(config.type)
    if notifier_class is None:
        raise ValueError(f"Unsupported notification type: {config.type}")
    notify = Notification(
        official_title="AutoBangumi 测试通知",
        season=1,
        episode=1,
        poster_path=poster_path,
    )
    with notifier_class(token=config.token, chat_id=config.chat_id) as notifier:
        return notifier.post_msg(notify)


class PostNotification:
    def __init__(self):
        Notifier = getClient(settings.notification.type)
        self.notifier = Notifier(
            token=settings.notification.token, chat_id=settings.notification.chat_id
        )

    @staticmethod
    def _get_poster(notify: Notification):
        with Database() as db:
            poster_path = db.bangumi.match_poster_source(notify.official_title)
        notify.poster_path = poster_path

    def send_msg(self, notify: Notification) -> bool:
        self._get_poster(notify)
        try:
            self.notifier.post_msg(notify)
            logger.debug(f"Send notification: {notify.official_title}")
        except Exception as e:
            logger.warning(f"Failed to send notification: {e}")
            return False

    def __enter__(self):
        self.notifier.__enter__()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.notifier.__exit__(exc_type, exc_val, exc_tb)
