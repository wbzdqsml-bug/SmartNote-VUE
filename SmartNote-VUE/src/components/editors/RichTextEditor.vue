<template>
  <div class="rich-text-editor" :class="{ 'is-read-only': readOnly }">
    <div v-if="editor && !readOnly" class="toolbar">
      <n-button size="small" quaternary @click="triggerImageUpload">
        上传图片
      </n-button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="file-input"
        @change="handleFileSelect"
      />
    </div>

    <div class="editable-wrapper">
      <editor-content v-if="editor" :editor="editor" />
    </div>

    <FilePreviewModal
      v-model:show="showPreview"
      :url="previewUrl"
      :type="previewType"
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import MathExtension from '@aarkue/tiptap-math-extension'
import { NButton, useMessage } from 'naive-ui'
import noteApi from '@/api/note'
import FilePreviewModal from '@/components/FilePreviewModal.vue'
import { addTokenToAttachmentSrc, stripTokenFromAttachmentSrc } from '@/utils/attachmentToken'

const props = defineProps({
  modelValue: { type: String, default: '' },
  readOnly: { type: Boolean, default: false },
  noteId: { type: Number, default: null }
})

const emit = defineEmits(['update:modelValue'])

const message = useMessage()
const fileInput = ref(null)
const showPreview = ref(false)
const previewUrl = ref('')
const previewType = ref('')

const uploadImage = async (file) => {
  if (!props.noteId) {
    message.warning('请先保存笔记后再上传图片')
    return null
  }

  const loading = message.loading('上传图片中...', { duration: 0 })
  try {
    const res = await noteApi.uploadAttachment(props.noteId, file)
    const data = res.data?.data || res.data
    const attachmentId = data?.id || data?.Id

    if (!attachmentId) throw new Error('未获取到附件 ID')
    message.success('上传成功')
    return `/api/notes/attachments/${attachmentId}`
  } catch (error) {
    console.error('[RichTextEditor] uploadImage error:', error)
    message.error(error?.message || '上传失败')
    return null
  } finally {
    loading?.destroy?.()
  }
}

const editor = useEditor({
  extensions: [
    StarterKit,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    MathExtension.configure({ evaluation: false }),
    Image.configure({ inline: true, allowBase64: true }),
    Placeholder.configure({ placeholder: '开始记录... (支持粘贴图片)' })
  ],
  editable: !props.readOnly,
  content: addTokenToAttachmentSrc(props.modelValue || ''),
  editorProps: {
    handleClickOn(view, pos, node, nodePos, event, direct) {
      if (node.type.name === 'image') {
        previewUrl.value = node.attrs.src
        previewType.value = 'image/png'
        showPreview.value = true
        return true
      }
      return false
    },
    handlePaste(view, event) {
      const items = event.clipboardData?.items
      if (!items) return false

      const imageItem = Array.from(items).find((item) => item.type.startsWith('image'))
      if (imageItem) {
        event.preventDefault()
        const file = imageItem.getAsFile()
        uploadImage(file).then((url) => {
          if (url && editor.value) {
            const withToken = addTokenToAttachmentSrc(`<img src="${url}" />`)
            const parser = new DOMParser()
            const img = parser.parseFromString(withToken, 'text/html').querySelector('img')
            editor.value
              .chain()
              .focus()
              .setImage({ src: img?.getAttribute('src') || url })
              .run()
          }
        })
        return true
      }
      return false
    }
  },
  onUpdate: ({ editor }) => {
    if (!props.readOnly && editor && !editor.isDestroyed) {
      emit('update:modelValue', stripTokenFromAttachmentSrc(editor.getHTML()))
    }
  }
})

const triggerImageUpload = () => fileInput.value?.click()

const handleFileSelect = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const url = await uploadImage(file)
  if (url && editor.value) {
    const withToken = addTokenToAttachmentSrc(`<img src="${url}" />`)
    const parser = new DOMParser()
    const img = parser.parseFromString(withToken, 'text/html').querySelector('img')
    editor.value.chain().focus().setImage({ src: img?.getAttribute('src') || url }).run()
  }
  event.target.value = ''
}

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value || editor.value.isDestroyed) return
    const current = editor.value.getHTML()
    if (!editor.value.isFocused && value !== stripTokenFromAttachmentSrc(current)) {
      editor.value.commands.setContent(addTokenToAttachmentSrc(value || ''), false)
    }
  }
)

watch(
  () => props.readOnly,
  (readOnly) => {
    editor.value?.setEditable(!readOnly)
  }
)

onBeforeUnmount(() => {
  if (editor.value && !editor.value.isDestroyed) {
    editor.value.destroy()
  }
})
</script>

<style scoped>
.rich-text-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eef2f8;
}

.toolbar {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.file-input {
  display: none;
}

.editable-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  line-height: 1.7;
  min-height: 0;
  height: 100%;
  box-sizing: border-box;
}

:deep(.ProseMirror) {
  min-height: 100%;
  height: 100%;
  outline: none;
  font-size: 16px;
  color: #333;
}

:deep(.ProseMirror img) {
  max-width: 100%;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

:deep(.ProseMirror img:hover) {
  opacity: 0.92;
  box-shadow: 0 0 0 2px #2080f0;
}
</style>
