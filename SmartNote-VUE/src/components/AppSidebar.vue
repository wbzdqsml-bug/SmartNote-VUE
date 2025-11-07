<template>
  <n-layout-sider
    bordered
    :width="240"
    :collapsed-width="0"
    collapse-mode="width"
    show-trigger
    class="sidebar"
  >
    <div class="branding">
      <div class="logo-mark">S</div>
      <div class="logo-text">SmartNote</div>
    </div>

    <n-button type="primary" block strong size="large" @click="$emit('create-note')">
      + 新建笔记
    </n-button>

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

    <n-menu :value="active" :options="menuOptions" class="menu" @update:value="handleSelect" />

    <div class="footer">
      <div class="user">
        <n-avatar size="large">
          {{ displayInitial }}
        </n-avatar>
        <div class="meta">
          <span class="name">{{ displayName }}</span>
          <n-button text size="tiny" type="primary" @click="$emit('open-profile')">
            个人资料
          </n-button>
        </div>
      </div>
      <n-button tertiary size="small" type="error" @click="$emit('logout')">
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
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  background: linear-gradient(180deg, #1d2433 0%, #0f172a 100%);
  color: rgba(255, 255, 255, 0.88);
  height: 100%;
}

.branding {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(135deg, #47b5ff, #7c5cff);
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #fff;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.search {
  margin: 16px 0 20px;
}

.menu {
  flex: 1;
  background: transparent;
}

.footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.name {
  font-weight: 600;
}
</style>
