<!--
  文件说明：通用业务组件（QuickActions）
  - 主要职责：承载可复用的业务 UI 与交互逻辑，供多个页面组合。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="quick-actions">
    <div class="left">
      <h3>快捷操作</h3>
      <p>快速创建笔记、导入文件，或调用智能助手。</p>
    </div>
    <div class="actions">
      <n-button type="primary" size="large" @click="$emit('create')">新建笔记</n-button>
      <n-button size="large" ghost @click="$emit('import')">导入文件</n-button>
      <n-button size="large" ghost @click="$emit('open-ai')">AI 助手</n-button>
    </div>
  </div>
</template>

<script setup>
import { NButton } from 'naive-ui'
</script>

<style scoped>
.quick-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  gap: 12px;
}

.left h3 {
  margin: 0;
  font-weight: 700;
  font-size: 18px;
  color: #111827;
}

.left p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
