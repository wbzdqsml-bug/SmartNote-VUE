<template>
  <div class="markdown-editor">
    <div class="toolbar">
      <el-button-group>
        <el-button size="small" @click="insertAround('**', '**')" title="加粗">B</el-button>
        <el-button size="small" @click="insertAround('*', '*')" title="斜体"><i>I</i></el-button>
        <el-button size="small" @click="insertHeading('# ')" title="一级标题">H1</el-button>
        <el-button size="small" @click="insertHeading('## ')" title="二级标题">H2</el-button>
        <el-button size="small" @click="insertList('- ')" title="无序列表">•</el-button>
        <el-button size="small" @click="insertList('1. ')" title="有序列表">1.</el-button>
        <el-button size="small" @click="insertCodeBlock" title="代码块">{ }</el-button>
        <el-button size="small" @click="insertLink" title="链接">🔗</el-button>
      </el-button-group>
    </div>
    <div class="editor-body">
      <textarea
        ref="textareaRef"
        v-model="localValue"
        class="textarea"
        :placeholder="placeholder"
      />
      <div class="preview" v-html="rendered" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import MarkdownIt from 'markdown-it'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '开始记录你的灵感…' }
})

const emit = defineEmits(['update:modelValue'])

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true
})

const localValue = ref(props.modelValue)
const textareaRef = ref(null)

watch(
  () => props.modelValue,
  value => {
    if (value !== localValue.value) localValue.value = value || ''
  }
)

watch(localValue, value => {
  emit('update:modelValue', value)
})

const rendered = computed(() => md.render(localValue.value || ''))

const insertAtCursor = (prefix = '', suffix = '') => {
  const textarea = textareaRef.value
  if (!textarea) return
  const start = textarea.selectionStart ?? textarea.value.length
  const end = textarea.selectionEnd ?? textarea.value.length
  const text = textarea.value
  const selected = text.slice(start, end)
  const newValue = `${text.slice(0, start)}${prefix}${selected}${suffix}${text.slice(end)}`
  localValue.value = newValue
  const cursorPos = start + prefix.length + selected.length
  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(cursorPos, cursorPos)
  })
}

const insertAround = (prefix, suffix) => {
  insertAtCursor(prefix, suffix)
}

const insertHeading = heading => {
  const textarea = textareaRef.value
  if (!textarea) return
  const start = textarea.selectionStart ?? 0
  const text = textarea.value
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  const newValue = `${text.slice(0, lineStart)}${heading}${text.slice(lineStart)}`
  localValue.value = newValue
  requestAnimationFrame(() => {
    textarea.focus()
    const cursor = start + heading.length
    textarea.setSelectionRange(cursor, cursor)
  })
}

const insertList = prefix => {
  insertHeading(prefix)
}

const insertCodeBlock = () => {
  insertAtCursor('\n```\n', '\n```\n')
}

const insertLink = () => {
  const url = window.prompt('请输入链接地址', 'https://')
  if (url) insertAtCursor('[链接文本](', `${url})`)
}
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
}

.editor-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  height: 100%;
}

.textarea {
  width: 100%;
  height: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  font-family: 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  resize: none;
  background: #fff;
}

.preview {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow-y: auto;
  background: #f9fafb;
}

.preview :deep(pre) {
  background: #1f2937;
  color: #f8f8f2;
  padding: 12px;
  border-radius: 6px;
  overflow: auto;
}

.preview :deep(code) {
  background: rgba(15, 23, 42, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
}
</style>
