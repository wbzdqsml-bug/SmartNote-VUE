<template>
  <div class="notes-page">
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
        class="note-panel editor-panel"
        :note="selectedNote"
        :saving="noteSaving"
        @update-note="handleUpdateNote"
      />
      <note-sidebar
        class="note-panel"
        :note="selectedNote"
        :saving="noteSaving"
        :category-options="categoryOptions"
        :tag-options="tagOptions"
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
import NoteList from '@/components/NoteList.vue'
import NoteEditor from '@/components/NoteEditor.vue'
import NoteSidebar from '@/components/NoteSidebar.vue'
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
  
  const tags = Array.isArray(raw.tags ?? raw.Tags)
      ? (raw.tags ?? raw.Tags).map((item) => ({
          id: normaliseId(item.id ?? item.Id ?? item.tagId ?? item.TagId),
          name: item.name ?? item.Name,
          color: item.color || item.Color || ''
        }))
      : []
  
  const tagIds = Array.isArray(raw.tags ?? raw.Tags)
      ? (raw.tags ?? raw.Tags)
          .map((item) => normaliseId(item.id ?? item.tagId ?? item.TagId))
          .filter((id) => id !== null && id !== undefined)
      : Array.isArray(raw.tagIds)
        ? raw.tagIds.map((id) => normaliseId(id)).filter((id) => id !== null && id !== undefined)
        : []

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
    tags,
    tagIds,
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
      selectedNoteId.value = list[0]?.id
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
    if (selectedNoteId.value) {
      router.replace({ path: route.path, query: { ...route.query, focus: selectedNoteId.value } })
    }
  })
}

const handleUpdateNote = async ({ id, payload, tagsChanged = false }) => {
  if (!id || !selectedNote.value) return
  noteSaving.value = true

  const currentNote = selectedNote.value
  const body = {
      id,
      title: payload.title ?? currentNote.title,
      contentJson: payload.contentJson ?? payload.content ?? currentNote.contentJson,
      content: payload.content ?? payload.contentJson ?? currentNote.content,
  }
  if ('categoryId' in payload) {
    body.categoryId = payload.categoryId ?? null
  }

  try {
    await noteApi.update(id, body)
    if (tagsChanged && 'tagIds' in payload) {
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

const handleFilterChange = () => {
  loadNotes(selectedNoteId.value)
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
  width: 100%;
  height: 100%;
  padding: 16px; /* A bit of padding for the whole page */
  box-sizing: border-box;
  background-color: #f8fafc; /* A slightly off-white background */
}

.notes-layout {
  display: grid;
  /* Proportional columns: list and sidebar take up a flexible portion, editor takes the most */
  grid-template-columns: minmax(280px, 1.5fr) 3fr minmax(260px, 1.5fr);
  gap: 16px;
  height: 100%;
  width: 100%;
}

.note-panel {
  height: 100%;
  min-height: 480px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background-color: #ffffff;
  border: 1px solid #eef2f8;
}

/* Medium screens (e.g., tablets, small laptops) */
@media (max-width: 1024px) {
  .notes-layout {
    /* Switch to 2 columns, hide the rightmost sidebar */
    grid-template-columns: minmax(280px, 320px) 1fr;
  }
  .notes-layout > :nth-child(3) {
    display: none; 
  }
}

/* Small screens (e.g., mobile) */
@media (max-width: 768px) {
  .notes-page {
    padding: 0;
  }
  .notes-layout {
    /* Stack the note list and editor vertically */
    grid-template-columns: 1fr;
    grid-template-rows: minmax(300px, 40vh) 1fr; /* List gets 40% of the height */
    gap: 0;
  }
  
  .note-panel {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  /* We still hide the sidebar on mobile */
  .notes-layout > :nth-child(3) {
    display: none; 
  }

  /* When a note is selected, we might want to hide the list and show the editor */
  /* This would require JS, but for now, we just stack them. */
}
</style>
