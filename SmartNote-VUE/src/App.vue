<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-dialog-provider>
      <n-message-provider>
        <!-- 
          外层容器：必须是透明的 (bg-transparent)
          h-screen 确保撑满屏幕 
        -->
        <div class="flex h-screen w-full bg-transparent overflow-hidden font-sans text-slate-700">
          <router-view />
        </div>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup>
import { NConfigProvider, NDialogProvider, NMessageProvider } from 'naive-ui'

// 调整 Naive UI 的默认色调以匹配极光风格
const themeOverrides = {
  common: {
    primaryColor: '#6366f1', // Indigo-500
    primaryColorHover: '#818cf8',
    primaryColorPressed: '#4f46e5',
    fontFamily: "'Inter', sans-serif"
  }
}
</script>

<style>
/* 这里留空，样式全走 style.css */
</style>