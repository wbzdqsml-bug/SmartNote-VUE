<template>
  <el-card shadow="hover" class="note-card">
    <div class="card-header">
      <h3 class="title" @click="handleOpen">{{ note.title || '无标题' }}</h3>
      <el-tag v-if="typeLabel" size="small" :type="typeTag">{{ typeLabel }}</el-tag>
    </div>
    <p v-if="previewText" class="summary">{{ previewText }}</p>
    <div class="meta">
      <span v-if="formattedUpdate">
        <el-icon><Clock /></el-icon>
        {{ formattedUpdate }}
      </span>
      <span v-if="note.workspaceName" class="workspace">{{ note.workspaceName }}</span>
    </div>
    <div class="actions">
      <el-button type="primary" size="small" @click="handleOpen">打开</el-button>
      <el-popconfirm
        title="确定要删除这条笔记吗？"
        confirm-button-text="删除"
        cancel-button-text="取消"
        @confirm="handleRemove"
      >
        <template #reference>
          <el-button type="danger" size="small">删除</el-button>
        </template>
      </el-popconfirm>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import { Clock } from '@element-plus/icons-vue'

const props = defineProps({
  note: { type: Object, required: true }
})

const emit = defineEmits(['open', 'remove'])

const typeMeta = {
  0: { label: 'Markdown', tag: 'primary' },
  1: { label: '富文本', tag: 'success' },
  2: { label: '画板', tag: 'warning' }
}

const typeLabel = computed(() => typeMeta[props.note?.type]?.label || '')
const typeTag = computed(() => typeMeta[props.note?.type]?.tag || 'info')

const formattedUpdate = computed(() =>
  props.note?.lastUpdateTime
    ? dayjs(props.note.lastUpdateTime).format('YYYY-MM-DD HH:mm')
    : ''
)

const previewText = computed(() => {
  if (!props.note) return ''
  if (props.note.summary) return props.note.summary
  if (props.note.contentMd) {
    return props.note.contentMd.replace(/[#>*`\-\[\]]/g, '').slice(0, 80)
  }
  if (props.note.contentDoc) {
    return props.note.contentDoc.replace(/<[^>]+>/g, '').slice(0, 80)
  }
  return ''
})

const handleOpen = () => emit('open', props.note.id)
const handleRemove = () => emit('remove', props.note.id)
</script>

<style scoped>
.note-card {
  margin-bottom: 20px;
  cursor: default;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  cursor: pointer;
}

.title:hover {
  color: var(--el-color-primary);
}

.summary {
  color: var(--el-text-color-secondary);
  line-height: 1.6;
  min-height: 48px;
}

.meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  align-items: center;
}

.meta .el-icon {
  margin-right: 4px;
}

.workspace {
  background: rgba(64, 158, 255, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
}

.actions {
  margin-top: auto;
  display: flex;
  gap: 8px;
}
</style>
