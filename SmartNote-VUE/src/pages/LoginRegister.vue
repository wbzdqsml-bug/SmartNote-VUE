<template>
  <div class="auth-bg">
    <AuthCard :default-tab="defaultTab" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AuthCard from '@/components/AuthCard.vue'
import '@/assets/bg.css'

const route = useRoute()

const defaultTab = computed(() => (route.name === 'register' ? 'register' : 'login'))
</script>
