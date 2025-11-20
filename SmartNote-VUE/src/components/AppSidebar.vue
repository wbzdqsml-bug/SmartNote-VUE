<template>
  <n-layout-sider
    bordered
    :width="240"
    :collapsed-width="0"
    collapse-mode="width"
    show-trigger
    class="sidebar"
  >
    <!-- 顶部品牌 -->
    <div class="branding">
      <div class="logo-mark">S</div>
      <div class="logo-text">SmartNote</div>
    </div>

    <!-- 新建笔记按钮 -->
    <n-button type="primary" block strong size="large" @click="$emit('create-note')">
      + 新建笔记
    </n-button>

    <!-- 搜索框 -->
    <n-input
      v-model:value="searchText"
      size="large"
      placeholder="搜索笔记..."
      clearable
      round
      class="search"
      @update:value="(val) => emit('search', val)"
    >
      <template #prefix>
        <n-icon :component="SearchOutline" />
      </template>
    </n-input>

    <!-- 菜单 -->
    <div class="menu-container">
      <n-menu
        :value="active"
        :options="menuOptions"
        class="menu"
        @update:value="handleSelect"
      />
    </div>

    <!-- ✅ 固定底部用户信息 -->
    <div class="footer">
      <div class="user">
        <n-avatar size="large" class="avatar">{{ displayInitial }}</n-avatar>
        <div class="meta">
          <span class="name">{{ displayName }}</span>
          <n-button text size="tiny" type="primary" @click="$emit('open-profile')">
            个人资料
          </n-button>
        </div>
      </div>
      <n-button tertiary size="small" type="error" class="logout" @click="$emit('logout')">
        退出登录
      </n-button>
    </div>
  </n-layout-sider>
</template>

<script setup>
import { computed, ref } from 'vue'
import { SearchOutline } from '@vicons/ionicons5'
import { NLayoutSider, NButton, NInput, NIcon, NMenu, NAvatar } from 'naive-ui'

const emit = defineEmits([
  'create-note',
  'search',
  'update:active',
  'open-profile',
  'logout',
  'open-recycle'
])

const props = defineProps({
  active: {
    type: String,
    default: 'notes'
  },
  profile: {
    type: Object,
    default: () => ({})
  }
})

const searchText = ref('')

const menuOptions = computed(() => [
  { label: '🗒 我的笔记', key: 'notes' },
  { label: '📊 学习分析', key: 'analysis' },
  { label: '🧠 AI 助手', key: 'ai' },
  { label: '🗑 回收站', key: 'recycle' },
  { label: '👤 个人资料', key: 'profile' },
  { label: '⚙ 协作空间', key: 'settings' }
])

const displayInitial = computed(() => {
  const name = props.profile?.nickname || props.profile?.username || 'U'
  return name.slice(0, 1).toUpperCase()
})

const displayName = computed(() => props.profile?.nickname || props.profile?.username || '未登录')

const handleSelect = (key) => {
  if (key === 'recycle') {
    emit('open-recycle')
    emit('update:active', props.active)
    return
  }
  emit('update:active', key)
}
</script>

<style scoped>
.sidebar {
  display: flex; /* ✅ 让整个侧边栏成为 Flex 容器 */
  flex-direction: column;
  justify-content: space-between; /* ✅ 顶部内容 + 底部固定 */
  height: 100%;
  padding: 20px 16px;
  background: #ffffff;
  color: #333;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
  border-right: 1px solid #f1f1f5;
  box-sizing: border-box;
}

/* 顶部区块 */
.branding {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #fff;
  font-size: 18px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.search {
  margin: 16px 0 20px;
}

/* 菜单部分可滚动（防止内容溢出） */
.menu-container {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 12px;
}

.menu {
  background: transparent;
  color: #111827;
}

.menu :deep(.n-menu-item-content--selected) {
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  color: #2563eb;
  font-weight: 600;
}

/* ✅ 底部用户信息固定 */
.footer {
  border-top: 1px solid #f1f1f5;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  background: #e5e7eb;
  color: #111827;
  font-weight: 600;
}

.meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.name {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
}

.logout {
  align-self: flex-start;
  border-color: #ef4444;
  color: #d03050;
  transition: 0.2s ease;
}

.logout:hover {
  background: rgba(220, 38, 38, 0.05);
  color: #b91c1c;
}
</style>
