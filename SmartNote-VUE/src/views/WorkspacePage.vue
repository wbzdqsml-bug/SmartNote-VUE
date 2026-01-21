<!--
  文件说明：页面视图（WorkspacePage）
  - 主要职责：负责页面级业务布局、数据加载与子组件编排。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="workspace-page">
    <workspace-panel class="section-card" />
  </div>
</template>

<script setup>
import WorkspacePanel from '@/components/WorkspacePanel.vue'
</script>

<style scoped>
.workspace-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.section-card {
  width: 100%;
}
</style>
