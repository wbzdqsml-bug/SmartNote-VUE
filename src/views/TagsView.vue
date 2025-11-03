<template>
  <div class="tags-view">
    <el-card class="tags-view__card">
      <template #header>
        <div class="tags-view__header">
          <span>标签管理</span>
          <el-button type="primary" @click="handleCreateTag">新建标签</el-button>
        </div>
      </template>
      <el-table :data="tagTable" border>
        <el-table-column prop="name" label="标签" />
        <el-table-column prop="count" label="关联笔记数" width="160" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleRename(row)">重命名</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useNotesStore } from '../stores/notes';
import { updateTag, deleteTag, createTag } from '../api/tags';

const notesStore = useNotesStore();

onMounted(async () => {
  if (!notesStore.items.length) {
    await notesStore.fetchNotes();
  }
});

const tagTable = computed(() => {
  if (notesStore.tags.length) {
    return notesStore.tags;
  }
  const map = new Map();
  notesStore.items.forEach((note) => {
    (note.tags || []).forEach((tag) => {
      map.set(tag, (map.get(tag) || 0) + 1);
    });
  });
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
});

const refresh = async () => {
  await notesStore.fetchNotes();
};

const handleCreateTag = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入标签名称', '新建标签', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '标签名称不能为空'
    });
    await createTag({ name: value });
    await refresh();
    ElMessage.success('标签创建成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '创建失败');
    }
  }
};

const handleRename = async (tag) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新的标签名称', '重命名标签', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: tag.name,
      inputPattern: /\S+/,
      inputErrorMessage: '标签名称不能为空'
    });
    await updateTag(tag.name, { name: value });
    await refresh();
    ElMessage.success('标签已更新');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '更新失败');
    }
  }
};

const handleDelete = async (tag) => {
  try {
    await ElMessageBox.confirm(`确定删除标签 "${tag.name}" 吗？`, '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await deleteTag(tag.name);
    await refresh();
    ElMessage.success('已删除标签');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
};
</script>

<style scoped lang="scss">
.tags-view {
  padding: 24px;

  &__card {
    max-width: 800px;
    margin: 0 auto;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }
}
</style>
