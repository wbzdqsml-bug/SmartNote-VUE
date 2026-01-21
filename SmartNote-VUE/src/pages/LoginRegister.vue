<!--
  文件说明：页面级组件（LoginRegister）
  - 主要职责：提供完整页面结构与交互，是路由直接渲染的入口。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="auth-bg">
    <AuthCard :default-tab="defaultTab" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AuthCard from '@/components/AuthCard.vue'
import '@/assets/bg.css'

const route = useRoute()

const defaultTab = computed(() => (route.name === 'register' ? 'register' : 'login'))
</script>
