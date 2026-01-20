<template>
  <div class="stats-bar">
    <div class="stat-item">
      <span class="stat-label">浏览</span>
      <strong>{{ detail.viewCount ?? 0 }}</strong>
    </div>
    <div class="stat-item">
      <span class="stat-label">点赞</span>
      <strong>{{ detail.likeCount ?? 0 }}</strong>
    </div>
    <div class="stat-item">
      <span class="stat-label">收藏</span>
      <strong>{{ detail.favoriteCount ?? 0 }}</strong>
    </div>
    <div class="stat-item">
      <span class="stat-label">克隆</span>
      <strong>{{ detail.cloneCount ?? 0 }}</strong>
    </div>
  </div>
</template>

<script setup>
defineProps({
  detail: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style scoped>
.stats-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  background: #f8fafc;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.stat-item strong {
  font-size: 18px;
  color: #0f172a;
}
</style>
