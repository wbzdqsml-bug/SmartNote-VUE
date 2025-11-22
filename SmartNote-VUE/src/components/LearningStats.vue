<template>
  <div class="learning-stats">
    <h3 class="title">学习趋势分析</h3>
    <div class="placeholder">
      <n-empty description="数据可视化模块开发中，敬请期待" />
    </div>
  </div>
</template>

<script setup>
import { NEmpty } from 'naive-ui'
</script>

<style scoped>
.learning-stats {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}
</style>
