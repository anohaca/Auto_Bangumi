import type { BangumiAPI } from '#/bangumi';

export interface AniRssMetadata {
  bgmId?: number;
  bgmName?: string;
  title?: string;
  jpTitle?: string;
  season?: string;
  score?: number;
  image?: string;
  releaseDate?: string;
  weekLabel?: string;
  notFound?: boolean;
  error?: string;
  cachedAt?: number;
}

export interface AniRssItem {
  rule: BangumiAPI;
  metadata: AniRssMetadata;
}

export interface AniRssCache {
  items: AniRssItem[];
  cached: number;
  refreshed: number;
  updatedAt?: number;
}

export const apiIntegration = {
  async getAniRssCache() {
    const { data } = await axios.get<AniRssCache>('api/v1/integration/ani-rss');
    return data;
  },
};
