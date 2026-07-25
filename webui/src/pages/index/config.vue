<script lang="ts" setup>
definePage({
  name: 'Config',
});

const { getConfig } = useConfigStore();

onActivated(() => {
  getConfig();
});
</script>

<template>
  <config-panel mt-12 />
</template>
