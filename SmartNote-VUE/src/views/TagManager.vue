<template>
  <div class="tag-page">
    <header class="page-header">
      <div>
        <h2>标签 / 分类管理</h2>
        <p>分开管理常用的标签与分类</p>
      </div>
      <n-space>
        <n-button quaternary type="primary" @click="refreshAll">刷新</n-button>
      </n-space>
    </header>

    <div class="grid">
      <n-card class="form-card" title="快速创建标签">
        <n-space vertical :size="12">
          <n-space align="center" :size="16">
            <n-input v-model:value="tagForm.name" placeholder="标签名称，例如：AI / 架构 / 周报" />
            <n-color-picker size="small" v-model:value="tagForm.color" />
            <n-input v-model:value="tagForm.color" style="width: 130px" />
            <n-button type="primary" :loading="tagCreating" @click="createTag">创建</n-button>
          </n-space>
          <div class="list-card">
            <div class="tag-grid">
              <n-empty v-if="!tags.length" description="暂无标签，先创建一个吧。" />
              <div v-else class="tag-grid-inner">
                <n-card
                  v-for="tag in tags"
                  :key="tag.id"
                  class="tag-item"
                  :bordered="false"
                >
                  <div class="tag-dot" :style="{ backgroundColor: tag.color || '#94a3b8' }"></div>
                  <div class="tag-text">
                    <div class="name">{{ tag.name || '未命名标签' }}</div>
                    <div class="meta">ID: {{ tag.id }}</div>
                  </div>
                </n-card>
              </div>
            </div>
          </div>
        </n-space>
      </n-card>

      <n-card class="form-card" title="快速创建分类">
        <n-space vertical :size="12">
          <n-space align="center" :size="16">
            <n-input v-model:value="categoryForm.name" placeholder="分类名称，例如：学习 / 工作" />
            <n-color-picker size="small" v-model:value="categoryForm.color" />
            <n-input v-model:value="categoryForm.color" style="width: 130px" />
            <n-button type="primary" :loading="categoryCreating" @click="createCategory">
              创建
            </n-button>
          </n-space>
          <div class="list-card">
            <div class="tag-grid">
              <n-empty v-if="!categories.length" description="暂无分类，先创建一个吧。" />
              <div v-else class="tag-grid-inner">
                <n-card
                  v-for="cat in categories"
                  :key="cat.id"
                  class="tag-item"
                  :bordered="false"
                >
                  <div class="tag-dot" :style="{ backgroundColor: cat.color || '#94a3b8' }"></div>
                  <div class="tag-text">
                    <div class="name">{{ cat.name || '未命名分类' }}</div>
                    <div class="meta">ID: {{ cat.id }}</div>
                  </div>
                </n-card>
              </div>
            </div>
          </div>
        </n-space>
      </n-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, computed, ref } from 'vue'
import { NCard, NButton, NSpace, NInput, NColorPicker, NEmpty, useMessage } from 'naive-ui'
import { useTagStore } from '@/store/tagStore'
import { useCategoryStore } from '@/store/categoryStore'

const tagStore = useTagStore()
const categoryStore = useCategoryStore()
const message = useMessage()

const tagForm = reactive({
  name: '',
  color: '#00AAFF'
})

const categoryForm = reactive({
  name: '',
  color: '#FF9933'
})

const tagCreating = ref(false)
const categoryCreating = ref(false)
const tags = computed(() => tagStore.tags)
const categories = computed(() => categoryStore.categories)

const loadTags = async () => {
  try {
    await tagStore.loadTags(true)
  } catch (error) {
    console.error('[TagManager] loadTags error:', error)
    message.error(error?.response?.data?.message || '获取标签失败，请稍后重试。')
  }
}

const loadCategories = async () => {
  try {
    await categoryStore.loadCategories(true)
  } catch (error) {
    console.error('[TagManager] loadCategories error:', error)
    message.error(error?.response?.data?.message || '获取分类失败，请稍后重试。')
  }
}

const createTag = async () => {
  if (!tagForm.name.trim()) {
    message.warning('请输入标签名称')
    return
  }
  tagCreating.value = true
  try {
    await tagStore.createTag({ name: tagForm.name.trim(), color: tagForm.color })
    await loadTags()
    message.success('标签已创建')
    tagForm.name = ''
  } catch (error) {
    console.error('[TagManager] createTag error:', error)
    message.error(error?.response?.data?.message || '创建标签失败，请稍后重试。')
  } finally {
    tagCreating.value = false
  }
}

const createCategory = async () => {
  if (!categoryForm.name.trim()) {
    message.warning('请输入分类名称')
    return
  }
  categoryCreating.value = true
  try {
    await categoryStore.createCategory({ name: categoryForm.name.trim(), color: categoryForm.color })
    await loadCategories()
    message.success('分类已创建')
    categoryForm.name = ''
  } catch (error) {
    console.error('[TagManager] createCategory error:', error)
    message.error(error?.response?.data?.message || '创建分类失败，请稍后重试。')
  } finally {
    categoryCreating.value = false
  }
}

const refreshAll = async () => {
  await Promise.all([loadTags(), loadCategories()])
}

onMounted(async () => {
  await refreshAll()
})
</script>

<style scoped>
.tag-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.page-header h2 {
  margin: 0 0 4px 0;
}

.page-header p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 16px;
}

.form-card :deep(.n-card__content) {
  padding-top: 0;
}

.tag-grid {
  min-height: 240px;
}

.tag-grid-inner {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
}

.tag-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-text .name {
  font-weight: 600;
}

.tag-text .meta {
  color: #94a3b8;
  font-size: 12px;
}
</style>
