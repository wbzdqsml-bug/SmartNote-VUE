<!--
  文件说明：任务组件（TaskCard）
  - 主要职责：提供任务卡片/列/弹窗等看板子组件能力。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <article
    class="task-card"
    draggable="true"
    @dragstart="$emit('drag-start', task)"
    @dragend="$emit('drag-end', task)"
  >
    <div class="card-header">
      <h4>{{ task.title || '未命名任务' }}</h4>
      <div class="actions">
        <button class="link" @click.stop="$emit('edit', task)">编辑</button>
        <button class="link danger" @click.stop="$emit('delete', task)">删除</button>
      </div>
    </div>
    <p class="description">{{ task.description || '暂无描述' }}</p>
    <div class="time">
      <span v-if="task.startAt">开始：{{ formatTime(task.startAt) }}</span>
      <span v-if="task.dueAt">截止：{{ formatTime(task.dueAt) }}</span>
    </div>
  </article>
</template>

<script setup>
import { format } from 'date-fns'

defineProps({
  task: {
    type: Object,
    required: true
  }
})

defineEmits(['drag-start', 'drag-end', 'edit', 'delete'])

const formatTime = (value) => {
  if (!value) return ''
  try {
    return format(new Date(value), 'MM-dd HH:mm')
  } catch {
    return value
  }
}
</script>

<style scoped>
.task-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: grab;
}

.task-card:active {
  cursor: grabbing;
}

.card-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.card-header h4 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
}

.actions {
  display: flex;
  gap: 8px;
}

.link {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 12px;
  cursor: pointer;
}

.link.danger {
  color: #dc2626;
}

.description {
  margin: 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.5;
}

.time {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
}
</style>
