<template>
  <n-config-provider :theme="appliedTheme">
    <n-dialog-provider>
      <n-message-provider>
        <router-view />
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup>
import { computed } from 'vue'
import { NConfigProvider, NDialogProvider, NMessageProvider, darkTheme } from 'naive-ui'
import { useUiStore } from '@/store/uiStore'

const uiStore = useUiStore()

const appliedTheme = computed(() => (uiStore.isDark ? darkTheme : null))
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  background-color: #f7f8fa;
  font-family: 'Inter', sans-serif;
}
</style>
