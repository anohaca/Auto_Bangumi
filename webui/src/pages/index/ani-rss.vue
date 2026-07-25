<script lang="ts" setup>
import { Pause, PlayOne, Refresh } from '@icon-park/vue-next';

definePage({
  name: 'ANI-RSS',
});

const { running } = useAppInfo();
const { start, pause, restart } = useProgramStore();

const iframe = ref<HTMLIFrameElement>();
const reloadKey = ref(0);
const aniLoaded = ref(false);
const activeView = ref<'ani-rss' | 'settings'>('ani-rss');
const aniRssUrl = computed(
  () => `http://${window.location.hostname || '127.0.0.1'}:7789/`
);

const { getConfig } = useConfigStore();

const quickLinks = [
  { label: 'AB 主页', path: '/bangumi' },
  { label: 'AB RSS', path: '/rss' },
  { label: '下载器', path: '/downloader' },
  { label: '日志', path: '/log' },
];

function showSettings() {
  getConfig();
  activeView.value = 'settings';
}

function reloadAniRss() {
  aniLoaded.value = false;
  reloadKey.value += 1;
}

function openAniRss() {
  window.open(aniRssUrl.value, '_blank', 'noopener,noreferrer');
}

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }

  await iframe.value?.requestFullscreen();
}
</script>

<template>
  <div mt-12 flex-grow min-h-0 flex="~ col" gap-10>
    <div
      bg-white
      rounded-12
      px-16
      py-10
      flex="~ wrap"
      items-center
      gap-10
      shadow-sm
    >
      <div flex items-center gap-8 mr-6>
        <span
          h-9
          w-9
          rounded-full
          :class="running ? 'bg-green-500' : 'bg-gray-400'"
        ></span>
        <span text-h3>AutoBangumi {{ running ? '运行中' : '已暂停' }}</span>
      </div>

      <div flex items-center gap-8 mr-auto>
        <span
          h-9
          w-9
          rounded-full
          :class="aniLoaded ? 'bg-green-500' : 'bg-amber-400'"
        ></span>
        <span text-h3>ANI-RSS {{ aniLoaded ? '已连接' : '连接中' }}</span>
      </div>

      <button
        h-32
        px-12
        rounded-8
        :class="
          activeView === 'ani-rss'
            ? 'bg-theme-row text-white'
            : 'bg-[#F1F5FA]'
        "
        @click="activeView = 'ani-rss'"
      >
        ANI-RSS
      </button>

      <button
        h-32
        px-12
        rounded-8
        :class="
          activeView === 'settings'
            ? 'bg-theme-row text-white'
            : 'bg-[#F1F5FA]'
        "
        @click="showSettings"
      >
        AutoBangumi 设置
      </button>

      <RouterLink
        v-for="item in quickLinks"
        :key="item.path"
        :to="item.path"
        px-12
        h-32
        rounded-8
        f-cer
        bg="#F1F5FA"
        hover="bg-[#E4EAF2]"
      >
        {{ item.label }}
      </RouterLink>

      <button
        h-32
        px-10
        rounded-8
        f-cer
        gap-5
        bg="#E9F7EF"
        hover="bg-[#D8F0E2]"
        title="启动 AutoBangumi"
        @click="start"
      >
        <PlayOne size="16" />
        启动
      </button>

      <button
        h-32
        px-10
        rounded-8
        f-cer
        gap-5
        bg="#FFF4DD"
        hover="bg-[#FFE9BA]"
        title="暂停 AutoBangumi"
        @click="pause"
      >
        <Pause size="16" />
        暂停
      </button>

      <button
        h-32
        px-10
        rounded-8
        f-cer
        gap-5
        bg="#F1F5FA"
        hover="bg-[#E4EAF2]"
        title="重启 AutoBangumi"
        @click="restart"
      >
        <Refresh size="16" />
        重启
      </button>

      <button
        h-32
        px-10
        rounded-8
        bg="#F1F5FA"
        hover="bg-[#E4EAF2]"
        @click="reloadAniRss"
      >
        刷新 ANI-RSS
      </button>

      <button
        h-32
        px-10
        rounded-8
        bg="#F1F5FA"
        hover="bg-[#E4EAF2]"
        @click="toggleFullscreen"
      >
        全屏
      </button>

      <button
        h-32
        px-10
        rounded-8
        bg="#F1F5FA"
        hover="bg-[#E4EAF2]"
        @click="openAniRss"
      >
        新窗口
      </button>
    </div>

    <iframe
      v-show="activeView === 'ani-rss'"
      :key="reloadKey"
      ref="iframe"
      :src="aniRssUrl"
      title="ANI-RSS"
      frameborder="0"
      allowfullscreen
      flex-grow
      min-h-0
      w-full
      bg-white
      rounded-12
      @load="aniLoaded = true"
    ></iframe>

    <div
      v-if="activeView === 'settings'"
      flex-grow
      min-h-0
      overflow-hidden
      bg-white
      rounded-12
      p-16
    >
      <config-panel />
    </div>
  </div>
</template>
