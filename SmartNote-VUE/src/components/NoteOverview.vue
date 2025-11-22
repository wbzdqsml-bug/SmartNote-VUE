<template>
  <div v-if="!notes.length" class="overview-empty">
    <n-empty description="暂无笔记" />
  </div>
  <div v-else class="overview-grid">
    <n-card
      v-for="note in limitedNotes"
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
  },
  limit: {
    type: Number,
    default: 6 // 默认只显示6个，多的不显示（如果想显示全部，可以把这个数字改很大）
  }
})

// 修复：使用 slice 确保只取前 limit 个笔记
const limitedNotes = computed(() => {
  if (!props.notes) return []
  return props.notes.slice(0, props.limit)
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
}

.overview-card {
  /* --- 核心布局代码 --- */
  /* 计算公式：(100%总宽 - 16px间距) / 2 = 50% - 8px 
     flex-grow: 0 (不自动放大)
     flex-shrink: 0 (不自动缩小)
  */
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  box-sizing: border-box; /* 这一行必须有，确保 padding 包含在宽度内 */
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
}

.note-preview {
  margin: 0 0 14px;
  font-size: 13px;
  color: #6b7280;
  min-height: 36px;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  color: #6b7280;
  font-size: 12px;
}
</style>