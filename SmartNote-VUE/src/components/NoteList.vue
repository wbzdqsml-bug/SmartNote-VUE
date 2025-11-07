<template>
  <n-card class="note-list" :segmented="{ content: true, footer: true }">
    <template #header>
      <div class="header">
        <div>
          <h3>笔记总览</h3>
          <p v-if="keyword">关键词：{{ keyword }}</p>
        </div>
        <n-space>
          <n-button quaternary size="small" @click="$emit('refresh')">刷新</n-button>
        </n-space>
      </div>
    </template>

    <div class="list-body">
      <n-spin :show="loading">
        <n-empty v-if="!notes.length" description="暂无笔记" />
        <div v-else class="scroll-area">
          <div class="card-column">
            <n-card
              v-for="note in filteredNotes"
              :key="note.id"
              :class="['note-card', { active: note.id === selectedId }]"
              hoverable
              @click="$emit('select', note)"
            >
              <template #header>
                <div class="card-header">
                  <n-ellipsis>{{ note.title || '未命名笔记' }}</n-ellipsis>
                  <n-tag size="small" round type="success">
                    {{ note.typeName || typeName(note.type) }}
                  </n-tag>
                </div>
              </template>

              <template #default>
                <p class="preview">
                  {{ renderPreview(note) }}
                </p>
              </template>

              <template #footer>
                <div class="card-footer">
                  <span>{{ formatTime(note.updateTime || note.createdAt) }}</span>
                  <n-popconfirm
                    positive-text="确认"
                    negative-text="取消"
                    @positive-click="$emit('soft-delete', note.id)"
                  >
                    <template #trigger>
                      <n-button size="tiny" tertiary type="error">
                        移入回收站
                      </n-button>
                    </template>
                    确认将该笔记移入回收站？
                  </n-popconfirm>
                </div>
              </template>
            </n-card>
          </div>
        </div>
      </n-spin>
    </div>
  </n-card>
</template>

<script setup>
import { computed } from 'vue'
import {
  NCard,
  NButton,
  NTag,
  NSpin,
  NSpace,
  NEmpty,
  NPopconfirm,
  NEllipsis
} from 'naive-ui'
import { format } from 'date-fns'
import { noteTypeMap } from '@/constants/noteTypes'

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedId: {
    type: [Number, String],
    default: null
  },
  keyword: {
    type: String,
    default: ''
  }
})

defineEmits(['select', 'soft-delete', 'refresh'])

const filteredNotes = computed(() => {
  const keyword = props.keyword?.toLowerCase()?.trim() ?? ''
  if (!keyword) {
    return props.notes
  }
  return props.notes.filter((item) => {
    return (
      item.title?.toLowerCase().includes(keyword) ||
      item.contentJson?.toLowerCase().includes(keyword)
    )
  })
})

const typeName = (value) => noteTypeMap[value] || '笔记'

const formatTime = (value) => {
  if (!value) return '未知时间'
  try {
    return format(new Date(value), 'yyyy-MM-dd HH:mm')
  } catch {
    return value
  }
}

const renderPreview = (note) => {
  if (!note) return '暂无预览内容'
  if (Number(note.type) === 1) return '手写画板（点击以查看详情）'
  if (note.preview) return note.preview
  const body = note.contentJson ?? note.content
  if (body) return body.slice(0, 120)
  return '暂无预览内容'
}
</script>

<style scoped>
.note-list {
  border-radius: 22px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.12);
  background: #fff;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

:deep(.n-card__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.header p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.list-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ✅ 让内部可滚动，外部固定高度 */
.scroll-area {
  flex: 1;
  overflow-y: auto;
  max-height: 480px; /* 固定高度，内部滚动 */
  padding-right: 8px;
  scrollbar-gutter: stable;
}

.scroll-area::-webkit-scrollbar {
  width: 8px;
}

.scroll-area::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 4px;
}

.scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

.card-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-card {
  border-radius: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
}

.note-card.active {
  border-color: rgba(79, 70, 229, 0.5);
  box-shadow: 0 14px 32px rgba(79, 70, 229, 0.18);
}

.note-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(79, 70, 229, 0.25);
}

.preview {
  min-height: 60px;
  color: #4b5563;
  font-size: 13px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #6b7280;
  font-size: 12px;
}
</style>
