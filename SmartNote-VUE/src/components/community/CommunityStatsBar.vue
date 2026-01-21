<!--
  文件说明：社区组件（CommunityStatsBar）
  - 主要职责：提供社区互动、评论与卡片展示等可复用单元。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
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
