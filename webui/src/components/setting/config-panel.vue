<script lang="ts" setup>
const { getConfig, setConfig } = useConfigStore();
const { isMobile } = useBreakpointQuery();
</script>

<template>
  <div overflow-auto flex-grow min-h-0>
    <div h-full>
      <div grid="~ pc:cols-2 gap-20" mb-auto>
        <div space-y-20>
          <config-normal />
          <config-parser />
          <config-download />
          <config-manage />
        </div>

        <div space-y-20>
          <config-notification />
          <config-proxy />
        </div>
      </div>

      <div fx-cer justify-end gap-8 mt-20 pb-4>
        <ab-button
          :class="[{ 'flex-1': isMobile }]"
          type="warn"
          @click="getConfig"
        >
          {{ $t('config.cancel') }}
        </ab-button>
        <ab-button
          :class="[{ 'flex-1': isMobile }]"
          type="primary"
          @click="setConfig"
        >
          {{ $t('config.apply') }}
        </ab-button>
      </div>
    </div>
  </div>
</template>
