<template>
  <div class="notes-page">
    <quick-actions
      @create="openCreate"
      @import="handleImport"
      @open-ai="goToAiPage"
    />

    <div class="notes-layout">
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
        @refresh="refreshNotes"
        @filter-change="handleFilterChange"
      />
      <note-editor
        class="note-panel"
        :note="selectedNote"
        :saving="noteSaving"
        @update-note="handleUpdateNote"
        @soft-delete="handleSoftDelete"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import QuickActions from '@/components/QuickActions.vue'
import NoteList from '@/components/NoteList.vue'
import NoteEditor from '@/components/NoteEditor.vue'
import noteApi from '@/api/note'
import { noteTypeMap } from '@/constants/noteTypes'
import { useCategoryStore } from '@/store/categoryStore'
import { useTagStore } from '@/store/tagStore'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const categoryStore = useCategoryStore()
const tagStore = useTagStore()

const notes = ref([])
const notesLoading = ref(false)
const selectedNoteId = ref(null)
const noteSaving = ref(false)
const keyword = ref(route.query.q || '')
const selectedCategory = ref(null)
const selectedTagIds = ref([])

const categoryOptions = computed(() => categoryStore.options)
const tagOptions = computed(() => tagStore.options)

const selectedNote = computed(() => notes.value.find((item) => item.id === selectedNoteId.value) || null)

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
    updateTime: updatedAt,
    workspaceId: raw.workspaceId ?? raw.WorkspaceId ?? null,
    categoryId: normaliseId(
      raw.categoryId ?? raw.CategoryId ?? raw.category?.id ?? raw.Category?.Id
    ),
    categoryName:
      raw.categoryName ?? raw.CategoryName ?? raw.category?.name ?? raw.Category?.Name ?? '',
    categoryColor:
      raw.categoryColor ?? raw.CategoryColor ?? raw.category?.color ?? raw.Category?.Color ?? '',
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
      selectedCategory.value !== null &&
      selectedCategory.value !== undefined &&
      selectedCategory.value !== ''
    if (hasCategory) params.categoryId = selectedCategory.value

    const hasTags = Array.isArray(selectedTagIds.value) && selectedTagIds.value.length > 0
    if (hasTags) params.tagIds = selectedTagIds.value.join(',')

    const response = Object.keys(params).length ? await noteApi.filter(params) : await noteApi.list()
    const raw = resolveResponse(response, [])
    const list = (Array.isArray(raw) ? raw : []).map(normaliseNote).filter(Boolean)
    list.sort((a, b) => getNoteTimestamp(b) - getNoteTimestamp(a))
    notes.value = list

    if (!list.length) {
      selectedNoteId.value = null
      return
    }

    const focus = focusId ?? normaliseId(route.query.focus)
    if (focus !== null && list.some((item) => item.id === focus)) {
      selectedNoteId.value = focus
    } else {
      selectedNoteId.value = list[0].id
    }
  } catch (error) {
    console.error('[NotesWorkspace] loadNotes error:', error)
    message.error(error?.response?.data?.message || '获取笔记列表失败，请稍后重试。')
  } finally {
    notesLoading.value = false
  }
}

const refreshNotes = () => {
  loadNotes(selectedNoteId.value)
}

const handleSelectNote = (note) => {
  selectedNoteId.value = normaliseId(note?.id)
  nextTick(() => {
    router.replace({ path: route.path, query: { ...route.query, focus: selectedNoteId.value } })
  })
}

const handleUpdateNote = async ({ id, payload, tagsChanged = false }) => {
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
    message.success('笔记已保存')
    await loadNotes(id)
  } catch (error) {
    console.error('[NotesWorkspace] handleUpdateNote error:', error)
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
    console.error('[NotesWorkspace] handleSoftDelete error:', error)
    message.error(error?.response?.data?.message || '删除失败，请稍后重试。')
  }
}

const handleSearch = (value) => {
  keyword.value = value?.trim() ?? ''
}

const handleFilterChange = () => {
  loadNotes(selectedNoteId.value)
}

const handleImport = () => {
  message.info('导入功能开发中，敬请期待。')
}

const goToAiPage = () => {
  router.push('/ai')
}

const openCreateNote = inject('openCreateNote', null)
const openCreate = () => {
  if (typeof openCreateNote === 'function') {
    openCreateNote()
  } else {
    message.info('创建功能不可用，请稍后重试')
  }
}

onMounted(async () => {
  await Promise.all([categoryStore.loadCategories(), tagStore.loadTags()])
  await loadNotes(normaliseId(route.query.focus))
})

watch(
  () => route.query.q,
  (value) => {
    keyword.value = value?.toString() || ''
  }
)
</script>

<style scoped>
.notes-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.notes-layout {
  display: grid;
  grid-template-columns: minmax(320px, 360px) minmax(480px, 1fr);
  gap: 24px;
}

.note-panel {
  min-height: 420px;
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
