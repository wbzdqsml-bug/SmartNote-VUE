<template>
    <el-page-header content="工作区管理">
      <template #extra>
        <el-button type="primary" @click="create">新建工作区</el-button>
      </template>
    </el-page-header>

    <el-table :data="workspaces" class="mt-4">
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="type" label="类型" />
      <el-table-column>
        <template #default="scope">
          <el-button type="danger" @click="remove(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
</template>

<script setup>
import { getWorkspaces, createWorkspace, deleteWorkspace } from '../api/workspace'
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const workspaces = ref([])
const load = async () => { workspaces.value = await getWorkspaces() }
onMounted(load)

const create = async () => {
  await createWorkspace({ name: '新工作区', type: 0 })
  ElMessage.success('创建成功')
  load()
}
const remove = async (id) => {
  await deleteWorkspace(id)
  ElMessage.success('删除成功')
  load()
}
</script>
