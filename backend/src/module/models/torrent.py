from typing import Optional

from pydantic import BaseModel
from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class Torrent(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True, alias="id")
    bangumi_id: Optional[int] = Field(None, alias="refer_id", foreign_key="bangumi.id")
    rss_id: Optional[int] = Field(None, alias="rss_id", foreign_key="rssitem.id")
    name: str = Field("", alias="name")
    url: str = Field("https://example.com/torrent", alias="url")
    homepage: Optional[str] = Field(None, alias="homepage")
    downloaded: bool = Field(False, alias="downloaded")
    retry_count: int = Field(0, alias="retry_count")
    retry_after: int = Field(0, alias="retry_after")


class TorrentUpdate(SQLModel):
    downloaded: bool = Field(False, alias="downloaded")


class DownloadedEpisode(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint(
            "bangumi_id",
            "season",
            "episode",
            name="uq_downloaded_episode",
        ),
    )

    id: int = Field(default=None, primary_key=True)
    bangumi_id: int = Field(foreign_key="bangumi.id", index=True)
    season: int
    episode: float
    name: str = ""
    torrent_hash: Optional[str] = None
    size: int = 0
    completed_at: int = 0


class EpisodeFile(BaseModel):
    media_path: str = Field(...)
    group: str | None = Field(None)
    title: str = Field(...)
    season: int = Field(...)
    episode: int | float = Field(None)
    suffix: str = Field(..., regex=r"\.(mkv|mp4|MKV|MP4)$")


class SubtitleFile(BaseModel):
    media_path: str = Field(...)
    group: str | None = Field(None)
    title: str = Field(...)
    season: int = Field(...)
    episode: int | float = Field(None)
    language: str = Field(..., regex=r"(zh|zh-tw)")
    suffix: str = Field(..., regex=r"\.(ass|srt|ASS|SRT)$")
