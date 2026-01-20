<template>
  <div class="calendar-page">
    <header class="calendar-header">
      <div>
        <h1>日程管理</h1>
        <p>使用时间范围快速查看任务安排。</p>
      </div>
      <div class="filters">
        <n-date-picker
          v-model:value="rangeValue"
          type="daterange"
          clearable
          @update:value="loadTasks"
        />
      </div>
    </header>

    <section class="calendar-grid">
      <div v-for="date in dateList" :key="date.key" class="calendar-cell">
        <div class="cell-header">{{ date.label }}</div>
        <div class="cell-body">
          <div
            v-for="task in groupedTasks[date.key] || []"
            :key="task.id"
            class="task-chip"
          >
            <strong>{{ task.title || '未命名任务' }}</strong>
            <span class="time">
              {{ formatTime(task.startAt || task.dueAt) }}
            </span>
          </div>
          <div v-if="!(groupedTasks[date.key] || []).length" class="empty">暂无任务</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { NDatePicker } from 'naive-ui'
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns'
import tasksApi from '@/api/tasks'

const today = new Date()
const rangeValue = ref([startOfMonth(today).getTime(), endOfMonth(today).getTime()])
const tasks = ref([])

const loadTasks = async () => {
  if (!rangeValue.value?.length) return
  const [startMs, endMs] = rangeValue.value
  const data = await tasksApi.range({
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString()
  })
  const list = data?.items ?? data?.data ?? data ?? []
  tasks.value = list.map((task) => ({
    id: task.id ?? task.Id,
    title: task.title ?? task.Title,
    startAt: task.startAt ?? task.StartAt,
    dueAt: task.dueAt ?? task.DueAt
  }))
}

const dateList = computed(() => {
  if (!rangeValue.value?.length) return []
  const [startMs, endMs] = rangeValue.value
  return eachDayOfInterval({
    start: new Date(startMs),
    end: new Date(endMs)
  }).map((date) => ({
    key: format(date, 'yyyy-MM-dd'),
    label: format(date, 'MM-dd EEE')
  }))
})

const groupedTasks = computed(() => {
  const map = {}
  tasks.value.forEach((task) => {
    const time = task.startAt || task.dueAt
    if (!time) return
    const key = format(new Date(time), 'yyyy-MM-dd')
    if (!map[key]) map[key] = []
    map[key].push(task)
  })
  return map
})

const formatTime = (value) => {
  if (!value) return ''
  return format(new Date(value), 'HH:mm')
}

onMounted(loadTasks)
</script>

<style scoped>
.calendar-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 28px 32px;
  background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 40%, #fdf2f8 100%);
  min-height: 100%;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
}

.calendar-header h1 {
  margin: 0;
  font-size: 26px;
  color: #0f172a;
}

.calendar-header p {
  margin: 6px 0 0;
  color: #64748b;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 14px;
}

.calendar-cell {
  background: #ffffff;
  border-radius: 16px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  min-height: 160px;
  display: flex;
  flex-direction: column;
}

.cell-header {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}

.cell-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.task-chip {
  padding: 8px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.12);
  color: #1e3a8a;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.task-chip .time {
  color: #475569;
}

.empty {
  font-size: 12px;
  color: #94a3b8;
}

@media (max-width: 1200px) {
  .calendar-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .calendar-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .calendar-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
