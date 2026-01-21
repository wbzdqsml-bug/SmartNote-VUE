<!--
  文件说明：页面视图（DeletedNotePage）
  - 主要职责：负责页面级业务布局、数据加载与子组件编排。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="deleted-note-page">
    <div class="toolbar">
      <n-button size="small" @click="goBack">返回回收站</n-button>
    </div>

    <n-card class="viewer-card" :bordered="false">
      <template #header>
        <div class="header">
          <n-tag v-if="note" type="info" size="small">{{ currentTypeLabel(note.type) }}</n-tag>
          <span class="title">{{ note?.title || '已删除的笔记' }}</span>
          <span class="deleted-at">
            删除时间: {{ formatTime(note?.deletedAt || note?.deletedTime || note?.DeletedTime) }}
          </span>
        </div>
      </template>

      <n-spin :show="loading">
        <DeletedNoteViewer v-if="note" :note="note" />
        <n-empty v-else description="笔记不存在或已被彻底删除" />
      </n-spin>
    </n-card>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage, NButton, NCard, NTag, NSpin, NEmpty } from 'naive-ui'
import { format } from 'date-fns'
import recycleApi from '@/api/recycle'
import DeletedNoteViewer from './DeletedNoteViewer.vue'
import { noteTypeMap } from '@/constants/noteTypes'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const note = ref(null)
const loading = ref(false)

const formatTime = (value) => {
  if (!value) return '--'
  try {
    return format(new Date(value), 'yyyy-MM-dd HH:mm')
  } catch {
    return value
  }
}

const currentTypeLabel = (type) => noteTypeMap[type] || '笔记'

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

const noteId = computed(() => route.params.noteId)

const goBack = () => {
  router.push('/recycle')
}

const load = async () => {
  const id = normaliseId(noteId.value)
  if (id === null || id === undefined || id === '') {
    note.value = null
    return
  }

  loading.value = true
  note.value = null
  try {
    const { data } = await recycleApi.get(id)
    const raw = data?.data ?? data
    note.value = normaliseRecycleNote(raw)
  } catch (error) {
    message.error(error?.response?.data?.message || '获取回收站笔记详情失败')
  } finally {
    loading.value = false
  }
}

watch(noteId, () => load(), { immediate: true })
</script>

<style scoped>
.deleted-note-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}

.toolbar {
  display: flex;
  justify-content: flex-start;
}

.viewer-card :deep(.n-card__content) {
  min-height: 60vh;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.title {
  font-size: 18px;
  font-weight: 700;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.deleted-at {
  font-size: 13px;
  color: #6b7280;
  flex-shrink: 0;
}
</style>

