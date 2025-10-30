<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'

// VVVVVV 核心：开启深色模式 VVVVVV
onMounted(() => {
  // 当组件挂载时，在 <html> 根标签上添加 'dark' class
  // Element Plus 会自动检测到这个 class 并切换到深色主题
  document.documentElement.classList.add('dark')
})
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
</script>

<style>
/* 全局样式重置
  (我们把 body 的背景也设为深色，防止切换路由时出现“白闪”)
*/
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

  /* 匹配 Element Plus Dark Mode 的背景色。
    #141414 是 Element Plus 的深色背景色，
    #1e1e1e 是我们 MainLayout 内容区的颜色。
    我们选一个基础的深色。
  */
  background-color: #141414;
}
</style>
