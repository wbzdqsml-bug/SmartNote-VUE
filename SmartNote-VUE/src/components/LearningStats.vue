<!--
  文件说明：通用业务组件（LearningStats）
  - 主要职责：承载可复用的业务 UI 与交互逻辑，供多个页面组合。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="learning-stats">
    <h3 class="title">学习趋势分析</h3>
    <div class="placeholder">
      <n-empty description="数据可视化模块开发中，敬请期待" />
    </div>
  </div>
</template>

<script setup>
import { NEmpty } from 'naive-ui'
</script>

<style scoped>
.learning-stats {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}
</style>
