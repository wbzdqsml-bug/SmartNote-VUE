<template>
  <div class="rich-text-editor">
    <div class="toolbar">
      <n-space size="small">
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button
              quaternary
              size="small"
              :type="editor?.isActive('bold') ? 'primary' : 'default'"
              @mousedown.prevent="() => toggle('bold')"
            >
              B
            </n-button>
          </template>
          加粗
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button
              quaternary
              size="small"
              :type="editor?.isActive('italic') ? 'primary' : 'default'"
              @mousedown.prevent="() => toggle('italic')"
            >
              I
            </n-button>
          </template>
          斜体
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button
              quaternary
              size="small"
              :type="editor?.isActive('underline') ? 'primary' : 'default'"
              @mousedown.prevent="() => toggle('underline')"
            >
              U
            </n-button>
          </template>
          下划线
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button
              quaternary
              size="small"
              :type="editor?.isActive('bulletList') ? 'primary' : 'default'"
              @mousedown.prevent="() => toggle('bulletList')"
            >
              •
            </n-button>
          </template>
          项目符号
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button tertiary size="small" @mousedown.prevent="clear">
              清空
            </n-button>
          </template>
          清除所有内容
        </n-tooltip>
      </n-space>
    </div>
    <div class="editable">
      <editor-content v-if="editor" :editor="editor" />
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, watch } from 'vue'
import { NButton, NTooltip, NSpace } from 'naive-ui'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import MathExtension from '@aarkue/tiptap-math-extension'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const sanitizeMathHtml = (html) => {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    doc.querySelectorAll('span[data-type="inlineMath"]').forEach((node) => {
      const latex = node.getAttribute('data-latex') || node.textContent || ''
      node.textContent = latex
    })
    return doc.body.innerHTML
  } catch (error) {
    return html.replace(/\$(?=<\/span>)/g, '')
  }
}

const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    MathExtension.configure({
      evaluation: false
    })
  ],
  content: props.modelValue || '',
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', sanitizeMathHtml(html))
  }
})

watch(
  () => props.modelValue,
  (value) => {
    if (!editor?.value) return
    const current = sanitizeMathHtml(editor.value.getHTML())
    if (value !== current) {
      editor.value.commands.setContent(value || '', false)
    }
  }
)

const toggle = (action) => {
  if (!editor?.value) return
  const chain = editor.value.chain().focus()
  switch (action) {
    case 'bold':
      chain.toggleBold().run()
      break
    case 'italic':
      chain.toggleItalic().run()
      break
    case 'underline':
      chain.toggleUnderline().run()
      break
    case 'bulletList':
      chain.toggleBulletList().run()
      break
    default:
      break
  }
}

const clear = () => {
  if (!editor?.value) return
  editor.value.chain().focus().clearContent().run()
}

onBeforeUnmount(() => {
  editor?.value?.destroy()
})
</script>

<style scoped>
.rich-text-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.editable {
  flex: 1;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding: 12px 18px;
  overflow-y: auto;
}

:deep(.ProseMirror) {
  min-height: 260px;
  outline: none;
  font-size: 14px;
  line-height: 1.6;
}

:deep(.ProseMirror:focus) {
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

/* Tiptap Math Extension Styles */
:deep(.tiptap p.is-editor-empty:first-child::before) {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
:deep(.tiptap .math-node) {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
:deep(.tiptap .math-node::before),
:deep(.tiptap .math-node::after) {
  content: none !important;
  display: none !important;
}
:deep(.tiptap .math-node.ProseMirror-selectednode) {
  outline: 2px solid #6366f1;
  border-radius: 4px;
}
</style>
