<template>
  <el-container class="main-layout">
    <el-aside width="240px" class="main-aside">
      <div class="logo-container">
        <span class="logo-text">SmartNote</span>
      </div>

      <div class="new-note-area">
        <el-button
          type="primary"
          :icon="Plus"
          class="new-note-btn el-button--primary"
        >
          New Note
        </el-button>
        <el-input
          v-model="searchText"
          placeholder="Search"
          :prefix-icon="Search"
          class="search-input"
        />
      </div>

      <el-menu
        active-text-color="#ffffff"
        background-color="#191919"
        class="main-menu"
        :default-active="$route.path"
        text-color="#aeb5c4"
        router
      >
        <el-menu-item index="/notes">
          <el-icon><Tickets /></el-icon>
          <span>My Notes</span>
        </el-menu-item>
        <el-menu-item index="/graph">
          <el-icon><DataLine /></el-icon>
          <span>Knowledge Graph</span>
        </el-menu-item>
        <el-menu-item index="/stats">
          <el-icon><PieChart /></el-icon>
          <span>Learning Stats</span>
        </el-menu-item>
        <el-menu-item index="/settings" disabled>
          <el-icon><Setting /></el-icon>
          <span>Settings</span>
        </el-menu-item>
      </el-menu>

      <div class="user-info">
        <el-avatar :size="30" :icon="UserFilled" />
        <span class="username">{{ userStore.nickname }}</span>
        <el-button link :icon="SwitchButton" class="logout-btn" @click="handleLogout">
          Logout
        </el-button>
      </div>
    </el-aside>

    <el-main class="main-content">
      <router-view />
    </el-main>

  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import {
  Tickets, DataLine, PieChart, Setting, UserFilled,
  Plus, Search, SwitchButton
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const searchText = ref('')

const handleLogout = () => {
  ElMessageBox.confirm('你确定要退出登录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
  .then(() => {
    userStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  })
  .catch(() => {})
}
</script>

<style scoped>
/* --- 最终样式 (浮动按钮版) --- */
.main-layout { height: 100vh; }
.main-aside {
  background-color: #191919; color: #fff; display: flex;
  flex-direction: column; height: 100%;
  border-right: 1px solid #303030; transition: all 0.3s ease;
}
.logo-container {
  display: flex; align-items: center; padding: 0 20px;
  height: 60px; box-sizing: border-box;
}
.logo-text { font-size: 22px; font-weight: 600; color: #fff; }
.new-note-area { padding: 10px 20px; }
.search-input { margin-top: 15px; }
.search-input ::v-deep(.el-input__wrapper) {
  background-color: #262626; border-radius: 6px; box-shadow: none;
}
.search-input ::v-deep(.el-input__inner) { color: #fff; }

.new-note-btn.el-button--primary {
  width: 100%; height: 40px; font-weight: 600; font-size: 15px;
  border: none; border-radius: 8px;
  color: #fff;
  background: linear-gradient(145deg, var(--el-color-primary-light-3), var(--el-color-primary));
  box-shadow: 0 4px 15px -5px rgba(64, 158, 255, 0.4);
  transition: all 0.2s ease-out;
}
.new-note-btn.el-button--primary:hover,
.new-note-btn.el-button--primary:focus,
.new-note-btn.el-button--primary:focus-visible {
  background: linear-gradient(145deg, var(--el-color-primary-light-1), var(--el-color-primary-light-3));
  color: #fff; border-color: transparent; outline: none;
  transform: scale(1.03) translateY(-2px);
  box-shadow: 0 6px 20px -5px rgba(64, 158, 255, 0.6);
}
.new-note-btn.el-button--primary:active {
  background: linear-gradient(145deg, var(--el-color-primary), var(--el-color-primary-dark-2));
  color: #fff; border-color: transparent; outline: none;
  transform: scale(0.98) translateY(0);
  box-shadow: 0 2px 10px -5px rgba(64, 158, 255, 0.5);
}

.main-menu {
  border-right: none; flex-grow: 1; background-color: #191919; padding: 0 10px;
}
.el-menu-item {
  font-size: 15px; border-radius: 8px; margin: 8px 0;
  transition: all 0.2s ease-in-out; color: #aeb5c4;
}
.el-menu-item:not(.is-active):hover { background-color: #262626; }
.el-menu-item.is-active {
  background-color: var(--el-color-primary);
  box-shadow: 0 4px 15px -5px var(--el-color-primary-light-3);
  transform: scale(1.03) translateY(-2px);
  color: #fff !important;
}

.user-info {
  height: 60px; display: flex; align-items: center; padding: 0 20px;
  border-top: 1px solid #303030; box-sizing: border-box;
}
.username {
  margin-left: 10px; flex-grow: 1; color: #fff; font-size: 15px;
}
.logout-btn { color: #aaa; }
.logout-btn:hover { color: #f56c6c; }

.main-content {
  background-color: #1e1e1e; color: #fff; padding: 20px;
}
</style>
