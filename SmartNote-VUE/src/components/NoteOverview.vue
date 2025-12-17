<template>
  <div v-if="!notes.length" class="overview-empty">
    <n-empty description="暂无笔记" />
  </div>
  <div v-else class="overview-grid">
    <n-card
      v-for="note in notes"
      :key="note.id"
      class="overview-card"
      hoverable
      @click="$emit('select', note)"
    >
      <div class="note-type">{{ note.typeName || noteTypeLabel(note.type) }}</div>
      <h4 class="note-title">{{ note.title || '未命名笔记' }}</h4>
      <p class="note-preview">{{ renderPreview(note) }}</p>
      <div class="note-footer">
        <span>{{ formatTime(note.updateTime || note.createdAt) }}</span>
        <n-button size="tiny" text @click.stop="$emit('open', note)">打开</n-button>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { NCard, NEmpty, NButton } from 'naive-ui'
import { format } from 'date-fns'
import { noteTypeMap } from '@/constants/noteTypes'

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  }
})

const noteTypeLabel = (type) => noteTypeMap[type] || '笔记'

const renderPreview = (note) => {
  if (!note) return '暂无预览内容'
  if (Number(note.type) === 1) return '手写画板（点击查看详情）'
  if (note.preview) return note.preview
  const body = note.contentJson ?? note.content
  if (body) return body.slice(0, 80)
  return '暂无预览内容'
}

const formatTime = (value) => {
  if (!value) return '未知时间'
  try {
    return format(new Date(value), 'MM-dd HH:mm')
  } catch {
    return value
  }
}
</script>

<style scoped>
.overview-grid {
  display: grid;
  /* Make the grid responsive: create as many 300px columns as fit, and stretch them to fill space */
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  width: 100%;
}

.overview-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.overview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.note-type {
  font-size: 12px;
  color: #4b5563;
  margin-bottom: 6px;
}

.note-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  /* Truncate long titles */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-preview {
  margin: 0 0 14px;
  font-size: 13px;
  color: #6b7280;
  min-height: 36px;
  flex: 1;
  /* Clamp preview text to 2 lines */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  color: #6b7280;
  font-size: 12px;
  margin-top: auto; /* Push footer to the bottom */
}
</style>
