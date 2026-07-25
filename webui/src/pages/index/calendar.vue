<script lang="ts" setup>
import { Refresh } from '@icon-park/vue-next';
import { apiIntegration } from '@/api/integration';
import type { AniRssCache, AniRssItem } from '@/api/integration';

definePage({
  name: 'Calendar',
});

const { t } = useMyI18n();
const loading = ref(false);
const error = ref('');
const result = ref<AniRssCache>();

const weekdayKeys = [
  '星期一',
  '星期二',
  '星期三',
  '星期四',
  '星期五',
  '星期六',
  '星期日',
];

const groups = computed(() => {
  const buckets = new Map<string, AniRssItem[]>(
    [...weekdayKeys, 'unknown'].map((key) => [key, []])
  );

  for (const item of result.value?.items ?? []) {
    const key = weekdayKeys.includes(item.metadata.weekLabel ?? '')
      ? item.metadata.weekLabel!
      : 'unknown';
    buckets.get(key)?.push(item);
  }

  return [...weekdayKeys, 'unknown']
    .map((key) => ({
      key,
      label:
        key === 'unknown'
          ? t('calendar.unknown')
          : t(`calendar.weekdays.${key}`),
      items: buckets.get(key) ?? [],
    }))
    .filter((group) => group.items.length > 0);
});

const resolvedCount = computed(
  () =>
    result.value?.items.filter((item) =>
      weekdayKeys.includes(item.metadata.weekLabel ?? '')
    ).length ?? 0
);

async function loadCalendar() {
  loading.value = true;
  error.value = '';
  try {
    result.value = await apiIntegration.getAniRssCache();
  } catch {
    error.value = t('calendar.load_error');
  } finally {
    loading.value = false;
  }
}

function openBangumi(item: AniRssItem) {
  if (!item.metadata.bgmId) return;
  window.open(
    `https://bgm.tv/subject/${item.metadata.bgmId}`,
    '_blank',
    'noopener,noreferrer'
  );
}

onActivated(loadCalendar);
</script>

<template>
  <div class="calendar-page">
    <header class="calendar-header">
      <div>
        <h1>{{ t('calendar.title') }}</h1>
        <p v-if="result">
          {{
            t('calendar.summary', {
              total: result.items.length,
              resolved: resolvedCount,
              unknown: result.items.length - resolvedCount,
            })
          }}
        </p>
        <p v-else>{{ t('calendar.description') }}</p>
      </div>
      <button :disabled="loading" class="refresh-button" @click="loadCalendar">
        <Refresh :class="{ spinning: loading }" size="17" />
        {{ t('calendar.refresh') }}
      </button>
    </header>

    <div v-if="loading && !result" class="calendar-state">
      {{ t('calendar.loading') }}
    </div>
    <div v-else-if="error && !result" class="calendar-state error">
      {{ error }}
    </div>
    <div v-else class="weekday-list">
      <section v-for="group in groups" :key="group.key" class="weekday-section">
        <div class="weekday-heading">
          <h2>{{ group.label }}</h2>
          <span>{{ group.items.length }}</span>
        </div>

        <div class="anime-grid">
          <article
            v-for="item in group.items"
            :key="item.rule.id"
            class="anime-card"
            :class="{ clickable: item.metadata.bgmId }"
            @click="openBangumi(item)"
          >
            <ab-image
              class="anime-poster"
              :src="item.metadata.image || item.rule.poster_link"
              :aspect-ratio="2 / 3"
            />
            <div class="anime-info">
              <h3 :title="item.rule.official_title || item.metadata.title">
                {{ item.rule.official_title || item.metadata.title }}
              </h3>
              <p v-if="item.metadata.jpTitle" :title="item.metadata.jpTitle">
                {{ item.metadata.jpTitle }}
              </p>
              <div class="anime-tags">
                <span v-if="item.metadata.score" class="score">
                  ★ {{ item.metadata.score }}
                </span>
                <span v-if="item.rule.season > 1">
                  S{{ item.rule.season }}
                </span>
                <span v-if="item.rule.group_name">
                  {{ item.rule.group_name }}
                </span>
                <span v-if="group.key === 'unknown'" class="unknown">
                  {{ t('calendar.pending') }}
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <div v-if="!groups.length" class="calendar-state">
        {{ t('calendar.empty') }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.calendar-page {
  flex-grow: 1;
  min-height: 0;
  margin-top: 12px;
  padding: 0 10px 24px 0;
  overflow: auto;
}

.calendar-header {
  position: sticky;
  z-index: 2;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  margin-bottom: 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 4px 18px rgba(42, 28, 82, 0.06);

  h1 {
    margin: 0 0 4px;
    font-size: 22px;
    color: #2a1c52;
  }

  p {
    margin: 0;
    color: #778097;
    font-size: 13px;
  }
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  height: 34px;
  padding: 0 13px;
  border-radius: 8px;
  background: #f1f5fa;
  color: #2a1c52;

  &:hover:not(:disabled) {
    background: #e4eaf2;
  }

  &:disabled {
    cursor: wait;
    opacity: 0.65;
  }
}

.spinning {
  animation: spin 0.9s linear infinite;
}

.weekday-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.weekday-section {
  padding: 14px;
  border-radius: 12px;
  background: #fff;
}

.weekday-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  h2 {
    margin: 0;
    color: #2a1c52;
    font-size: 18px;
  }

  span {
    min-width: 22px;
    padding: 2px 7px;
    border-radius: 999px;
    background: #f0ebff;
    color: #7356b1;
    font-size: 12px;
    text-align: center;
  }
}

.anime-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 12px;
}

.anime-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #edf0f5;
  border-radius: 10px;
  background: #fff;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &.clickable {
    cursor: pointer;
  }

  &.clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(42, 28, 82, 0.12);
  }
}

.anime-poster {
  width: 100%;
  overflow: hidden;
  background: #eceff4;
}

.anime-info {
  padding: 9px 10px 10px;

  h3,
  p {
    overflow: hidden;
    margin: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  h3 {
    color: #2f3340;
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin-top: 3px;
    color: #9399a8;
    font-size: 11px;
  }
}

.anime-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;

  span {
    max-width: 100%;
    overflow: hidden;
    padding: 2px 6px;
    border-radius: 5px;
    background: #f1f5fa;
    color: #697287;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .score {
    background: #fff2d9;
    color: #b57400;
  }

  .unknown {
    background: #fff0e8;
    color: #bd5e24;
  }
}

.calendar-state {
  padding: 60px 20px;
  color: #858da0;
  text-align: center;

  &.error {
    color: #d24b4b;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .calendar-page {
    padding-right: 0;
  }

  .calendar-header {
    align-items: flex-start;
    padding: 13px;
  }

  .anime-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 7px;
  }

  .weekday-section {
    padding: 10px;
  }

  .anime-info {
    padding: 7px;
  }
}
</style>
