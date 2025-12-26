<template>
  <div class="rich-text-editor" :class="{ 'is-read-only': readOnly }">
    <div v-if="editor && !readOnly" class="toolbar">
      <n-space size="small" align="center" wrap>
        <!-- History -->
        <n-button-group size="small">
          <n-tooltip>
            <template #trigger>
              <n-button quaternary @mousedown.prevent="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()">
                <template #icon><n-icon :component="UndoIcon" /></template>
              </n-button>
            </template>
            撤销 (Ctrl+Z)
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button quaternary @mousedown.prevent="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()">
                <template #icon><n-icon :component="RedoIcon" /></template>
              </n-button>
            </template>
            重做 (Ctrl+Y)
          </n-tooltip>
        </n-button-group>

        <div class="divider"></div>

        <!-- Headings -->
        <n-dropdown
          trigger="hover"
          :options="headingOptions"
          @select="(level) => editor.chain().focus().toggleHeading({ level }).run()">
          <n-button size="small" quaternary>
             <span class="toolbar-button-text">正文</span>
             <n-icon :component="ChevronDownIcon" />
          </n-button>
        </n-dropdown>

        <div class="divider"></div>

        <!-- Basic Text Formatting -->
        <n-button-group size="small">
          <n-tooltip>
            <template #trigger>
              <n-button quaternary :type="editor.isActive('bold') ? 'primary' : 'default'" @mousedown.prevent="editor.chain().focus().toggleBold().run()">
                <template #icon><n-icon :component="BoldIcon" /></template>
              </n-button>
            </template>
            加粗
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button quaternary :type="editor.isActive('italic') ? 'primary' : 'default'" @mousedown.prevent="editor.chain().focus().toggleItalic().run()">
                <template #icon><n-icon :component="ItalicIcon" /></template>
              </n-button>
            </template>
            斜体
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button quaternary :type="editor.isActive('underline') ? 'primary' : 'default'" @mousedown.prevent="editor.chain().focus().toggleUnderline().run()">
                <template #icon><n-icon :component="UnderlineIcon" /></template>
              </n-button>
            </template>
            下划线
          </n-tooltip>
           <n-tooltip>
            <template #trigger>
              <n-button quaternary :type="editor.isActive('strike') ? 'primary' : 'default'" @mousedown.prevent="editor.chain().focus().toggleStrike().run()">
                <template #icon><n-icon :component="StrikeIcon" /></template>
              </n-button>
            </template>
            删除线
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button quaternary :type="editor.isActive('code') ? 'primary' : 'default'" @mousedown.prevent="editor.chain().focus().toggleCode().run()">
                <template #icon><n-icon :component="CodeIcon" /></template>
              </n-button>
            </template>
            行内代码
          </n-tooltip>
        </n-button-group>

        <!-- Color -->
        <n-tooltip>
          <template #trigger>
            <n-button quaternary class="color-button">
               <input type="color" @input="editor.chain().focus().setColor($event.target.value).run()" :value="editor.getAttributes('textStyle').color || '#000000'">
               <n-icon :component="ColorPaletteIcon" />
            </n-button>
          </template>
          文字颜色
        </n-tooltip>
         <n-tooltip>
          <template #trigger>
            <n-button quaternary :type="editor.isActive('highlight') ? 'primary' : 'default'" @mousedown.prevent="editor.chain().focus().toggleHighlight().run()">
              <template #icon><n-icon :component="HighlightIcon" /></template>
            </n-button>
          </template>
          高亮
        </n-tooltip>

        <div class="divider"></div>
        
        <!-- Block Formatting -->
        <n-button-group size="small">
           <n-tooltip>
            <template #trigger>
              <n-button quaternary :type="editor.isActive('bulletList') ? 'primary' : 'default'" @mousedown.prevent="editor.chain().focus().toggleBulletList().run()">
                <template #icon><n-icon :component="ListIcon" /></template>
              </n-button>
            </template>
            无序列表
          </n-tooltip>
           <n-tooltip>
            <template #trigger>
              <n-button quaternary :type="editor.isActive('orderedList') ? 'primary' : 'default'" @mousedown.prevent="editor.chain().focus().toggleOrderedList().run()">
                <template #icon><n-icon :component="OrderedListIcon" /></template>
              </n-button>
            </template>
            有序列表
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button quaternary :type="editor.isActive('blockquote') ? 'primary' : 'default'" @mousedown.prevent="editor.chain().focus().toggleBlockquote().run()">
                <template #icon><n-icon :component="QuoteIcon" /></template>
              </n-button>
            </template>
            引用
          </n-tooltip>
          <n-tooltip>
            <template #trigger>
              <n-button quaternary :type="editor.isActive('codeBlock') ? 'primary' : 'default'" @mousedown.prevent="editor.chain().focus().toggleCodeBlock().run()">
                <template #icon><n-icon :component="CodeBlockIcon" /></template>
              </n-button>
            </template>
            代码块
          </n-tooltip>
        </n-button-group>

         <div class="divider"></div>

	         <!-- Insert -->
	        <n-button-group size="small">
	          <n-tooltip>
	            <template #trigger>
	              <n-button quaternary @mousedown.prevent="insertFormula">
	                <template #icon><n-icon :component="MathIcon" /></template>
	              </n-button>
	            </template>
	            插入公式 (LaTeX)
	          </n-tooltip>
	          <n-tooltip>
	            <template #trigger>
	              <n-button quaternary @mousedown.prevent="editor.chain().focus().setHorizontalRule().run()">
	                <template #icon><n-icon :component="RuleIcon" /></template>
	              </n-button>
            </template>
            分割线
          </n-tooltip>
        </n-button-group>

      </n-space>
    </div>
    <div class="editable-wrapper">
      <editor-content :editor="editor" />
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, watch } from 'vue';
import { NButton, NTooltip, NSpace, NButtonGroup, NDropdown, NIcon } from 'naive-ui';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import MathExtension from '@aarkue/tiptap-math-extension';

import {
  TextBold as BoldIcon,
  TextItalic as ItalicIcon,
  TextUnderline as UnderlineIcon,
  TextStrikethrough as StrikeIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
} from '@vicons/carbon';

import {
  TextOutline as HeadingIcon,
  Code as CodeIcon,
  List as ListIcon,
  ListSharp as OrderedListIcon,
	  ChatbubbleOutline as QuoteIcon,
	  CodeWorkingOutline as CodeBlockIcon,
	  RemoveOutline as RuleIcon,
	  CalculatorOutline as MathIcon,
	  BrushOutline as HighlightIcon,
	  ColorPaletteOutline as ColorPaletteIcon,
	  ChevronDown as ChevronDownIcon,
} from '@vicons/ionicons5';


const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  readOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const editor = useEditor({
	extensions: [
		StarterKit,
		TextStyle,
		Color,
		Highlight.configure({ multicolor: true }),
		MathExtension.configure({ evaluation: false }),
		Placeholder.configure({
      placeholder: '在这里开始记录您的灵感... 支持Markdown语法，或输入 / 获取帮助',
    }),
  ],
  editable: !props.readOnly,
  content: props.modelValue || `
    <h2>欢迎使用新版富文本编辑器!</h2>
    <p>我们为您准备了一些物理和化学公式样例:</p>
    <p><strong>物理公式:</strong></p>
    <ul>
      <li>质能方程: <span data-type="inlineMath" data-latex="E=mc^2"></span></li>
      <li>二次方程求根公式: <span data-type="inlineMath" data-latex="x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"></span></li>
    </ul>
    <p><strong>化学公式:</strong></p>
    <ul>
      <li>水的分子式: <span data-type="inlineMath" data-latex="H_2O"></span></li>
      <li>硫酸: <span data-type="inlineMath" data-latex="H_2SO_4"></span></li>
      <li>一个化学反应: <span data-type="inlineMath" data-latex="2H_2 + O_2 \\rightarrow 2H_2O"></span></li>
    </ul>
    <p>现在，开始您的创作吧！</p>
  `,
  onUpdate: ({ editor }) => {
    if (!props.readOnly) {
      emit('update:modelValue', editor.getHTML());
    }
  },
});

watch(
  () => props.modelValue,
  (value) => {
    if (editor.value && !editor.value.isFocused) {
      const isSame = editor.value.getHTML() === value;
      if (isSame) return;
      editor.value.commands.setContent(value || '', false);
    }
  }
);

watch(
  () => props.readOnly,
  (readOnly) => {
    editor.value?.setEditable(!readOnly)
  }
)

const headingOptions = [
  { label: '正文', key: 'p' },
  { label: '标题 1', key: 1 },
  { label: '标题 2', key: 2 },
  { label: '标题 3', key: 3 },
  { label: '标题 4', key: 4 },
];

const insertFormula = () => {
  if (!editor.value) return;

  const { from, to, empty } = editor.value.state.selection;
  const selectedText = empty ? '' : editor.value.state.doc.textBetween(from, to, ' ');

  const input = prompt('请输入 LaTeX 公式:', selectedText);
  if (!input) return;

  let latex = input.trim();
  if (!latex) return;

  let display = 'no';
  if (latex.startsWith('$$') && latex.endsWith('$$') && latex.length > 4) {
    display = 'yes';
    latex = latex.slice(2, -2).trim();
  } else if (latex.startsWith('\\[') && latex.endsWith('\\]') && latex.length > 4) {
    display = 'yes';
    latex = latex.slice(2, -2).trim();
  } else if (latex.startsWith('$') && latex.endsWith('$') && latex.length > 2) {
    display = 'no';
    latex = latex.slice(1, -1).trim();
  } else if (latex.startsWith('\\(') && latex.endsWith('\\)') && latex.length > 4) {
    display = 'no';
    latex = latex.slice(2, -2).trim();
  }

  if (!latex) return;

  editor.value
    .chain()
    .focus()
    .insertContent({
      type: 'inlineMath',
      attrs: { latex, evaluate: 'no', display },
    })
    .run();
};

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style scoped>
.rich-text-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.rich-text-editor:not(.is-read-only):not(.overlay-editor) {
  max-height: min(72vh, 720px);
}

.toolbar {
  flex-shrink: 0;
  padding: 8px 12px;
  border-bottom: 1px solid #e0e0e0;
  background: #fdfdfd;
}

.divider {
  width: 1px;
  height: 20px;
  background-color: #e0e0e0;
  margin: 0 8px;
}

.toolbar-button-text {
  margin-right: 4px;
  font-size: 13px;
}

.color-button {
  position: relative;
  overflow: hidden;
}
.color-button input[type="color"] {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.editable-wrapper {
  flex: 1;
  min-height: 0;
  padding: 16px 22px;
  overflow-y: auto;
  line-height: 1.7;
}

:deep(.ProseMirror) {
  min-height: 300px;
  outline: none;
  font-size: 16px;
  color: #333;
}
:deep(.ProseMirror > * + *) {
  margin-top: 1em;
}

:deep(.ProseMirror:focus) {
  outline: none;
}

/* Placeholder */
:deep(p.is-editor-empty:first-child::before) {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* Tiptap and specific element styles */
:deep(h1, h2, h3, h4) {
  font-weight: 700;
  line-height: 1.3;
  color: #111;
}
:deep(h1) { font-size: 2em; }
:deep(h2) { font-size: 1.6em; }
:deep(h3) { font-size: 1.3em; }
:deep(h4) { font-size: 1.1em; }

:deep(ul, ol) {
  padding: 0 1.5rem;
}

:deep(blockquote) {
  padding-left: 1rem;
  border-left: 3px solid #d1d5db;
  color: #6b7280;
  margin-left: 0.5rem;
}

:deep(code) {
  background-color: rgba(97, 97, 97, 0.1);
  color: #e44d26;
  font-size: 0.9em;
  padding: 0.2em 0.4em;
  border-radius: 4px;
}

:deep(pre) {
  background: #1e1e1e;
  color: #dcdcdc;
  font-family: 'Fira Code', 'JetBrainsMono', monospace;
  padding: 1rem 1.2rem;
  border-radius: 8px;
  white-space: pre-wrap;
}
:deep(pre code) {
  color: inherit;
  padding: 0;
  background: none;
  font-size: 0.9em;
}

:deep(hr) {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 2rem 0;
}

:deep(mark) {
  background-color: #fff475;
  padding: 0.1em 0.2em;
  border-radius: 2px;
}

:deep(.katex-display) {
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
