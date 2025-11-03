<template>
  <div class="note-editor">
    <div class="note-editor__header">
      <el-input v-model="localNote.title" placeholder="输入标题" size="large" />
      <div class="note-editor__actions" v-if="showActions">
        <el-button :disabled="loading" @click="emit('cancel')">取消</el-button>
        <el-popconfirm title="确定要删除这条笔记吗？" @confirm="handleDelete" v-if="localNote.id">
          <template #reference>
            <el-button type="danger" :disabled="loading">删除</el-button>
          </template>
        </el-popconfirm>
        <el-button type="primary" :loading="loading" @click="handleSave">保存</el-button>
      </div>
    </div>
    <el-input
      v-model="localNote.content"
      type="textarea"
      :autosize="{ minRows: 12, maxRows: 30 }"
      placeholder="记录灵感、想法或待办事项..."
    />
    <div class="note-editor__footer">
      <el-select
        v-model="localNote.tags"
        multiple
        filterable
        allow-create
        default-first-option
        placeholder="添加标签"
        class="note-editor__tag-select"
        @change="handleTagsChange"
      >
        <el-option
          v-for="tag in availableTags"
          :key="tag"
          :label="tag"
          :value="tag"
        />
      </el-select>
      <span class="note-editor__timestamp">{{ lastUpdated }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import dayjs from 'dayjs';

const props = defineProps({
  note: {
    type: Object,
    required: true
  },
  availableTags: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  showActions: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['save', 'delete', 'cancel', 'update:tags']);

const localNote = reactive({
  id: null,
  title: '',
  content: '',
  tags: []
});

watch(
  () => props.note,
  (note) => {
    Object.assign(localNote, {
      id: note?.id ?? null,
      title: note?.title ?? '',
      content: note?.content ?? '',
      tags: [...(note?.tags ?? [])]
    });
  },
  { immediate: true, deep: true }
);

const lastUpdated = computed(() => {
  if (!props.note?.updated_at) return '从未保存';
  return `最后更新：${dayjs(props.note.updated_at).format('YYYY-MM-DD HH:mm')}`;
});

const handleSave = () => {
  emit('save', { ...localNote });
};

const handleDelete = () => {
  emit('delete', localNote.id);
};

const handleTagsChange = (value) => {
  emit('update:tags', value);
};
</script>

<style scoped lang="scss">
.note-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  height: calc(100vh - 120px);

  &__header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: center;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  &__tag-select {
    min-width: 260px;
  }

  &__timestamp {
    color: var(--el-text-color-secondary);
  }
}
</style>
