<template>
  <div class="notes-page">
    <el-page-header content="我的笔记">
      <template #extra>
        <el-button type="primary" @click="openCreateDialog" :loading="preparingCreate">
          新建笔记
        </el-button>
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

    <el-dialog v-model="showCreateDialog" title="新建笔记" width="420px">
      <el-form label-width="88px">
        <el-form-item label="标题">
          <el-input v-model="createForm.title" placeholder="请输入笔记标题" />
        </el-form-item>
        <el-form-item label="所属工作区">
          <el-select
            v-model="createForm.workspaceId"
            placeholder="请选择工作区"
            :loading="workspaceStore.loading"
          >
            <el-option
              v-for="item in workspaceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="笔记类型">
          <el-radio-group v-model="createForm.type">
            <el-radio-button
              v-for="option in noteTypeOptions"
              :key="option.value"
              :label="option.value"
            >
              {{ option.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false" :disabled="creating">取消</el-button>
          <el-button type="primary" @click="confirmCreate" :loading="creating">创建</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'

import NoteCard from '../components/NoteCard.vue'
import { useNoteStore } from '../store/noteStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { NOTE_TYPE, NOTE_TYPE_OPTIONS } from '../constants/note'

const router = useRouter()
const noteStore = useNoteStore()
const workspaceStore = useWorkspaceStore()

const { notes, loading } = storeToRefs(noteStore)
const preparingCreate = ref(false)
const creating = ref(false)
const showCreateDialog = ref(false)
const createForm = reactive({
  title: '新笔记',
  type: NOTE_TYPE.MARKDOWN,
  workspaceId: null
})

const noteTypeOptions = NOTE_TYPE_OPTIONS
const workspaceOptions = computed(() =>
  workspaceStore.workspaces.map(item => ({ label: item.name, value: item.id }))
)

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

const resetCreateForm = () => {
  createForm.title = '新笔记'
  createForm.type = NOTE_TYPE.MARKDOWN
  createForm.workspaceId = workspaceStore.workspaces[0]?.id || null
}

const openCreateDialog = async () => {
  preparingCreate.value = true
  try {
    await ensureWorkspaces()
    const workspace = workspaceStore.workspaces[0]
    if (!workspace) {
      ElMessage.warning('请先创建一个工作区再添加笔记')
      return
    }
    resetCreateForm()
    showCreateDialog.value = true
  } catch (error) {
    console.error('创建笔记失败', error)
    ElMessage.error(error?.message || '创建笔记失败')
  } finally {
    preparingCreate.value = false
  }
}

const confirmCreate = async () => {
  if (!createForm.workspaceId) {
    ElMessage.warning('请选择工作区')
    return
  }
  creating.value = true
  try {
    const payload = {
      title: createForm.title?.trim() || '新笔记',
      workspaceId: createForm.workspaceId,
      type: createForm.type
    }
    const id = await noteStore.addNote(payload)
    showCreateDialog.value = false
    if (id) router.push(`/notes/${id}`)
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
