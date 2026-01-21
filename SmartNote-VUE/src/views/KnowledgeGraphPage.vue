<!--
  文件说明：页面视图（KnowledgeGraphPage）
  - 主要职责：负责页面级业务布局、数据加载与子组件编排。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
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
