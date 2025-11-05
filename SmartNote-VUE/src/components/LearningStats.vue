<template>
  <n-card class="learning-stats" title="学习趋势分析" :bordered="false">
    <div class="placeholder">
      <n-empty description="数据可视化模块开发中，敬请期待" />
    </div>
  </n-card>
</template>

<script setup>
import { NCard, NEmpty } from 'naive-ui'
</script>

<style scoped>
.learning-stats {
  border-radius: 22px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
  min-height: 240px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}
</style>
