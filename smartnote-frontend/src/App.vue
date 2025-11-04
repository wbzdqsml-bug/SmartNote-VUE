<template>
  <!-- 登录注册页不显示 Layout -->
  <Layout v-if="!isAuthPage">
    <router-view />
  </Layout>
  <router-view v-else />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Layout from './components/Layout.vue'

const route = useRoute()
const noLayoutPages = ['/login', '/register']

const isAuthPage = computed(() => noLayoutPages.includes(route.path))
</script>
