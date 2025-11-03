<template>
  <div class="note-list">
    <div class="note-list__header">
      <h2>笔记</h2>
      <span class="note-list__count">{{ notes.length }} 条记录</span>
    </div>
    <el-scrollbar class="note-list__scroll">
      <el-skeleton v-if="loading" :rows="6" animated class="note-list__skeleton" />
      <el-empty v-else-if="!notes.length" description="暂无笔记" />
      <el-menu
        v-else
        class="note-list__menu"
        :default-active="activeNoteId"
        @select="onSelect"
        :ellipsis="false"
      >
        <el-menu-item v-for="note in notes" :key="note.id" :index="String(note.id)">
          <div class="note-list__item">
            <div class="note-list__title">{{ note.title || '未命名笔记' }}</div>
            <div class="note-list__meta">
              <span>{{ formatUpdated(note.updated_at) }}</span>
              <el-tag v-for="tag in note.tags" :key="tag" size="small">{{ tag }}</el-tag>
            </div>
          </div>
        </el-menu-item>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const props = defineProps({
  notes: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  activeNoteId: {
    type: [Number, String, null],
    default: null
  }
});

const emit = defineEmits(['select']);

const onSelect = (noteId) => {
  emit('select', Number(noteId));
};

const formatUpdated = (value) => {
  if (!value) return '刚刚';
  return dayjs(value).fromNow();
};
</script>

<style scoped lang="scss">
.note-list {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color);
  width: 320px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color);

    h2 {
      margin: 0;
      font-size: 18px;
    }
  }

  &__count {
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  &__scroll {
    height: calc(100vh - 160px);
  }

  &__skeleton {
    padding: 16px;
  }

  &__menu {
    border-right: none;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 0;
  }

  &__title {
    font-weight: 600;
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    .el-tag {
      border-radius: 8px;
    }
  }
}
</style>
