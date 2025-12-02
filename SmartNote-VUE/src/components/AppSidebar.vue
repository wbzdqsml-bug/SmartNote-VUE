<template>
  <n-layout-sider
    bordered
    :width="260"
    :collapsed-width="0"
    collapse-mode="width"
    show-trigger
    class="sidebar"
  >
    <div class="branding">
      <div class="logo-mark">S</div>
      <div class="logo-text">SmartNote</div>
    </div>

    <n-button type="primary" block size="large" class="create-btn" @click="$emit('create-note')">
      + 新建笔记
    </n-button>

    <div class="menu-container">
      <n-menu :value="active" :options="menuOptions" class="menu" @update:value="handleSelect" />
    </div>

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
import { NLayoutSider, NButton, NMenu, NAvatar } from 'naive-ui'

const emit = defineEmits(['create-note', 'update:active', 'open-profile', 'logout'])

const props = defineProps({
  active: {
    type: String,
    default: 'home'
  },
  profile: {
    type: Object,
    default: () => ({})
  }
})

const menuOptions = computed(() => [
  { label: '首页概览', key: 'home' },
  { label: '笔记编辑', key: 'notes' },
  { label: '学习统计', key: 'analysis' },
  { label: '知识图谱', key: 'graph' },
  { label: 'AI 助手', key: 'ai' },
  { label: '协作空间', key: 'workspace' },
  { label: '回收站', key: 'recycle' },
  { label: '标签管理', key: 'tags' },
  { label: '个人资料', key: 'profile' }
])

const displayInitial = computed(() => {
  const name = props.profile?.nickname || props.profile?.username || 'U'
  return name.slice(0, 1).toUpperCase()
})

const displayName = computed(() => props.profile?.nickname || props.profile?.username || '未登录')

const handleSelect = (key) => {
  emit('update:active', key)
}
</script>

<style scoped>
.sidebar {
  height: 100%;
  background: #ffffff;
  font-family: 'Inter', 'Noto Sans SC', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  box-sizing: border-box;
}

.branding {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.logo-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #111827;
  color: #ffffff;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 18px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.create-btn {
  background: #111827;
  color: #ffffff;
  border-radius: 10px;
  margin-bottom: 14px;
}

.create-btn:hover {
  background: #0f172a;
}

.menu-container {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
}

.menu {
  background: transparent;
  color: #111827;
}

.menu :deep(.n-menu-item-content) {
  border-radius: 10px;
  padding: 10px 12px;
}

.menu :deep(.n-menu-item-content:hover) {
  background: #f3f4f6;
}

.menu :deep(.n-menu-item-content--selected) {
  background: #e5e7eb;
  font-weight: 600;
}

.footer {
  border-top: 1px solid #e5e7eb;
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
  border-color: #d1d5db;
  color: #111827;
}

.logout:hover {
  background: #f3f4f6;
}
</style>
