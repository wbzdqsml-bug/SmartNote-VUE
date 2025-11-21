<template>
  <n-card class="note-list" :segmented="{ content: true, footer: true }">
    <template #header>
      <div class="header">
        <div>
          <h3>笔记总览</h3>
          <p v-if="keyword">关键词：{{ keyword }}</p>
        </div>
        <n-space>
          <n-button quaternary size="small" @click="$emit('refresh')">刷新</n-button>
        </n-space>
      </div>
      <div class="filters">
        <div class="filter-block">
          <div class="filter-label">分类</div>
          <div class="filter-content">
            <n-tag
              v-if="categoryValue"
              size="small"
              round
              closable
              :bordered="false"
              @close="clearCategory"
            >
              {{ categoryLabel }}
            </n-tag>
            <span v-else class="filter-placeholder">未选择</span>
            <n-button quaternary size="tiny" type="primary" @click="toggleCategorySelect">
              + 添加
            </n-button>
          </div>
          <n-select
            v-if="showCategorySelect"
            size="small"
            v-model:value="categorySelectorValue"
            :options="categoryOptions"
            placeholder="选择分类"
            style="width: 160px"
            clearable
            filterable
            @update:value="handleSelectCategory"
            @blur="showCategorySelect = false"
          />
        </div>

        <div class="filter-block">
          <div class="filter-label">标签</div>
          <div class="filter-content tags">
            <div class="filter-chips">
              <n-tag
                v-for="tag in selectedTagDetails"
                :key="tag.value"
                size="small"
                round
                closable
                :bordered="false"
                @close="removeTag(tag.value)"
              >
                {{ tag.label }}
              </n-tag>
              <span v-if="!selectedTagDetails.length" class="filter-placeholder">未选择</span>
            </div>
            <n-button quaternary size="tiny" type="primary" @click="toggleTagSelect">
              + 添加
            </n-button>
          </div>
          <n-select
            v-if="showTagSelect"
            size="small"
            v-model:value="tagSelectorValue"
            multiple
            filterable
            :options="tagOptions"
            placeholder="选择标签"
            style="width: 260px"
            clearable
            @update:value="handleSelectTags"
            @blur="showTagSelect = false"
          />
        </div>
      </div>
    </template>

    <div class="list-body">
      <n-spin :show="loading">
        <n-empty v-if="!notes.length" description="暂无笔记" />
        <div v-else class="scroll-area">
          <div class="card-column">
            <n-card
              v-for="note in filteredNotes"
              :key="note.id"
              :class="['note-card', { active: note.id === selectedId }]"
              hoverable
              @click="$emit('select', note)"
            >
              <template #header>
                <div class="card-header">
                  <n-ellipsis>{{ note.title || '未命名笔记' }}</n-ellipsis>
                  <n-tag size="small" round type="success">
                    {{ note.typeName || typeName(note.type) }}
                  </n-tag>
                </div>
              </template>

              <template #default>
                <p class="preview">
                  {{ renderPreview(note) }}
                </p>
                <div class="note-meta">
                  <div class="meta-row">
                    <div v-if="note.categoryName" class="category-meta">
                      <span
                        class="category-dot"
                        :style="{ backgroundColor: note.categoryColor || '#64748b' }"
                      ></span>
                      <span class="category-name">{{ note.categoryName }}</span>
                    </div>
                    <div class="type-chip">
                      <n-tag size="small" round type="info">
                        {{ note.typeName || typeName(note.type) }}
                      </n-tag>
                    </div>
                  </div>
                  <div v-if="displayTags(note).length" class="tag-chips">
                    <n-tag
                      v-for="tag in displayTags(note)"
                      :key="tag.id || tag.name"
                      size="small"
                      round
                    >
                      {{ tag.name }}
                    </n-tag>
                  </div>
                  <div v-else class="tag-placeholder">暂无标签</div>
                </div>
              </template>

              <template #footer>
                <div class="card-footer">
                  <span>{{ formatTime(note.updateTime || note.createdAt) }}</span>
                  <n-popconfirm
                    positive-text="确认"
                    negative-text="取消"
                    @positive-click="$emit('soft-delete', note.id)"
                  >
                    <template #trigger>
                      <n-button size="tiny" tertiary type="error">
                        移入回收站
                      </n-button>
                    </template>
                    确认将该笔记移入回收站？
                  </n-popconfirm>
                </div>
              </template>
            </n-card>
          </div>
        </div>
      </n-spin>
    </div>
  </n-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  NCard,
  NButton,
  NTag,
  NSpin,
  NSpace,
  NEmpty,
  NPopconfirm,
  NEllipsis,
  NSelect
} from 'naive-ui'
import { format } from 'date-fns'
import { noteTypeMap } from '@/constants/noteTypes'

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  selectedId: {
    type: [Number, String],
    default: null
  },
  keyword: {
    type: String,
    default: ''
  },
  categoryOptions: {
    type: Array,
    default: () => []
  },
  tagOptions: {
    type: Array,
    default: () => []
  },
  selectedCategory: {
    type: [Number, String],
    default: null
  },
  selectedTagIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'select',
  'soft-delete',
  'refresh',
  'update:selectedCategory',
  'update:selectedTagIds',
  'filter-change'
])

const showCategorySelect = ref(false)
const showTagSelect = ref(false)
const categorySelectorValue = ref(null)
const tagSelectorValue = ref([])

const categoryValue = computed({
  get: () => props.selectedCategory ?? null,
  set: (value) => emit('update:selectedCategory', value)
})

const tagValues = computed({
  get: () => (Array.isArray(props.selectedTagIds) ? props.selectedTagIds : []),
  set: (value) => emit('update:selectedTagIds', value ?? [])
})

const categoryLabel = computed(() => {
  const matched = props.categoryOptions.find(
    (item) => String(item.value) === String(categoryValue.value)
  )
  return matched?.label || '未选择'
})

const selectedTagDetails = computed(() => {
  const list = Array.isArray(tagValues.value) ? tagValues.value : []
  const map = new Map(props.tagOptions.map((item) => [String(item.value), item.label]))
  return list
    .map((val) => ({
      value: val,
      label: map.get(String(val)) || `标签 #${val}`
    }))
    .filter((item) => item.value !== null && item.value !== undefined)
})

const displayTags = (note) => {
  const list = Array.isArray(note?.tags) ? note.tags : []
  if (!list.length) return []
  const normalized = list
    .map((item) => ({
      id: item.id ?? item.tagId ?? item.TagId,
      name: item.name || `标签 #${item.id}`
    }))
    .filter((item) => item.id !== null && item.id !== undefined)
  if (normalized.length <= 3) return normalized
  return [...normalized.slice(0, 3), { id: 'more', name: '...' }]
}

const filteredNotes = computed(() => {
  const keyword = props.keyword?.toLowerCase()?.trim() ?? ''
  if (!keyword) {
    return props.notes
  }
  return props.notes.filter((item) => {
    return (
      item.title?.toLowerCase().includes(keyword) ||
      item.contentJson?.toLowerCase().includes(keyword)
    )
  })
})

const handleFiltersChange = () => {
  emit('filter-change')
}

const toggleCategorySelect = () => {
  categorySelectorValue.value = categoryValue.value
  showCategorySelect.value = true
}

const handleSelectCategory = (value) => {
  categorySelectorValue.value = value
  categoryValue.value = value ?? null
  showCategorySelect.value = false
  handleFiltersChange()
}

const clearCategory = () => {
  categorySelectorValue.value = null
  categoryValue.value = null
  handleFiltersChange()
}

const toggleTagSelect = () => {
  tagSelectorValue.value = [...tagValues.value]
  showTagSelect.value = true
}

const handleSelectTags = (value) => {
  const resolved = Array.isArray(value) ? value : []
  tagSelectorValue.value = resolved
  tagValues.value = resolved
  showTagSelect.value = false
  handleFiltersChange()
}

const removeTag = (tagId) => {
  const filtered = (Array.isArray(tagValues.value) ? tagValues.value : []).filter(
    (id) => String(id) !== String(tagId)
  )
  tagValues.value = filtered
  tagSelectorValue.value = filtered
  handleFiltersChange()
}

const typeName = (value) => noteTypeMap[value] || '笔记'

const formatTime = (value) => {
  if (!value) return '未知时间'
  try {
    return format(new Date(value), 'yyyy-MM-dd HH:mm')
  } catch {
    return value
  }
}

const renderPreview = (note) => {
  if (!note) return '暂无预览内容'
  if (Number(note.type) === 1) return '手写画板（点击以查看详情）'
  if (note.preview) return note.preview
  const body = note.contentJson ?? note.content
  if (body) return body.slice(0, 120)
  return '暂无预览内容'
}
</script>

<style scoped>
.note-list {
  border-radius: 22px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.12);
  background: #fff;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

:deep(.n-card__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.header p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
}

.filter-label {
  font-size: 12px;
  color: #6b7280;
}

.filter-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.filter-content.tags {
  align-items: flex-start;
}

.filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-placeholder {
  color: #94a3b8;
  font-size: 12px;
}

.list-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ✅ 让内部可滚动，外部固定高度 */
.scroll-area {
  flex: 1;
  overflow-y: auto;
  max-height: 480px; /* 固定高度，内部滚动 */
  padding-right: 8px;
  scrollbar-gutter: stable;
}

.scroll-area::-webkit-scrollbar {
  width: 8px;
}

.scroll-area::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.3);
  border-radius: 4px;
}

.scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.5);
}

.card-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-card {
  border-radius: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
}

.note-card.active {
  border-color: rgba(79, 70, 229, 0.5);
  box-shadow: 0 14px 32px rgba(79, 70, 229, 0.18);
}

.note-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(79, 70, 229, 0.25);
}

.preview {
  min-height: 60px;
  color: #4b5563;
  font-size: 13px;
}

.note-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.category-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 12px;
}

.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  background: #475569;
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.type-chip :deep(.n-tag) {
  background: #eef2ff;
  color: #3730a3;
}

.tag-placeholder {
  color: #94a3b8;
  font-size: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #6b7280;
  font-size: 12px;
}
</style>
