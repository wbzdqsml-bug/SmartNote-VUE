<template>
  <div class="note-preview" v-if="note">
    <div class="note-preview__header">
      <h2>{{ note.title || '未命名笔记' }}</h2>
      <div class="note-preview__meta">
        <el-tag v-for="tag in note.tags" :key="tag" size="small" type="info">{{ tag }}</el-tag>
        <span>最后更新：{{ formatDate(note.updated_at) }}</span>
      </div>
      <div class="note-preview__actions">
        <el-button type="primary" @click="emit('edit', note)">编辑</el-button>
        <el-popconfirm title="确定要删除这条笔记吗？" @confirm="emit('delete', note.id)">
          <template #reference>
            <el-button type="danger">删除</el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>
    <el-scrollbar class="note-preview__content">
      <p v-if="!note.content" class="note-preview__empty">暂无内容</p>
      <div v-else v-html="formattedContent"></div>
    </el-scrollbar>
  </div>
  <el-empty v-else description="选择一条笔记开始" />
</template>

<script setup>
import { computed } from 'vue';
import DOMPurify from 'dompurify';
import dayjs from 'dayjs';

const props = defineProps({
  note: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['edit', 'delete']);

const formattedContent = computed(() => {
  if (!props.note?.content) return '';
  const paragraphs = props.note.content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line}</p>`)
    .join('');
  return DOMPurify.sanitize(paragraphs);
});

const formatDate = (value) => {
  if (!value) return '刚刚';
  return dayjs(value).format('YYYY-MM-DD HH:mm');
};
</script>

<style scoped lang="scss">
.note-preview {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  padding: 24px;
  gap: 16px;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 8px;

    h2 {
      margin: 0;
      font-size: 24px;
    }
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    color: var(--el-text-color-secondary);
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__content {
    flex: 1;
    padding-right: 8px;
  }

  &__empty {
    color: var(--el-text-color-secondary);
    font-style: italic;
  }
}
</style>
