import logging

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from module.conf import settings
from module.database import Database
from module.models import APIResponse, Config
from module.models.config import Notification
from module.notification import send_test_notification
from module.security.api import UNAUTHORIZED, get_current_user

router = APIRouter(prefix="/config", tags=["config"])
logger = logging.getLogger(__name__)


@router.get("/get", response_model=Config, dependencies=[Depends(get_current_user)])
async def get_config():
    return settings


@router.patch(
    "/update", response_model=APIResponse, dependencies=[Depends(get_current_user)]
)
async def update_config(config: Config):
    try:
        settings.save(config_dict=config.dict())
        settings.load()
        # update_rss()
        logger.info("Config updated")
        return JSONResponse(
            status_code=200,
            content={
                "msg_en": "Update config successfully.",
                "msg_zh": "更新配置成功。",
            },
        )
    except Exception as e:
        logger.warning(e)
        return JSONResponse(
            status_code=406,
            content={"msg_en": "Update config failed.", "msg_zh": "更新配置失败。"},
        )


@router.post(
    "/notification/test",
    response_model=APIResponse,
    dependencies=[Depends(get_current_user)],
)
async def test_notification(notification: Notification):
    try:
        with Database() as database:
            poster = next(
                (
                    item.poster_source_link
                    for item in database.bangumi.search_all()
                    if item.poster_source_link
                ),
                None,
            )
        if not send_test_notification(notification, poster):
            raise RuntimeError("Notification provider rejected the request")
        return JSONResponse(
            status_code=200,
            content={"msg_en": "Test notification sent.", "msg_zh": "测试通知已发送。"},
        )
    except Exception as error:
        logger.warning("Test notification failed: %s", error)
        return JSONResponse(
            status_code=406,
            content={
                "msg_en": "Test notification failed.",
                "msg_zh": "测试通知发送失败。",
            },
        )
