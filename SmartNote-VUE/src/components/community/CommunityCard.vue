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
        </div>
        <div class="right-meta">
          <span class="type-label">{{ resolveTypeLabel(item.contentType) }}</span>
          <span class="comment-count">💬 {{ item.commentCount ?? 0 }}</span>
        </div>
      </div>
      <div class="meta-row">
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
  if (value === 0 || value === 'Markdown' || value === 'MARKDOWN') return 'Markdown'
  if (value === 1 || value === 'Note' || value === 'NOTE') return '笔记'
  if (value === 2 || value === 'Template' || value === 'TEMPLATE') return '模板'
  if (value === 3 || value === 'RichText' || value === 'RICH_TEXT') return '富文本'
  return String(value)
}

const findImageUrl = (value) => {
  if (!value) return ''
  if (typeof value === 'string') {
    const htmlMatch = value.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (htmlMatch?.[1]) return htmlMatch[1]
    const markdownMatch = value.match(/!\[[^\]]*]\(([^)]+)\)/)
    if (markdownMatch?.[1]) return markdownMatch[1]
    const jsonMatch = value.match(/"src"\s*:\s*"([^"]+)"/i)
    return jsonMatch?.[1] || ''
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImageUrl(item)
      if (found) return found
    }
  }
  if (typeof value === 'object') {
    const direct =
      value.src ||
      value.url ||
      value.image ||
      value.thumbnail ||
      value.thumb ||
      value.fileUrl ||
      value.previewUrl
    if (typeof direct === 'string' && direct.startsWith('http')) return direct
    for (const key of Object.keys(value)) {
      const found = findImageUrl(value[key])
      if (found) return found
    }
  }
  return ''
}

const resolveThumbnailUrl = (content) => {
  if (!content) return ''
  if (typeof content === 'string') {
    const trimmed = content.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        const found = findImageUrl(parsed)
        if (found) return found
      } catch (error) {
        return findImageUrl(content)
      }
    }
  }
  const raw = typeof content === 'string' ? content : JSON.stringify(content)
  const found = findImageUrl(raw)
  return found || ''
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
  cursor: pointer;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  display: flex;
  gap: 18px;
  align-items: center;
  width: 100%;
}

.community-card:hover {
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

.right-meta {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 12px;
  text-align: right;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.type-label,
.comment-count {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
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
