<!--
  文件说明：社区组件（CommunityActions）
  - 主要职责：提供社区互动、评论与卡片展示等可复用单元。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="actions">
    <button class="action-btn" :class="{ active: liked }" @click="$emit('toggle-like')">
      ❤️ 点赞
    </button>
    <button class="action-btn" :class="{ active: favorited }" @click="$emit('toggle-favorite')">
      ⭐ 收藏
    </button>
    <button v-if="showPublish" class="action-btn publish" @click="$emit('publish')">
      🚀 发布
    </button>
    <button class="action-btn clone" @click="$emit('clone')">
      🔁 克隆到工作区
    </button>
  </div>
</template>

<script setup>
defineProps({
  liked: Boolean,
  favorited: Boolean,
  showPublish: Boolean
})

defineEmits(['toggle-like', 'toggle-favorite', 'clone', 'publish'])
</script>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.action-btn {
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.action-btn.active {
  background: rgba(239, 68, 68, 0.16);
  color: #dc2626;
}

.action-btn.clone {
  background: rgba(16, 185, 129, 0.16);
  color: #047857;
}

.action-btn.publish {
  background: rgba(14, 165, 233, 0.16);
  color: #0369a1;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.12);
}
</style>
