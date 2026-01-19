<template>
  <div class="markdown-editor">
    <div class="editor-header" v-if="!readOnly">
      <span class="editor-title">{{ previewMode ? '预览模式' : '编辑模式' }}</span>
      <div class="header-actions">
        <n-button size="tiny" secondary strong @click="togglePreview">
          {{ previewMode ? '编辑' : '预览' }}
        </n-button>
      </div>
    </div>

    <div v-if="!currentPreviewMode" class="editor-body">
      <n-input
        ref="inputRef"
        v-model:value="localValue"
        type="textarea"
        :placeholder="placeholder"
        :autosize="false"
        :rows="18"
        :resizable="false"
        class="md-input"
        @paste="handlePaste"
      />
    </div>

    <div v-else class="preview-body" @click="handlePreviewClick">
      <n-scrollbar class="preview">
        <div class="preview-content" v-html="rendered"></div>
      </n-scrollbar>
    </div>

    <FilePreviewModal v-model:show="showPreview" :url="previewUrl" :type="previewType" />
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { NInput, NScrollbar, NButton, useMessage } from 'naive-ui'
import MarkdownIt from 'markdown-it'
import texmath from 'markdown-it-texmath'
import katex from 'katex'
import noteApi from '@/api/note'
import FilePreviewModal from '@/components/FilePreviewModal.vue'
import { addTokenToAttachmentSrc } from '@/utils/attachmentToken'

const props = defineProps({
  modelValue: { type: String, default: '' },
  readOnly: { type: Boolean, default: false },
  noteId: { type: Number, default: null },
  placeholder: { type: String, default: '支持 Markdown 语法，可直接粘贴图片...' }
})
const emit = defineEmits(['update:modelValue'])

const message = useMessage()
const localValue = ref(props.modelValue || '')
const inputRef = ref(null)
const previewMode = ref(false)
const showPreview = ref(false)
const previewUrl = ref('')
const previewType = ref('')

const katexOptions = {
  throwOnError: false,
  errorColor: '#cc0000',
  strict: 'ignore'
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true
})
  .use(texmath, { engine: katex, delimiters: 'dollars', katexOptions })
  .use(texmath, { engine: katex, delimiters: 'brackets', katexOptions })

const currentPreviewMode = computed(() => props.readOnly || previewMode.value)
const rendered = computed(() =>
  localValue.value ? addTokenToAttachmentSrc(md.render(localValue.value)) : ''
)

watch(
  () => props.modelValue,
  (val) => {
    localValue.value = val || ''
  }
)
watch(localValue, (val) => {
  if (!props.readOnly) emit('update:modelValue', val)
})

const togglePreview = () => {
  previewMode.value = !previewMode.value
}

const handlePreviewClick = (e) => {
  if (e.target.tagName === 'IMG' && e.target.src) {
    previewUrl.value = e.target.src
    previewType.value = 'image/png'
    showPreview.value = true
  }
}

const handlePaste = async (event) => {
  const items = event.clipboardData?.items
  if (!items) return

  const imageItem = Array.from(items).find((item) => item.type.startsWith('image'))
  if (imageItem) {
    event.preventDefault()
    if (!props.noteId) {
      message.warning('请先保存笔记')
      return
    }

    const file = imageItem.getAsFile()
    const msgReactive = message.loading('上传图片中...', { duration: 0 })

    try {
      const res = await noteApi.uploadAttachment(props.noteId, file)
      const data = res.data?.data || res.data
      const attachmentId = data?.id || data?.Id

      if (!attachmentId) throw new Error('返回ID无效')

      const canonicalUrl = `/api/notes/attachments/${attachmentId}`
      insertTextAtCursor(`![image](${canonicalUrl})`)
      message.success('上传成功')
    } catch (e) {
      console.error(e)
      message.error('上传失败')
    } finally {
      msgReactive?.destroy?.()
    }
  }
}

const insertTextAtCursor = (text) => {
  const textarea = inputRef.value?.$el?.querySelector('textarea')
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const original = localValue.value
  localValue.value = original.substring(0, start) + text + original.substring(end)
  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(start + text.length, start + text.length)
  })
}
</script>

<style scoped>
.markdown-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
}

.editor-header {
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
}

.editor-title {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.editor-body,
.preview-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  min-height: 0;
  height: 100%;
}

.md-input {
  flex: 1;
  height: 100%;
}

.md-input :deep(textarea) {
  height: 100% !important;
  resize: none;
  padding: 16px 0;
  border: none;
  outline: none;
  box-shadow: none;
}

.md-input :deep(.n-input__border),
.md-input :deep(.n-input__state-border) {
  display: none !important;
}

.preview {
  width: 100%;
  padding: 16px 0;
}

.preview-content :deep(img) {
  max-width: 100%;
  border-radius: 4px;
  cursor: zoom-in;
}

.preview-content :deep(pre) {
  background: #0b1220;
  color: #e2e8f0;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  overflow-x: auto;
  font-size: 13.5px;
  line-height: 1.6;
}

.preview-content :deep(pre code) {
  color: inherit;
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
  background: transparent;
  padding: 0;
  display: block;
}

.preview-content :deep(:not(pre) > code) {
  background: #f1f5f9;
  color: #0f172a;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
}

.preview-content :deep(.katex-display) {
  margin: 12px 0;
  overflow-x: auto;
}

.preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 14px;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 8px 10px;
  text-align: left;
  vertical-align: top;
}

.preview-content :deep(th) {
  background: #f8fafc;
  font-weight: 600;
}

.preview-content :deep(tr:nth-child(even) td) {
  background: #f1f5f9;
}
</style>
