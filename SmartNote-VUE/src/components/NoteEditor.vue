<template>
  <n-card class="note-editor" :bordered="false">
    <template v-if="note">
      <div class="title-row">
        <n-input
          v-model:value="localNote.title"
          size="large"
          placeholder="请输入笔记标题"
          class="title-input"
        />
        <div class="type-actions">
          <n-tag type="info" size="medium">{{ currentTypeLabel }}</n-tag>
          <n-button type="primary" strong size="small" :loading="saving" @click="handleSave">
            保存
          </n-button>
        </div>
      </div>

      <component
        :is="currentEditor"
        v-model="localNote.content"
        class="dynamic-editor"
      />

      <div class="footer">
        <div class="meta">
          <span>创建时间：{{ formatTime(note.createdAt || note.createTime) }}</span>
          <span>最近更新：{{ formatTime(note.updateTime || note.lastUpdateTime) }}</span>
        </div>
        <n-button tertiary type="error" @click="emit('soft-delete', note.id)">
          移入回收站
        </n-button>
      </div>
    </template>
    <template v-else>
      <n-empty description="请选择左侧的笔记" />
    </template>
  </n-card>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { NCard, NInput, NButton, NTag, NEmpty } from 'naive-ui'
import { format } from 'date-fns'
import { noteTypeMap, defaultContentByType } from '@/constants/noteTypes'
import MarkdownEditor from '@/components/editors/MarkdownEditor.vue'
import CanvasBoard from '@/components/editors/CanvasBoard.vue'
import MindMapEditor from '@/components/editors/MindMapEditor.vue'
import RichTextEditor from '@/components/editors/RichTextEditor.vue'

const props = defineProps({
  note: {
    type: Object,
    default: null
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update-note', 'soft-delete'])

const editorMap = {
  0: MarkdownEditor,
  1: CanvasBoard,
  2: MindMapEditor,
  3: RichTextEditor
}

const localNote = reactive({
  id: null,
  title: '',
  content: '',
  type: 0
})

const currentEditor = computed(() => editorMap[localNote.type] || MarkdownEditor)
const currentTypeLabel = computed(() => noteTypeMap[localNote.type] || '笔记')

watch(
  () => props.note,
  (value) => {
    if (!value) {
      localNote.id = null
      localNote.title = ''
      localNote.content = ''
      localNote.type = 0
      return
    }
    const noteType = typeof value.type === 'number' ? value.type : Number(value.type ?? 0)
    const resolvedType = Number.isNaN(noteType) ? 0 : noteType
    localNote.id = value.id
    localNote.title = value.title || ''
    localNote.type = resolvedType
    localNote.content = value.contentJson ?? value.content ?? defaultContentByType[resolvedType] ?? ''
  },
  { immediate: true }
)

const payload = computed(() => ({
  title: localNote.title,
  contentJson: localNote.content
}))

const handleSave = () => {
  if (!localNote.id) return
  emit('update-note', { id: localNote.id, payload: payload.value })
}

const formatTime = (value) => {
  if (!value) return '--'
  try {
    return format(new Date(value), 'yyyy-MM-dd HH:mm')
  } catch {
    return value
  }
}
</script>

<style scoped>
.note-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  border-radius: 22px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.06);
  background: #fff;
  padding-bottom: 16px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title-input :deep(.n-input__input-el) {
  font-size: 20px;
  font-weight: 600;
}

.type-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dynamic-editor {
  flex: 1;
  min-height: 360px;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #6b7280;
  font-size: 12px;
  margin-top: auto;
  padding-top: 12px;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
