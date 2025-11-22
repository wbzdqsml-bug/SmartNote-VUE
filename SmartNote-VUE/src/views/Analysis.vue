<template>
  <div class="analysis-page">
    <div class="analysis-grid">
      <stats-panel class="section-card" :notes="notes" />
      <learning-stats class="section-card" />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import StatsPanel from '@/components/StatsPanel.vue'
import LearningStats from '@/components/LearningStats.vue'
import noteApi from '@/api/note'
import { noteTypeMap } from '@/constants/noteTypes'

const message = useMessage()
const notes = ref([])

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
  try {
    const response = await noteApi.list()
    const data = response.data?.data ?? response.data ?? []
    notes.value = (Array.isArray(data) ? data : []).map(normaliseNote).filter(Boolean)
  } catch (error) {
    console.error('[Analysis] loadNotes error:', error)
    message.error(error?.response?.data?.message || '获取笔记数据失败')
  }
}

onMounted(() => {
  loadNotes()
})
</script>

<style scoped>
.analysis-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 16px;
}

.section-card {
  width: 100%;
}
</style>
