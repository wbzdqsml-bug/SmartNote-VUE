<template>
  <div class="workspace-page">
    <el-page-header content="工作区管理">
      <template #extra>
        <el-button type="primary" @click="create">新建工作区</el-button>
      </template>
    </el-page-header>

    <el-card class="mt-4" shadow="never">
      <el-table :data="workspaces" v-loading="loading" empty-text="暂无工作区">
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column label="类型" min-width="140">
          <template #default="scope">
            <el-tag type="info" effect="plain">{{ scope.row.typeLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="180">
          <template #default="scope">
            {{ scope.row.createdAt || scope.row.createTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center">
          <template #default="scope">
            <el-space>
              <el-button type="primary" size="small" @click="openInviteDialog(scope.row)">
                邀请成员
              </el-button>
              <el-button type="danger" size="small" plain @click="remove(scope.row)">
                删除
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="inviteDialogVisible" :title="inviteDialogTitle" width="420px">
      <el-form label-width="96px">
        <el-form-item label="邀请对象">
          <el-input
            v-model="inviteForm.account"
            placeholder="请输入用户名或邮箱"
            autocomplete="off"
          />
        </el-form-item>
        <el-form-item label="附加信息">
          <el-input
            v-model="inviteForm.message"
            type="textarea"
            :rows="3"
            placeholder="可选，向对方说明加入理由"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="inviteDialogVisible = false" :disabled="inviting">取消</el-button>
          <el-button type="primary" @click="submitInvite" :loading="inviting">发送邀请</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { getWorkspaces, createWorkspace, deleteWorkspace } from '../api/workspace'
import { sendInvitation } from '../api/invitation'
import { ensureArray } from '../utils/response'

const WORKSPACE_TYPE_MAP = {
  0: '个人',
  1: '团队'
}

const workspaces = ref([])
const loading = ref(false)
const inviteDialogVisible = ref(false)
const inviting = ref(false)
const currentWorkspace = ref(null)
const inviteForm = reactive({ workspaceId: null, account: '', message: '' })

const formatWorkspaceType = type => {
  if (typeof type === 'number') return WORKSPACE_TYPE_MAP[type] || `类型 ${type}`
  return type || '未设置'
}

const decorateWorkspace = item => ({
  ...item,
  typeLabel: formatWorkspaceType(item.type)
})

const load = async () => {
  loading.value = true
  try {
    const data = await getWorkspaces()
    workspaces.value = ensureArray(data).map(decorateWorkspace)
  } catch (error) {
    console.error('加载工作区失败', error)
    ElMessage.error(error?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const create = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入工作区名称', '新建工作区', {
      confirmButtonText: '创建',
      cancelButtonText: '取消',
      inputValue: '新工作区',
      inputValidator: val => (!!val && val.trim().length > 0) || '名称不能为空'
    })
    await createWorkspace({ name: value.trim(), type: 0 })
    ElMessage.success('创建成功')
    await load()
  } catch (error) {
    if (error === 'cancel') return
    console.error('创建工作区失败', error)
    ElMessage.error(error?.message || '创建失败')
  }
}

const remove = async row => {
  const id = row?.id ?? row
  if (!id) return
  try {
    await ElMessageBox.confirm(`确定要删除工作区 “${row?.name || ''}” 吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  try {
    await deleteWorkspace(id)
    ElMessage.success('删除成功')
    await load()
  } catch (error) {
    console.error('删除工作区失败', error)
    ElMessage.error(error?.message || '删除失败')
  }
}

const resetInviteForm = () => {
  inviteForm.account = ''
  inviteForm.message = ''
}

const openInviteDialog = workspace => {
  currentWorkspace.value = workspace
  inviteForm.workspaceId = workspace?.id ?? null
  resetInviteForm()
  inviteDialogVisible.value = true
}

const inviteDialogTitle = computed(() =>
  currentWorkspace.value ? `邀请加入 ${currentWorkspace.value.name}` : '发送邀请'
)

const submitInvite = async () => {
  if (!inviteForm.workspaceId) {
    ElMessage.warning('请选择工作区')
    return
  }
  const account = inviteForm.account?.trim()
  if (!account) {
    ElMessage.warning('请输入邀请对象')
    return
  }
  inviting.value = true
  try {
    const remark = inviteForm.message?.trim()
    const params = {
      account,
      username: account,
      email: account
    }
    if (remark) {
      params.remark = remark
      params.message = remark
    }
    await sendInvitation(inviteForm.workspaceId, params)
    ElMessage.success('邀请已发送')
    inviteDialogVisible.value = false
  } catch (error) {
    console.error('发送邀请失败', error)
    ElMessage.error(error?.message || '发送失败')
  } finally {
    inviting.value = false
  }
}
</script>

<style scoped>
.workspace-page {
  padding: 16px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
