<template>
  <n-card class="overview" title="最近笔记" :bordered="false">
    <n-empty v-if="!notes.length" description="暂无笔记" />
    <n-scrollbar v-else class="overview-scroll" x-scrollable>
      <div class="overview-strip">
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
    </n-scrollbar>
  </n-card>
</template>

<script setup>
import { computed } from 'vue'
import { NCard, NEmpty, NScrollbar, NButton } from 'naive-ui'
import { format } from 'date-fns'
import { noteTypeMap } from '@/constants/noteTypes'

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  },
  limit: {
    type: Number,
    default: 6
  }
})

const limitedNotes = computed(() => props.notes.slice(0, props.limit))

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
.overview {
  border-radius: 22px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
  margin-bottom: 16px;
}

.overview-scroll {
  padding-bottom: 12px;
}

.overview-strip {
  display: flex;
  gap: 16px;
  padding: 0 6px;
}

.overview-card {
  border-radius: 18px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  width: 240px;
  flex: 0 0 240px;
}

.overview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(79, 70, 229, 0.25);
}

.note-type {
  font-size: 12px;
  color: #6366f1;
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
  color: #9ca3af;
  font-size: 12px;
}
</style>
