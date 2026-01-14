﻿<template>
  <div ref="editorShell" class="note-editor-wrapper" v-bind="$attrs">
    <n-card ref="cardRef" class="note-editor" :bordered="false">
      <template v-if="note">
        <div class="title-row">
          <n-input
            v-model:value="localNote.title"
            size="large"
            placeholder="请输入笔记标题"
            class="title-input"
            @update:value="onFieldChange"
          />
          <div class="type-actions">
            <n-tag type="info" size="medium">{{ currentTypeLabel }}</n-tag>
            <n-button type="primary" strong size="small" :loading="saving" @click="handleSave">
              保存
            </n-button>
            <n-button quaternary size="small" @click="showExpanded = true">放大编辑</n-button>
            <n-popover trigger="hover" placement="bottom" :disabled="!localNote.id">
              <template #trigger>
                <n-button
                  quaternary
                  size="small"
                  :disabled="!localNote.id"
                  @click="showAIPanel = true"
                >
                  <n-icon :component="SparklesOutline" :size="20" />
                </n-button>
              </template>
              AI 助手
            </n-popover>
          </div>
        </div>

        <div class="editor-row" :key="`${localNote.id}-${localNote.type}`" v-if="editorReady">
          <component
            :is="currentEditor"
            v-model="localNote.content"
            class="dynamic-editor"
            :note-id="localNote.id"
            @update:modelValue="onFieldChange"
          />
        </div>
      </template>
      <template v-else>
        <n-empty description="请选择左侧的笔记" />
      </template>
    </n-card>

    <n-drawer v-model:show="showAIPanel" :width="520" placement="right">
      <AIActionsPanel
        v-if="localNote.id"
        :note-id="localNote.id"
        :workspace-id="localNote.workspaceId"
        :note-title="localNote.title"
        :category-id="note?.categoryId"
        :tag-ids="note?.tagIds"
        :show-close="true"
        @close="showAIPanel = false"
      />
    </n-drawer>

    <div v-if="showExpanded" class="editor-overlay" @click.self="showExpanded = false">
      <div ref="overlayCardRef" class="overlay-card">
        <div class="overlay-header">
          <div class="overlay-title">
            <n-input
              v-model:value="localNote.title"
              size="large"
              placeholder="请输入笔记标题"
              class="title-input overlay-title-input"
              @update:value="onFieldChange"
            />
            <n-tag type="info" size="small">{{ currentTypeLabel }}</n-tag>
          </div>
          <div class="overlay-actions">
            <n-button size="small" @click="showExpanded = false">关闭</n-button>
            <n-button size="small" type="primary" :loading="saving" @click="handleSaveAndClose">保存并关闭</n-button>
          </div>
        </div>
        <div class="overlay-editor-content" :key="`${localNote.id}-${localNote.type}`" v-if="editorReady">
          <component 
            :is="currentEditor" 
            v-model="localNote.content" 
            class="dynamic-editor overlay-editor" 
            :note-id="localNote.id"
            @update:modelValue="onFieldChange" 
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { NCard, NInput, NButton, NTag, NEmpty, NIcon, NPopover, NDrawer } from 'naive-ui'
import { noteTypeMap, defaultContentByType } from '@/constants/noteTypes'
import MarkdownEditor from '@/components/editors/MarkdownEditor.vue'
import CanvasBoard from '@/components/editors/CanvasBoard.vue'
import MindMapEditor from '@/components/editors/MindMapEditor.vue'
import RichTextEditor from '@/components/editors/RichTextEditor.vue'
import { SparklesOutline } from '@vicons/ionicons5'
import AIActionsPanel from '@/components/AIActionsPanel.vue'

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

const emit = defineEmits(['update-note', 'change'])

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
  type: 0,
  workspaceId: null
})
const showExpanded = ref(false)
const showAIPanel = ref(false)
const editorReady = ref(true)
const cardRef = ref(null)
const overlayCardRef = ref(null)
const editorShell = ref(null)
let autoSaveTimer = null

const currentEditor = computed(() => editorMap[localNote.type] || MarkdownEditor)
const currentTypeLabel = computed(() => noteTypeMap[localNote.type] || '笔记')

const resolveImportedContent = (content, noteType) => {
  if (content === null || content === undefined) return ''
  if (typeof content !== 'string') return content
  const trimmed = content.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return content
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object') {
      const markdown = parsed.md ?? parsed.markdown
      const html = parsed.html ?? parsed.content
      if (noteType === 0 && typeof markdown === 'string') return markdown
      if (noteType === 3 && typeof html === 'string') return html
      if (typeof markdown === 'string') return markdown
      if (typeof html === 'string') return html
    }
  } catch (error) {
    return content
  }
  return content
}

const blurActiveWithinEditor = () => {
  if (typeof document === 'undefined') return
  const activeElement = document.activeElement
  if (!activeElement) return

  const containers = [
    cardRef.value?.$el ?? cardRef.value,
    overlayCardRef.value,
    editorShell.value
  ].filter(Boolean)

  if (containers.some((el) => el.contains(activeElement))) {
    activeElement.blur()
  }
}

const scheduleAutoSave = () => {
  if (!localNote.id || props.saving) return
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => {
    emit('update-note', {
      id: localNote.id,
      payload: {
        title: localNote.title,
        content: localNote.content,
        contentJson: localNote.content,
        categoryId: props.note?.categoryId ?? null,
        tagIds: props.note?.tagIds ?? []
      },
      silent: true,
      autosave: true
    })
  }, 1200)
}

watch(
  () => props.note,
  (value) => {
    if (!value) {
      localNote.id = null
      localNote.title = ''
      localNote.content = ''
      localNote.type = 0
      localNote.workspaceId = null
      if (autoSaveTimer) clearTimeout(autoSaveTimer)
      return
    }

    if (localNote.id !== value.id) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer)
      blurActiveWithinEditor()
      editorReady.value = false
      setTimeout(() => {
        const noteType = typeof value.type === 'number' ? value.type : Number(value.type ?? 0)
        const resolvedType = Number.isNaN(noteType) ? 0 : noteType
        
        localNote.id = value.id
        localNote.title = value.title || ''
        localNote.type = resolvedType
        const rawContent = value.contentJson ?? value.content ?? defaultContentByType[resolvedType] ?? ''
        localNote.content = resolveImportedContent(rawContent, resolvedType)
        localNote.workspaceId = value.workspaceId ?? value.WorkspaceId ?? null
        editorReady.value = true
      }, 0)
    }
  },
  { immediate: true }
)

watch(showExpanded, (visible) => {
  if (visible) blurActiveWithinEditor()
})

watch(showAIPanel, (visible) => {
  if (visible) blurActiveWithinEditor()
})

const onFieldChange = () => {
  emit('change', {
    title: localNote.title,
    content: localNote.content,
    contentJson: localNote.content
  })
  scheduleAutoSave()
}

const handleSave = () => {
  if (!localNote.id) return
  emit('update-note', {
    id: localNote.id,
    payload: {
      title: localNote.title,
      content: localNote.content,
      contentJson: localNote.content,
      categoryId: props.note?.categoryId ?? null,
      tagIds: props.note?.tagIds ?? []
    }
  })
}

const handleSaveAndClose = () => {
  handleSave()
  showExpanded.value = false
}

onBeforeUnmount(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
})
</script>

<style scoped>
.note-editor-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.note-editor {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid #eef2f8;
  background: #fff;
  padding: 16px 18px 14px;
  box-sizing: border-box;
  overflow: hidden;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.title-input :deep(.n-input__input-el) {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.type-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.editor-row {
  flex: 1;
  display: flex;
  min-height: 0;
}

.dynamic-editor {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 2px 0;
}

/* --- Overlay Styles --- */

.editor-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  z-index: 2000;
  padding: 4vh; /* Use viewport-relative padding */
}

.overlay-card {
  width: min(1600px, 90vw);
  height: 88vh;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 16px;
}

.overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
}

.overlay-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.overlay-title-input {
  flex: 1;
}

.overlay-title-input :deep(.n-input__input-el) {
  font-size: 22px;
  font-weight: 600;
}

.overlay-actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.overlay-editor-content {
  flex: 1;
  min-height: 0;
  display: flex;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.overlay-editor {
  flex: 1;
  min-height: 100%;
}
</style>
