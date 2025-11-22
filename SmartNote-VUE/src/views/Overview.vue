<template>
  <div class="overview-page">
    <quick-actions
      @create="openCreate"
      @import="handleImport"
      @open-ai="goToAiPage"
    />

    <div class="overview-grid">
      <n-card class="overview-card" title="笔记总览">
        <note-overview
          :notes="notes"
          :limit="notes.length || 0"
          @select="openNote"
          @open="openNote"
        />
      </n-card>
      <n-card class="overview-card" title="最近笔记">
        <div v-if="recentNotes.length" class="recent-list">
          <div
            v-for="item in recentNotes"
            :key="item.id"
            class="recent-item"
            @click="openNote(item)"
          >
            <div class="recent-meta">
              <span class="type">{{ item.typeName || '笔记' }}</span>
              <span class="time">{{ formatTime(item.updateTime || item.createdAt) }}</span>
            </div>
            <div class="title">{{ item.title || '未命名笔记' }}</div>
            <div class="preview">{{ item.preview || '暂无预览' }}</div>
          </div>
        </div>
        <n-empty v-else description="暂无笔记，点击上方“新建笔记”开始吧" />
      </n-card>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, NCard, NEmpty } from 'naive-ui'
import { format } from 'date-fns'
import QuickActions from '@/components/QuickActions.vue'
import NoteOverview from '@/components/NoteOverview.vue'
import noteApi from '@/api/note'
import { noteTypeMap } from '@/constants/noteTypes'

const router = useRouter()
const message = useMessage()

const notes = ref([])
const loading = ref(false)

const recentNotes = computed(() => notes.value.slice(0, 6))

const normaliseId = (value) => {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return Number.isNaN(num) ? value : num
}

const normaliseNote = (raw) => {
  if (!raw || typeof raw !== 'object') return null
  const id = normaliseId(raw.id ?? raw.noteId ?? raw.noteID)
  const typeValue = Number.isInteger(raw.type) ? raw.type : Number(raw.type ?? 0)
  const content = raw.contentJson ?? raw.ContentJson ?? raw.content ?? ''
  const createdAt =
    raw.createTime || raw.CreateTime || raw.createdAt || raw.created_time || raw.created_at || null
  const updatedAt =
    raw.lastUpdateTime ||
    raw.LastUpdateTime ||
    raw.updateTime ||
    raw.updatedAt ||
    raw.updated_at ||
    createdAt
  return {
    ...raw,
    id,
    type: Number.isNaN(typeValue) ? 0 : typeValue,
    typeName: noteTypeMap[Number.isNaN(typeValue) ? 0 : typeValue] || '笔记',
    content,
    contentJson: content,
    preview: raw.preview ?? '',
    createdAt,
    updateTime: updatedAt
  }
}

const getNoteTimestamp = (note) => {
  const target = note.updateTime || note.updatedAt || note.createdAt || note.createTime
  return target ? new Date(target).getTime() : 0
}

const loadNotes = async () => {
  loading.value = true
  try {
    const response = await noteApi.list()
    const data = response.data?.data ?? response.data ?? []
    const list = (Array.isArray(data) ? data : []).map(normaliseNote).filter(Boolean)
    list.sort((a, b) => getNoteTimestamp(b) - getNoteTimestamp(a))
    notes.value = list
  } catch (error) {
    console.error('[Overview] loadNotes error:', error)
    message.error(error?.response?.data?.message || '获取笔记失败，请稍后重试。')
  } finally {
    loading.value = false
  }
}

const openNote = (note) => {
  const id = normaliseId(note?.id)
  router.push({ path: '/notes', query: id ? { focus: id } : {} })
}

const goToAiPage = () => {
  router.push('/ai')
}

const handleImport = () => {
  message.info('导入功能开发中，敬请期待。')
}

const formatTime = (value) => {
  if (!value) return '--'
  try {
    return format(new Date(value), 'MM-dd HH:mm')
  } catch {
    return value
  }
}

const openCreateNote = inject('openCreateNote', null)
const openCreate = () => {
  if (typeof openCreateNote === 'function') {
    openCreateNote()
  } else {
    message.info('创建功能不可用，请稍后重试')
  }
}

onMounted(() => {
  loadNotes()
})
</script>

<style scoped>
.overview-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 18px;
}

.overview-card {
  width: 100%;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.recent-item:hover {
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
  transform: translateY(-2px);
}

.recent-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.title {
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.preview {
  font-size: 13px;
  color: #4b5563;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
