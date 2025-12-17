<template>
  <div class="tag-page">
    <div class="page-header">
      <div>
        <h2>标签与分类</h2>
        <p>统一管理标签与分类，便于组织笔记。</p>
      </div>
      <n-button size="small" @click="refreshAll">刷新</n-button>
    </div>

    <div class="grid">
      <n-card class="form-card" :bordered="false" title="标签">
        <template #header-extra>
          <n-tag size="small" round type="info">{{ tags.length }} 个</n-tag>
        </template>

        <div class="create-bar">
          <n-input
            v-model:value="tagForm.name"
            size="large"
            placeholder="标签名称，例如：重要 / 待办"
            class="name-input"
          />

          <n-popover trigger="click" placement="bottom" :show-arrow="false">
            <template #trigger>
              <n-button size="large" secondary class="color-trigger" :title="tagForm.color">
                <span class="color-dot" :style="{ backgroundColor: tagForm.color }"></span>
              </n-button>
            </template>
            <div class="color-popover">
              <div class="color-popover-title">选择颜色</div>
              <n-color-picker v-model:value="tagForm.color" :show-alpha="false" />
            </div>
          </n-popover>

          <n-button size="large" type="primary" :loading="tagCreating" @click="createTag">
            创建
          </n-button>
        </div>

        <div class="tag-grid">
          <n-empty v-if="!tags.length" description="暂无标签，先创建一个吧。" />
          <div v-else class="tag-grid-inner">
            <n-card
              v-for="tag in tags"
              :key="tag.id"
              size="small"
              class="tag-item"
              :bordered="false"
              hoverable
            >
              <div class="item-row">
                <div class="tag-info">
                  <div class="tag-dot" :style="{ backgroundColor: tag.color || '#94a3b8' }"></div>
                  <div class="tag-text">
                    <div class="name">{{ tag.name || '未命名标签' }}</div>
                    <div class="meta">ID: {{ tag.id }}</div>
                  </div>
                </div>
                <div class="actions">
                  <n-popconfirm
                    @positive-click="handleDeleteTag(tag.id)"
                    placement="left"
                    positive-text="确认"
                    negative-text="取消"
                  >
                    <template #trigger>
                      <n-button quaternary circle type="error" size="small" :loading="tagDeleting">
                        <template #icon>
                          <n-icon :component="TrashOutline" />
                        </template>
                      </n-button>
                    </template>
                    确认删除标签 {{ tag.name }} 吗？
                  </n-popconfirm>
                </div>
              </div>
            </n-card>
          </div>
        </div>
      </n-card>

      <n-card class="form-card" :bordered="false" title="分类">
        <template #header-extra>
          <n-tag size="small" round type="info">{{ categories.length }} 个</n-tag>
        </template>

        <div class="create-bar">
          <n-input
            v-model:value="categoryForm.name"
            size="large"
            placeholder="分类名称，例如：学习 / 工作"
            class="name-input"
          />

          <n-popover trigger="click" placement="bottom" :show-arrow="false">
            <template #trigger>
              <n-button size="large" secondary class="color-trigger" :title="categoryForm.color">
                <span class="color-dot" :style="{ backgroundColor: categoryForm.color }"></span>
              </n-button>
            </template>
            <div class="color-popover">
              <div class="color-popover-title">选择颜色</div>
              <n-color-picker v-model:value="categoryForm.color" :show-alpha="false" />
            </div>
          </n-popover>

          <n-button size="large" type="primary" :loading="categoryCreating" @click="createCategory">
            创建
          </n-button>
        </div>

        <div class="tag-grid">
          <n-empty v-if="!categories.length" description="暂无分类，先创建一个吧。" />
          <div v-else class="tag-grid-inner">
            <n-card
              v-for="cat in categories"
              :key="cat.id"
              size="small"
              class="tag-item"
              :bordered="false"
              hoverable
            >
              <div class="item-row">
                <div class="tag-info">
                  <div class="tag-dot" :style="{ backgroundColor: cat.color || '#94a3b8' }"></div>
                  <div class="tag-text">
                    <div class="name">{{ cat.name || '未命名分类' }}</div>
                    <div class="meta">ID: {{ cat.id }}</div>
                  </div>
                </div>
                <div class="actions">
                  <n-popconfirm
                    @positive-click="handleDeleteCategory(cat.id)"
                    placement="left"
                    positive-text="确认"
                    negative-text="取消"
                  >
                    <template #trigger>
                      <n-button
                        quaternary
                        circle
                        type="error"
                        size="small"
                        :loading="categoryDeleting"
                      >
                        <template #icon>
                          <n-icon :component="TrashOutline" />
                        </template>
                      </n-button>
                    </template>
                    确认删除分类 {{ cat.name }} 吗？
                  </n-popconfirm>
                </div>
              </div>
            </n-card>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  NButton,
  NCard,
  NColorPicker,
  NEmpty,
  NIcon,
  NInput,
  NPopover,
  NPopconfirm,
  NTag,
  useMessage
} from 'naive-ui'
import { TrashOutline } from '@vicons/ionicons5'
import { useCategoryStore } from '@/store/categoryStore'
import { useTagStore } from '@/store/tagStore'

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
const tagDeleting = ref(false)
const categoryCreating = ref(false)
const categoryDeleting = ref(false)
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

const handleDeleteTag = async (tagId) => {
  tagDeleting.value = true
  try {
    await tagStore.deleteTag(tagId)
    message.success('标签已删除')
  } catch (error) {
    console.error('[TagManager] handleDeleteTag error:', error)
    message.error(error?.response?.data?.message || '删除标签失败，请稍后重试。')
  } finally {
    tagDeleting.value = false
  }
}

const handleDeleteCategory = async (categoryId) => {
  categoryDeleting.value = true
  try {
    await categoryStore.deleteCategory(categoryId)
    message.success('分类已删除')
  } catch (error) {
    console.error('[TagManager] handleDeleteCategory error:', error)
    message.error(error?.response?.data?.message || '删除分类失败，请稍后重试。')
  } finally {
    categoryDeleting.value = false
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
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 18px;
}

.form-card {
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.form-card :deep(.n-card-header) {
  padding: 16px 16px 8px;
}

.form-card :deep(.n-card__content) {
  padding: 0 16px 16px;
}

.create-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.name-input {
  flex: 1;
  min-width: 220px;
}

.color-trigger {
  width: 44px;
  padding: 0;
  border-radius: 12px;
}

.color-dot {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.color-popover {
  width: 260px;
  padding: 6px 4px;
}

.color-popover-title {
  font-size: 12px;
  color: #64748b;
  margin: 0 8px 8px;
}

.tag-grid {
  min-height: 240px;
}

.tag-grid-inner {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.tag-item {
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
}

.tag-item :deep(.n-card__content) {
  padding: 12px;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tag-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-item .tag-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.tag-text .name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-text .meta {
  color: #94a3b8;
  font-size: 12px;
}

.actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

@media (max-width: 520px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
