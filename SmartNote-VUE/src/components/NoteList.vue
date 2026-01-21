<!--
  文件说明：通用业务组件（NoteList）
  - 主要职责：承载可复用的业务 UI 与交互逻辑，供多个页面组合。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <div class="note-list">
    <div class="header">
      <n-input
        v-model:value="localKeyword"
        placeholder="搜索笔记..."
        clearable
        size="small"
      >
        <template #prefix><n-icon :component="Search" /></template>
      </n-input>
      <div class="filters">
        <n-select 
          v-model:value="localCategory" 
          :options="categoryOptions" 
          placeholder="分类" 
          clearable 
          filterable
          size="small" 
          class="filter-select"
          @update:value="handleFilterUpdate"
        />
        <n-select 
          v-model:value="localTags" 
          :options="tagOptions" 
          placeholder="标签" 
          multiple 
          clearable 
          filterable
          size="small" 
          class="filter-select"
          @update:value="handleFilterUpdate"
        />
      </div>
    </div>

    <div class="list-container">
      <n-scrollbar>
        <n-spin :show="loading">
          <div class="list-scroll-content">
            <n-empty
              v-if="!filteredNotes.length"
              :description="emptyDescription"
              class="empty-state"
            />
            <div v-else class="list">
              <div 
                v-for="(note, index) in filteredNotes" 
                :key="note.id" 
                class="note-item" 
                :class="{ active: selectedId === note.id }"
                :style="{ '--note-accent': resolveAccent(note, index) }"
                @click="$emit('select', note)"
              >
                <div class="note-title">{{ note.title || '无标题' }}</div>
                <div class="note-preview">{{ resolvePreview(note) }}</div>
                <div class="note-meta">
                  <span class="time">{{ formatDate(note.updateTime) }}</span>
                  <div class="note-badges">
                    <span v-if="note.categoryName" class="badge badge-category">
                      {{ note.categoryName }}
                    </span>
                    <span
                      v-for="(tag, tagIndex) in resolveDisplayTags(note)"
                      :key="tag.id ?? tag.name ?? tagIndex"
                      class="badge badge-tag"
                    >
                      {{ resolveTagLabel(tag) }}
                    </span>
                    <span v-if="resolveExtraTags(note) > 0" class="badge badge-more">
                      +{{ resolveExtraTags(note) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-spin>
      </n-scrollbar>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { NInput, NIcon, NSelect, NSpin, NEmpty, NScrollbar } from 'naive-ui'
import { Search } from '@vicons/ionicons5'
import { format } from 'date-fns'

const props = defineProps({
  notes: Array,
  loading: Boolean,
  selectedId: Number,
  keyword: String,
  categoryOptions: Array,
  tagOptions: Array,
  selectedCategory: [Number, String],
  selectedTagIds: Array
})

const emit = defineEmits(['select', 'refresh', 'filter-change', 'update:selectedCategory', 'update:selectedTagIds'])

const localKeyword = ref(props.keyword)
const localCategory = ref(props.selectedCategory)
const localTags = ref(props.selectedTagIds)

const stripHtml = (value) => value?.toString().replace(/<[^>]*>/g, ' ') || ''
const normalizeText = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
const accentPalette = ['#f97316', '#14b8a6', '#0ea5e9', '#f59e0b', '#84cc16', '#f43f5e']

const resolveAccent = (note, index) => {
  const raw = note?.categoryColor || ''
  if (raw) return raw
  const safeIndex = Number.isInteger(index) ? index : 0
  return accentPalette[safeIndex % accentPalette.length]
}

const maxTagCount = 3
const resolveTagLabel = (tag) => tag?.name || tag?.title || ''
const resolveTags = (note) => {
  const tags = Array.isArray(note?.tags) ? note.tags : []
  return tags.filter((tag) => resolveTagLabel(tag))
}
const resolveDisplayTags = (note) => resolveTags(note).slice(0, maxTagCount)
const resolveExtraTags = (note) => {
  const extra = resolveTags(note).length - maxTagCount
  return extra > 0 ? extra : 0
}

const resolvePreview = (note) => {
  const preview = normalizeText(note?.preview).trim()
  if (preview) return preview
  const raw = normalizeText(note?.contentJson ?? note?.content)
  const text = stripHtml(raw).replace(/\s+/g, ' ').trim()
  return text || '无内容'
}

const filteredNotes = computed(() => {
  const list = Array.isArray(props.notes) ? props.notes : []
  const keyword = localKeyword.value?.trim().toLowerCase() || ''
  if (!keyword) return list

  return list.filter((note) => {
    const title = (note?.title || '').toString().toLowerCase()
    const preview = stripHtml(note?.preview || note?.content || note?.contentJson || '').toLowerCase()
    return title.includes(keyword) || preview.includes(keyword)
  })
})

const emptyDescription = computed(() => {
  if (localKeyword.value?.trim()) return '没有匹配的笔记'
  return '暂无笔记'
})

const handleFilterUpdate = () => {
  emit('update:selectedCategory', localCategory.value)
  emit('update:selectedTagIds', localTags.value)
  emit('filter-change')
}

const formatDate = (ts) => {
  if (!ts) return ''
  const date = new Date(ts)
  const now = new Date()
  return date.toDateString() === now.toDateString() ? format(date, 'HH:mm') : format(date, 'MM-dd')
}

watch(() => props.keyword, (val) => localKeyword.value = val)
watch(() => props.selectedCategory, (val) => localCategory.value = val)
watch(() => props.selectedTagIds, (val) => localTags.value = val)
</script>

<style scoped>
.note-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
  background-color: #f6f0e7;
  background-image:
    radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.05) 1px, transparent 0),
    linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(246, 240, 231, 0.95));
  background-size: 12px 12px, cover;
}

.header {
  padding: 14px 14px 12px;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.45);
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 1;
}

.header :deep(.n-input) {
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
  background: #fffaf0;
}

.header :deep(.n-input__border) { border: none; }
.header :deep(.n-input__input-el) { font-size: 12px; }

.filters {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.filter-select { min-width: 0; }

.filter-select :deep(.n-base-selection) {
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
  background: #fffaf0;
}

.filter-select :deep(.n-base-selection__border) { border: none; }

.list-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 12px 12px 16px;
  scrollbar-gutter: stable;
}

.list-container::-webkit-scrollbar {
  width: 8px;
}

.list-container::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.4);
  border-radius: 999px;
}

.list-container::-webkit-scrollbar-track {
  background: transparent;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state { margin: 40px 0; }

.note-item {
  padding: 18px 16px 14px 22px;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
  position: relative;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 250, 240, 0.9)),
    repeating-linear-gradient(
      180deg,
      rgba(15, 23, 42, 0.03) 0,
      rgba(15, 23, 42, 0.03) 1px,
      transparent 1px,
      transparent 24px
    );
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 10px 18px rgba(30, 41, 59, 0.08);
  overflow: hidden;
}

.note-item::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 14px;
  bottom: 14px;
  width: 5px;
  border-radius: 999px;
  background: var(--note-accent, #f97316);
  box-shadow: 0 0 0 6px rgba(249, 115, 22, 0.12);
  opacity: 0.95;
}

.note-item::after {
  content: '';
  position: absolute;
  top: -6px;
  right: 18px;
  width: 60px;
  height: 18px;
  border-radius: 6px;
  background: var(--note-accent, #f97316);
  opacity: 0.25;
  transform: rotate(-2deg);
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.12);
}

.note-item:hover {
  transform: translateY(-2px) rotate(-0.2deg);
  box-shadow: 0 16px 28px rgba(30, 41, 59, 0.14);
  border-color: rgba(15, 23, 42, 0.12);
}

.note-item.active {
  border-color: var(--note-accent, #f97316);
  box-shadow: 0 18px 34px rgba(30, 41, 59, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(255, 245, 230, 0.95)),
    repeating-linear-gradient(
      180deg,
      rgba(15, 23, 42, 0.04) 0,
      rgba(15, 23, 42, 0.04) 1px,
      transparent 1px,
      transparent 24px
    );
}

.note-title {
  font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-preview {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 12px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.9em;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.time {
  font-size: 11px;
  color: #475569;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
}

.note-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  max-width: 70%;
}

.badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(255, 255, 255, 0.7);
  color: #475569;
  line-height: 1;
  white-space: nowrap;
}

.badge-category {
  border-color: var(--note-accent, #f97316);
  color: var(--note-accent, #f97316);
  background: rgba(255, 255, 255, 0.85);
}

.badge-tag { border-style: dashed; }

.badge-more {
  border-style: dotted;
  background: rgba(15, 23, 42, 0.08);
  color: #64748b;
}
</style>
