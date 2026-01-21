<!--
  文件说明：任务组件（TaskEditModal）
  - 主要职责：提供任务卡片/列/弹窗等看板子组件能力。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <n-modal v-model:show="visible" preset="card" title="任务信息" class="task-modal">
    <n-form :model="form" label-placement="top">
      <n-form-item label="任务标题">
        <n-input v-model:value="form.title" placeholder="请输入标题" />
      </n-form-item>
      <n-form-item label="任务描述">
        <n-input
          v-model:value="form.description"
          type="textarea"
          placeholder="描述一下任务目标"
          :autosize="{ minRows: 3 }"
        />
      </n-form-item>
      <n-form-item label="状态">
        <n-select v-model:value="form.status" :options="statusOptions" />
      </n-form-item>
      <div class="date-row">
        <n-form-item label="开始时间">
          <n-date-picker v-model:value="form.startAt" type="datetime" clearable />
        </n-form-item>
        <n-form-item label="截止时间">
          <n-date-picker v-model:value="form.dueAt" type="datetime" clearable />
        </n-form-item>
      </div>
    </n-form>
    <div class="modal-actions">
      <n-button @click="handleCancel">取消</n-button>
      <n-button type="primary" @click="handleSubmit">保存</n-button>
    </div>
  </n-modal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSelect, NDatePicker, NButton } from 'naive-ui'

const props = defineProps({
  show: Boolean,
  task: {
    type: Object,
    default: () => ({})
  },
  statusOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:show', 'submit'])

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const form = reactive({
  title: '',
  description: '',
  status: 'Todo',
  startAt: null,
  dueAt: null
})

watch(
  () => props.task,
  (task) => {
    form.title = task?.title ?? ''
    form.description = task?.description ?? ''
    form.status = task?.status ?? 'Todo'
    form.startAt = task?.startAt ? new Date(task.startAt).getTime() : null
    form.dueAt = task?.dueAt ? new Date(task.dueAt).getTime() : null
  },
  { immediate: true }
)

const handleCancel = () => {
  visible.value = false
}

const handleSubmit = () => {
  emit('submit', {
    title: form.title,
    description: form.description,
    status: form.status,
    startAt: form.startAt,
    dueAt: form.dueAt
  })
}
</script>

<style scoped>
.task-modal {
  max-width: 520px;
}

.date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
</style>
