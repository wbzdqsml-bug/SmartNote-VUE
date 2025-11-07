<template>
  <n-config-provider>
    <n-dialog-provider>
      <n-message-provider>
        <router-view />
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup>
import { NConfigProvider, NDialogProvider, NMessageProvider } from 'naive-ui'
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  background-color: #f7f8fa;
  font-family: 'Inter', sans-serif;
}
</style>
