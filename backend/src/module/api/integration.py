from fastapi import APIRouter, Query

from module.integration import AniRssMetadataCache

router = APIRouter(prefix="/integration", tags=["integration"])


@router.get("/ani-rss")
async def get_ani_rss_metadata(force: bool = Query(False)):
    return await AniRssMetadataCache.get_all(force=force)
