<template>
  <div class="mine-page">
    <header class="header">
      <div>
        <h1>我的发布</h1>
        <p>管理你的社区内容状态与表现。</p>
      </div>
      <n-select v-model:value="status" :options="statusOptions" />
    </header>

    <section class="list">
      <community-card
        v-for="item in items"
        :key="item.id"
        :item="normalizeItem(item)"
        @open="openDetail"
      />
      <div v-if="!items.length && !loading" class="empty">暂无发布内容</div>
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
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { NSelect, NPagination } from 'naive-ui'
import { useRouter } from 'vue-router'
import communityApi from '@/api/community'
import CommunityCard from '@/components/community/CommunityCard.vue'

const router = useRouter()

const status = ref('')
const page = ref(1)
const pageSize = ref(12)
const pageCount = ref(1)
const items = ref([])
const loading = ref(false)

const statusOptions = [
  { label: '全部状态', value: null },
  { label: '草稿', value: 0 },
  { label: '已发布', value: 1 },
  { label: '已下架', value: 2 }
]

const normalizeItem = (raw) => ({
  id: raw.id ?? raw.Id,
  title: raw.title ?? raw.Title,
  contentJson: raw.contentJson ?? raw.ContentJson,
  contentType: raw.contentType ?? raw.ContentType,
  status: raw.status ?? raw.Status,
  authorName: raw.authorName ?? raw.AuthorName,
  publishedAt: raw.publishedAt ?? raw.PublishedAt,
  viewCount: raw.viewCount ?? raw.ViewCount,
  likeCount: raw.likeCount ?? raw.LikeCount,
  favoriteCount: raw.favoriteCount ?? raw.FavoriteCount
})

const openDetail = (item) => {
  router.push({ path: `/community/${item.id}` })
}

const loadData = async () => {
  loading.value = true
  try {
    const data = await communityApi.mine({
      status: status.value ?? undefined,
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

watch(status, () => {
  page.value = 1
  loadData()
})

onMounted(loadData)
</script>

<style scoped>
.mine-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 28px 32px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(130deg, #f0f9ff 0%, #fef2f2 100%);
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.header h1 {
  margin: 0;
  font-size: 24px;
  color: #0f172a;
}

.header p {
  margin: 4px 0 0;
  color: #64748b;
}

.list {
  column-count: 3;
  column-gap: 18px;
}

.empty {
  padding: 24px;
  border-radius: 18px;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  text-align: center;
}

.pagination {
  display: flex;
  justify-content: center;
}

@media (max-width: 1200px) {
  .list {
    column-count: 2;
  }
}

@media (max-width: 720px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .list {
    column-count: 1;
  }
}
</style>
