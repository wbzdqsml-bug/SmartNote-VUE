<!--
  文件说明：页面视图（DeletedNoteViewer）
  - 主要职责：负责页面级业务布局、数据加载与子组件编排。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="deleted-note-viewer-wrapper">
    <div v-if="note" class="viewer-content">
      <div class="editor-row">
        <component
          :is="currentEditor"
          :model-value="noteContent"
          :read-only="true"
          class="dynamic-editor"
        />
      </div>
    </div>
    <div v-else>
      <n-empty description="笔记不存在或已被彻底删除" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { NEmpty } from 'naive-ui'
import { defaultContentByType } from '@/constants/noteTypes'
import MarkdownEditor from '@/components/editors/MarkdownEditor.vue'
import CanvasBoard from '@/components/editors/CanvasBoard.vue'
import MindMapEditor from '@/components/editors/MindMapEditor.vue'
import RichTextEditor from '@/components/editors/RichTextEditor.vue'
import CodeEditor from '@/components/editors/CodeEditor.vue' // Assuming there's a CodeEditor

const props = defineProps({
  note: {
    type: Object,
    default: null
  }
})

const editorMap = {
  0: MarkdownEditor,
  1: CanvasBoard,
  2: MindMapEditor,
  3: RichTextEditor,
  4: CodeEditor // Assuming type 4 is for code notes
}

const currentEditor = computed(() => {
  const noteType = typeof props.note?.type === 'number' ? props.note.type : Number(props.note?.type ?? 0)
  const resolvedType = Number.isNaN(noteType) ? 0 : noteType
  return editorMap[resolvedType] || MarkdownEditor
})

const noteContent = computed(() => {
  if (!props.note) return ''
  const noteType = typeof props.note.type === 'number' ? props.note.type : Number(props.note.type ?? 0)
  const resolvedType = Number.isNaN(noteType) ? 0 : noteType
  return props.note.contentJson ?? props.note.content ?? defaultContentByType[resolvedType] ?? ''
})
</script>

<style scoped>
.deleted-note-viewer-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.viewer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editor-row {
  flex: 1;
  display: flex;
  min-height: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.dynamic-editor {
  flex: 1;
  overflow: auto;
  min-height: 100%;
}
</style>