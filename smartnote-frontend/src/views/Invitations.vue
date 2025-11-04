<template>
    <el-page-header content="邀请管理" />

    <el-table :data="list" class="mt-4">
      <el-table-column prop="workspaceName" label="工作区" />
      <el-table-column prop="inviterName" label="邀请人" />
      <el-table-column prop="status" label="状态" />
      <el-table-column>
        <template #default="scope">
          <el-button type="success" @click="accept(scope.row.id)">接受</el-button>
          <el-button type="danger" @click="decline(scope.row.id)">拒绝</el-button>
        </template>
      </el-table-column>
    </el-table>
</template>

<script setup>
import { getInvitations, acceptInvitation, declineInvitation } from '../api/invitation'
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const list = ref([])
const load = async () => { list.value = await getInvitations() }
onMounted(load)

const accept = async (id) => { await acceptInvitation(id); ElMessage.success('已接受'); load() }
const decline = async (id) => { await declineInvitation(id); ElMessage.info('已拒绝'); load() }
</script>
