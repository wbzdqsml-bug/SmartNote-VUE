<template>
  <div class="task-board-page">
    <header class="board-header">
      <div>
        <h1>任务看板</h1>
        <p>拖拽任务卡片，快速调整优先级与状态。</p>
      </div>
      <div class="header-actions">
        <n-select
          v-model:value="workspaceId"
          :options="workspaceOptions"
          placeholder="选择工作区"
          @update:value="loadTasks"
        />
        <n-button type="primary" @click="openCreate">新建任务</n-button>
      </div>
    </header>

    <section class="board">
      <task-column
        v-for="column in columns"
        :key="column.status"
        :title="column.title"
        :status="column.status"
        :tasks="tasksByStatus[column.status]"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
        @drop="handleDrop"
        @edit="openEdit"
        @delete="handleDelete"
      />
    </section>

    <task-edit-modal
      v-model:show="modalVisible"
      :task="activeTask"
      :status-options="statusOptions"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { NSelect, NButton } from 'naive-ui'
import workspaceApi from '@/api/workspace'
import tasksApi from '@/api/tasks'
import TaskColumn from '@/components/tasks/TaskColumn.vue'
import TaskEditModal from '@/components/tasks/TaskEditModal.vue'

const workspaceOptions = ref([])
const workspaceId = ref(null)
const modalVisible = ref(false)
const activeTask = ref({})
const draggedTask = ref(null)

const columns = [
  { title: '待处理', status: 'Todo', statusValue: 0 },
  { title: '进行中', status: 'Doing', statusValue: 1 },
  { title: '已完成', status: 'Done', statusValue: 2 }
]

const statusOptions = columns.map((column) => ({
  label: column.title,
  value: column.status
}))

const statusValueMap = columns.reduce((acc, column) => {
  acc[column.status] = column.statusValue
  return acc
}, {})

const statusKeyMap = columns.reduce((acc, column) => {
  acc[column.statusValue] = column.status
  return acc
}, {})

const tasksByStatus = reactive({
  Todo: [],
  Doing: [],
  Done: []
})

const normalizeTask = (raw) => {
  const rawStatus = raw.status ?? raw.Status
  const status =
    typeof rawStatus === 'number'
      ? statusKeyMap[rawStatus] ?? 'Todo'
      : rawStatus ?? 'Todo'
  return {
    id: raw.id ?? raw.Id,
    workspaceId: raw.workspaceId ?? raw.WorkspaceId,
    noteId: raw.noteId ?? raw.NoteId,
    title: raw.title ?? raw.Title,
    description: raw.description ?? raw.Description,
    status,
    sortOrder: raw.sortOrder ?? raw.SortOrder ?? 0,
    startAt: raw.startAt ?? raw.StartAt,
    dueAt: raw.dueAt ?? raw.DueAt
  }
}

const loadWorkspaces = async () => {
  const data = await workspaceApi.list()
  const list = data?.data ?? data ?? []
  workspaceOptions.value = list.map((item) => ({
    label: item.name || item.title || item.workspaceName || '工作区',
    value: item.id ?? item.Id ?? item.workspaceId ?? item.WorkspaceId
  }))
  if (!workspaceId.value) {
    workspaceId.value = workspaceOptions.value[0]?.value ?? null
  }
}

const loadTasks = async () => {
  if (!workspaceId.value) return
  const data = await tasksApi.list({ workspaceId: workspaceId.value })
  const list = data?.items ?? data?.data ?? data ?? []
  const normalized = list.map(normalizeTask)
  columns.forEach((column) => {
    tasksByStatus[column.status] = normalized
      .filter((task) => task.status === column.status)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  })
}

const openCreate = () => {
  activeTask.value = {
    status: 'Todo'
  }
  modalVisible.value = true
}

const openEdit = (task) => {
  activeTask.value = { ...task }
  modalVisible.value = true
}

const handleSubmit = async (payload) => {
  const isEdit = Boolean(activeTask.value?.id)
  const status = payload.status || activeTask.value.status || 'Todo'
  const newPayload = {
    NoteId: activeTask.value?.noteId ?? null,
    Title: payload.title,
    Description: payload.description,
    Status: statusValueMap[status] ?? 0,
    SortOrder: activeTask.value?.sortOrder ?? tasksByStatus[status].length + 1,
    StartAt: payload.startAt ? new Date(payload.startAt).toISOString() : null,
    DueAt: payload.dueAt ? new Date(payload.dueAt).toISOString() : null
  }
  if (isEdit) {
    await tasksApi.update(activeTask.value.id, newPayload)
  } else {
    await tasksApi.create({
      WorkspaceId: workspaceId.value,
      ...newPayload
    })
  }
  modalVisible.value = false
  await loadTasks()
}

const handleDelete = async (task) => {
  if (!task?.id) return
  await tasksApi.remove(task.id)
  await loadTasks()
}

const handleDragStart = (task) => {
  draggedTask.value = task
}

const handleDragEnd = () => {
  draggedTask.value = null
}

const handleDrop = async ({ status, index }) => {
  if (!draggedTask.value) return
  const sourceStatus = draggedTask.value.status
  const targetList = tasksByStatus[status]
  const updatedSource = tasksByStatus[sourceStatus].filter((task) => task.id !== draggedTask.value.id)
  if (sourceStatus === status) {
    const newList = [...updatedSource]
    newList.splice(index, 0, draggedTask.value)
    tasksByStatus[status] = newList
    await persistSort()
    return
  }

  tasksByStatus[sourceStatus] = updatedSource
  draggedTask.value.status = status
  const newTarget = [...targetList]
  newTarget.splice(index, 0, draggedTask.value)
  tasksByStatus[status] = newTarget

  await persistSort()
}

const persistSort = async () => {
  const items = []
  columns.forEach((column) => {
    tasksByStatus[column.status].forEach((task, index) => {
      task.sortOrder = index + 1
      items.push({
        TaskId: task.id,
        Status: statusValueMap[column.status] ?? 0,
        SortOrder: task.sortOrder
      })
    })
  })
  await tasksApi.sort({ Items: items })
  await loadTasks()
}

onMounted(async () => {
  await loadWorkspaces()
  await loadTasks()
})
</script>

<style scoped>
.task-board-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 28px 32px;
  background: linear-gradient(180deg, #eff6ff 0%, #ffffff 35%, #fef2f2 100%);
  min-height: 100%;
}

.board-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.board-header h1 {
  margin: 0;
  font-size: 26px;
  color: #0f172a;
}

.board-header p {
  margin: 6px 0 0;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

@media (max-width: 1100px) {
  .board {
    grid-template-columns: 1fr;
  }
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
