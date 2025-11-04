<template>
    <el-page-header @back="$router.back()" content="笔记详情" />
    <el-input v-model="note.title" placeholder="标题" class="mt-3" />
    <el-input type="textarea" rows="15" v-model="note.contentMd" class="mt-3" />
    <el-button type="primary" @click="save" class="mt-3">保存</el-button>
</template>

<script setup>
import { updateNote } from '../api/note'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

const route = useRoute()
const note = ref({ id: route.params.id, title: '', contentMd: '' })

const save = async () => {
  await updateNote(note.value.id, note.value)
  ElMessage.success('保存成功')
}
</script>
