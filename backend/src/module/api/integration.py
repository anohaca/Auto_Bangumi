from fastapi import APIRouter, Depends, Query

from module.integration import AniRssMetadataCache
from module.security.api import get_token_data

router = APIRouter(prefix="/integration", tags=["integration"])


@router.get(
    "/ani-rss",
    dependencies=[Depends(get_token_data)],
)
async def get_ani_rss_metadata(force: bool = Query(False)):
    return await AniRssMetadataCache.get_all(force=force)
