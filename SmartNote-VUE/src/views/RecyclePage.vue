<!--
  文件说明：页面视图（RecyclePage）
  - 主要职责：负责页面级业务布局、数据加载与子组件编排。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="recycle-page">
    <div class="toolbar">
      <n-button size="small" @click="load">刷新</n-button>
      <n-button
        size="small"
        type="primary"
        ghost
        :disabled="!selectedRowKeys.length"
        @click="handleRestore"
      >
        恢复选中
      </n-button>
      <n-popconfirm
        v-if="selectedRowKeys.length"
        positive-text="删除"
        negative-text="取消"
        @positive-click="handleDelete"
      >
        <template #trigger>
          <n-button size="small" type="error" tertiary>彻底删除</n-button>
        </template>
        删除后无法恢复，确定继续？
      </n-popconfirm>
    </div>

    <n-data-table
      :columns="columns"
      :data="notes"
      :loading="loading"
      :pagination="pagination"
      :row-key="(row) => row.id"
      :checked-row-keys="selectedRowKeys"
      @update:checked-row-keys="(keys) => (selectedRowKeys = keys)"
      checkable
    />

    <n-modal v-model:show="showViewModal" preset="card" class="view-modal" :segmented="modalSegmented" :loading="viewingNoteLoading">
      <template #header>
        <div class="modal-header">
          <n-tag type="info" size="small">{{ currentTypeLabel(currentViewingNote?.type) }}</n-tag>
          <span class="modal-title">{{ currentViewingNote?.title }}</span>
          <span class="deleted-at">
            删除时间: {{ formatTime(currentViewingNote?.deletedAt || currentViewingNote?.deletedTime || currentViewingNote?.DeletedTime) }}
          </span>
        </div>
      </template>
      <DeletedNoteViewer :note="currentViewingNote" v-if="currentViewingNote" />
    </n-modal>
  </div>
</template>

<script setup>
import { onMounted, ref, h } from 'vue'
import { useMessage, NButton, NPopconfirm, NDataTable, NModal, NTag } from 'naive-ui'
import recycleApi from '@/api/recycle'
import { format } from 'date-fns'
import DeletedNoteViewer from './DeletedNoteViewer.vue'
import { noteTypeMap } from '@/constants/noteTypes'

const message = useMessage()

const notes = ref([])
const loading = ref(false)
const selectedRowKeys = ref([])
const showViewModal = ref(false)
const currentViewingNote = ref(null)
const viewingNoteLoading = ref(false) // New loading state for the modal

const pagination = {
  pageSize: 8
}

const modalSegmented = {
  content: 'soft',
  footer: 'soft'
}

const formatTime = (value) => {
  if (!value) return '--'
  try {
    return format(new Date(value), 'yyyy-MM-dd HH:mm')
  } catch {
    return value
  }
}

const normaliseId = (value) => {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return Number.isNaN(num) ? value : num
}

const normaliseRecycleNote = (raw) => {
  if (!raw || typeof raw !== 'object') return null
  const id = normaliseId(raw.id ?? raw.noteId ?? raw.noteID ?? raw.NoteId ?? raw.NoteID)
  const typeValue = Number.isInteger(raw.type) ? raw.type : Number(raw.type ?? raw.Type ?? 0)
  const resolvedType = Number.isNaN(typeValue) ? 0 : typeValue
  const content = raw.contentJson ?? raw.ContentJson ?? raw.content ?? raw.Content ?? ''
  const createdAt =
    raw.createTime || raw.CreateTime || raw.createdAt || raw.created_time || raw.created_at || null
  const updatedAt =
    raw.lastUpdateTime ||
    raw.LastUpdateTime ||
    raw.updateTime ||
    raw.updatedAt ||
    raw.updated_at ||
    createdAt
  const deletedAt =
    raw.deletedAt ||
    raw.deletedTime ||
    raw.DeletedTime ||
    raw.deleted_time ||
    raw.deleted_at ||
    null

  return {
    ...raw,
    id,
    title: raw.title ?? raw.Title ?? raw.name ?? raw.Name ?? '',
    type: resolvedType,
    content,
    contentJson: content,
    updateTime: updatedAt,
    deletedAt
  }
}

const currentTypeLabel = (type) => noteTypeMap[type] || '笔记'

const handleViewNote = async (noteSummary) => {
  viewingNoteLoading.value = true
  showViewModal.value = true // Open modal immediately for better UX
  currentViewingNote.value = null // Clear previous note content
  try {
    const id = normaliseId(noteSummary?.id)
    const { data } = await recycleApi.get(id)
    const raw = data?.data ?? data
    currentViewingNote.value = normaliseRecycleNote(raw)
  } catch (error) {
    message.error(error?.response?.data?.message || '获取笔记详情失败')
    showViewModal.value = false // Close modal on error
  } finally {
    viewingNoteLoading.value = false
  }
}

const columns = [
  { type: 'selection' },
  {
    title: '标题',
    key: 'title'
  },
  {
    title: '删除时间',
    key: 'deletedAt',
    render(row) {
      return formatTime(row.deletedAt || row.deletedTime || row.DeletedTime)
    }
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          onClick: () => handleViewNote(row)
        },
        { default: () => '查看' }
      )
    }
  }
]

const load = async () => {
  loading.value = true
  try {
    const { data } = await recycleApi.list()
    const raw = data?.data ?? data ?? []
    notes.value = (Array.isArray(raw) ? raw : []).map(normaliseRecycleNote).filter(Boolean)
  } catch (error) {
    message.error(error?.response?.data?.message || '获取回收站失败')
  } finally {
    loading.value = false
  }
}

const handleRestore = async () => {
  if (!selectedRowKeys.value.length) return
  try {
    await recycleApi.restore(selectedRowKeys.value)
    message.success('恢复成功')
    selectedRowKeys.value = []
    load()
  } catch (error) {
    message.error(error?.response?.data?.message || '恢复失败')
  }
}

const handleDelete = async () => {
  if (!selectedRowKeys.value.length) return
  try {
    await recycleApi.remove(selectedRowKeys.value)
    message.success('已永久删除')
    selectedRowKeys.value = []
    load()
  } catch (error) {
    message.error(error?.response?.data?.message || '删除失败')
  }
}

onMounted(() => {
  load()
})
</script>

<style scoped>
.recycle-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.section-card {
  width: 100%;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.view-modal {
  width: min(90vw, 1200px);
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.view-modal :deep(.n-card__content) {
  flex: 1;
  overflow: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.deleted-at {
  font-size: 14px;
  color: #606060;
}
</style>
