<!--
  文件说明：社区组件（CommunityCard）
  - 主要职责：提供社区互动、评论与卡片展示等可复用单元。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <article class="community-card" @click="$emit('open', item)">
    <div class="card-media">
      <div class="thumbnail">
        <img
          v-if="resolveThumbnailUrl(item.contentJson)"
          class="thumbnail-image"
          :src="resolveThumbnailUrl(item.contentJson)"
          alt="内容缩略图"
        />
        <div v-else class="thumbnail-inner">
          <span class="thumbnail-label">PDF</span>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div class="card-header">
        <div class="title-group">
          <h3 class="title">{{ item.title || '未命名内容' }}</h3>
          <span class="type-chip">{{ resolveTypeLabel(item.contentType) }}</span>
        </div>
        <div class="right-summary">
          <span class="status-chip" :class="resolveStatusClass(item.status)">
            {{ resolveStatusLabel(item.status) }}
          </span>
          <p class="summary">{{ renderExcerpt(item.contentJson) }}</p>
        </div>
      </div>
      <div class="meta-row">
        <span class="author-name">{{ item.authorName || '匿名创作者' }}</span>
        <span class="time">{{ formatTime(item.publishedAt) }}</span>
      </div>
      <p class="excerpt">{{ item.authorName || '匿名创作者' }}</p>
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

const resolveThumbnailUrl = (content) => {
  if (!content) return ''
  const raw = typeof content === 'string' ? content : JSON.stringify(content)
  const match = raw.match(/<img[^>]+src=["']([^"']+)["']/i)
  return match?.[1] || ''
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
  border-radius: 18px;
  padding: 16px 20px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  display: flex;
  gap: 18px;
  align-items: center;
  width: 100%;
}

.community-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.card-media {
  flex: 0 0 96px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail {
  width: 96px;
  height: 96px;
  border-radius: 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-inner {
  width: 62px;
  height: 74px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
}

.thumbnail-label {
  letter-spacing: 0.08em;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.title-group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
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

.right-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  text-align: right;
  max-width: 220px;
}

.summary {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
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
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.excerpt {
  margin: 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.5;
  min-height: 32px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #64748b;
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

@media (max-width: 720px) {
  .community-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-media {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
