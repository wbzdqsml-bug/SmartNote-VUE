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
      return formatTime(row.deletedAt || row.updateTime)
    }
  }
]

const load = async () => {
  loading.value = true
  try {
    const { data } = await recycleApi.list()
    notes.value = data?.data || data || []
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
