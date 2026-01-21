<!--
  文件说明：社区组件（CommentTree）
  - 主要职责：提供社区互动、评论与卡片展示等可复用单元。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="comment-tree">
    <div v-if="!comments.length" class="empty">暂无评论，欢迎留下第一条~</div>
    <div v-else class="comment-list">
      <comment-item
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :show-delete="showDelete"
        @reply="$emit('reply', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import CommentItem from '@/components/community/CommentItem.vue'

defineProps({
  comments: {
    type: Array,
    default: () => []
  },
  showDelete: {
    type: Boolean,
    default: false
  }
})

defineEmits(['reply', 'delete'])
</script>

<style scoped>
.comment-tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty {
  padding: 16px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  font-size: 14px;
}
</style>
