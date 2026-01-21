<!--
  文件说明：编辑器组件（RichTextEditor）
  - 主要职责：提供特定内容形态的编辑能力与编辑器工具条交互。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
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
              @click="showFormulaModal = true"
            >
              <n-icon :component="MathCurve" />
            </n-button>
          </template>
          插入公式
        </n-tooltip>
        <n-dropdown trigger="click" :options="tableOptions" @select="handleTableAction">
          <n-button size="small" quaternary>
            <n-icon :component="TableIcon" />
          </n-button>
        </n-dropdown>
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

    <n-modal v-model:show="showFormulaModal">
      <n-card title="插入公式" style="width: 520px" closable @close="showFormulaModal = false">
        <n-form label-width="90px">
          <n-form-item label="公式类型">
            <n-select
              v-model:value="formulaPresetKey"
              size="small"
              :options="formulaPresetOptions"
            />
          </n-form-item>
          <template v-if="currentFormulaPreset?.key === 'custom'">
            <n-form-item label="公式代码">
              <n-input
                v-model:value="customLatex"
                type="textarea"
                placeholder="请输入 LaTeX 公式，例如 \\frac{a}{b}"
              />
            </n-form-item>
          </template>
          <template v-else>
            <n-form-item
              v-for="field in currentFormulaPreset?.fields || []"
              :key="field.key"
              :label="field.label"
            >
              <n-input-number
                v-model:value="formulaValues[field.key]"
                :min="field.min ?? undefined"
                :max="field.max ?? undefined"
                :step="field.step ?? 1"
                placeholder="请输入数值"
              />
            </n-form-item>
          </template>
          <n-form-item label="展示方式">
            <n-checkbox v-model:checked="isBlockFormula">块级公式</n-checkbox>
          </n-form-item>
          <n-form-item label="预览">
            <div class="formula-preview">{{ previewFormula }}</div>
          </n-form-item>
        </n-form>
        <template #footer>
          <div class="formula-actions">
            <n-button size="small" @click="showFormulaModal = false">取消</n-button>
            <n-button size="small" type="primary" @click="insertFormula">插入</n-button>
          </div>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
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
import Placeholder from '@tiptap/extension-placeholder'
import MathExtension from '@aarkue/tiptap-math-extension'
import {
  NButton,
  NCard,
  NCheckbox,
  NColorPicker,
  NDivider,
  NDropdown,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NTooltip,
  useMessage
} from 'naive-ui'
import {
  MathCurve,
  Image as ImageIcon,
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

const message = useMessage()
const fileInput = ref(null)
const showPreview = ref(false)
const previewUrl = ref('')
const previewType = ref('')
const imageWidth = ref(null)
const imageCaption = ref('')
const showFormulaModal = ref(false)
const formulaPresetKey = ref('custom')
const customLatex = ref('')
const isBlockFormula = ref(false)
const formulaValues = reactive({})

const formulaPresets = [
  {
    key: 'custom',
    label: '自定义公式',
    fields: [],
    build: () => customLatex.value.trim()
  },
  {
    key: 'circle-area',
    label: '圆面积 A = πr²',
    fields: [{ key: 'r', label: '半径 r', default: 1, min: 0, step: 0.1 }],
    build: (values) => `A = \\pi ${values.r ?? 0}^2`
  },
  {
    key: 'circle-circumference',
    label: '圆周长 C = 2πr',
    fields: [{ key: 'r', label: '半径 r', default: 1, min: 0, step: 0.1 }],
    build: (values) => `C = 2\\pi ${values.r ?? 0}`
  },
  {
    key: 'pythagorean',
    label: '勾股定理 c = √(a² + b²)',
    fields: [
      { key: 'a', label: '直角边 a', default: 3, min: 0, step: 1 },
      { key: 'b', label: '直角边 b', default: 4, min: 0, step: 1 }
    ],
    build: (values) => `c = \\sqrt{${values.a ?? 0}^2 + ${values.b ?? 0}^2}`
  },
  {
    key: 'quadratic',
    label: '一元二次公式',
    fields: [
      { key: 'a', label: 'a', default: 1, step: 0.1 },
      { key: 'b', label: 'b', default: 0, step: 0.1 },
      { key: 'c', label: 'c', default: 0, step: 0.1 }
    ],
    build: (values) =>
      `x = \\frac{-${values.b ?? 0} \\pm \\sqrt{${values.b ?? 0}^2 - 4\\cdot${values.a ?? 0}\\cdot${values.c ?? 0}}}{2\\cdot${values.a ?? 1}}`
  },
  {
    key: 'ohm',
    label: '欧姆定律 V = IR',
    fields: [
      { key: 'i', label: '电流 I', default: 1, step: 0.1 },
      { key: 'r', label: '电阻 R', default: 10, step: 0.1 }
    ],
    build: (values) => `V = ${values.i ?? 0}\\cdot${values.r ?? 0}`
  },
  {
    key: 'ideal-gas',
    label: '理想气体 PV = nRT',
    fields: [
      { key: 'p', label: '压强 P', default: 1, step: 0.1 },
      { key: 'v', label: '体积 V', default: 1, step: 0.1 },
      { key: 'n', label: '物质的量 n', default: 1, step: 0.1 },
      { key: 't', label: '温度 T', default: 273, step: 1 }
    ],
    build: (values) => `${values.p ?? 0}\\cdot${values.v ?? 0} = ${values.n ?? 0} R ${values.t ?? 0}`
  },
  {
    key: 'density',
    label: '密度 ρ = m/V',
    fields: [
      { key: 'm', label: '质量 m', default: 1, step: 0.1 },
      { key: 'v', label: '体积 V', default: 1, step: 0.1 }
    ],
    build: (values) => `\\rho = \\frac{${values.m ?? 0}}{${values.v ?? 1}}`
  },
  {
    key: 'population',
    label: '指数增长 N = N₀ e^{rt}',
    fields: [
      { key: 'n0', label: '初始值 N₀', default: 100, step: 1 },
      { key: 'r', label: '增长率 r', default: 0.1, step: 0.01 },
      { key: 't', label: '时间 t', default: 1, step: 1 }
    ],
    build: (values) => `N = ${values.n0 ?? 0} e^{${values.r ?? 0} \\cdot ${values.t ?? 0}}`
  }
]

const formulaPresetOptions = formulaPresets.map((preset) => ({
  label: preset.label,
  value: preset.key
}))

const currentFormulaPreset = computed(
  () => formulaPresets.find((preset) => preset.key === formulaPresetKey.value) || formulaPresets[0]
)

const previewFormula = computed(() => {
  const preset = currentFormulaPreset.value
  if (!preset) return ''
  if (preset.key === 'custom') return customLatex.value.trim()
  return preset.build(formulaValues) || ''
})

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
      link: { openOnClick: true, autolink: true, linkOnPaste: true }
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
    MathExtension.configure({ evaluation: false }),
    FigureImage,
    Placeholder.configure({ placeholder: '开始记录... (支持粘贴图片、数学公式)' })
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

const resetFormulaValues = () => {
  const preset = currentFormulaPreset.value
  if (!preset) return
  Object.keys(formulaValues).forEach((key) => delete formulaValues[key])
  preset.fields?.forEach((field) => {
    formulaValues[field.key] = field.default ?? 0
  })
  if (preset.key === 'custom' && !customLatex.value) {
    customLatex.value = ''
  }
}

const insertFormula = () => {
  const latex = previewFormula.value
  if (!latex) {
    message.warning('请先输入或选择公式内容')
    return
  }
  const content = isBlockFormula.value ? `$$${latex}$$` : `$${latex}$`
  editor.value?.chain().focus().insertContent(content).run()
  showFormulaModal.value = false
}

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

watch(
  () => formulaPresetKey.value,
  () => {
    resetFormulaValues()
  },
  { immediate: true }
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

.formula-preview {
  padding: 8px 10px;
  border: 1px dashed #e5e7eb;
  border-radius: 6px;
  color: #374151;
  background: #f9fafb;
  font-size: 14px;
}

.formula-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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
