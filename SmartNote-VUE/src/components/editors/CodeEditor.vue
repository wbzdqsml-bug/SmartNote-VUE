<template>
  <div class="code-editor">
    <n-input
      v-model:value="localValue"
      type="textarea"
      :autosize="{ minRows: 16, maxRows: 32 }"
      :placeholder="placeholder"
      class="code-input"
      :readonly="readOnly"
    />
    <n-card size="small" class="preview" :bordered="false">
      <template #header>
        <div class="preview-header">实时预览</div>
      </template>
      <pre>{{ localValue }}</pre>
    </n-card>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { NInput, NCard } from 'naive-ui'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '// 在这里编写代码笔记'
  },
  readOnly: {
    type: Boolean,
    default: false
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
  if (!props.readOnly) {
    emit('update:modelValue', value)
  }
})
</script>

<style scoped>
.code-editor {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
}

.code-input :deep(textarea) {
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 13px;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 14px;
}

.preview {
  flex: 1;
  background: #0f172a;
  color: #94a3b8;
  border-radius: 16px;
  overflow: auto;
}

.preview-header {
  font-weight: 600;
  color: #38bdf8;
}

pre {
  margin: 0;
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 13px;
  white-space: pre-wrap;
}
</style>
