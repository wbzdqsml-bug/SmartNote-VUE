<!--
  文件说明：页面视图（Overview）
  - 主要职责：负责页面级业务布局、数据加载与子组件编排。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="overview-page">
    <quick-actions
      @create="openCreate"
      @import="handleImport"
      @open-ai="goToAiPage"
    />
    <input
      ref="importInput"
      type="file"
      class="import-input"
      accept=".md,.json,.txt,.html"
      @change="handleImportFile"
    />

    <div class="overview-grid">
      <n-card class="overview-card" title="全部笔记">
        <div class="overview-wrapper">
          <div class="search-bar">
            <n-input
              v-model:value="searchTerm"
              placeholder="搜索笔记标题或内容"
              clearable
              size="large"
            />
          </div>
          <note-overview :notes="filteredNotes" @select="openNote" @open="openNote" />
        </div>
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
import workspaceApi from '@/api/workspace'
import { noteTypeMap } from '@/constants/noteTypes'

const router = useRouter()
const message = useMessage()

const notes = ref([])
const loading = ref(false)
const searchTerm = ref('')
const importInput = ref(null)
const workspaceOptions = ref([])

const recentNotes = computed(() => notes.value.slice(0, 6))
const filteredNotes = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  if (!keyword) return notes.value
  return notes.value.filter((note) => {
    const title = note.title?.toLowerCase() || ''
    const content = note.contentJson?.toLowerCase() || ''
    return title.includes(keyword) || content.includes(keyword)
  })
})

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
  importInput.value?.click()
}

const loadWorkspaceOptions = async () => {
  try {
    const response = await workspaceApi.list()
    const data = response.data?.data ?? response.data ?? []
    workspaceOptions.value = Array.isArray(data)
      ? data.map((item) => ({
          label: item.name || item.title || item.workspaceName || '工作区',
          value: item.id ?? item.Id ?? item.workspaceId ?? item.WorkspaceId
        }))
      : []
  } catch (error) {
    console.error('[Overview] loadWorkspaceOptions error:', error)
  }
}

const resolveWorkspaceId = () => workspaceOptions.value[0]?.value ?? null

const handleImportFile = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const workspaceId = resolveWorkspaceId()
  if (!workspaceId) {
    message.warning('请先进入一个工作区')
    event.target.value = ''
    return
  }
  try {
    await noteApi.importNote(workspaceId, file)
    message.success('导入成功')
    await loadNotes()
  } catch (error) {
    console.error('[Overview] importNote error:', error)
    message.error(error?.response?.data?.message || '导入失败')
  } finally {
    event.target.value = ''
  }
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
  loadWorkspaceOptions()
})
</script>

<style scoped>
.overview-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.import-input {
  display: none;
}

.search-bar {
  width: 100%;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 18px;
}

.overview-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
