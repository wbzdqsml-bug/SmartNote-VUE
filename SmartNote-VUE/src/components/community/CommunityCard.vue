<!--
  文件说明：社区组件（CommunityCard）
  - 主要职责：提供社区互动、评论与卡片展示等可复用单元。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <article class="community-card" @click="$emit('open', item)">
    <div class="card-header">
      <div class="title-group">
        <span class="type-chip">{{ resolveTypeLabel(item.contentType) }}</span>
        <h3 class="title">{{ item.title || '未命名内容' }}</h3>
      </div>
      <span class="status-chip" :class="resolveStatusClass(item.status)">
        {{ resolveStatusLabel(item.status) }}
      </span>
    </div>
    <div class="meta-row">
      <span class="author-name">{{ item.authorName || '匿名创作者' }}</span>
      <span class="time">{{ formatTime(item.publishedAt) }}</span>
    </div>
    <p class="excerpt">{{ renderExcerpt(item.contentJson) }}</p>
    <div class="stats">
      <span>👀 {{ item.viewCount ?? 0 }}</span>
      <span>❤️ {{ item.likeCount ?? 0 }}</span>
      <span>⭐ {{ item.favoriteCount ?? 0 }}</span>
    </div>
  </article>
</template>

<script setup>
import { format } from 'date-fns'

defineProps({
  item: {
    type: Object,
    required: true
  }
})

defineEmits(['open'])

const resolveTypeLabel = (value) => {
  if (value === null || value === undefined || value === '') return '全部'
  if (value === 1 || value === 'Note' || value === 'NOTE') return '笔记'
  if (value === 2 || value === 'Template' || value === 'TEMPLATE') return '模板'
  return String(value)
}

const resolveStatusLabel = (value) => {
  if (value === null || value === undefined || value === '') return '公开'
  const mapping = {
    0: '私有',
    1: '草稿',
    2: '已发布',
    3: '已下架',
    Private: '私有',
    Draft: '草稿',
    Published: '已发布',
    Banned: '已下架'
  }
  return mapping[value] || value
}

const resolveStatusClass = (value) => {
  if (value === 3 || value === 'Banned') return 'danger'
  if (value === 0 || value === 1 || value === 'Private' || value === 'Draft') return 'warning'
  return 'success'
}

const renderExcerpt = (content) => {
  if (!content) return '暂无内容摘要'
  const raw = typeof content === 'string' ? content : JSON.stringify(content)
  return raw.replace(/<[^>]*>/g, '').slice(0, 140)
}

const formatTime = (value) => {
  if (!value) return '未发布'
  try {
    return format(new Date(value), 'MM-dd HH:mm')
  } catch {
    return value
  }
}
</script>

<style scoped>
.community-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  display: block;
  width: 100%;
}

.community-card:hover {
  border-color: #cbd5f5;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.title-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.type-chip,
.status-chip {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 6px;
  background: #e2e8f0;
  color: #475569;
  font-weight: 500;
}

.status-chip.success {
  background: #dcfce7;
  color: #15803d;
}

.status-chip.warning {
  background: #fef3c7;
  color: #a16207;
}

.status-chip.danger {
  background: #fee2e2;
  color: #b91c1c;
}

.title {
  margin: 0;
  font-size: 17px;
  color: #0f172a;
}

.excerpt {
  margin: 0 0 12px;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.55;
  min-height: 36px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}

.author-name {
  font-weight: 500;
  color: #475569;
}

.stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
}
</style>
