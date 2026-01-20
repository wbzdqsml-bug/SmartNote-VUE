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
