<template>
  <el-container class="layout">
    <el-aside width="200px">
      <NavBar />
    </el-aside>
    <el-container>
      <el-main>
        <slot/>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import NavBar from './NavBar.vue'
</script>

<style scoped>
.layout { height: 100vh; }
</style>
