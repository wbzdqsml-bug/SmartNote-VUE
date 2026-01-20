<template>
  <div class="detail-page">
    <section class="detail-hero">
      <div class="detail-info">
        <span class="type">{{ resolveTypeLabel(detail?.contentType) }}</span>
        <h1>{{ detail?.title || '未命名内容' }}</h1>
        <div class="meta">
          <span>作者：{{ detail?.authorName || '匿名' }}</span>
          <span>发布于：{{ formatTime(detail?.publishedAt) }}</span>
        </div>
      </div>
      <community-actions
        :liked="liked"
        :favorited="favorited"
        :show-publish="canPublish"
        @toggle-like="toggleLike"
        @toggle-favorite="toggleFavorite"
        @publish="openPublishModal"
        @clone="openCloneModal"
      />
    </section>

    <community-stats-bar :detail="detail || {}" />

    <section class="content">
      <div v-if="contentMode === 'html'" v-html="renderedContent" class="content-html"></div>
      <div v-else-if="contentMode === 'markdown'" class="content-markdown" v-html="renderedContent"></div>
      <pre v-else class="content-json">{{ renderedContent }}</pre>
    </section>

    <section class="comments">
      <div class="comment-header">
        <h2>评论区</h2>
        <span class="replying" v-if="replyTarget">
          回复 @{{ replyTarget.authorName }}
          <button class="link" @click="clearReply">取消</button>
        </span>
      </div>
      <n-input
        v-model:value="commentContent"
        type="textarea"
        placeholder="分享你的看法..."
        :autosize="{ minRows: 3 }"
      />
      <div class="comment-actions">
        <n-button type="primary" @click="submitComment">发布评论</n-button>
      </div>
      <comment-tree
        :comments="commentTree"
        :show-delete="false"
        @reply="setReplyTarget"
        @delete="deleteComment"
      />
    </section>

    <n-modal v-model:show="cloneModalVisible" preset="card" title="克隆到工作区">
      <n-form :model="cloneForm" label-placement="top">
        <n-form-item label="选择工作区">
          <n-select v-model:value="cloneForm.workspaceId" :options="workspaceOptions" />
        </n-form-item>
        <n-form-item label="新标题">
          <n-input v-model:value="cloneForm.title" />
        </n-form-item>
      </n-form>
      <div class="modal-actions">
        <n-button @click="cloneModalVisible = false">取消</n-button>
        <n-button type="primary" @click="confirmClone">确认克隆</n-button>
      </div>
    </n-modal>

    <n-modal v-model:show="publishModalVisible" preset="card" title="发布到社区">
      <n-form :model="publishForm" label-placement="top">
        <n-form-item label="标题快照">
          <n-input v-model:value="publishForm.titleSnapshot" />
        </n-form-item>
        <n-form-item label="内容快照">
          <n-input
            v-model:value="publishForm.contentSnapshot"
            type="textarea"
            :autosize="{ minRows: 4 }"
          />
        </n-form-item>
      </n-form>
      <div class="modal-actions">
        <n-button @click="publishModalVisible = false">取消</n-button>
        <n-button type="primary" @click="confirmPublish">确认发布</n-button>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NInput, NButton, NModal, NForm, NFormItem, NSelect } from 'naive-ui'
import MarkdownIt from 'markdown-it'
import communityApi from '@/api/community'
import workspaceApi from '@/api/workspace'
import CommentTree from '@/components/community/CommentTree.vue'
import CommunityActions from '@/components/community/CommunityActions.vue'
import CommunityStatsBar from '@/components/community/CommunityStatsBar.vue'

const route = useRoute()
const router = useRouter()
const markdown = new MarkdownIt()

const detail = ref(null)
const commentTree = ref([])
const commentContent = ref('')
const replyTarget = ref(null)
const liked = ref(false)
const favorited = ref(false)

const cloneModalVisible = ref(false)
const workspaceOptions = ref([])
const cloneForm = ref({
  workspaceId: null,
  title: ''
})

const publishModalVisible = ref(false)
const publishForm = ref({
  titleSnapshot: '',
  contentSnapshot: ''
})

const canPublish = computed(() => {
  if (!detail.value?.noteId) return false
  const status = detail.value?.status
  return status === 0 || status === 'Draft' || status === null || status === undefined
})

const renderedContent = computed(() => {
  const raw = detail.value?.contentJson ?? ''
  if (!raw) return ''
  const normalized = typeof raw === 'string' ? raw : JSON.stringify(raw)
  if (contentMode.value === 'html') return normalized
  if (contentMode.value === 'markdown') return markdown.render(normalized)
  try {
    return JSON.stringify(JSON.parse(normalized), null, 2)
  } catch {
    return normalized
  }
})

const contentMode = computed(() => {
  const raw = detail.value?.contentJson
  if (!raw) return 'markdown'
  const normalized = typeof raw === 'string' ? raw.trim() : JSON.stringify(raw)
  if (normalized.startsWith('<') && normalized.endsWith('>')) return 'html'
  if (normalized.startsWith('{') || normalized.startsWith('[')) return 'json'
  return 'markdown'
})

const resolveTypeLabel = (value) => {
  if (value === 1 || value === 'Note' || value === 'NOTE') return '笔记'
  if (value === 2 || value === 'Template' || value === 'TEMPLATE') return '模板'
  return value || '内容'
}

const formatTime = (value) => {
  if (!value) return '未知时间'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

const loadDetail = async () => {
  const data = await communityApi.detail(route.params.id)
  detail.value = {
    id: data.id ?? data.Id,
    noteId: data.noteId ?? data.NoteId,
    title: data.title ?? data.Title,
    contentJson: data.contentJson ?? data.ContentJson,
    contentType: data.contentType ?? data.ContentType,
    status: data.status ?? data.Status,
    authorName: data.authorName ?? data.AuthorName,
    publishedAt: data.publishedAt ?? data.PublishedAt,
    viewCount: data.viewCount ?? data.ViewCount,
    likeCount: data.likeCount ?? data.LikeCount,
    favoriteCount: data.favoriteCount ?? data.FavoriteCount,
    cloneCount: data.cloneCount ?? data.CloneCount
  }
}

const normalizeComment = (comment) => ({
  id: comment.id ?? comment.Id,
  publicContentId: comment.publicContentId ?? comment.PublicContentId,
  authorName: comment.authorName ?? comment.AuthorName,
  parentId: comment.parentId ?? comment.ParentId,
  content: comment.content ?? comment.Content,
  createTime: comment.createTime ?? comment.CreateTime,
  replies: (comment.replies ?? comment.Replies ?? []).map(normalizeComment)
})

const loadComments = async () => {
  const data = await communityApi.comments(route.params.id)
  const list = data?.replies ?? data?.Replies ?? data ?? []
  commentTree.value = list.map(normalizeComment)
}

const submitComment = async () => {
  if (!commentContent.value.trim()) return
  await communityApi.createComment({
    PublicContentId: detail.value?.id ?? route.params.id,
    ParentId: replyTarget.value?.id ?? null,
    Content: commentContent.value
  })
  commentContent.value = ''
  replyTarget.value = null
  await loadComments()
}

const setReplyTarget = (comment) => {
  replyTarget.value = comment
}

const clearReply = () => {
  replyTarget.value = null
}

const deleteComment = async (comment) => {
  if (!comment?.id) return
  await communityApi.deleteComment(comment.id)
  await loadComments()
}

const toggleLike = async () => {
  liked.value = !liked.value
  await communityApi.react({
    PublicContentId: detail.value?.id ?? route.params.id,
    IsLiked: liked.value,
    IsFavorite: favorited.value
  })
  if (detail.value) {
    detail.value.likeCount = Math.max(0, (detail.value.likeCount ?? 0) + (liked.value ? 1 : -1))
  }
}

const toggleFavorite = async () => {
  favorited.value = !favorited.value
  await communityApi.react({
    PublicContentId: detail.value?.id ?? route.params.id,
    IsLiked: liked.value,
    IsFavorite: favorited.value
  })
  if (detail.value) {
    detail.value.favoriteCount = Math.max(
      0,
      (detail.value.favoriteCount ?? 0) + (favorited.value ? 1 : -1)
    )
  }
}

const openCloneModal = async () => {
  cloneModalVisible.value = true
  if (!workspaceOptions.value.length) {
    const data = await workspaceApi.list()
    const list = data?.data ?? data ?? []
    workspaceOptions.value = list.map((item) => ({
      label: item.name || item.title || item.workspaceName || '工作区',
      value: item.id ?? item.Id ?? item.workspaceId ?? item.WorkspaceId
    }))
    cloneForm.value.workspaceId = workspaceOptions.value[0]?.value ?? null
  }
  cloneForm.value.title = detail.value?.title || ''
}

const confirmClone = async () => {
  if (!cloneForm.value.workspaceId) return
  const result = await communityApi.cloneContent({
    PublicContentId: detail.value?.id ?? route.params.id,
    WorkspaceId: cloneForm.value.workspaceId,
    Title: cloneForm.value.title
  })
  cloneModalVisible.value = false
  const newId = result?.id ?? result?.Id
  if (newId) {
    router.push({ path: '/notes', query: { focus: newId } })
  }
}

const resolveContentTypeValue = (value) => {
  if (typeof value === 'number') return value
  if (value === 'Note' || value === 'NOTE') return 1
  if (value === 'Template' || value === 'TEMPLATE') return 2
  return 0
}

const openPublishModal = () => {
  publishForm.value.titleSnapshot = detail.value?.title || ''
  publishForm.value.contentSnapshot = detail.value?.contentJson
    ? typeof detail.value.contentJson === 'string'
      ? detail.value.contentJson
      : JSON.stringify(detail.value.contentJson)
    : ''
  publishModalVisible.value = true
}

const confirmPublish = async () => {
  if (!detail.value?.noteId) return
  await communityApi.publish({
    NoteId: detail.value.noteId,
    ContentType: resolveContentTypeValue(detail.value.contentType),
    TitleSnapshot: publishForm.value.titleSnapshot,
    ContentSnapshotJson: publishForm.value.contentSnapshot
  })
  publishModalVisible.value = false
  await loadDetail()
}

onMounted(async () => {
  await loadDetail()
  await loadComments()
})
</script>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 28px 32px;
}

.detail-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
  border-radius: 24px;
  background: linear-gradient(130deg, #e0f2fe 0%, #fef9c3 55%, #fde68a 100%);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.12);
}

.detail-info h1 {
  margin: 8px 0;
  font-size: 28px;
  color: #0f172a;
}

.meta {
  display: flex;
  gap: 16px;
  color: #475569;
  font-size: 13px;
}

.type {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.15);
  color: #1d4ed8;
  font-weight: 600;
  font-size: 12px;
}

.content {
  background: #ffffff;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.content-markdown,
.content-html {
  color: #1f2937;
  line-height: 1.7;
}

.content-json {
  margin: 0;
  white-space: pre-wrap;
  font-size: 13px;
  color: #1f2937;
}

.comments {
  background: #f8fafc;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-header h2 {
  margin: 0;
  font-size: 20px;
}

.replying {
  font-size: 12px;
  color: #2563eb;
}

.link {
  border: none;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  margin-left: 6px;
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

@media (max-width: 900px) {
  .detail-hero {
    flex-direction: column;
  }
}
</style>
