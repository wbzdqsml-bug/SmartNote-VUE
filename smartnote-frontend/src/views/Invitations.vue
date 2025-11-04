<template>
  <div class="invitation-page">
    <el-page-header content="邀请管理" />

    <el-card class="mt-4" shadow="never">
      <el-table :data="list" v-loading="loading" empty-text="暂无邀请">
        <el-table-column label="工作区" min-width="160">
          <template #default="scope">
            {{ scope.row.workspaceName || scope.row.workspace || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="邀请人" min-width="140">
          <template #default="scope">
            {{ scope.row.inviterName || scope.row.inviter || scope.row.fromUserName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="120" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.statusTag" effect="plain">
              {{ scope.row.statusLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="邀请时间" min-width="180">
          <template #default="scope">
            {{ scope.row.createdAt || scope.row.createTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-space>
              <el-button
                type="success"
                size="small"
                :disabled="!scope.row.isPending"
                @click="accept(scope.row)"
              >
                接受
              </el-button>
              <el-button
                type="danger"
                size="small"
                plain
                :disabled="!scope.row.isPending"
                @click="decline(scope.row)"
              >
                拒绝
              </el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { getInvitations, acceptInvitation, declineInvitation } from '../api/invitation'
import { ensureArray } from '../utils/response'

const list = ref([])
const loading = ref(false)

const STATUS_MAP = {
  pending: { label: '待处理', tag: 'warning' },
  accepted: { label: '已接受', tag: 'success' },
  declined: { label: '已拒绝', tag: 'danger' },
  rejected: { label: '已拒绝', tag: 'danger' },
  revoked: { label: '已撤回', tag: 'info' },
  expired: { label: '已过期', tag: 'info' }
}

const normalizeStatusKey = status => {
  if (typeof status === 'number') {
    switch (status) {
      case 0:
        return 'pending'
      case 1:
        return 'accepted'
      case 2:
        return 'declined'
      case 3:
        return 'revoked'
      default:
        return `${status}`
    }
  }
  return String(status ?? '').toLowerCase()
}

const decorateInvitation = item => {
  const statusKey = normalizeStatusKey(item.status)
  const statusMeta = STATUS_MAP[statusKey] || { label: item.status || '未知状态', tag: 'info' }
  return {
    ...item,
    statusKey,
    statusLabel: statusMeta.label,
    statusTag: statusMeta.tag,
    isPending: statusKey === 'pending'
  }
}

const load = async () => {
  loading.value = true
  try {
    const data = await getInvitations()
    list.value = ensureArray(data).map(decorateInvitation)
  } catch (error) {
    console.error('加载邀请失败', error)
    ElMessage.error(error?.message || '加载邀请失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)

const ensureId = row => row?.id ?? row?.invitationId ?? row

const accept = async row => {
  const id = ensureId(row)
  if (!id || row?.isPending === false) return
  try {
    await acceptInvitation(id)
    ElMessage.success('已接受邀请')
    await load()
  } catch (error) {
    console.error('接受邀请失败', error)
    ElMessage.error(error?.message || '接受失败')
  }
}

const decline = async row => {
  const id = ensureId(row)
  if (!id || row?.isPending === false) return
  try {
    await ElMessageBox.confirm('确定要拒绝该邀请吗？', '提示', {
      type: 'warning',
      confirmButtonText: '拒绝',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  try {
    await declineInvitation(id)
    ElMessage.info('已拒绝邀请')
    await load()
  } catch (error) {
    console.error('拒绝邀请失败', error)
    ElMessage.error(error?.message || '拒绝失败')
  }
}
</script>

<style scoped>
.invitation-page {
  padding: 16px;
}

.mt-4 {
  margin-top: 16px;
}
</style>
