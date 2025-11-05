<template>
  <n-card class="quick-actions" :bordered="false">
    <div class="left">
      <h3>快捷操作</h3>
      <p>快速创建笔记、导入文件，或调用智能助手。</p>
    </div>
    <n-space>
      <n-button type="primary" size="large" strong @click="$emit('create')">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        新建笔记
      </n-button>
      <n-button type="info" size="large" ghost @click="$emit('import')">
        <template #icon>
          <n-icon :component="CloudUploadOutline" />
        </template>
        导入文件
      </n-button>
      <n-button type="warning" size="large" ghost @click="$emit('open-ai')">
        <template #icon>
          <n-icon :component="SparklesOutline" />
        </template>
        AI 助手
      </n-button>
    </n-space>
  </n-card>
</template>

<script setup>
import { AddOutline, CloudUploadOutline, SparklesOutline } from '@vicons/ionicons5'
import { NCard, NButton, NIcon, NSpace } from 'naive-ui'
</script>

<style scoped>
.quick-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 26px;
  border-radius: 22px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: #fff;
  box-shadow: 0 16px 40px rgba(79, 70, 229, 0.25);
}

.left h3 {
  margin: 0;
  font-weight: 700;
  font-size: 22px;
}

.left p {
  margin: 6px 0 0;
  opacity: 0.85;
  font-size: 13px;
}

:deep(.n-button) {
  border-radius: 12px;
  font-weight: 600;
}
</style>
