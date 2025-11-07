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
          <div class="notes-layout">
            <note-list
              class="note-panel"
              :notes="notes"
              :loading="notesLoading"
              :selected-id="selectedNoteId"
              :keyword="keyword"
              @select="handleSelectNote"
              @soft-delete="handleSoftDelete"
              @refresh="refreshAll"
            />
            <note-editor
              class="note-panel"
              :note="selectedNote"
              :saving="noteSaving"
              @update-note="handleUpdateNote"
              @soft-delete="handleSoftDelete"
            />
          </div>
          <note-overview
            class="section-card"
            :notes="recentNotes"
            @select="handleSelectNote"
            @open="handleOverviewOpen"
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

  <n-modal
    v-model:show="createVisible"
    preset="card"
    title="新建笔记"
    :mask-closable="false"
  >
    <n-form :model="createForm" label-placement="left" label-width="80">
      <n-form-item label="标题">
        <n-input v-model:value="createForm.title" placeholder="请输入笔记标题" />
      </n-form-item>
      <n-form-item label="类型">
        <n-select v-model:value="createForm.type" :options="noteTypeOptions" />
      </n-form-item>
      <n-form-item label="工作区">
        <n-select
          v-model:value="createForm.workspaceId"
          :options="workspaceOptions"
          :loading="workspaceLoading"
          placeholder="请选择所属工作区"
          clearable
        />
      </n-form-item>
    </n-form>
    <template #action>
      <n-space justify="end">
        <n-button @click="createVisible = false">取消</n-button>
        <n-button type="primary" :loading="createSubmitting" @click="submitCreate">
          创建
        </n-button>
      </n-space>
    </template>
  </n-modal>

  <recycle-drawer v-model:show="showRecycle" />
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
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
import noteApi from '@/api/note'
import workspaceApi from '@/api/workspace'
import { noteTypeOptions, noteTypeMap, defaultContentByType } from '@/constants/noteTypes'
import { useUserStore } from '@/store/userStore'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const userStore = useUserStore()

const activeSection = ref('notes')
const keyword = ref('')

const notes = ref([])
const notesLoading = ref(false)
const selectedNoteId = ref(null)
const noteSaving = ref(false)

const workspaceOptions = ref([])
const workspaceLoading = ref(false)

const createVisible = ref(false)
const createSubmitting = ref(false)
const createForm = reactive({
  title: '',
  type: noteTypeOptions[0]?.value ?? 0,
  workspaceId: null
})

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
  const content = raw.contentJson ?? raw.content ?? ''
  const preview = raw.preview ?? ''
  const createdAt =
    raw.createTime || raw.createdAt || raw.created_time || raw.created_at || null
  const updatedAt =
    raw.lastUpdateTime || raw.updateTime || raw.updatedAt || raw.updated_at || createdAt
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
    workspaceId: raw.workspaceId ?? raw.WorkspaceId ?? null
  }
}

const getNoteTimestamp = (note) => {
  const target = note.updateTime || note.updatedAt || note.createdAt || note.createTime
  return target ? new Date(target).getTime() : 0
}

const loadNotes = async (focusId = null) => {
  notesLoading.value = true
  try {
    const response = await noteApi.list()
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
    if (workspaceOptions.value.length && !createForm.workspaceId) {
      createForm.workspaceId = workspaceOptions.value[0].value
    }
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
  if (workspaceOptions.value.length && !createForm.workspaceId) {
    createForm.workspaceId = workspaceOptions.value[0].value
  }
}

const openCreateDialog = async () => {
  createForm.title = ''
  createForm.type = noteTypeOptions[0]?.value ?? 0
  createForm.workspaceId = null
  await ensureWorkspaceOptions()
  createVisible.value = true
}

const submitCreate = async () => {
  if (!createForm.title.trim()) {
    message.warning('请输入笔记标题')
    return
  }
  if (!createForm.workspaceId) {
    message.warning('请选择笔记所属的工作区')
    return
  }
  createSubmitting.value = true
  try {
    const payload = {
      workspaceId: createForm.workspaceId,
      title: createForm.title.trim(),
      type: createForm.type,
      contentJson: defaultContentByType[createForm.type] || ''
    }
    const response = await noteApi.create(payload)
    const data = resolveResponse(response, {})
    const newId = normaliseId(data?.noteId ?? data?.id)
    message.success('新建笔记成功')
    createVisible.value = false
    await loadNotes(newId)
  } catch (error) {
    console.error('[Home] submitCreate error:', error)
    if (error?.response?.status === 401) {
      message.error(error?.response?.data?.message || '当前账号没有权限创建该笔记。')
      return
    }
    message.error(error?.response?.data?.message || '新建笔记失败，请稍后重试。')
  } finally {
    createSubmitting.value = false
  }
}

const handleSelectNote = (note) => {
  selectedNoteId.value = normaliseId(note?.id)
}

const handleOverviewOpen = (note) => {
  handleSelectNote(note)
  activeSection.value = 'notes'
  focusSection('notes')
}

const handleUpdateNote = async ({ id, payload }) => {
  if (!id) return
  noteSaving.value = true
  try {
    const body = {
      id,
      title: payload.title,
      contentJson: payload.contentJson
    }
    await noteApi.update(id, body)
    message.success('笔记已保存')
    await loadNotes(id)
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

const focusSection = (key) => {
  nextTick(() => {
    const target = sectionMap[key]?.value
    if (target && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

const handleSectionChange = (key) => {
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
  await Promise.all([loadWorkspaceOptions(), loadNotes()])
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

.notes-layout {
  display: grid;
  grid-template-columns: minmax(320px, 360px) minmax(480px, 1fr);
  gap: 24px;
}

.note-panel {
  min-height: 420px;
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
  .notes-layout {
    grid-template-columns: 1fr;
  }

  .note-panel {
    min-height: 360px;
  }
}
</style>
