<!--
  文件说明：布局组件（AppLayout）
  - 主要职责：负责页面骨架结构与插槽布局组织。
  - 关键交互：梳理组件输入（props/状态）与输出（事件/调用）以便维护。
  - 依赖关系：记录依赖的 API/状态仓库/子组件，便于追踪数据来源。
  - 维护提示：修改结构或样式时，注意与父子组件/路由联动影响。
-->
<template>
  <n-layout has-sider class="app-layout">
    <app-sidebar
      :active="activeKey"
      :profile="userStore.profile"
      @create-note="openCreateDialog"
      @search="handleSearch"
      @update:active="handleNav"
      @open-profile="goProfile"
      @logout="handleLogout"
    />
    <n-layout class="main-area">
      <user-header
        :title="headerTitle"
        :subtitle="headerSubtitle"
        :notifications="[]"
        @refresh="handleRefresh"
      />
      <div class="main-scroll">
        <router-view />
      </div>
    </n-layout>
  </n-layout>

  <add-note-modal
    v-model:show="createVisible"
    :workspace-options="workspaceOptions"
    :workspace-loading="workspaceLoading"
    @created="handleCreatedNote"
  />
</template>

<script setup>
import { computed, onMounted, provide, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDialog, useMessage, NLayout } from 'naive-ui'
import AppSidebar from '@/components/AppSidebar.vue'
import UserHeader from '@/components/UserHeader.vue'
import AddNoteModal from '@/components/AddNoteModal.vue'
import workspaceApi from '@/api/workspace'
import { useUserStore } from '@/store/userStore'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const userStore = useUserStore()

const createVisible = ref(false)
const workspaceOptions = ref([])
const workspaceLoading = ref(false)

const routeMap = {
  home: '/home',
  notes: '/notes',
  analysis: '/analysis',
  community: '/community',
  chat: '/chat',
  ai: '/ai',
  graph: '/graph',
  workspace: '/workspace',
  recycle: '/recycle',
  tags: '/tags',
  profile: '/profile',
  tasks: '/tasks/board',
  'tasks-board': '/tasks/board',
  'tasks-calendar': '/tasks/calendar'
}

const activeKey = computed(() => route.meta.sidebarKey || route.name || 'home')
const headerTitle = computed(() => route.meta.title || 'SmartNote')
const headerSubtitle = computed(() => route.meta.subtitle || '学习中心与知识中枢')

const ensureWorkspaceOptions = async () => {
  if (workspaceOptions.value.length || workspaceLoading.value) return
  workspaceLoading.value = true
  try {
    const response = await workspaceApi.list()
    const data = response.data?.data ?? response.data ?? []
    workspaceOptions.value = (Array.isArray(data) ? data : []).map((item) => ({
      label: item.name || item.title || `工作区 #${item.id ?? ''}`,
      value: item.id ?? item.Id ?? item.workspaceId ?? item.WorkspaceId
    }))
  } catch (error) {
    console.error('[AppLayout] loadWorkspaceOptions error:', error)
    message.error(error?.response?.data?.message || '获取工作区信息失败，请稍后重试。')
  } finally {
    workspaceLoading.value = false
  }
}

const openCreateDialog = async () => {
  await ensureWorkspaceOptions()
  createVisible.value = true
}

provide('openCreateNote', openCreateDialog)

const handleCreatedNote = async (noteId) => {
  createVisible.value = false
  await router.push({ path: routeMap.notes, query: noteId ? { focus: noteId } : {} })
}

const handleSearch = (value) => {
  const keyword = value?.trim() ?? ''
  router.push({
    path: routeMap.notes,
    query: keyword ? { q: keyword } : {}
  })
}

const handleNav = (key) => {
  const target = routeMap[key] || routeMap.home
  if (route.path !== target) {
    router.push(target)
  }
}

const goProfile = () => {
  router.push(routeMap.profile)
}

const handleLogout = () => {
  dialog.warning({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    positiveText: '退出',
    negativeText: '取消',
    onPositiveClick: () => {
      userStore.logout()
      router.push('/login')
    }
  })
}

const handleRefresh = () => {
  router.replace({ path: route.fullPath, query: { ...route.query, _t: Date.now() } })
}

onMounted(() => {
  if (!userStore.profile) {
    userStore.fetchProfile()
  }
  ensureWorkspaceOptions()
})
</script>

<style scoped>
.app-layout {
  height: 100vh;
  background: #f7f7f7;
}

.main-area {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #ffffff;
}

.main-scroll {
  flex: 1;
  padding: 0 24px 28px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
