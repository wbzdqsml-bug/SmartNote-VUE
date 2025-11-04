<template>
  <div class="notes-page">
    <el-page-header content="我的笔记">
      <template #extra>
        <el-button type="primary" @click="createNew">新建笔记</el-button>
      </template>
    </el-page-header>

    <el-row :gutter="20" class="mt-4">
      <el-col v-for="n in notes" :key="n.id" :span="8">
        <NoteCard :note="n" @open="openNote" @remove="remove" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import NoteCard from '../components/NoteCard.vue'
import { getNotes, deleteNote, createNote } from '../api/note'
import { ElMessage } from 'element-plus'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const notes = ref([])
const router = useRouter()

// 加载所有笔记
const load = async () => {
  notes.value = await getNotes()
}
onMounted(load)

// 打开笔记
const openNote = (id) => router.push(`/notes/${id}`)

// 删除笔记
const remove = async (id) => {
  await deleteNote(id)
  ElMessage.success('已删除')
  load()
}

// 新建笔记
const createNew = async () => {
  const id = await createNote({
    title: '新笔记',
    workspaceId: 1,
    type: 0
  })
  router.push(`/notes/${id}`)
}
</script>

<style scoped>
.notes-page {
  padding: 20px;
}
.mt-4 {
  margin-top: 16px;
}
</style>
