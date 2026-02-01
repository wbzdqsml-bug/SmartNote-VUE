<!--
  文件说明：社区组件（CommunityCard）
  - 主要职责：提供社区互动、评论与卡片展示等可复用单元。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <article class="community-card" @click="$emit('open', item)">
    <div class="card-top">
      <span class="type-chip">{{ resolveTypeLabel(item.contentType) }}</span>
      <span class="status-chip" :class="resolveStatusClass(item.status)">
        {{ resolveStatusLabel(item.status) }}
      </span>
    </div>
    <h3 class="title">{{ item.title || '未命名内容' }}</h3>
    <p class="excerpt">{{ renderExcerpt(item.contentJson) }}</p>
    <div class="meta">
      <div class="author">
        <span class="author-name">{{ item.authorName || '匿名创作者' }}</span>
        <span class="time">{{ formatTime(item.publishedAt) }}</span>
      </div>
      <div class="stats">
        <span>👀 {{ item.viewCount ?? 0 }}</span>
        <span>❤️ {{ item.likeCount ?? 0 }}</span>
        <span>⭐ {{ item.favoriteCount ?? 0 }}</span>
      </div>
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
  background: linear-gradient(160deg, #ffffff 0%, #f1f5ff 100%);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.25);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: inline-block;
  width: 100%;
  margin-bottom: 16px;
}

.community-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.12);
}

.card-top {
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.type-chip,
.status-chip {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  font-weight: 600;
}

.status-chip.success {
  background: rgba(16, 185, 129, 0.16);
  color: #059669;
}

.status-chip.warning {
  background: rgba(245, 158, 11, 0.16);
  color: #b45309;
}

.status-chip.danger {
  background: rgba(239, 68, 68, 0.16);
  color: #dc2626;
}

.title {
  margin: 0 0 10px;
  font-size: 18px;
  color: #0f172a;
}

.excerpt {
  margin: 0 0 16px;
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
  min-height: 42px;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
}

.author {
  display: flex;
  justify-content: space-between;
}

.author-name {
  font-weight: 600;
  color: #334155;
}

.stats {
  display: flex;
  gap: 12px;
}
</style>
