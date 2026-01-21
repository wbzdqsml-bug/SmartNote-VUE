<!--
  文件说明：任务组件（TaskColumn）
  - 主要职责：提供任务卡片/列/弹窗等看板子组件能力。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <section
    class="task-column"
    @dragover.prevent
    @drop="$emit('drop', status)"
  >
    <header class="column-header">
      <h3>{{ title }}</h3>
      <span class="count">{{ tasks.length }}</span>
    </header>
    <div class="column-body">
      <div
        v-for="(task, index) in tasks"
        :key="task.id"
        class="drop-slot"
        @dragover.prevent
        @drop="$emit('drop', { status, index })"
      >
        <task-card
          :task="task"
          @drag-start="$emit('drag-start', $event)"
          @drag-end="$emit('drag-end', $event)"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
        />
      </div>
      <div
        class="drop-zone"
        @dragover.prevent
        @drop="$emit('drop', { status, index: tasks.length })"
      >
        <span v-if="!tasks.length" class="empty">暂无任务</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import TaskCard from '@/components/tasks/TaskCard.vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  tasks: {
    type: Array,
    default: () => []
  }
})

defineEmits(['drag-start', 'drag-end', 'drop', 'edit', 'delete'])
</script>

<style scoped>
.task-column {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 20px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-header h3 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.count {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
}

.column-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.drop-slot {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drop-zone {
  min-height: 32px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.3);
  display: grid;
  place-items: center;
  color: #94a3b8;
  font-size: 12px;
}

.empty {
  padding: 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.05);
  color: #64748b;
  text-align: center;
  font-size: 13px;
}
</style>
