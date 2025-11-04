<template>
  <div class="rich-editor">
    <div class="toolbar">
      <el-button-group>
        <el-button size="small" @click="exec('undo')" title="撤销">↺</el-button>
        <el-button size="small" @click="exec('redo')" title="重做">↻</el-button>
      </el-button-group>
      <el-button-group>
        <el-button size="small" @click="exec('bold')" title="加粗"><strong>B</strong></el-button>
        <el-button size="small" @click="exec('italic')" title="斜体"><em>I</em></el-button>
        <el-button size="small" @click="exec('underline')" title="下划线"><u>U</u></el-button>
        <el-button size="small" @click="formatBlock('H1')" title="一级标题">H1</el-button>
        <el-button size="small" @click="formatBlock('H2')" title="二级标题">H2</el-button>
        <el-button size="small" @click="exec('insertUnorderedList')" title="无序列表">•</el-button>
        <el-button size="small" @click="exec('insertOrderedList')" title="有序列表">1.</el-button>
        <el-button size="small" @click="insertLink" title="插入链接">🔗</el-button>
        <el-button size="small" @click="exec('removeFormat')" title="清除格式">⎚</el-button>
      </el-button-group>
    </div>
    <div
      ref="editor"
      class="editable"
      contenteditable="true"
      :placeholder="placeholder"
      @input="onInput"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '支持富文本格式，随意排版。' }
})

const emit = defineEmits(['update:modelValue'])

const editor = ref(null)

const syncValue = value => {
  if (editor.value && editor.value.innerHTML !== (value || '')) {
    editor.value.innerHTML = value || ''
  }
}

onMounted(() => {
  syncValue(props.modelValue)
})

watch(
  () => props.modelValue,
  value => {
    syncValue(value)
  }
)

const onInput = () => {
  emit('update:modelValue', editor.value?.innerHTML || '')
}

const focusEditor = () => {
  if (!editor.value) return
  if (document.activeElement !== editor.value) editor.value.focus()
}

const exec = (command, value = null) => {
  focusEditor()
  document.execCommand(command, false, value)
}

const formatBlock = tag => {
  focusEditor()
  document.execCommand('formatBlock', false, tag)
}

const insertLink = () => {
  focusEditor()
  const url = window.prompt('请输入链接地址', 'https://')
  if (url) document.execCommand('createLink', false, url)
}
</script>

<style scoped>
.rich-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
}

.editable {
  flex: 1;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 12px;
  overflow-y: auto;
  min-height: 320px;
}

.editable:empty:before {
  content: attr(placeholder);
  color: var(--el-text-color-placeholder);
}

.editable :deep(h1) {
  font-size: 24px;
  margin-bottom: 12px;
}

.editable :deep(h2) {
  font-size: 20px;
  margin-bottom: 10px;
}
</style>
