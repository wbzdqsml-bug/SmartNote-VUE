<!--
  文件说明：社区组件（CommentItem）
  - 主要职责：提供社区互动、评论与卡片展示等可复用单元。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="comment-item">
    <div class="comment-header">
      <div class="author">
        <span class="name">{{ comment.authorName || '匿名' }}</span>
        <span class="time">{{ formatTime(comment.createTime) }}</span>
      </div>
      <div class="actions">
        <button class="link" @click="$emit('reply', comment)">回复</button>
        <button v-if="showDelete" class="link danger" @click="$emit('delete', comment)">删除</button>
      </div>
    </div>
    <p class="content">{{ comment.content }}</p>
    <div v-if="comment.replies?.length" class="replies">
      <comment-item
        v-for="child in comment.replies"
        :key="child.id"
        :comment="child"
        :show-delete="showDelete"
        @reply="$emit('reply', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { format } from 'date-fns'

defineOptions({ name: 'CommentItem' })

defineProps({
  comment: {
    type: Object,
    required: true
  },
  showDelete: {
    type: Boolean,
    default: false
  }
})

defineEmits(['reply', 'delete'])

const formatTime = (value) => {
  if (!value) return '刚刚'
  try {
    return format(new Date(value), 'MM-dd HH:mm')
  } catch {
    return value
  }
}
</script>

<style scoped>
.comment-item {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.05);
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.author {
  display: flex;
  gap: 10px;
  align-items: center;
}

.name {
  font-weight: 600;
  color: #1f2937;
}

.actions {
  display: flex;
  gap: 8px;
}

.link {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.link.danger {
  color: #dc2626;
}

.content {
  margin: 0;
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
}

.replies {
  margin-top: 12px;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-left: 2px solid rgba(148, 163, 184, 0.2);
}
</style>
