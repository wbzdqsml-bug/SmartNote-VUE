<template>
  <div class="markdown-editor">
    <n-split :default-size="0.6" :min="0.3" :max="0.8" class="split">
      <template #1>
        <div class="pane left-pane">
          <div class="pane-card">
            <n-input
              ref="inputRef"
              v-model:value="localValue"
              type="textarea"
              :placeholder="placeholder"
              :autosize="false"
              :rows="20"
            />
          </div>
        </div>
      </template>
      <template #2>
        <div class="pane preview-pane">
          <div class="pane-card">
            <n-scrollbar ref="previewScrollbar" class="preview">
              <div class="preview-content" v-html="rendered"></div>
            </n-scrollbar>
          </div>
        </div>
      </template>
    </n-split>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NInput, NSplit, NScrollbar } from 'naive-ui'
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
const previewScrollbar = ref(null)

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true
}).use(markdownItKatex)

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

const syncPreviewScroll = () => {
  const inputEl = inputRef.value?.$el?.querySelector('.n-input__textarea-el')
  const scrollbarEl = previewScrollbar.value?.$el
  if (!inputEl || !scrollbarEl) return
  const container = scrollbarEl.querySelector('.n-scrollbar-container')
  const content = scrollbarEl.querySelector('.n-scrollbar-content')
  if (!container || !content) return
  const maxInput =
    (inputEl.scrollHeight || 0) - (inputEl.clientHeight || 0) || 1
  const ratio = inputEl.scrollTop / maxInput
  const maxPreview = (content.scrollHeight || 0) - (container.clientHeight || 0)
  const target = ratio * maxPreview
  container.scrollTop = target
}

const attachScrollSync = () => {
  const inputEl = inputRef.value?.$el?.querySelector('.n-input__textarea-el')
  if (inputEl) {
    inputEl.addEventListener('scroll', syncPreviewScroll)
  }
}

const detachScrollSync = () => {
  const inputEl = inputRef.value?.$el?.querySelector('.n-input__textarea-el')
  if (inputEl) {
    inputEl.removeEventListener('scroll', syncPreviewScroll)
  }
}

onMounted(() => {
  attachScrollSync()
})

onBeforeUnmount(() => {
  detachScrollSync()
})
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

.split {
  height: 100%;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.pane {
  height: 100%;
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

.left-pane :deep(.n-input) {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.left-pane :deep(.n-input__textarea) {
  height: 100%;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.left-pane :deep(.n-input__textarea-el) {
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
</style>
