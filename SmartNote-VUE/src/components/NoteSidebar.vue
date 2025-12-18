<template>
  <div class="note-sidebar" v-bind="$attrs">
    <div v-if="note">
      <div class="sidebar-section">
        <h3 class="section-title">分类</h3>
        <div class="control-content">
            <n-tag
              v-if="categoryDisplay"
              size="small"
              round
              closable
              :bordered="false"
              @close="updateCategory(null)"
            >
              <span
                class="category-dot"
                :style="{ backgroundColor: categoryDisplay.color || '#64748b' }"
              ></span>
              {{ categoryDisplay.label }}
            </n-tag>
            <span v-else class="placeholder">未选择</span>
            <n-button
              v-if="!categoryDisplay"
              quaternary
              size="tiny"
              type="primary"
              @click="toggleCategoryPicker"
            >
              + 添加
            </n-button>
            <n-select
              v-if="showCategoryPicker && !categoryDisplay"
              size="small"
              v-model:value="localNote.categoryId"
              :options="categoryOptions"
              placeholder="选择分类"
              style="width: 200px"
              clearable
              @update:value="handleSelectCategory"
              @blur="showCategoryPicker = false"
            />
            <div v-if="showCategoryPicker && !categoryDisplay" class="inline-create">
              <n-color-picker v-model:value="newCategoryColor" size="small" :modes="['hex']" />
              <n-input
                size="small"
                v-model:value="newCategoryName"
                placeholder="新建分类名称"
                style="width: 200px"
              />
              <n-button size="tiny" type="primary" :loading="creatingCategory" @click="handleCreateCategory">
                新建分类
              </n-button>
            </div>
          </div>
      </div>

      <div class="sidebar-section">
        <h3 class="section-title">标签</h3>
        <div class="control-content tags-content">
            <div class="tag-chip-row" v-if="tagDetails.length">
              <n-tag
                v-for="tag in tagDetails"
                :key="tag.id"
                size="small"
                round
                closable
                :bordered="false"
                @close="removeTag(tag.id)"
              >
                {{ tag.name }}
              </n-tag>
            </div>
            <n-select
              v-if="showTagPicker"
              size="small"
              v-model:value="tagPickerValue"
              multiple
              filterable
              :options="tagOptions"
              placeholder="添加标签"
              style="width: 260px"
              clearable
              @update:value="handleSelectTags"
              @blur="showTagPicker = false"
            />
            <div v-if="showTagPicker" class="inline-create">
              <n-color-picker v-model:value="newTagColor" size="small" :modes="['hex']" />
              <n-input
                size="small"
                v-model:value="newTagName"
                placeholder="新建标签名称"
                style="width: 200px"
              />
              <n-button size="tiny" type="primary" :loading="creatingTag" @click="handleCreateTag">
                新建标签
              </n-button>
            </div>
            <n-button
              quaternary
              size="tiny"
              type="primary"
              @click="toggleTagPicker"
            >
              + 添加
            </n-button>
            <span v-if="!tagDetails.length" class="placeholder">未选择</span>
          </div>
      </div>

      <div class="sidebar-section">
        <h3 class="section-title">信息</h3>
        <div class="meta-grid">
          <div class="meta-label">创建时间</div>
          <div class="meta-value">{{ formatTime(note.createdAt || note.createTime) }}</div>

          <div class="meta-label">最近更新</div>
          <div class="meta-value">{{ formatTime(note.updateTime || note.lastUpdateTime) }}</div>
        </div>
      </div>
      
      <div class="sidebar-section footer">
        <n-button tertiary type="error" @click="emit('soft-delete', note.id)">移入回收站</n-button>
      </div>
    </div>
    <div v-else class="empty-state">
      <n-empty size="large" description="未选择笔记" />
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  NButton,
  NTag,
  NEmpty,
  NSelect,
  NColorPicker,
  NInput,
  useMessage
} from 'naive-ui'
import { format } from 'date-fns'
import { useCategoryStore } from '@/store/categoryStore'
import { useTagStore } from '@/store/tagStore'

const props = defineProps({
  note: {
    type: Object,
    default: null
  },
  saving: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update-note', 'soft-delete'])

const message = useMessage()

// A local, reactive copy of the note's metadata
const localNote = reactive({
  id: null,
  title: '',
  content: '',
  categoryId: null,
  tagIds: []
})

const categoryStore = useCategoryStore()
const tagStore = useTagStore()

const categoryOptions = computed(() => categoryStore.options)
const tagOptions = computed(() => tagStore.options)

const showCategoryPicker = ref(false)
const showTagPicker = ref(false)
const tagPickerValue = ref([])
const tagsDirty = ref(false)
const newCategoryName = ref('')
const creatingCategory = ref(false)
const newCategoryColor = ref('#FF9933')
const newTagName = ref('')
const creatingTag = ref(false)
const newTagColor = ref('#00AAFF')

const normaliseId = (value) => {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return Number.isNaN(num) ? value : num
}

watch(
  () => props.note,
  (value) => {
    if (!value) {
      localNote.id = null
      localNote.title = ''
      localNote.content = ''
      localNote.categoryId = null
      localNote.tagIds = []
      tagsDirty.value = false
      return
    }

    // Keep title and content in sync for save payloads
    localNote.id = value.id
    localNote.title = value.title || ''
    localNote.content = value.contentJson ?? value.content ?? ''
    
    localNote.categoryId = normaliseId(value.categoryId ?? null)
    localNote.tagIds = (value.tagIds || []).map(id => normaliseId(id)).filter(Boolean)
    tagPickerValue.value = [...localNote.tagIds]
    tagsDirty.value = false
  },
  { immediate: true, deep: true }
)

const categoryDisplay = computed(() => {
  const id = localNote.categoryId
  if (id === null || id === undefined || id === '') return null
  const matched = categoryStore.categories.find((item) => String(item.id) === String(id))
  return matched ? { label: matched.name, color: matched.color, value: id } : null
})

const tagDetails = computed(() => {
  return (localNote.tagIds || []).map(id => {
    return tagStore.tags.find(item => String(item.id) === String(id)) || { id, name: `Tag #${id}` }
  }).filter(Boolean)
})


const payload = computed(() => ({
  title: localNote.title,
  content: localNote.content,
  contentJson: localNote.content,
  categoryId: localNote.categoryId ?? null,
  tagIds: Array.isArray(localNote.tagIds) ? [...localNote.tagIds] : []
}))

const triggerSave = () => {
  if (!localNote.id) return
  emit('update-note', { id: localNote.id, payload: payload.value, tagsChanged: tagsDirty.value })
  tagsDirty.value = false
}

const updateCategory = async (value) => {
  if (!localNote.id) return
  localNote.categoryId = value ?? null
  tagsDirty.value = true
  triggerSave()
  showCategoryPicker.value = false
}

const handleSelectCategory = async (value) => {
  await updateCategory(value)
}

const toggleCategoryPicker = () => {
  showCategoryPicker.value = !showCategoryPicker.value
}

const handleCreateCategory = async () => {
  const name = newCategoryName.value.trim()
  if (!name) return message.warning('请输入分类名称')
  creatingCategory.value = true
  try {
    const created = await categoryStore.createCategory({ name, color: newCategoryColor.value || '' })
    if (created && created.id) {
      localNote.categoryId = created.id
      message.success('分类已创建并选中')
      tagsDirty.value = true
      triggerSave()
    }
  } finally {
    creatingCategory.value = false
    newCategoryName.value = ''
    showCategoryPicker.value = false
  }
}

const removeTag = (tagId) => {
  localNote.tagIds = localNote.tagIds.filter(id => String(id) !== String(tagId))
  tagPickerValue.value = [...localNote.tagIds]
  tagsDirty.value = true
  triggerSave()
}

const handleSelectTags = (value) => {
  localNote.tagIds = value
  tagPickerValue.value = value
  tagsDirty.value = true
  triggerSave()
  showTagPicker.value = false
}

const toggleTagPicker = () => {
  showTagPicker.value = !showTagPicker.value
}

const handleCreateTag = async () => {
  const name = newTagName.value.trim()
  if (!name) return message.warning('请输入标签名称')
  creatingTag.value = true
  try {
    const created = await tagStore.createTag({ name, color: newTagColor.value || '' })
    if (created && created.id) {
      localNote.tagIds.push(created.id)
      tagPickerValue.value = [...localNote.tagIds]
      message.success('标签已创建并选中')
      tagsDirty.value = true
      triggerSave()
    }
  } finally {
    creatingTag.value = false
    newTagName.value = ''
    showTagPicker.value = false
  }
}

const formatTime = (value) => {
  if (!value) return '--'
  try {
    return format(new Date(value), 'yyyy-MM-dd HH:mm')
  } catch {
    return value
  }
}
</script>

<style scoped>
.note-sidebar {
  height: 100%;
  min-height: 0;
  background: #fff;
  border: 1px solid #eef2f8;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 12px;
}

.control-content {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.control-content.tags-content {
  align-items: flex-start;
}

.tag-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}

.placeholder {
  color: #9ca3af;
  font-size: 12px;
}

.inline-create {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 12px;
  font-size: 13px;
}

.meta-label {
  color: #64748b;
  text-align: right;
}

.meta-value {
  color: #334155;
  font-weight: 500;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}

.footer {
  margin-top: auto;
  display: flex;
}

.footer .n-button {
  width: 100%;
}
</style>
