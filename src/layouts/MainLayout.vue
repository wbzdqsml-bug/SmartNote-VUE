<template>
  <el-container class="layout">
    <el-aside width="260px" class="layout__aside">
      <div class="logo">
        <el-icon><Edit /></el-icon>
        <span>SmartNote</span>
      </div>
      <el-menu :default-active="activeMenu" @select="handleSelect" class="layout__menu">
        <el-menu-item index="notes">
          <el-icon><Notebook /></el-icon>
          <span>笔记</span>
        </el-menu-item>
        <el-menu-item index="tags">
          <el-icon><CollectionTag /></el-icon>
          <span>标签</span>
        </el-menu-item>
        <el-menu-item index="settings">
          <el-icon><Setting /></el-icon>
          <span>设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout__header">
        <div class="layout__header-left">
          <el-input
            v-if="isNotesRoute"
            v-model="search"
            placeholder="搜索笔记"
            clearable
            @clear="handleSearch"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="layout__header-right">
          <el-button type="primary" v-if="isNotesRoute" @click="handleCreateNote">
            <el-icon><Plus /></el-icon>
            新建笔记
          </el-button>
          <el-divider direction="vertical" />
          <el-switch
            v-model="isDark"
            inline-prompt
            active-text="暗"
            inactive-text="亮"
            @change="toggleTheme"
          />
        </div>
      </el-header>
      <el-main class="layout__main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { usePreferencesStore } from '../stores/preferences';
import { useNotesStore } from '../stores/notes';
import { Edit, Notebook, CollectionTag, Setting, Search, Plus } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const notesStore = useNotesStore();
const { filter } = storeToRefs(notesStore);
const search = ref(filter.value);
const activeMenu = computed(() => {
  if (route.name === 'Tags') return 'tags';
  if (route.name === 'Settings') return 'settings';
  return 'notes';
});

const isNotesRoute = computed(() => route.name === 'Notes' || route.name === 'NoteDetails');

watch(
  () => route.name,
  (name) => {
    if (name === 'Notes') {
      notesStore.fetchNotes();
    }
  },
  { immediate: true }
);

const handleSelect = (index) => {
  if (index === 'notes') router.push({ name: 'Notes' });
  if (index === 'tags') router.push({ name: 'Tags' });
  if (index === 'settings') router.push({ name: 'Settings' });
};

const handleSearch = () => {
  notesStore.setFilter(search.value);
};

const handleCreateNote = () => {
  notesStore.startCreate();
};

const preferencesStore = usePreferencesStore();
const isDark = computed({
  get: () => preferencesStore.isDark,
  set: (value) => preferencesStore.setDark(value)
});

const toggleTheme = () => {
  preferencesStore.applyTheme();
};
</script>

<style scoped lang="scss">
.layout {
  height: 100vh;

  &__aside {
    background-color: var(--el-bg-color-overlay);
    border-right: 1px solid var(--el-border-color);
    padding: 16px 0;

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 24px 16px;
      font-size: 20px;
      font-weight: 600;
    }
  }

  &__menu {
    border-right: none;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    gap: 16px;
    border-bottom: 1px solid var(--el-border-color);
  }

  &__header-left {
    flex: 1;
  }

  &__header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__main {
    padding: 0;
    background-color: var(--el-bg-color);
  }
}
</style>
