<template>
  <div class="ai-panel">
    <div class="header">
      <h3>AI 智能助手</h3>
      <n-tag type="success" size="small">Beta</n-tag>
    </div>
    <n-space vertical>
      <n-input
        v-model:value="prompt"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 5 }"
        placeholder="描述你想分析或提炼的内容，例如：总结今天的学习重点"
      />
      <n-space>
        <n-button type="primary" :loading="loading" @click="handleAnalyse">生成摘要</n-button>
        <n-button ghost :loading="loading" @click="handleKeywords">提取关键词</n-button>
      </n-space>
      <n-alert v-if="result" type="info" :show-icon="false">
        {{ result }}
      </n-alert>
    </n-space>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { NButton, NInput, NAlert, NSpace, NTag } from 'naive-ui'

const emit = defineEmits(['analyse', 'keywords'])

const prompt = ref('')
const loading = ref(false)
const result = ref('')

const handleAnalyse = async () => {
  if (!prompt.value.trim()) {
    result.value = '请输入需要分析的内容。'
    return
  }
  loading.value = true
  result.value = 'AI 正在处理中，请稍候...'
  try {
    emit('analyse', prompt.value)
    await sleep()
    result.value = `智能摘要：${prompt.value.slice(0, 40)}...`
  } finally {
    loading.value = false
  }
}

const handleKeywords = async () => {
  if (!prompt.value.trim()) {
    result.value = '请输入需要提取关键词的内容。'
    return
  }
  loading.value = true
  result.value = 'AI 正在提取关键词...'
  try {
    emit('keywords', prompt.value)
    await sleep()
    const tokens = prompt.value
      .split(/\s+/)
      .map((token) => token.replace(/[^\p{L}\p{N}]/gu, ''))
      .filter(Boolean)
    const keywords = [...new Set(tokens)].slice(0, 6).join('、') || '暂无'
    result.value = `关键词：${keywords}`
  } finally {
    loading.value = false
  }
}

const sleep = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms))
</script>

<style scoped>
.ai-panel {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  padding: 16px;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
