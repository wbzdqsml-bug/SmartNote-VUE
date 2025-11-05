<template>
  <div class="markdown-editor">
    <n-split :default-size="0.5" :min="0.25" :max="0.75" class="split">
      <template #1>
        <n-input
          v-model:value="localValue"
          type="textarea"
          :placeholder="placeholder"
          :autosize="{ minRows: 12, maxRows: 28 }"
        />
      </template>
      <template #2>
        <n-scrollbar class="preview">
          <div class="preview-content" v-html="rendered"></div>
        </n-scrollbar>
      </template>
    </n-split>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { NInput, NSplit, NScrollbar } from 'naive-ui'

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

const escapeHtml = (text = '') =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const formatInline = (text = '') =>
  text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')

const renderMarkdown = (text = '') => {
  if (!text.trim()) {
    return '<p>暂无内容</p>'
  }
  const escaped = escapeHtml(text)
  const blocks = escaped.split(/\n{2,}/)
  return blocks
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('### ')) {
        return `<h3>${formatInline(trimmed.replace(/^###\s*/, ''))}</h3>`
      }
      if (trimmed.startsWith('## ')) {
        return `<h2>${formatInline(trimmed.replace(/^##\s*/, ''))}</h2>`
      }
      if (trimmed.startsWith('# ')) {
        return `<h1>${formatInline(trimmed.replace(/^#\s*/, ''))}</h1>`
      }
      const lines = trimmed.split(/\n/)
      if (lines.every((line) => /^-\s+/.test(line))) {
        const items = lines
          .map((line) => `<li>${formatInline(line.replace(/^-\s+/, ''))}</li>`)
          .join('')
        return `<ul>${items}</ul>`
      }
      return `<p>${formatInline(trimmed).replace(/\n/g, '<br />')}</p>`
    })
    .join('')
}

const rendered = computed(() => renderMarkdown(localValue.value))
</script>

<style scoped>
.markdown-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.split {
  height: 100%;
}

.preview {
  padding: 12px 16px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 0 18px 18px 0;
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
