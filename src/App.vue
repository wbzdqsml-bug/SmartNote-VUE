<template>
  <el-config-provider :size="uiSize" :button="{ autoInsertSpace: true }">
    <MainLayout />
  </el-config-provider>
</template>

<script setup>
import { computed } from 'vue';
import { usePreferencesStore } from './stores/preferences';
import MainLayout from './layouts/MainLayout.vue';

const preferences = usePreferencesStore();
const uiSize = computed(() => preferences.uiSize);
</script>
