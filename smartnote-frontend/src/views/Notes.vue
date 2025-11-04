<template>
  <div class="notes-page">
    <el-page-header content="我的笔记">
      <template #extra>
        <el-button type="primary" @click="createNew" :loading="creating">新建笔记</el-button>
      </template>
    </el-page-header>

    <div class="notes-body">
      <el-empty v-if="!loading && !notes.length" description="还没有笔记，快去创建吧！" />
      <el-row v-else :gutter="20">
        <el-col
          v-for="n in notes"
          :key="n.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <NoteCard :note="n" @open="openNote" @remove="remove" />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'

import NoteCard from '../components/NoteCard.vue'
import { useNoteStore } from '../store/noteStore'
import { useWorkspaceStore } from '../store/workspaceStore'

const router = useRouter()
const noteStore = useNoteStore()
const workspaceStore = useWorkspaceStore()

const { notes, loading } = storeToRefs(noteStore)
const creating = ref(false)

const ensureWorkspaces = async () => {
  if (!workspaceStore.workspaces.length && !workspaceStore.loading) {
    await workspaceStore.loadWorkspaces()
  }
}

onMounted(async () => {
  await Promise.all([noteStore.loadNotes(), ensureWorkspaces()])
})

const openNote = id => {
  router.push(`/notes/${id}`)
}

const remove = async id => {
  try {
    await noteStore.removeNote(id)
  } catch (error) {
    console.error('删除笔记失败', error)
    ElMessage.error(error?.message || '删除失败')
  }
}

const createNew = async () => {
  creating.value = true
  try {
    await ensureWorkspaces()
    const workspace = workspaceStore.workspaces[0]
    if (!workspace) {
      ElMessage.warning('请先创建一个工作区再添加笔记')
      return
    }
    const id = await noteStore.addNote({
      title: '新笔记',
      workspaceId: workspace.id,
      type: 0
    })
    router.push(`/notes/${id}`)
  } catch (error) {
    console.error('创建笔记失败', error)
    ElMessage.error(error?.message || '创建笔记失败')
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.notes-page {
  padding: 20px;
  min-height: calc(100vh - 48px);
  box-sizing: border-box;
}

.notes-body {
  margin-top: 16px;
}
</style>
