<template>
  <div class="workspace-page">
    <workspace-panel class="section-card" />
  </div>
</template>

<script setup>
import WorkspacePanel from '@/components/WorkspacePanel.vue'
</script>

<style scoped>
.workspace-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.section-card {
  width: 100%;
}
</style>
