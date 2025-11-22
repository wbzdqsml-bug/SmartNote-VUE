<template>
  <n-modal
    v-model:show="show"
    preset="card"
    title="新建笔记"
    :mask-closable="false"
    style="max-width: 540px"
  >
    <n-form :model="form" label-placement="left" label-width="84">
      <n-form-item label="标题">
        <n-input v-model:value="form.title" placeholder="请输入笔记标题" />
      </n-form-item>
      <n-form-item label="类型">
        <n-select v-model:value="form.type" :options="typeOptions" />
      </n-form-item>
      <n-form-item label="工作区">
        <n-select
          v-model:value="form.workspaceId"
          :options="workspaceOptions"
          :loading="workspaceLoading"
          placeholder="请选择所属工作区"
          clearable
        />
      </n-form-item>
      <n-form-item label="分类">
        <n-space align="center">
          <n-select
            v-model:value="form.categoryId"
            :options="categoryOptions"
            placeholder="选择分类"
            clearable
            filterable
            style="width: 260px"
          />
          <n-button text type="primary" size="small" @click="openCreateCategory">
            创建分类
          </n-button>
        </n-space>
      </n-form-item>
      <n-form-item label="标签">
        <n-space vertical :size="8">
          <n-select
            v-model:value="form.tagIds"
            multiple
            filterable
            tag
            :options="tagOptions"
            placeholder="选择标签"
            clearable
            style="width: 320px"
            :on-create="handleTagCreateRequest"
          />
          <n-button text size="small" type="primary" @click="openCreateTag">
            创建标签
          </n-button>
        </n-space>
      </n-form-item>
    </n-form>
    <template #action>
      <n-space justify="end">
        <n-button @click="emit('update:show', false)">取消</n-button>
        <n-button type="primary" :loading="submitting" @click="submitCreate">创建</n-button>
      </n-space>
    </template>
  </n-modal>

  <n-modal v-model:show="categoryModal.visible" preset="dialog" title="创建分类">
    <n-form :model="categoryModal" label-width="72">
      <n-form-item label="名称">
        <n-input v-model:value="categoryModal.name" placeholder="请输入分类名称" />
      </n-form-item>
      <n-form-item label="颜色">
        <n-space align="center">
          <n-color-picker v-model:value="categoryModal.color" size="small" />
          <n-input v-model:value="categoryModal.color" style="width: 140px" />
        </n-space>
      </n-form-item>
    </n-form>
    <template #action>
      <n-space justify="end">
        <n-button @click="closeCategoryModal">取消</n-button>
        <n-button type="primary" :loading="categoryModal.loading" @click="submitCreateCategory">
          确认创建
        </n-button>
      </n-space>
    </template>
  </n-modal>

  <n-modal v-model:show="tagModal.visible" preset="dialog" title="创建标签">
    <n-form :model="tagModal" label-width="72">
      <n-form-item label="名称">
        <n-input v-model:value="tagModal.name" placeholder="请输入标签名称" />
      </n-form-item>
      <n-form-item label="颜色">
        <n-space align="center">
          <n-color-picker v-model:value="tagModal.color" size="small" />
          <n-input v-model:value="tagModal.color" style="width: 140px" />
        </n-space>
      </n-form-item>
    </n-form>
    <template #action>
      <n-space justify="end">
        <n-button @click="cancelCreateTag">取消</n-button>
        <n-button type="primary" :loading="tagModal.loading" @click="submitCreateTag">
          确认创建
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NButton,
  NColorPicker,
  useMessage
} from 'naive-ui'
import noteApi from '@/api/note'
import { noteTypeOptions, defaultContentByType } from '@/constants/noteTypes'
import { useCategoryStore } from '@/store/categoryStore'
import { useTagStore } from '@/store/tagStore'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  workspaceOptions: {
    type: Array,
    default: () => []
  },
  workspaceLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show', 'created'])

const message = useMessage()
const categoryStore = useCategoryStore()
const tagStore = useTagStore()

const typeOptions = noteTypeOptions

const categoryOptions = computed(() => categoryStore.options)
const tagOptions = computed(() => tagStore.options)

const form = reactive({
  title: '',
  type: typeOptions[0]?.value ?? 0,
  workspaceId: null,
  categoryId: null,
  tagIds: []
})

const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const submitting = ref(false)

const categoryModal = reactive({
  visible: false,
  name: '',
  color: '#FF9933',
  loading: false
})

const tagModal = reactive({
  visible: false,
  name: '',
  color: '#00AAFF',
  loading: false
})

let pendingTagResolver = null

const resetForm = () => {
  form.title = ''
  form.type = typeOptions[0]?.value ?? 0
  form.categoryId = null
  form.tagIds = []
  if (props.workspaceOptions?.length) {
    form.workspaceId = props.workspaceOptions[0].value
  } else {
    form.workspaceId = null
  }
}

const ensureOptions = async () => {
  try {
    await Promise.all([categoryStore.loadCategories(), tagStore.loadTags()])
  } catch (error) {
    console.error('[AddNoteModal] ensureOptions error:', error)
  }
}

watch(
  () => props.show,
  async (visible) => {
    if (visible) {
      resetForm()
      await ensureOptions()
    }
  }
)

watch(
  () => props.workspaceOptions,
  (options) => {
    if (show.value && Array.isArray(options) && options.length && !form.workspaceId) {
      form.workspaceId = options[0].value
    }
  },
  { deep: true }
)

const closeCategoryModal = () => {
  categoryModal.visible = false
  categoryModal.name = ''
}

const openCreateCategory = () => {
  categoryModal.visible = true
  categoryModal.name = ''
  categoryModal.color = categoryModal.color || '#FF9933'
}

const submitCreateCategory = async () => {
  if (!categoryModal.name.trim()) {
    message.warning('请输入分类名称')
    return
  }
  categoryModal.loading = true
  try {
    await categoryStore.createCategory({
      name: categoryModal.name.trim(),
      color: categoryModal.color
    })
    await categoryStore.loadCategories(true)
    const matched = categoryStore.categories.find(
      (item) => item.name === categoryModal.name.trim()
    )
    if (matched) form.categoryId = matched.id
    message.success('分类已创建')
    closeCategoryModal()
  } catch (error) {
    console.error('[AddNoteModal] submitCreateCategory error:', error)
    message.error(error?.response?.data?.message || '创建分类失败，请稍后重试。')
  } finally {
    categoryModal.loading = false
  }
}

const openCreateTag = () => {
  tagModal.visible = true
  tagModal.name = ''
  tagModal.color = tagModal.color || '#00AAFF'
  pendingTagResolver = null
}

const handleTagCreateRequest = (label) => {
  const name = (label || '').trim()
  if (!name) return null
  const existing = tagStore.tags.find((item) => item.name === name)
  if (existing) {
    return { label: existing.name, value: existing.id }
  }
  tagModal.name = name
  tagModal.visible = true
  return new Promise((resolve) => {
    pendingTagResolver = resolve
  })
}

const cancelCreateTag = () => {
  if (pendingTagResolver) {
    pendingTagResolver(null)
    pendingTagResolver = null
  }
  tagModal.visible = false
}

const submitCreateTag = async () => {
  if (!tagModal.name.trim()) {
    message.warning('请输入标签名称')
    return
  }
  tagModal.loading = true
  const resolver = pendingTagResolver
  try {
    await tagStore.createTag({
      name: tagModal.name.trim(),
      color: tagModal.color
    })
    await tagStore.loadTags(true)
    const matched = tagStore.tags.find((item) => item.name === tagModal.name.trim())
    const createdId = matched?.id
    message.success('标签已创建')
    if (createdId) {
      const option = { label: matched.name, value: createdId }
      if (resolver) {
        resolver(option)
      } else {
        form.tagIds = Array.from(new Set([...(form.tagIds || []), createdId]))
      }
    } else if (resolver) {
      resolver(null)
    }
    tagModal.visible = false
  } catch (error) {
    console.error('[AddNoteModal] submitCreateTag error:', error)
    message.error(error?.response?.data?.message || '创建标签失败，请稍后重试。')
    if (resolver) resolver(null)
  } finally {
    pendingTagResolver = null
    tagModal.loading = false
  }
}

const submitCreate = async () => {
  if (!form.title.trim()) {
    message.warning('请输入笔记标题')
    return
  }
  if (!form.workspaceId) {
    message.warning('请选择笔记所属的工作区')
    return
  }
  submitting.value = true
  try {
    const payload = {
      workspaceId: form.workspaceId,
      title: form.title.trim(),
      type: form.type,
      contentJson: defaultContentByType[form.type] || '',
      categoryId: form.categoryId ?? null,
      tagIds: Array.isArray(form.tagIds) ? form.tagIds : []
    }
    const response = await noteApi.create(payload)
    const data = response?.data?.data ?? response?.data ?? {}
    const newId = data?.noteId ?? data?.id
    message.success('新建笔记成功')
    emit('update:show', false)
    emit('created', newId)
  } catch (error) {
    console.error('[AddNoteModal] submitCreate error:', error)
    message.error(error?.response?.data?.message || '新建笔记失败，请稍后重试。')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
:deep(.n-modal-mask) {
  @apply bg-black/30 backdrop-blur-sm;
}

:deep(.n-card) {
  @apply w-[500px] bg-white border border-gray-200 shadow-sm rounded-2xl;
}

:deep(.n-card-header__main) {
  @apply text-xl font-bold text-gray-900 mb-2;
}

:deep(.n-card__content) {
  @apply space-y-3;
}

:deep(.n-card__action) {
  @apply pt-2;
}

.grad-btn {
  @apply bg-gray-900 text-white rounded-xl shadow-sm hover:shadow;
}

.ghost-btn {
  @apply bg-transparent border border-gray-300 text-gray-800 rounded-xl hover:bg-gray-100 transition-all;
}
</style>
