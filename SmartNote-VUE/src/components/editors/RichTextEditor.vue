<template>
  <div class="rich-text-editor">
    <div class="toolbar">
      <n-space size="small">
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button quaternary size="small" @mousedown.prevent="format('bold')">
              B
            </n-button>
          </template>
          加粗
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button quaternary size="small" @mousedown.prevent="format('italic')">
              I
            </n-button>
          </template>
          斜体
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button quaternary size="small" @mousedown.prevent="format('underline')">
              U
            </n-button>
          </template>
          下划线
        </n-tooltip>
        <n-tooltip placement="bottom">
          <template #trigger>
            <n-button quaternary size="small" @mousedown.prevent="format('insertUnorderedList')">
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
    <div
      ref="editorRef"
      class="editable"
      contenteditable
      @input="onInput"
      @blur="onInput"
    ></div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { NButton, NTooltip, NSpace } from 'naive-ui'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const editorRef = ref(null)

const syncContent = (value) => {
  if (!editorRef.value) return
  const html = value || ''
  if (editorRef.value.innerHTML !== html) {
    editorRef.value.innerHTML = html
  }
}

watch(
  () => props.modelValue,
  (value) => {
    syncContent(value)
  }
)

onMounted(() => {
  syncContent(props.modelValue)
})

const onInput = () => {
  if (!editorRef.value) return
  emit('update:modelValue', editorRef.value.innerHTML)
}

const format = (command) => {
  document.execCommand(command, false)
  onInput()
}

const clear = () => {
  if (!editorRef.value) return
  editorRef.value.innerHTML = ''
  onInput()
}
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
  padding: 18px;
  overflow-y: auto;
  font-size: 14px;
  line-height: 1.6;
}

.editable:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}
</style>
