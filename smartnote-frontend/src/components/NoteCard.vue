<template>
  <el-card shadow="hover" class="note-card">
    <h3>{{ note.title || '无标题' }}</h3>
    <p>{{ new Date(note.lastUpdateTime).toLocaleString() }}</p>
    <div class="actions">
      <el-button type="primary" size="small" @click="$emit('open', note.id)">打开</el-button>
      <el-button type="danger" size="small" @click="$emit('remove', note.id)">删除</el-button>
    </div>
  </el-card>
</template>

<script setup>
defineProps({ note: Object })
</script>

<style scoped>
.note-card { margin-bottom: 20px; }
.actions { margin-top: 10px; display: flex; gap: 8px; }
</style>
