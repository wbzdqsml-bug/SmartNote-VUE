<template>
  <n-layout has-sider class="app-layout">
    <app-sidebar
      :active="activeSection"
      :profile="userStore.profile"
      @create-note="openCreateDialog"
      @search="handleSearch"
      @update:active="handleSectionChange"
      @open-profile="handleOpenProfile"
      @open-recycle="showRecycle = true"
      @logout="handleLogout"
    />
    <n-layout class="main-area">
      <user-header
        :title="headerTitle"
        :subtitle="headerSubtitle"
        :notifications="notifications"
        @refresh="refreshAll"
      />
      <div class="main-scroll">
        <section ref="notesSection" class="section" id="notes">
          <quick-actions
            @create="openCreateDialog"
            @import="handleImport"
            @open-ai="goToAiSection"
          />
          <note-overview
            class="section-card note-overview-panel"
            :notes="recentNotes"
            @select="handleSelectNote"
            @open="handleOverviewOpen"
          />
          <div class="note-list-row">
            <note-list
              class="note-panel"
              :notes="notes"
              :loading="notesLoading"
              :selected-id="selectedNoteId"
              :keyword="keyword"
              :category-options="categoryOptions"
              :tag-options="tagOptions"
              v-model:selected-category="selectedCategory"
              v-model:selected-tag-ids="selectedTagIds"
              @select="handleSelectNote"
              @soft-delete="handleSoftDelete"
              @refresh="refreshAll"
              @filter-change="handleFilterChange"
            />
          </div>
          <note-editor
            class="note-panel note-editor-full"
            :note="selectedNote"
            :saving="noteSaving"
            @update-note="handleUpdateNote"
            @soft-delete="handleSoftDelete"
          />
        </section>

        <section ref="analysisSection" class="section" id="analysis">
          <div class="analysis-grid">
            <stats-panel class="section-card" :notes="notes" />
            <learning-stats class="section-card" />
          </div>
        </section>

        <section ref="aiSection" class="section" id="ai">
          <div class="ai-grid">
            <AiActionsPanel
              class="section-card"
              @analyse="handleAiAnalyse"
              @keywords="handleAiKeywords"
            />
            <knowledge-graph-panel
              class="section-card"
              :notes="notes"
              :loading="notesLoading"
            />
          </div>
        </section>

        <section ref="settingsSection" class="section" id="settings">
          <workspace-panel class="section-card" />
        </section>
      </div>
    </n-layout>
  </n-layout>

  <add-note-modal
    v-model:show="createVisible"
    :workspace-options="workspaceOptions"
    :workspace-loading="workspaceLoading"
    @created="handleCreatedNote"
  />

  <recycle-drawer v-model:show="showRecycle" />
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import AppSidebar from '@/components/AppSidebar.vue'
import UserHeader from '@/components/UserHeader.vue'
import QuickActions from '@/components/QuickActions.vue'
import NoteList from '@/components/NoteList.vue'
import NoteEditor from '@/components/NoteEditor.vue'
import NoteOverview from '@/components/NoteOverview.vue'
import StatsPanel from '@/components/StatsPanel.vue'
import LearningStats from '@/components/LearningStats.vue'
import AiActionsPanel from '@/components/AIActionsPanel.vue'
import KnowledgeGraphPanel from '@/components/KnowledgeGraphPanel.vue'
import WorkspacePanel from '@/components/WorkspacePanel.vue'
import RecycleDrawer from '@/components/RecycleDrawer.vue'
import AddNoteModal from '@/components/AddNoteModal.vue'
import noteApi from '@/api/note'
import workspaceApi from '@/api/workspace'
import { noteTypeMap } from '@/constants/noteTypes'
import { useUserStore } from '@/store/userStore'
import { useCategoryStore } from '@/store/categoryStore'
import { useTagStore } from '@/store/tagStore'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const userStore = useUserStore()
const categoryStore = useCategoryStore()
const tagStore = useTagStore()

const activeSection = ref('notes')
const keyword = ref('')

const notes = ref([])
const notesLoading = ref(false)
const selectedNoteId = ref(null)
const noteSaving = ref(false)

const categoryOptions = computed(() => categoryStore.options)
const tagOptions = computed(() => tagStore.options)
const selectedCategory = ref(null)
const selectedTagIds = ref([])

const workspaceOptions = ref([])
const workspaceLoading = ref(false)

const createVisible = ref(false)

const showRecycle = ref(false)

const notesSection = ref(null)
const analysisSection = ref(null)
const aiSection = ref(null)
const settingsSection = ref(null)

const notifications = ref([])

const isUnauthorized = (error) => error?.response?.status === 401

const sectionMap = {
  notes: notesSection,
  analysis: analysisSection,
  ai: aiSection,
  settings: settingsSection
}

const headerMap = {
  notes: { title: '我的笔记', subtitle: '学习中心与知识中枢' },
  analysis: { title: '学习分析', subtitle: '掌握知识增长节奏' },
  ai: { title: 'AI 助手', subtitle: '智能分析与创作助手' },
  settings: { title: '协作空间', subtitle: '工作区与成员管理' }
}

const headerTitle = computed(() => headerMap[activeSection.value]?.title ?? '我的笔记')
const headerSubtitle = computed(
  () => headerMap[activeSection.value]?.subtitle ?? '学习中心与知识中枢'
)

const selectedNote = computed(() =>
  notes.value.find((item) => item.id === selectedNoteId.value) || null
)

const recentNotes = computed(() => notes.value.slice(0, 6))

const resolveResponse = (response, fallback = []) => {
  if (!response) return fallback
  const data = response.data ?? fallback
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data ?? fallback
  }
  return data ?? fallback
}

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
  const preview = raw.preview ?? ''
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
    preview,
    createdAt,
    updateTime: updatedAt,
    workspaceId: raw.workspaceId ?? raw.WorkspaceId ?? null,
    categoryId: normaliseId(
      raw.categoryId ?? raw.CategoryId ?? raw.category?.id ?? raw.Category?.Id
    ),
    categoryName: raw.categoryName ?? raw.CategoryName ?? raw.category?.name ?? raw.Category?.Name ?? '',
    categoryColor: raw.categoryColor ?? raw.CategoryColor ?? raw.category?.color ?? raw.Category?.Color ?? '',
    tags: Array.isArray(raw.tags ?? raw.Tags)
      ? (raw.tags ?? raw.Tags).map((item) => ({
          id: normaliseId(item.id ?? item.Id ?? item.tagId ?? item.TagId),
          name: item.name ?? item.Name,
          color: item.color || item.Color || ''
        }))
      : [],
    tagIds: Array.isArray(raw.tags ?? raw.Tags)
      ? (raw.tags ?? raw.Tags)
          .map((item) => normaliseId(item.id ?? item.tagId ?? item.TagId))
          .filter((id) => id !== null && id !== undefined)
    : Array.isArray(raw.tagIds)
      ? raw.tagIds.map((id) => normaliseId(id)).filter((id) => id !== null && id !== undefined)
      : []
  }
}

const getNoteTimestamp = (note) => {
  const target = note.updateTime || note.updatedAt || note.createdAt || note.createTime
  return target ? new Date(target).getTime() : 0
}

const loadNotes = async (focusId = selectedNoteId.value) => {
  notesLoading.value = true
  try {
    const params = {}
    const hasCategory =
      selectedCategory.value !== null && selectedCategory.value !== undefined && selectedCategory.value !== ''
    if (hasCategory) params.categoryId = selectedCategory.value

    const hasTags = Array.isArray(selectedTagIds.value) && selectedTagIds.value.length > 0
    if (hasTags) params.tagIds = selectedTagIds.value.join(',')

    const response = Object.keys(params).length ? await noteApi.filter(params) : await noteApi.list()
    const raw = resolveResponse(response, [])
    const list = (Array.isArray(raw) ? raw : [])
      .map(normaliseNote)
      .filter(Boolean)
    list.sort((a, b) => getNoteTimestamp(b) - getNoteTimestamp(a))
    notes.value = list

    if (!list.length) {
      selectedNoteId.value = null
      return
    }

    const focus = focusId ?? selectedNoteId.value
    if (focus !== null && list.some((item) => item.id === focus)) {
      selectedNoteId.value = focus
    } else {
      selectedNoteId.value = list[0].id
    }
  } catch (error) {
    console.error('[Home] loadNotes error:', error)
    if (isUnauthorized(error)) {
      message.error(error?.response?.data?.message || '当前账号没有权限查看笔记列表。')
    } else {
      message.error(error?.response?.data?.message || '获取笔记列表失败，请稍后重试。')
    }
  } finally {
    notesLoading.value = false
  }
}

const loadWorkspaceOptions = async () => {
  workspaceLoading.value = true
  try {
    const response = await workspaceApi.list()
    const raw = resolveResponse(response, [])
    const list = Array.isArray(raw) ? raw : []
    workspaceOptions.value = list.map((item) => {
      const id = item.id ?? item.Id ?? item.workspaceId ?? item.WorkspaceId
      return {
        label: item.name || item.title || `工作区 #${id}`,
        value: id
      }
    })
  } catch (error) {
    console.error('[Home] loadWorkspaceOptions error:', error)
    if (isUnauthorized(error)) {
      message.error(error?.response?.data?.message || '当前账号没有权限查看工作区信息。')
    } else {
      message.error(error?.response?.data?.message || '获取工作区信息失败，请稍后重试。')
    }
  } finally {
    workspaceLoading.value = false
  }
}

const ensureWorkspaceOptions = async () => {
  if (!workspaceOptions.value.length && !workspaceLoading.value) {
    await loadWorkspaceOptions()
  }
}

const openCreateDialog = async () => {
  await ensureWorkspaceOptions()
  createVisible.value = true
}

const handleCreatedNote = async (noteId) => {
  await loadNotes(noteId ?? selectedNoteId.value)
}

const handleSelectNote = (note) => {
  selectedNoteId.value = normaliseId(note?.id)
}

const handleOverviewOpen = (note) => {
  handleSelectNote(note)
  activeSection.value = 'notes'
  focusSection('notes')
}

const handleUpdateNote = async ({ id, payload, tagsChanged = false, silent = false, autosave = false }) => {
  if (!id) return
  noteSaving.value = true
  try {
    const body = {
      id,
      title: payload.title,
      contentJson: payload.contentJson ?? payload.content,
      content: payload.content ?? payload.contentJson
    }
    if ('categoryId' in payload) {
      body.categoryId = payload.categoryId ?? null
    }

    await noteApi.update(id, body)
    if (tagsChanged) {
      const tagIds = Array.isArray(payload.tagIds)
        ? payload.tagIds.map((item) => normaliseId(item)).filter((item) => item !== null)
        : []
      await noteApi.updateTags(id, { tagIds })
    }
    if (!silent) {
      message.success('笔记已保存')
      await loadNotes(id)
    } else if (autosave) {
      notes.value = notes.value.map((item) =>
        item.id === id
          ? {
              ...item,
              title: body.title ?? item.title,
              content: body.content ?? item.content,
              contentJson: body.contentJson ?? item.contentJson,
              updateTime: new Date().toISOString()
            }
          : item
      )
    }
  } catch (error) {
    console.error('[Home] handleUpdateNote error:', error)
    if (error?.response?.status === 401) {
      message.error(error?.response?.data?.message || '当前账号没有权限执行此操作。')
      return
    }
    message.error(error?.response?.data?.message || '保存失败，请稍后重试。')
  } finally {
    noteSaving.value = false
  }
}

const handleSoftDelete = async (id) => {
  const targetId = normaliseId(id)
  if (!targetId) return
  try {
    await noteApi.softDelete([targetId])
    message.success('已移入回收站')
    if (selectedNoteId.value === targetId) {
      selectedNoteId.value = null
    }
    await loadNotes()
  } catch (error) {
    console.error('[Home] handleSoftDelete error:', error)
    message.error(error?.response?.data?.message || '删除失败，请稍后重试。')
  }
}

const handleSearch = (value) => {
  keyword.value = value?.trim() ?? ''
}

const handleFilterChange = () => {
  loadNotes(selectedNoteId.value)
}

const focusSection = (key) => {
  nextTick(() => {
    const target = sectionMap[key]?.value
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

const handleSectionChange = (key) => {
  if (key === 'profile') {
    router.push('/profile')
    return
  }
  if (key === 'tags') {
    router.push('/tags')
    return
  }
  activeSection.value = key
  focusSection(key)
}

const goToAiSection = () => {
  activeSection.value = 'ai'
  focusSection('ai')
}

const refreshAll = () => {
  loadNotes(selectedNoteId.value)
}

const handleImport = () => {
  message.info('导入功能开发中，敬请期待。')
}

const handleAiAnalyse = (prompt) => {
  message.success(`已提交摘要分析任务：${prompt.slice(0, 20)}...`)
}

const handleAiKeywords = (prompt) => {
  message.success(`已提交关键词提取任务：${prompt.slice(0, 20)}...`)
}

const handleOpenProfile = () => {
  message.info('个人资料功能即将上线。')
}

const handleLogout = () => {
  dialog.warning({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    positiveText: '退出',
    negativeText: '取消',
    onPositiveClick: () => {
      userStore.logout()
      router.push('/login')
    }
  })
}

watch(showRecycle, (visible, previous) => {
  if (!visible && previous) {
    loadNotes(selectedNoteId.value)
  }
})

onMounted(async () => {
  if (!userStore.profile) {
    userStore.fetchProfile()
  }
  await Promise.all([
    loadWorkspaceOptions(),
    categoryStore.loadCategories(),
    tagStore.loadTags(),
    loadNotes()
  ])
})
</script>

<style scoped>
.app-layout {
  height: 100vh;
  background: #f3f4f6;
}

.main-area {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}

.main-scroll {
  flex: 1;
  padding: 0 28px 32px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.note-list-row {
  display: flex;
  flex-direction: row;
  gap: 16px;
  width: 100%;
  height: 640px;
  overflow: hidden;
}

.note-panel {
  min-height: 420px;
  width: 100%;
  height: 640px;
  overflow: hidden;
}

.note-editor-full {
  width: 100%;
  height: 640px;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.ai-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.section-card {
  width: 100%;
}

@media (max-width: 1200px) {
  .note-panel {
    min-height: 360px;
  }
}
</style>
