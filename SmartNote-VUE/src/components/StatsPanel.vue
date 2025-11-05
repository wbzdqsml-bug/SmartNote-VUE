<template>
  <n-card class="stats-panel" :bordered="false">
    <template #header>
      <h3>学习统计</h3>
    </template>
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
  </n-card>
</template>

<script setup>
import { computed } from 'vue'
import { NCard, NProgress } from 'naive-ui'
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
  border-radius: 22px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
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
