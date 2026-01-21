<!--
  文件说明：页面视图（AiAssistant）
  - 主要职责：负责页面级业务布局、数据加载与子组件编排。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="ai-page">
    <n-card class="section-card" :bordered="false" title="AI 助手">
      <div class="toolbar">
        <n-select
          v-model:value="selectedId"
          class="note-select"
          filterable
          clearable
          placeholder="选择一篇笔记后使用 AI 功能"
          :options="noteOptions"
          :loading="loading"
        />
        <n-button size="small" @click="loadNotes">刷新</n-button>
      </div>

      <n-empty v-if="!selectedNote" description="请先选择笔记（推荐在“笔记编辑”页右侧 AI 面板使用）" />

      <ai-actions-panel
        v-else
        :note-id="selectedNote.id"
        :workspace-id="selectedNote.workspaceId"
        :note-title="selectedNote.title"
        :category-id="selectedNote.categoryId"
        :tag-ids="selectedNote.tagIds"
      />
    </n-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { NButton, NCard, NEmpty, NSelect, useMessage } from 'naive-ui'
import noteApi from '@/api/note'
import AiActionsPanel from '@/components/AIActionsPanel.vue'

const message = useMessage()

const notes = ref([])
const loading = ref(false)
const selectedId = ref(null)

const normaliseId = (value) => {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

const resolveResponse = (response, fallback = []) => {
  if (!response) return fallback
  const data = response.data ?? fallback
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data ?? fallback
  }
  return data ?? fallback
}

const normaliseNote = (raw) => {
  if (!raw || typeof raw !== 'object') return null
  const id = normaliseId(raw.id ?? raw.noteId ?? raw.noteID)
  if (id === null) return null
  return {
    id,
    title: raw.title ?? raw.Title ?? '未命名笔记',
    workspaceId: normaliseId(raw.workspaceId ?? raw.WorkspaceId),
    categoryId: normaliseId(raw.categoryId ?? raw.CategoryId ?? raw.category?.id ?? raw.Category?.Id),
    tagIds: Array.isArray(raw.tagIds)
      ? raw.tagIds.map((item) => normaliseId(item)).filter((item) => item !== null)
      : Array.isArray(raw.tags ?? raw.Tags)
        ? (raw.tags ?? raw.Tags)
            .map((item) => normaliseId(item.id ?? item.Id ?? item.tagId ?? item.TagId))
            .filter((item) => item !== null)
        : []
  }
}

const noteOptions = computed(() =>
  (Array.isArray(notes.value) ? notes.value : []).map((note) => ({
    label: note.title,
    value: note.id
  }))
)

const selectedNote = computed(() => {
  const id = normaliseId(selectedId.value)
  if (id === null) return null
  return notes.value.find((item) => item.id === id) || null
})

const loadNotes = async () => {
  loading.value = true
  try {
    const response = await noteApi.list()
    const data = resolveResponse(response, [])
    notes.value = (Array.isArray(data) ? data : []).map(normaliseNote).filter(Boolean)
  } catch (error) {
    console.error('[AiAssistant] loadNotes error:', error)
    message.error(error?.response?.data?.message || '获取笔记列表失败，请稍后重试。')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadNotes()
})
</script>

<style scoped>
.ai-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-card {
  width: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.note-select {
  flex: 1;
  min-width: 240px;
}
</style>

