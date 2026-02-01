<!--
  文件说明：社区页面（CommunityListPage）
  - 主要职责：负责社区相关的页面布局、列表展示与交互组织。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="community-page">
    <header class="hero">
      <div class="hero-text">
        <h1>知识社区</h1>
        <p>发现灵感、分享创作、结识志同道合的伙伴。</p>
      </div>
      <div class="hero-actions">
        <n-input
          v-model:value="keyword"
          placeholder="搜索标题、内容..."
          clearable
          size="large"
          @keydown.enter="loadData"
        />
        <n-select v-model:value="contentType" :options="contentTypeOptions" size="large" />
        <n-button type="primary" size="large" @click="loadData">发现内容</n-button>
        <n-button secondary size="large" @click="openPublishModal">发布笔记</n-button>
      </div>
    </header>

    <section class="community-list">
      <community-card
        v-for="item in items"
        :key="item.id"
        :item="normalizeItem(item)"
        @open="openDetail"
      />
      <div v-if="!items.length && !loading" class="empty">
        暂无内容，欢迎成为第一个分享的人！
      </div>
    </section>

    <div class="pagination">
      <n-pagination
        v-model:page="page"
        v-model:page-size="pageSize"
        :page-count="pageCount"
        :page-sizes="[6, 12, 18]"
        show-size-picker
        @update:page="loadData"
        @update:page-size="handlePageSizeChange"
      />
    </div>

    <n-modal v-model:show="publishModalVisible" preset="card" title="发布笔记到社区">
      <n-form :model="publishForm" label-placement="top">
        <n-form-item label="选择笔记">
          <n-select
            v-model:value="publishForm.noteId"
            :options="noteOptions"
            placeholder="请选择要发布的笔记"
          />
        </n-form-item>
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
import { onMounted, ref, watch } from 'vue'
import { NInput, NButton, NSelect, NPagination, NModal, NForm, NFormItem, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import communityApi from '@/api/community'
import noteApi from '@/api/note'
import CommunityCard from '@/components/community/CommunityCard.vue'

const router = useRouter()
const message = useMessage()

const keyword = ref('')
const contentType = ref('')
const page = ref(1)
const pageSize = ref(12)
const pageCount = ref(1)
const items = ref([])
const loading = ref(false)
const publishModalVisible = ref(false)
const noteOptions = ref([])
const notesCache = ref([])
const publishForm = ref({
  noteId: null,
  titleSnapshot: '',
  contentSnapshot: ''
})

const contentTypeOptions = [
  { label: '全部类型', value: null },
  { label: '笔记', value: 1 },
  { label: '模板', value: 2 }
]

const normalizeItem = (raw) => ({
  id: raw.id ?? raw.Id,
  noteId: raw.noteId ?? raw.NoteId,
  title: raw.title ?? raw.Title,
  titleSnapshot: raw.titleSnapshot ?? raw.TitleSnapshot,
  preview:
    raw.preview ??
    raw.Preview ??
    raw.contentPreview ??
    raw.ContentPreview ??
    raw.summary ??
    raw.Summary ??
    raw.contentSummary ??
    raw.ContentSummary,
  contentJson:
    raw.contentSnapshotJson ??
    raw.ContentSnapshotJson ??
    raw.contentSnapshot ??
    raw.ContentSnapshot ??
    raw.contentJson ??
    raw.ContentJson ??
    raw.content ??
    raw.Content,
  contentType: raw.contentType ?? raw.ContentType,
  status: raw.status ?? raw.Status,
  authorName: raw.authorName ?? raw.AuthorName,
  publishedAt: raw.publishedAt ?? raw.PublishedAt,
  viewCount: raw.viewCount ?? raw.ViewCount,
  likeCount: raw.likeCount ?? raw.LikeCount,
  favoriteCount: raw.favoriteCount ?? raw.FavoriteCount
})

const resolveNotesResponse = (response) => {
  if (!response) return []
  const payload = response.data ?? response
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data ?? []
  }
  return payload ?? []
}

const openDetail = (item) => {
  router.push({ path: `/community/${item.id}` })
}

const loadNotes = async () => {
  if (notesCache.value.length) return
  const response = await noteApi.list()
  const list = resolveNotesResponse(response)
  notesCache.value = Array.isArray(list) ? list : []
  noteOptions.value = notesCache.value.map((note) => ({
    label: note.title || note.Title || '未命名笔记',
    value: note.id ?? note.Id
  }))
}

const openPublishModal = async () => {
  await loadNotes()
  publishForm.value = {
    noteId: noteOptions.value[0]?.value ?? null,
    titleSnapshot: '',
    contentSnapshot: ''
  }
  publishModalVisible.value = true
}

const resolveContentTypeForPublish = (note) => {
  const rawType = note?.type ?? note?.Type ?? 0
  if (typeof rawType === 'number') return rawType
  if (rawType === 'Note' || rawType === 'NOTE') return 0
  if (rawType === 'Template' || rawType === 'TEMPLATE') return 1
  return 0
}

const resolveNotePayload = (noteId) => {
  const note = notesCache.value.find((item) => (item.id ?? item.Id) === noteId)
  if (!note) return null
  return {
    NoteId: note.id ?? note.Id,
    ContentType: resolveContentTypeForPublish(note),
    TitleSnapshot: note.title ?? note.Title ?? '未命名笔记',
    ContentSnapshotJson: note.contentJson ?? note.ContentJson ?? note.content ?? note.Content ?? ''
  }
}

const findExistingContentByNoteId = async (noteId) => {
  const data = await communityApi.mine({ page: 1, pageSize: 100 })
  const list = data?.items ?? data?.list ?? data?.data ?? data ?? []
  const normalized = Array.isArray(list) ? list.map(normalizeItem) : []
  return normalized.find((item) => item.noteId === noteId) || null
}

const confirmPublish = async () => {
  if (!publishForm.value.noteId) return
  const payload = resolveNotePayload(publishForm.value.noteId)
  if (!payload) {
    message.warning('请选择要发布的笔记')
    return
  }
  const titleSnapshot = publishForm.value.titleSnapshot?.trim()
  const contentSnapshot = publishForm.value.contentSnapshot
  try {
    await communityApi.publish({
      NoteId: payload.NoteId,
      ContentType: payload.ContentType,
      TitleSnapshot: titleSnapshot || null,
      ContentSnapshotJson: contentSnapshot || null
    })
  } catch (error) {
    if (error?.response?.status !== 400) throw error
    const existing = await findExistingContentByNoteId(payload.NoteId)
    if (!existing?.id) throw error
    await communityApi.updateStatus({
      publicContentId: existing.id,
      status: 2
    })
    message.success('已重新发布')
  }
  publishModalVisible.value = false
  await loadData()
}

const loadData = async () => {
  loading.value = true
  try {
    const data = await communityApi.list({
      keyword: keyword.value || undefined,
      contentType: contentType.value ?? undefined,
      page: page.value,
      pageSize: pageSize.value
    })
    items.value = data?.items ?? data?.list ?? data?.data ?? data ?? []
    const total = data?.total ?? data?.Total ?? data?.count ?? items.value.length
    pageCount.value = Math.max(1, Math.ceil(total / pageSize.value))
  } finally {
    loading.value = false
  }
}

const handlePageSizeChange = () => {
  page.value = 1
  loadData()
}

watch(
  () => publishForm.value.noteId,
  (noteId) => {
    const payload = noteId ? resolveNotePayload(noteId) : null
    if (!payload) return
    publishForm.value.titleSnapshot = payload.TitleSnapshot
    publishForm.value.contentSnapshot = payload.ContentSnapshotJson
  }
)

onMounted(loadData)
</script>

<style scoped>
.community-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 28px 32px;
}

.hero {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid #e2e8f0;
}

.hero-text h1 {
  margin: 0;
  font-size: 26px;
  color: #0f172a;
}

.hero-text p {
  margin: 6px 0 0;
  color: #64748b;
}

.hero-actions {
  display: grid;
  grid-template-columns: 1fr 180px auto auto;
  gap: 10px;
  align-items: center;
}

.community-list {
  display: grid;
  gap: 16px;
}

.empty {
  padding: 20px;
  border-radius: 12px;
  border: 1px dashed #cbd5f5;
  color: #64748b;
  text-align: center;
}

.pagination {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

@media (max-width: 1200px) {
  .hero-actions {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 720px) {
  .hero-actions {
    grid-template-columns: 1fr;
  }
}
</style>
