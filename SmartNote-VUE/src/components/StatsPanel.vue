<!--
  文件说明：通用业务组件（StatsPanel）
  - 主要职责：承载可复用的业务 UI 与交互逻辑，供多个页面组合。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="stats-panel">
    <h3 class="title">学习统计</h3>
    <div class="grid">
      <div class="stat-item">
        <span class="label">笔记总数</span>
        <span class="value">{{ totalNotes }}</span>
      </div>
      <div class="stat-item">
        <span class="label">最近更新</span>
        <span class="value">{{ latestUpdate }}</span>
      </div>
      <div
        v-for="item in typeProgress"
        :key="item.value"
        class="stat-item"
        :class="{ full: typeProgress.length > 2 && item.index >= 2 }"
      >
        <span class="label">{{ item.label }}</span>
        <n-progress type="line" :percentage="item.percentage" indicator-placement="inside" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { NProgress } from 'naive-ui'
import { format } from 'date-fns'
import { noteTypeOptions } from '@/constants/noteTypes'

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  }
})

const totalNotes = computed(() => props.notes.length)

const latestUpdate = computed(() => {
  if (!props.notes.length) return '--'
  const latest = props.notes
    .map((item) => item.updateTime || item.lastUpdateTime || item.LastUpdateTime || item.createdAt)
    .filter(Boolean)
    .map((value) => new Date(value))
    .sort((a, b) => b.getTime() - a.getTime())[0]
  if (!latest) return '--'
  try {
    return format(latest, 'yyyy-MM-dd HH:mm')
  } catch {
    return '--'
  }
})

const typeProgress = computed(() => {
  if (!props.notes.length) {
    return noteTypeOptions.map((item, index) => ({
      ...item,
      index,
      percentage: 0
    }))
  }
  return noteTypeOptions.map((item, index) => {
    const count = props.notes.filter((note) => Number(note.type) === item.value).length
    const percentage = Math.round((count / props.notes.length) * 100)
    return {
      ...item,
      index,
      percentage
    }
  })
})
</script>

<style scoped>
.stats-panel {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  background: #ffffff;
}

.title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 13px;
  color: #6b7280;
}

.value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.stat-item.full {
  grid-column: 1 / -1;
}
</style>
