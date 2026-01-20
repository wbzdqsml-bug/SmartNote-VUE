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
      </div>
    </header>

    <section class="masonry">
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
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { NInput, NButton, NSelect, NPagination } from 'naive-ui'
import { useRouter } from 'vue-router'
import communityApi from '@/api/community'
import CommunityCard from '@/components/community/CommunityCard.vue'

const router = useRouter()

const keyword = ref('')
const contentType = ref('')
const page = ref(1)
const pageSize = ref(12)
const pageCount = ref(1)
const items = ref([])
const loading = ref(false)

const contentTypeOptions = [
  { label: '全部类型', value: '' },
  { label: '笔记', value: 'Note' },
  { label: '模板', value: 'Template' }
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
    const data = await communityApi.list({
      keyword: keyword.value || undefined,
      contentType: contentType.value || undefined,
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
  background: linear-gradient(120deg, #dbeafe 0%, #fef3c7 50%, #fce7f3 100%);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12);
}

.hero-text h1 {
  margin: 0;
  font-size: 28px;
  color: #0f172a;
}

.hero-text p {
  margin: 6px 0 0;
  color: #475569;
}

.hero-actions {
  display: grid;
  grid-template-columns: 1fr 180px 140px;
  gap: 12px;
}

.masonry {
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
  padding-top: 8px;
}

@media (max-width: 1200px) {
  .masonry {
    column-count: 2;
  }
  .hero-actions {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 720px) {
  .masonry {
    column-count: 1;
  }
  .hero-actions {
    grid-template-columns: 1fr;
  }
}
</style>
