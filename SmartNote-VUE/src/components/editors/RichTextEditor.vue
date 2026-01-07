<template>
  <div class="rich-text-editor" :class="{ 'is-read-only': readOnly }">
    <div v-if="editor && !readOnly" class="toolbar">
      <n-space align="center" size="small" wrap>
        <n-select
          v-model:value="headingLevel"
          size="small"
          class="heading-select"
          :options="headingOptions"
        />
        <n-divider vertical />
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
              size="small"
              quaternary
              :type="editor?.isActive('bold') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleBold().run()"
            >
              <n-icon :component="TextBold" />
            </n-button>
          </template>
          加粗
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
              size="small"
              quaternary
              :type="editor?.isActive('italic') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleItalic().run()"
            >
              <n-icon :component="TextItalic" />
            </n-button>
          </template>
          斜体
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
              size="small"
              quaternary
              :type="editor?.isActive('underline') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleUnderline().run()"
            >
              <n-icon :component="TextUnderline" />
            </n-button>
          </template>
          下划线
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
              size="small"
              quaternary
              :type="editor?.isActive('strike') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleStrike().run()"
            >
              <n-icon :component="TextStrikethrough" />
            </n-button>
          </template>
          删除线
        </n-tooltip>
        <n-divider vertical />
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
              size="small"
              quaternary
              :type="editor?.isActive({ textAlign: 'left' }) ? 'primary' : 'default'"
              @click="editor?.chain().focus().setTextAlign('left').run()"
            >
              <n-icon :component="TextAlignLeft" />
            </n-button>
          </template>
          左对齐
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
              size="small"
              quaternary
              :type="editor?.isActive({ textAlign: 'center' }) ? 'primary' : 'default'"
              @click="editor?.chain().focus().setTextAlign('center').run()"
            >
              <n-icon :component="TextAlignCenter" />
            </n-button>
          </template>
          居中
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
              size="small"
              quaternary
              :type="editor?.isActive({ textAlign: 'right' }) ? 'primary' : 'default'"
              @click="editor?.chain().focus().setTextAlign('right').run()"
            >
              <n-icon :component="TextAlignRight" />
            </n-button>
          </template>
          右对齐
        </n-tooltip>
        <n-divider vertical />
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-color-picker
              size="small"
              :show-alpha="false"
              :value="currentTextColor"
              @update:value="setTextColor"
            />
          </template>
          文字颜色
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-color-picker
              size="small"
              :show-alpha="false"
              :value="currentHighlightColor"
              @update:value="setHighlightColor"
            />
          </template>
          高亮颜色
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button size="small" quaternary @click="clearMarks">
              <n-icon :component="TextClearFormat" />
            </n-button>
          </template>
          清除格式
        </n-tooltip>
        <n-divider vertical />
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
              size="small"
              quaternary
              :type="editor?.isActive('bulletList') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleBulletList().run()"
            >
              <n-icon :component="ListBulleted" />
            </n-button>
          </template>
          无序列表
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
              size="small"
              quaternary
              :type="editor?.isActive('orderedList') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleOrderedList().run()"
            >
              <n-icon :component="ListNumbered" />
            </n-button>
          </template>
          有序列表
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
              size="small"
              quaternary
              :type="editor?.isActive('taskList') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleTaskList().run()"
            >
              <n-icon :component="ListChecked" />
            </n-button>
          </template>
          待办
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
              size="small"
              quaternary
              :type="editor?.isActive('blockquote') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleBlockquote().run()"
            >
              <n-icon :component="Quotes" />
            </n-button>
          </template>
          引用
        </n-tooltip>
        <n-divider vertical />
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button
              size="small"
              quaternary
              :type="editor?.isActive('codeBlock') ? 'primary' : 'default'"
              @click="editor?.chain().focus().toggleCodeBlock().run()"
            >
              <n-icon :component="Code" />
            </n-button>
          </template>
          代码块
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button size="small" quaternary @click="copyCodeBlock">
              <n-icon :component="Copy" />
            </n-button>
          </template>
          复制代码
        </n-tooltip>
        <n-dropdown trigger="click" :options="tableOptions" @select="handleTableAction">
          <n-button size="small" quaternary>
            <n-icon :component="TableIcon" />
          </n-button>
        </n-dropdown>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button size="small" quaternary @click="toggleLink">
              <n-icon :component="LinkIcon" />
            </n-button>
          </template>
          链接
        </n-tooltip>
        <n-divider vertical />
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button size="small" quaternary @click="editor?.chain().focus().undo().run()">
              <n-icon :component="Undo" />
            </n-button>
          </template>
          撤销
        </n-tooltip>
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button size="small" quaternary @click="editor?.chain().focus().redo().run()">
              <n-icon :component="Redo" />
            </n-button>
          </template>
          重做
        </n-tooltip>
        <n-divider vertical />
        <n-tooltip trigger="hover">
          <template #trigger>
            <n-button size="small" quaternary @click="triggerImageUpload">
              <n-icon :component="ImageIcon" />
            </n-button>
          </template>
          上传图片
        </n-tooltip>
        <div v-if="isImageSelected" class="image-controls">
          <n-input-number
            v-model:value="imageWidth"
            size="small"
            placeholder="宽度(px)"
            :min="40"
            :max="1200"
            :step="10"
            @update:value="applyImageWidth"
          />
          <n-input
            v-model:value="imageCaption"
            size="small"
            placeholder="图片说明"
            @update:value="applyImageCaption"
          />
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button size="small" quaternary @click="resetImageSize">
                <n-icon :component="Reset" />
              </n-button>
            </template>
            原始大小
          </n-tooltip>
        </div>
      </n-space>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="file-input"
        @change="handleFileSelect"
      />
    </div>

    <div class="editable-wrapper">
      <editor-content v-if="editor" :editor="editor" class="tiptap-editor" />
    </div>

    <FilePreviewModal
      v-model:show="showPreview"
      :url="previewUrl"
      :type="previewType"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Node, mergeAttributes } from '@tiptap/core'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import MathExtension from '@aarkue/tiptap-math-extension'
import { NButton, NColorPicker, NDivider, NDropdown, NIcon, NInput, NInputNumber, NSelect, NSpace, NTooltip, useMessage } from 'naive-ui'
import {
  Code,
  Copy,
  Image as ImageIcon,
  Link as LinkIcon,
  ListBulleted,
  ListChecked,
  ListNumbered,
  Quotes,
  Redo,
  Reset,
  Table as TableIcon,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  TextBold,
  TextClearFormat,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
  Undo
} from '@vicons/carbon'
import noteApi from '@/api/note'
import FilePreviewModal from '@/components/FilePreviewModal.vue'
import { addTokenToAttachmentSrc, stripTokenFromAttachmentSrc } from '@/utils/attachmentToken'

const FigureImage = Node.create({
  name: 'figureImage',
  group: 'block',
  draggable: true,
  selectable: true,
  content: 'text*',
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      height: { default: null },
      caption: { default: '' }
    }
  },
  parseHTML() {
    return [
      {
        tag: 'figure[data-type="figure-image"]',
        contentElement: 'figcaption',
        priority: 1000,
        getAttrs: (element) => {
          const img = element.querySelector('img')
          const caption = element.querySelector('figcaption')
          return {
            src: img?.getAttribute('src') || null,
            alt: img?.getAttribute('alt') || null,
            title: img?.getAttribute('title') || null,
            width: img?.getAttribute('width') || img?.style?.width || null,
            height: img?.getAttribute('height') || img?.style?.height || null,
            caption: caption?.textContent || ''
          }
        }
      },
      {
        tag: 'img[src]',
        getAttrs: (element) => ({
          src: element.getAttribute('src'),
          alt: element.getAttribute('alt') || null,
          title: element.getAttribute('title') || null,
          width: element.getAttribute('width') || element.style?.width || null,
          height: element.getAttribute('height') || element.style?.height || null,
          caption: ''
        })
      }
    ]
  },
  renderHTML({ HTMLAttributes }) {
    const { src, alt, title, width, height, caption, ...rest } = HTMLAttributes
    const formatSize = (value) => {
      if (!value) return null
      const numeric = Number(value)
      if (!Number.isNaN(numeric)) return `${numeric}px`
      return value
    }
    const styles = [
      width ? `width: ${formatSize(width)}` : null,
      height ? `height: ${formatSize(height)}` : null
    ]
      .filter(Boolean)
      .join('; ')

    return [
      'figure',
      mergeAttributes(rest, { 'data-type': 'figure-image' }),
      ['img', mergeAttributes({ src, alt, title, style: styles || null })],
      ['figcaption', {}, caption || '']
    ]
  },
  addCommands() {
    return {
      setFigureImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs })
    }
  }
})

const props = defineProps({
  modelValue: { type: String, default: '' },
  readOnly: { type: Boolean, default: false },
  noteId: { type: Number, default: null }
})

const emit = defineEmits(['update:modelValue'])

const lowlight = createLowlight(common)

const message = useMessage()
const fileInput = ref(null)
const showPreview = ref(false)
const previewUrl = ref('')
const previewType = ref('')
const imageWidth = ref(null)
const imageCaption = ref('')

const headingOptions = [
  { label: '正文', value: 0 },
  { label: '标题 1', value: 1 },
  { label: '标题 2', value: 2 },
  { label: '标题 3', value: 3 }
]

const tableOptions = [
  { label: '插入 3x3 表格', key: 'insert' },
  { label: '新增行', key: 'addRow' },
  { label: '新增列', key: 'addColumn' },
  { label: '删除行', key: 'deleteRow' },
  { label: '删除列', key: 'deleteColumn' },
  { label: '删除表格', key: 'deleteTable' }
]

const resolveImageSrc = (src) => {
  if (!src) return src
  const html = addTokenToAttachmentSrc(`<img src="${src}" />`)
  if (typeof DOMParser === 'undefined') return src
  const parser = new DOMParser()
  const img = parser.parseFromString(html, 'text/html').querySelector('img')
  return img?.getAttribute('src') || src
}

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
    StarterKit.configure({
      codeBlock: false,
      link: { openOnClick: false, autolink: true, linkOnPaste: true }
    }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    CodeBlockLowlight.configure({ lowlight }),
    MathExtension.configure({ evaluation: false }),
    FigureImage,
    Placeholder.configure({ placeholder: '开始记录... (支持粘贴图片、代码块、数学公式)' })
  ],
  editable: !props.readOnly,
  content: addTokenToAttachmentSrc(props.modelValue || ''),
  editorProps: {
    handleClickOn(view, pos, node) {
      if (node.type.name === 'figureImage') {
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
            editor.value
              .chain()
              .focus()
              .setFigureImage({ src: resolveImageSrc(url) })
              .run()
          }
        })
        return true
      }

      const html = event.clipboardData?.getData('text/html')
      if (html) {
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const img = doc.querySelector('img')
        const src = img?.getAttribute('src')
        if (src) {
          event.preventDefault()
          editor.value
            ?.chain()
            .focus()
            .setFigureImage({ src: resolveImageSrc(src) })
            .run()
          return true
        }
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

const headingLevel = computed({
  get: () => {
    if (!editor.value) return 0
    if (editor.value.isActive('heading', { level: 1 })) return 1
    if (editor.value.isActive('heading', { level: 2 })) return 2
    if (editor.value.isActive('heading', { level: 3 })) return 3
    return 0
  },
  set: (value) => {
    if (!editor.value) return
    if (!value) {
      editor.value.chain().focus().setParagraph().run()
      return
    }
    editor.value.chain().focus().toggleHeading({ level: value }).run()
  }
})

const currentTextColor = computed(() => editor.value?.getAttributes('textStyle')?.color || null)
const currentHighlightColor = computed(
  () => editor.value?.getAttributes('highlight')?.color || null
)
const isImageSelected = computed(() => editor.value?.isActive('figureImage') || false)

const updateImageState = () => {
  if (!editor.value || !editor.value.isActive('figureImage')) {
    imageWidth.value = null
    imageCaption.value = ''
    return
  }

  const attrs = editor.value.getAttributes('figureImage')
  imageWidth.value = attrs.width ? Number(attrs.width) : null
  imageCaption.value = attrs.caption || ''
}

const setTextColor = (value) => {
  if (!editor.value) return
  editor.value.chain().focus().setColor(value).run()
}

const setHighlightColor = (value) => {
  if (!editor.value) return
  editor.value.chain().focus().toggleHighlight({ color: value }).run()
}

const clearMarks = () => {
  editor.value?.chain().focus().unsetAllMarks().clearNodes().run()
}

const toggleLink = () => {
  if (!editor.value) return
  if (editor.value.isActive('link')) {
    editor.value.chain().focus().unsetLink().run()
    return
  }
  const url = window.prompt('请输入链接地址')
  if (url) {
    editor.value.chain().focus().setLink({ href: url }).run()
  }
}

const handleTableAction = (key) => {
  if (!editor.value) return
  const chain = editor.value.chain().focus()
  switch (key) {
    case 'insert':
      chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
      break
    case 'addRow':
      chain.addRowAfter().run()
      break
    case 'addColumn':
      chain.addColumnAfter().run()
      break
    case 'deleteRow':
      chain.deleteRow().run()
      break
    case 'deleteColumn':
      chain.deleteColumn().run()
      break
    case 'deleteTable':
      chain.deleteTable().run()
      break
    default:
      break
  }
}

const copyCodeBlock = async () => {
  if (!editor.value) return
  const { state } = editor.value
  const { $from } = state.selection
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth)
    if (node.type.name === 'codeBlock') {
      const text = node.textContent
      try {
        await navigator.clipboard.writeText(text)
        message.success('已复制代码')
      } catch (error) {
        message.warning('复制失败，请手动复制')
      }
      return
    }
  }
  message.warning('请先选中代码块')
}

const applyImageWidth = (value) => {
  if (!editor.value) return
  editor.value.chain().focus().updateAttributes('figureImage', { width: value || null }).run()
}

const applyImageCaption = (value) => {
  if (!editor.value) return
  editor.value.chain().focus().updateAttributes('figureImage', { caption: value || '' }).run()
}

const resetImageSize = () => {
  if (!editor.value) return
  editor.value.chain().focus().updateAttributes('figureImage', { width: null, height: null }).run()
}

const triggerImageUpload = () => fileInput.value?.click()

const handleFileSelect = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const url = await uploadImage(file)
  if (url && editor.value) {
    editor.value
      .chain()
      .focus()
      .setFigureImage({ src: resolveImageSrc(url) })
      .run()
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

watch(
  () => editor.value,
  (value) => {
    if (!value) return
    value.on('selectionUpdate', updateImageState)
    value.on('transaction', updateImageState)
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
  flex-wrap: wrap;
}

.heading-select {
  min-width: 120px;
}

.toolbar :deep(.n-button) {
  min-width: 34px;
}

.toolbar :deep(.n-button__content) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.toolbar :deep(.n-color-picker) {
  width: 30px;
}

.image-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-input {
  display: none;
}

.editable-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 12px 14px;
  line-height: 1.7;
  min-height: 0;
  box-sizing: border-box;
  max-height: 100%;
}

.tiptap-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

:deep(.ProseMirror) {
  flex: 1;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  outline: none;
  font-size: 16px;
  color: #333;
  overflow-y: auto;
  padding: 4px 0;
}

:deep(.ProseMirror h1) {
  font-size: 28px;
  margin: 16px 0 12px;
}

:deep(.ProseMirror h2) {
  font-size: 22px;
  margin: 14px 0 10px;
}

:deep(.ProseMirror h3) {
  font-size: 18px;
  margin: 12px 0 8px;
}

:deep(.ProseMirror blockquote) {
  border-left: 4px solid #6366f1;
  margin: 12px 0;
  padding: 6px 12px;
  color: #4b5563;
  background: #f8fafc;
}

:deep(.ProseMirror pre) {
  background: #0f172a;
  color: #e2e8f0;
  padding: 12px 14px;
  border-radius: 6px;
  overflow-x: auto;
}

:deep(.ProseMirror pre code) {
  color: inherit;
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 14px;
}

:deep(.ProseMirror code) {
  background: #f1f5f9;
  border-radius: 4px;
  padding: 2px 6px;
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 14px;
}

:deep(.ProseMirror table) {
  border-collapse: collapse;
  margin: 12px 0;
  width: 100%;
}

:deep(.ProseMirror table td,
.ProseMirror table th) {
  border: 1px solid #e2e8f0;
  padding: 8px;
  min-width: 80px;
}

:deep(.ProseMirror table th) {
  background: #f8fafc;
  font-weight: 600;
}

:deep(.ProseMirror ul[data-type='taskList']) {
  list-style: none;
  padding-left: 0;
}

:deep(.ProseMirror ul[data-type='taskList'] li) {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

:deep(.ProseMirror a) {
  color: #2563eb;
  text-decoration: underline;
}

:deep(.ProseMirror figure[data-type='figure-image']) {
  margin: 12px 0;
  text-align: center;
}

:deep(.ProseMirror figure[data-type='figure-image'] img) {
  max-width: 100%;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

:deep(.ProseMirror figure[data-type='figure-image'] img:hover) {
  opacity: 0.92;
  box-shadow: 0 0 0 2px #2080f0;
}

:deep(.ProseMirror figure[data-type='figure-image'] figcaption) {
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
}
</style>
