<template>
  <el-menu
    router
    default-active="$route.path"
    class="navbar"
    background-color="#f8f9fa"
    text-color="#333"
    active-text-color="#409EFF"
  >
    <el-menu-item index="/notes">
      <el-icon><Folder /></el-icon>
      <span>我的笔记</span>
    </el-menu-item>

    <el-menu-item index="/workspaces">
      <el-icon><User /></el-icon>
      <span>工作区</span>
    </el-menu-item>

    <el-menu-item index="/invitations">
      <el-icon><Message /></el-icon>
      <span>邀请</span>
    </el-menu-item>

    <el-menu-item index="/recycle">
      <el-icon><Delete /></el-icon>
      <span>回收站</span>
    </el-menu-item>

    <el-menu-item @click="logout">
      <el-icon><SwitchButton /></el-icon>
      <span>退出</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Folder, User, Message, Delete, SwitchButton } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const logout = () => {
  localStorage.removeItem('token')
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  height: 100%;
  border-right: 1px solid #ebeef5;
  padding-top: 20px;
}
.el-menu-item {
  font-size: 15px;
}
</style>
