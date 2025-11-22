<template>
  <div class="graph-page">
    <knowledge-graph-panel class="section-card" :notes="notes" :loading="loading" />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import KnowledgeGraphPanel from '@/components/KnowledgeGraphPanel.vue'
import noteApi from '@/api/note'
import { noteTypeMap } from '@/constants/noteTypes'

const message = useMessage()
const notes = ref([])
const loading = ref(false)

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

const loadNotes = async () => {
  loading.value = true
  try {
    const response = await noteApi.list()
    const data = response.data?.data ?? response.data ?? []
    notes.value = (Array.isArray(data) ? data : []).map(normaliseNote).filter(Boolean)
  } catch (error) {
    console.error('[KnowledgeGraphPage] loadNotes error:', error)
    message.error(error?.response?.data?.message || '获取笔记失败，请稍后重试。')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadNotes()
})
</script>

<style scoped>
.graph-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.section-card {
  width: 100%;
}
</style>
