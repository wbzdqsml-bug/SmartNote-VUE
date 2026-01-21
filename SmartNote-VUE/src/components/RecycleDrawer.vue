<!--
  文件说明：通用业务组件（RecycleDrawer）
  - 主要职责：承载可复用的业务 UI 与交互逻辑，供多个页面组合。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <n-drawer :show="show" placement="right" width="420" @update:show="$emit('update:show', $event)">
    <n-drawer-content title="回收站" closable>
      <div class="toolbar">
        <n-button size="small" @click="load">刷新</n-button>
        <n-button
          size="small"
          type="primary"
          ghost
          :disabled="!selectedRowKeys.length"
          @click="handleRestore"
        >
          恢复选中
        </n-button>
        <n-popconfirm
          v-if="selectedRowKeys.length"
          positive-text="删除"
          negative-text="取消"
          @positive-click="handleDelete"
        >
          <template #trigger>
            <n-button size="small" type="error" tertiary>彻底删除</n-button>
          </template>
          删除后无法恢复，确定继续？
        </n-popconfirm>
      </div>

      <n-data-table
        :columns="columns"
        :data="notes"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row) => row.id"
        :checked-row-keys="selectedRowKeys"
        @update:checked-row-keys="(keys) => (selectedRowKeys = keys)"
        checkable
      />
    </n-drawer-content>
  </n-drawer>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import {
  NDrawer,
  NDrawerContent,
  NButton,
  NPopconfirm,
  NDataTable
} from 'naive-ui'
import recycleApi from '@/api/recycle'
import { format } from 'date-fns'
import { useMessage } from 'naive-ui'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:show'])

const message = useMessage()

const notes = ref([])
const loading = ref(false)
const selectedRowKeys = ref([])

const pagination = {
  pageSize: 6
}

const normaliseId = (value) => {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return Number.isNaN(num) ? value : num
}

const normaliseRecycleNote = (raw) => {
  if (!raw || typeof raw !== 'object') return null
  const id = normaliseId(raw.id ?? raw.noteId ?? raw.noteID ?? raw.NoteId ?? raw.NoteID)
  const typeValue = Number.isInteger(raw.type) ? raw.type : Number(raw.type ?? raw.Type ?? 0)
  const resolvedType = Number.isNaN(typeValue) ? 0 : typeValue
  const deletedAt =
    raw.deletedAt ||
    raw.deletedTime ||
    raw.DeletedTime ||
    raw.deleted_time ||
    raw.deleted_at ||
    null

  return {
    ...raw,
    id,
    title: raw.title ?? raw.Title ?? raw.name ?? raw.Name ?? '',
    type: resolvedType,
    deletedAt
  }
}

const columns = [
  { type: 'selection' },
  {
    title: '标题',
    key: 'title'
  },
  {
    title: '删除时间',
    key: 'deletedAt',
    render(row) {
      return formatTime(row.deletedAt || row.deletedTime || row.DeletedTime || row.updateTime)
    }
  }
]

const load = async () => {
  loading.value = true
  try {
    const { data } = await recycleApi.list()
    const raw = data?.data ?? data ?? []
    notes.value = (Array.isArray(raw) ? raw : []).map(normaliseRecycleNote).filter(Boolean)
  } catch (error) {
    message.error(error?.response?.data?.message || '获取回收站失败')
  } finally {
    loading.value = false
  }
}

const handleRestore = async () => {
  if (!selectedRowKeys.value.length) return
  try {
    await recycleApi.restore(selectedRowKeys.value)
    message.success('恢复成功')
    selectedRowKeys.value = []
    load()
  } catch (error) {
    message.error(error?.response?.data?.message || '恢复失败')
  }
}

const handleDelete = async () => {
  if (!selectedRowKeys.value.length) return
  try {
    await recycleApi.remove(selectedRowKeys.value)
    message.success('已永久删除')
    selectedRowKeys.value = []
    load()
  } catch (error) {
    message.error(error?.response?.data?.message || '删除失败')
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

watch(
  () => props.show,
  (val) => {
    if (val) {
      load()
    } else {
      selectedRowKeys.value = []
    }
  }
)

onMounted(() => {
  if (props.show) {
    load()
  }
})
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
