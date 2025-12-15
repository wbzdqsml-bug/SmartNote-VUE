<template>
  <div class="markdown-editor">
    <div class="pane-card single-pane">
      <div class="editor-header">
        <span class="editor-title">{{ previewMode ? 'Markdown 预览' : 'Markdown 编辑' }}</span>
        <n-button size="tiny" secondary strong @click="togglePreview">
          {{ previewMode ? '返回编辑' : '预览' }}
        </n-button>
      </div>
      <div v-if="!previewMode" class="editor-body">
        <n-input
          ref="inputRef"
          v-model:value="localValue"
          type="textarea"
          :placeholder="placeholder"
          :autosize="false"
          :rows="20"
        />
      </div>
      <div v-else class="preview-body">
        <n-scrollbar class="preview">
          <div class="preview-content" v-html="rendered"></div>
        </n-scrollbar>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { NInput, NScrollbar, NButton } from 'naive-ui'
import MarkdownIt from 'markdown-it'
import markdownItKatex from 'markdown-it-katex'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '# 新建 Markdown 笔记\n\n支持 **粗体**、斜体、列表、代码块等基础语法'
  }
})

const emit = defineEmits(['update:modelValue'])

const localValue = ref(props.modelValue || '')
const inputRef = ref(null)
const previewMode = ref(false)

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true
})
  .enable(['table'])
  .use(markdownItKatex)

watch(
  () => props.modelValue,
  (value) => {
    if (value !== localValue.value) {
      localValue.value = value || ''
    }
  }
)

watch(localValue, (value) => {
  emit('update:modelValue', value)
})

const rendered = computed(() => {
  if (!localValue.value.trim()) {
    return '<p>暂无内容</p>'
  }
  const html = md.render(localValue.value)
  // Guard against stray dollar signs that might remain before rendered KaTeX output
  return html.replace(/\$(?=<span class="katex(?:-display)?)/g, '')
})

const togglePreview = () => {
  previewMode.value = !previewMode.value
  if (!previewMode.value) {
    nextTick(() => {
      const inputEl = inputRef.value?.$el?.querySelector('.n-input__textarea-el')
      inputEl?.focus()
    })
  }
}
</script>

<style scoped>
/* Include KaTeX CSS for formula rendering:
   https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css */
.markdown-editor {
  height: 640px;
  min-height: 640px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.pane-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05);
  overflow: hidden;
  height: 100%;
  min-height: 0;
}

.pane-card :deep(.n-scrollbar) {
  height: 100%;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  background: #f8fafc;
}

.editor-title {
  font-weight: 600;
  color: #0f172a;
}

.editor-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 12px;
}

.editor-body :deep(.n-input) {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editor-body :deep(.n-input__textarea) {
  height: 100%;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.editor-body :deep(.n-input__textarea-el) {
  height: 100%;
  min-height: 0;
  flex: 1;
  resize: none;
  overflow: auto;
}

.preview {
  padding: 12px 16px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  height: 100%;
}

.preview-body {
  flex: 1;
  min-height: 0;
  display: flex;
}

.preview-content {
  color: #0f172a;
  font-size: 13px;
  line-height: 1.6;
}

.preview-content h1,
.preview-content h2,
.preview-content h3 {
  margin: 12px 0 6px;
}

.preview-content ul {
  padding-left: 20px;
  margin: 8px 0;
}

.preview-content code {
  background: rgba(15, 23, 42, 0.08);
  padding: 2px 6px;
  border-radius: 6px;
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
}

.preview-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 13px;
}

.preview-content th,
.preview-content td {
  border: 1px solid rgba(15, 23, 42, 0.12);
  padding: 8px 10px;
  text-align: left;
}

.preview-content th {
  background: #f8fafc;
  font-weight: 600;
}
</style>
