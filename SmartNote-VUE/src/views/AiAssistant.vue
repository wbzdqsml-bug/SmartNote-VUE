<template>
  <div class="ai-page">
    <ai-actions-panel class="section-card" @analyse="handleAnalyse" @keywords="handleKeywords" />
  </div>
</template>

<script setup>
import { useMessage } from 'naive-ui'
import AiActionsPanel from '@/components/AIActionsPanel.vue'

const message = useMessage()

const handleAnalyse = (prompt) => {
  message.success(`已提交摘要分析任务：${prompt.slice(0, 20)}...`)
}

const handleKeywords = (prompt) => {
  message.success(`已提交关键词提取任务：${prompt.slice(0, 20)}...`)
}
</script>

<style scoped>
.ai-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.section-card {
  width: 100%;
}
</style>
