<!--
  文件说明：根组件（App）
  - 主要职责：负责应用整体布局/路由出口，并承载全局样式与通用容器。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
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