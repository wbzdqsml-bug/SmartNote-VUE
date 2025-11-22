<template>
  <n-card class="note-editor" :bordered="false">
    <template v-if="note">
      <div class="title-row">
        <n-input
          v-model:value="localNote.title"
          size="large"
          placeholder="请输入笔记标题"
          class="title-input"
        />
        <div class="type-actions">
          <n-tag type="info" size="medium">{{ currentTypeLabel }}</n-tag>
          <n-button type="primary" strong size="small" :loading="saving" @click="handleSave">
            保存
          </n-button>
        </div>
      </div>

      <div class="control-row grouped">
        <div class="control-block">
          <span class="control-label">分类</span>
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

        <div class="control-block">
          <span class="control-label">标签</span>
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
      </div>

      <!-- ✅ 元信息行，增加上下间距 -->
      <div class="meta-row">
        <span>创建时间：{{ formatTime(note.createdAt || note.createTime) }}</span>
        <span>最近更新：{{ formatTime(note.updateTime || note.lastUpdateTime) }}</span>
      </div>

      <!-- ✅ 编辑器主体区 -->
      <component :is="currentEditor" v-model="localNote.content" class="dynamic-editor" />

      <div class="footer">
        <n-button tertiary type="error" @click="emit('soft-delete', note.id)">移入回收站</n-button>
      </div>
    </template>

    <template v-else>
      <n-empty description="请选择左侧的笔记" />
    </template>
  </n-card>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  NCard,
  NInput,
  NButton,
  NTag,
  NEmpty,
  NSelect,
  NColorPicker,
  useMessage
} from 'naive-ui'
import { format } from 'date-fns'
import { noteTypeMap, defaultContentByType } from '@/constants/noteTypes'
import MarkdownEditor from '@/components/editors/MarkdownEditor.vue'
import CanvasBoard from '@/components/editors/CanvasBoard.vue'
import MindMapEditor from '@/components/editors/MindMapEditor.vue'
import RichTextEditor from '@/components/editors/RichTextEditor.vue'
import noteApi from '@/api/note'
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

const editorMap = {
  0: MarkdownEditor,
  1: CanvasBoard,
  2: MindMapEditor,
  3: RichTextEditor
}

const localNote = reactive({
  id: null,
  title: '',
  content: '',
  type: 0,
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

const resolveResponse = (response, fallback = []) => {
  if (!response) return fallback
  const data = response.data ?? fallback
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data ?? fallback
  }
  return data ?? fallback
}

const normaliseId = (value) => {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return Number.isNaN(num) ? value : num
}

const categoryDisplay = computed(() => {
  const id = localNote.categoryId
  if (id === null || id === undefined || id === '') return null
  const matched = (categoryStore.categories || []).find((item) => String(item.id) === String(id))
  if (matched) {
    return { label: matched.name || `分类 #${matched.id}`, color: matched.color || '', value: id }
  }
  const fallbackOption = categoryOptions.value.find((item) => String(item.value) === String(id))
  if (fallbackOption) {
    return { label: fallbackOption.label, color: fallbackOption.color || '', value: id }
  }
  return null
})

const tagDetails = computed(() => {
  const ids = Array.isArray(localNote.tagIds) ? localNote.tagIds : []
  return ids.map((id) => {
    const matched = (tagStore.tags || []).find((item) => String(item.id) === String(id))
    if (matched) return matched
    const option = tagOptions.value.find((item) => String(item.value) === String(id))
    if (option) return { id: option.value, name: option.label, color: option.color || '' }
    return { id, name: `标签 #${id}`, color: '' }
  })
})

const ensureCategoryOptions = async (force = false) => {
  try {
    await categoryStore.loadCategories(force)
  } catch (error) {
    console.error('[NoteEditor] ensureCategoryOptions error:', error)
  }
}

const ensureTagOptions = async (force = false) => {
  try {
    await tagStore.loadTags(force)
  } catch (error) {
    console.error('[NoteEditor] ensureTagOptions error:', error)
  }
}

const mergeTagsToStore = (list) => {
  if (!Array.isArray(list) || !list.length) return
  const existing = new Set((tagStore.tags || []).map((item) => String(item.id)))
  const additions = list
    .map((item) => {
      const id = normaliseId(item.id ?? item.tagId ?? item.TagId)
      if (id === null || id === undefined) return null
      return {
        id,
        name: item.name || item.title || `标签 #${id}`,
        color: item.color || ''
      }
    })
    .filter(Boolean)
    .filter((item) => !existing.has(String(item.id)))
  if (additions.length) {
    tagStore.tags = [...tagStore.tags, ...additions]
  }
}

const currentEditor = computed(() => editorMap[localNote.type] || MarkdownEditor)
const currentTypeLabel = computed(() => noteTypeMap[localNote.type] || '笔记')

watch(
  () => props.note,
  async (value) => {
    if (!value) {
      localNote.id = null
      localNote.title = ''
      localNote.content = ''
      localNote.type = 0
      localNote.categoryId = null
      localNote.tagIds = []
      showCategoryPicker.value = false
      showTagPicker.value = false
      tagPickerValue.value = []
      tagsDirty.value = false
      newCategoryName.value = ''
      newCategoryColor.value = '#FF9933'
      newTagName.value = ''
      newTagColor.value = '#00AAFF'
      return
    }

    const noteType = typeof value.type === 'number' ? value.type : Number(value.type ?? 0)
    const resolvedType = Number.isNaN(noteType) ? 0 : noteType
    const targetId = value.id

    localNote.id = targetId
    localNote.title = value.title || ''
    localNote.type = resolvedType
    localNote.content =
      value.contentJson ?? value.content ?? defaultContentByType[resolvedType] ?? ''
    localNote.categoryId = normaliseId(value.categoryId ?? value.CategoryId ?? null)
    const incomingTags = Array.isArray(value.tags) ? value.tags : []
    mergeTagsToStore(incomingTags)
    localNote.tagIds = Array.isArray(value.tagIds)
      ? value.tagIds
          .map((item) => normaliseId(item))
          .filter((id) => id !== null && id !== undefined)
      : incomingTags
          .map((item) => normaliseId(item.id ?? item.tagId ?? item.TagId))
          .filter((id) => id !== null && id !== undefined)
    tagPickerValue.value = [...localNote.tagIds]
    showCategoryPicker.value = false
    showTagPicker.value = false
    tagsDirty.value = false
    newCategoryName.value = ''
    newCategoryColor.value = '#FF9933'
    newTagName.value = ''
    newTagColor.value = '#00AAFF'

    await Promise.all([ensureCategoryOptions(), ensureTagOptions()])
  },
  { immediate: true }
)

const updateCategory = async (value) => {
  if (!localNote.id) return
  localNote.categoryId = value ?? null
  try {
    await noteApi.update(localNote.id, {
      title: localNote.title,
      contentJson: localNote.content,
      content: localNote.content,
      categoryId: value ?? null
    })
    message.success('分类已更新')
    showCategoryPicker.value = false
  } catch (error) {
    console.error('[NoteEditor] updateCategory error:', error)
    message.error(error?.response?.data?.message || '更新分类失败，请稍后重试。')
  }
}

const handleSelectCategory = async (value) => {
  await updateCategory(value)
}

const toggleCategoryPicker = () => {
  showCategoryPicker.value = true
}

const handleCreateCategory = async () => {
  const name = newCategoryName.value.trim()
  if (!name) {
    message.warning('请输入分类名称')
    return
  }
  if (creatingCategory.value) return
  creatingCategory.value = true
  try {
    const created = await categoryStore.createCategory({
      name,
      color: newCategoryColor.value || ''
    })
    const id = normaliseId(created?.id ?? created?.categoryId ?? created?.CategoryId)
    if (id !== null && id !== undefined) {
      localNote.categoryId = id
      showCategoryPicker.value = false
      message.success('分类已创建并已选中')
    }
    await ensureCategoryOptions(true)
  } catch (error) {
    console.error('[NoteEditor] handleCreateCategory error:', error)
    message.error(error?.response?.data?.message || '创建分类失败，请稍后重试。')
  } finally {
    newCategoryName.value = ''
    newCategoryColor.value = '#FF9933'
    creatingCategory.value = false
  }
}

const normaliseTagList = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item) => normaliseId(item))
    .filter((id) => id !== null && id !== undefined)

const isSameTagList = (a = [], b = []) => {
  if (a.length !== b.length) return false
  return a.every((item, index) => String(item) === String(b[index]))
}

const handleSelectTags = (value) => {
  const next = normaliseTagList(value)
  const current = normaliseTagList(localNote.tagIds)
  tagPickerValue.value = [...next]
  if (isSameTagList(current, next)) {
    showTagPicker.value = false
    return
  }
  localNote.tagIds = next
  tagsDirty.value = true
  showTagPicker.value = false
}

const toggleTagPicker = () => {
  showTagPicker.value = true
}

const removeTag = (tagId) => {
  const next = (Array.isArray(localNote.tagIds) ? localNote.tagIds : []).filter(
    (id) => String(id) !== String(tagId)
  )
  if (isSameTagList(localNote.tagIds, next)) return
  tagPickerValue.value = [...next]
  localNote.tagIds = next
  tagsDirty.value = true
}

const handleCreateTag = async () => {
  const name = newTagName.value.trim()
  if (!name) {
    message.warning('请输入标签名称')
    return
  }
  if (creatingTag.value) return
  creatingTag.value = true
  try {
    const created = await tagStore.createTag({ name, color: newTagColor.value || '' })
    const id = normaliseId(created?.id ?? created?.tagId ?? created?.TagId)
    if (id !== null && id !== undefined) {
      const next = normaliseTagList([...localNote.tagIds, id])
      localNote.tagIds = next
      tagPickerValue.value = [...next]
      tagsDirty.value = true
      showTagPicker.value = false
      message.success('标签已创建并已选中')
    }
    await ensureTagOptions(true)
  } catch (error) {
    console.error('[NoteEditor] handleCreateTag error:', error)
    message.error(error?.response?.data?.message || '创建标签失败，请稍后重试。')
  } finally {
    newTagName.value = ''
    newTagColor.value = '#00AAFF'
    creatingTag.value = false
  }
}

const payload = computed(() => ({
  title: localNote.title,
  content: localNote.content,
  contentJson: localNote.content,
  categoryId: localNote.categoryId ?? null,
  tagIds: Array.isArray(localNote.tagIds) ? [...localNote.tagIds] : []
}))

const handleSave = () => {
  if (!localNote.id) return
  emit('update-note', { id: localNote.id, payload: payload.value, tagsChanged: tagsDirty.value })
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
.note-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 16px 18px 14px;
  box-sizing: border-box;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.title-input :deep(.n-input__input-el) {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.type-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-row.grouped {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-label {
  font-size: 12px;
  color: #6b7280;
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

/* ✅ 调整 meta-row 的上下间距与字体 */
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  color: #6b7280;
  font-size: 13px;
  margin: 8px 0 10px; /* 增加上下间距，防止与其他元素重叠 */
  line-height: 1.5;
}

/* ✅ 编辑器占据剩余空间 */
.dynamic-editor {
  flex: 1;
  min-height: 360px;
  overflow: auto;
  padding: 8px 0;
}

.footer {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 12px;
}

.footer :deep(.n-button) {
  min-width: 120px;
}
</style>
