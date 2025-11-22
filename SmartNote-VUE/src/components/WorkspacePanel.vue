<template>
  <n-card class="workspace-panel" :segmented="{ content: true }">
    <template #header>
      <div class="header">
        <h3>协作空间</h3>
        <n-space>
          <n-button size="small" @click="initialize">刷新</n-button>
          <n-button size="small" type="primary" ghost @click="showCreate = true">
            新建工作区
          </n-button>
        </n-space>
      </div>
    </template>

    <n-tabs v-model:value="activeTab" type="segment" size="large">
      <n-tab-pane name="workspace" tab="我的工作区">
        <n-spin :show="workspaceLoading">
          <n-empty v-if="!workspaces.length" description="暂无工作区，先创建一个吧" />
          <div v-else class="workspace-content">
            <n-list class="workspace-list" clickable hoverable bordered>
              <n-list-item
                v-for="space in workspaces"
                :key="space.id"
                :class="['workspace-item', { active: space.id === activeWorkspaceId }]"
                @click="selectWorkspace(space.id)"
              >
                <n-thing :title="space.name" :description="space.description">
                  <template #footer>
                    <span>更新于：{{ formatTime(space.updatedAt || space.updateTime || space.createTime) }}</span>
                  </template>
                </n-thing>
              </n-list-item>
            </n-list>

            <div v-if="workspaceDetail" class="workspace-detail">
              <div class="detail-meta">
                <div>
                  <h4>{{ workspaceDetail.name }}</h4>
                  <p>{{ workspaceDetail.description || '暂无简介' }}</p>
                </div>
                <div class="meta-tags">
                  <n-tag type="info" round>成员 {{ members.length }}</n-tag>
                  <n-tag round>笔记 {{ workspaceDetail.noteCount ?? '--' }}</n-tag>
                  <n-tag v-if="workspaceDetail.isOwner" type="success" round>拥有者</n-tag>
                </div>
              </div>

              <div class="detail-actions">
                <n-space>
                  <n-button size="small" tertiary type="primary" @click="showInvite = true">
                    邀请成员
                  </n-button>
                  <n-button size="small" tertiary @click="handleLeave">
                    退出工作区
                  </n-button>
                  <n-popconfirm
                    v-if="workspaceDetail.isOwner"
                    positive-text="删除"
                    negative-text="取消"
                    @positive-click="handleDelete"
                  >
                    <template #trigger>
                      <n-button size="small" tertiary type="error">删除工作区</n-button>
                    </template>
                    删除后将不可恢复，确认继续？
                  </n-popconfirm>
                </n-space>
              </div>

              <n-divider />

              <h5>成员管理</h5>
              <n-data-table
                :loading="memberLoading"
                :columns="memberColumns"
                :data="members"
                size="small"
                :row-key="(row) => row.id"
              />
            </div>
          </div>
        </n-spin>
      </n-tab-pane>

      <n-tab-pane name="invitations" tab="邀请管理">
        <n-spin :show="invitationLoading">
          <n-empty v-if="!invitations.length" description="暂无邀请记录" />
          <n-timeline v-else class="invite-timeline">
            <n-timeline-item
              v-for="invite in invitations"
              :key="invite.id"
              :time="formatTime(invite.createdAt || invite.createTime)"
              :title="invite.workspaceName || invite.name"
            >
              <p class="invite-desc">邀请人：{{ invite.inviterName || invite.ownerName || '—' }}</p>
              <p class="invite-status">状态：{{ inviteStatus(invite.status) }}</p>
              <n-space>
                <n-button
                  size="tiny"
                  type="primary"
                  :disabled="!isPending(invite)"
                  @click="handleAccept(invite)"
                >
                  接受
                </n-button>
                <n-button
                  size="tiny"
                  type="warning"
                  ghost
                  :disabled="!isPending(invite)"
                  @click="handleReject(invite)"
                >
                  拒绝
                </n-button>
                <n-button
                  size="tiny"
                  quaternary
                  :disabled="!canRevoke(invite)"
                  @click="handleRevoke(invite)"
                >
                  撤销
                </n-button>
              </n-space>
            </n-timeline-item>
          </n-timeline>
        </n-spin>
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="showCreate" preset="card" title="创建工作区" :mask-closable="false">
      <n-form :model="createForm" label-width="80" label-placement="left">
        <n-form-item label="名称" required>
          <n-input v-model:value="createForm.name" placeholder="请输入工作区名称" />
        </n-form-item>
        <n-form-item label="简介">
          <n-input v-model:value="createForm.description" type="textarea" placeholder="可以补充一句介绍" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space justify="end">
          <n-button @click="showCreate = false">取消</n-button>
          <n-button type="primary" :loading="createSubmitting" @click="handleCreate">
            创建
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showInvite" preset="card" title="邀请成员" :mask-closable="false">
      <n-form :model="inviteForm" label-width="80" label-placement="left">
        <n-form-item label="用户名" required>
          <n-input v-model:value="inviteForm.username" placeholder="请输入被邀请人的用户名" />
        </n-form-item>
        <n-form-item label="权限">
          <n-space>
            <n-checkbox v-model:checked="inviteForm.canEdit">可编辑</n-checkbox>
            <n-checkbox v-model:checked="inviteForm.canShare">可邀请</n-checkbox>
          </n-space>
        </n-form-item>
      </n-form>
      <template #action>
        <n-space justify="end">
          <n-button @click="showInvite = false">取消</n-button>
          <n-button type="primary" :loading="inviteSubmitting" @click="handleInvite">
            发送邀请
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showPermission" preset="card" title="更新成员权限" :mask-closable="false">
      <n-form :model="permissionForm" label-width="80" label-placement="left">
        <n-form-item label="成员">
          <n-input :value="permissionTarget?.displayName || '—'" disabled />
        </n-form-item>
        <n-form-item label="权限">
          <n-space>
            <n-checkbox v-model:checked="permissionForm.canEdit">可编辑</n-checkbox>
            <n-checkbox v-model:checked="permissionForm.canShare">可邀请</n-checkbox>
          </n-space>
        </n-form-item>
      </n-form>
      <template #action>
        <n-space justify="end">
          <n-button @click="showPermission = false">取消</n-button>
          <n-button type="primary" :loading="permissionSubmitting" @click="handlePermissionSave">
            保存
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </n-card>
</template>

<script setup>
import { computed, h, onMounted, reactive, ref } from 'vue'
import {
  NCard,
  NTabs,
  NTabPane,
  NButton,
  NSpace,
  NList,
  NListItem,
  NThing,
  NSpin,
  NEmpty,
  NTag,
  NDivider,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NCheckbox,
  NPopconfirm,
  NTimeline,
  NTimelineItem,
  useMessage,
  useDialog
} from 'naive-ui'
import workspaceApi from '@/api/workspace'
import memberApi from '@/api/member'
import invitationApi from '@/api/invitation'
import { format } from 'date-fns'

const message = useMessage()
const dialog = useDialog()

const activeTab = ref('workspace')
const workspaces = ref([])
const workspaceLoading = ref(false)
const activeWorkspaceId = ref(null)
const workspaceDetail = ref(null)
const members = ref([])
const memberLoading = ref(false)
const invitations = ref([])
const invitationLoading = ref(false)

const showCreate = ref(false)
const createSubmitting = ref(false)
const createForm = reactive({
  name: '',
  description: ''
})

const showInvite = ref(false)
const inviteSubmitting = ref(false)
const inviteForm = reactive({
  username: '',
  canEdit: true,
  canShare: false
})

const showPermission = ref(false)
const permissionSubmitting = ref(false)
const permissionTarget = ref(null)
const permissionForm = reactive({
  canEdit: false,
  canShare: false
})

const isUnauthorized = (error) => error?.response?.status === 401
const handleUnauthorized = (error, fallbackMessage) => {
  if (!isUnauthorized(error)) return false
  message.error(error?.response?.data?.message || fallbackMessage || '当前账号没有权限执行此操作。')
  return true
}

const resolveResponse = (response, fallback = []) => {
  if (!response) return fallback
  const data = response.data ?? fallback
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data ?? fallback
  }
  return data ?? fallback
}

const loadWorkspaces = async () => {
  workspaceLoading.value = true
  try {
    const response = await workspaceApi.list()
    const list = resolveResponse(response, [])
    const normalized = Array.isArray(list)
      ? list.map((item) => {
          const rawId = item.id ?? item.Id ?? item.workspaceId ?? item.WorkspaceId
          const numericId =
            rawId !== null && rawId !== undefined ? Number(rawId) : null
          const id = Number.isFinite(numericId) ? numericId : rawId
          return {
            ...item,
            id,
            name: item.name ?? item.Name ?? ('工作区 #' + id),
            description: item.description ?? item.Description ?? ''
          }
        })
      : []
    workspaces.value = normalized
    if (!workspaces.value.length) {
      activeWorkspaceId.value = null
      workspaceDetail.value = null
      members.value = []
      return
    }
    const currentId = activeWorkspaceId.value ?? workspaces.value[0].id
    if (!workspaces.value.find((item) => item.id === currentId)) {
      activeWorkspaceId.value = workspaces.value[0].id
    } else {
      activeWorkspaceId.value = currentId
    }
    await loadWorkspaceDetail(activeWorkspaceId.value)
  } catch (error) {
    console.error('[WorkspacePanel] loadWorkspaces error:', error)
    if (handleUnauthorized(error, '当前账号没有权限查看工作区。')) {
      workspaces.value = []
      workspaceDetail.value = null
      members.value = []
    } else {
      message.error(error?.response?.data?.message || '获取工作区失败，请稍后重试。')
    }
  } finally {
    workspaceLoading.value = false
  }
}

const loadWorkspaceDetail = async (workspaceId) => {
  if (!workspaceId) {
    workspaceDetail.value = null
    members.value = []
    return
  }
  memberLoading.value = true
  try {
    const detailRes = await workspaceApi.detail(workspaceId)
    const detail = resolveResponse(detailRes, null)
    const normalizedDetail = detail
      ? {
          ...detail,
          id: detail.id ?? detail.Id ?? workspaceId,
          name: detail.name ?? detail.Name ?? '未命名工作区',
          description: detail.description ?? detail.Description ?? '',
          isOwner: detail.isOwner ?? detail.IsOwner ?? false,
          noteCount: detail.noteCount ?? detail.NoteCount ?? 0
        }
      : { id: workspaceId }
    workspaceDetail.value = normalizedDetail
    const memberRes = await memberApi.list(workspaceId)
    const rawMembers = resolveResponse(memberRes, [])
    members.value = Array.isArray(rawMembers)
      ? rawMembers.map((item) => {
          const id = item.id ?? item.userId ?? item.UserId
          const username = item.username ?? item.Username ?? ''
          const nickname = item.nickname ?? item.Nickname ?? ''
          return {
            ...item,
            id,
            username,
            nickname,
            displayName: nickname ? `${nickname}（${username}）` : username,
            canEdit: item.canEdit ?? item.CanEdit ?? false,
            canShare: item.canShare ?? item.CanShare ?? false,
            isOwner: item.isOwner ?? item.IsOwner ?? item.role === 'Owner',
            isSelf: item.isSelf ?? item.IsSelf ?? false
          }
        })
      : []
  } catch (error) {
    console.error('[WorkspacePanel] loadWorkspaceDetail error:', error)
    if (handleUnauthorized(error, '当前账号没有权限查看该工作区详情。')) {
      workspaceDetail.value = null
      members.value = []
    } else {
      message.error(error?.response?.data?.message || '获取工作区详情失败。')
    }
  } finally {
    memberLoading.value = false
  }
}

const loadInvitations = async () => {
  invitationLoading.value = true
  try {
    const response = await invitationApi.myInvitations()
    const list = resolveResponse(response, [])
    invitations.value = Array.isArray(list)
      ? list.map((item) => {
          const rawId =
            item.invitationId ??
            item.InvitationId ??
            item.id ??
            item.Id ??
            item.invitationID ??
            item.InvitationID
          const numericId =
            rawId !== null && rawId !== undefined ? Number(rawId) : null
          const id = Number.isFinite(numericId) ? numericId : rawId
          const rawWorkspaceId =
            item.workspaceId ?? item.WorkspaceId ?? item.workspace?.id ?? null
          const numericWorkspaceId =
            rawWorkspaceId !== null && rawWorkspaceId !== undefined
              ? Number(rawWorkspaceId)
              : null
          return {
            ...item,
            id,
            invitationId: id,
            workspaceId: Number.isFinite(numericWorkspaceId)
              ? numericWorkspaceId
              : rawWorkspaceId,
            workspaceName:
              item.workspaceName ??
              item.WorkspaceName ??
              item.workspace?.name ??
              '',
            inviterName:
              item.inviterUsername ??
              item.InviterUsername ??
              item.inviterName ??
              item.InviterName ??
              item.ownerName ??
              item.OwnerName ??
              '',
            status: item.status ?? item.Status ?? 'Pending',
            createdAt:
              item.createdAt ??
              item.createdTime ??
              item.createTime ??
              item.created_at ??
              null
          }
        })
      : []
  } catch (error) {
    console.error('[WorkspacePanel] loadInvitations error:', error)
    if (handleUnauthorized(error, '当前账号没有权限查看邀请信息。')) {
      invitations.value = []
    } else {
      message.error(error?.response?.data?.message || '获取邀请信息失败。')
    }
  } finally {
    invitationLoading.value = false
  }
}

const initialize = async () => {
  await Promise.all([loadWorkspaces(), loadInvitations()])
}

const selectWorkspace = async (workspaceId) => {
  const resolved =
    workspaceId !== null && workspaceId !== undefined
      ? Number(workspaceId)
      : null
  const nextId = Number.isFinite(resolved) ? resolved : workspaceId
  if (nextId === activeWorkspaceId.value) return
  activeWorkspaceId.value = nextId
  await loadWorkspaceDetail(nextId)
}

const handleCreate = async () => {
  if (!createForm.name.trim()) {
    message.warning('请输入工作区名称')
    return
  }
  createSubmitting.value = true
  try {
    await workspaceApi.create({
      name: createForm.name.trim(),
      description: createForm.description.trim()
    })
    message.success('工作区创建成功')
    showCreate.value = false
    createForm.name = ''
    createForm.description = ''
    await loadWorkspaces()
  } catch (error) {
    console.error('[WorkspacePanel] handleCreate error:', error)
    message.error(error?.response?.data?.message || '创建失败，请稍后重试。')
  } finally {
    createSubmitting.value = false
  }
}

const handleInvite = async () => {
  if (!activeWorkspaceId.value) {
    message.warning('请先选择一个工作区')
    return
  }
  if (!inviteForm.username.trim()) {
    message.warning('请输入被邀请人的用户名')
    return
  }
  inviteSubmitting.value = true
  try {
    const numericId =
      activeWorkspaceId.value !== null && activeWorkspaceId.value !== undefined
        ? Number(activeWorkspaceId.value)
        : null
    const workspaceId = Number.isFinite(numericId)
      ? numericId
      : activeWorkspaceId.value
    await invitationApi.send(workspaceId, {
      inviteeUsername: inviteForm.username.trim(),
      canEdit: inviteForm.canEdit,
      canShare: inviteForm.canShare
    })
    message.success('邀请已发送')
    showInvite.value = false
    inviteForm.username = ''
    inviteForm.canEdit = true
    inviteForm.canShare = false
    await loadInvitations()
  } catch (error) {
    console.error('[WorkspacePanel] handleInvite error:', error)
    message.error(error?.response?.data?.message || '邀请失败，请稍后重试。')
  } finally {
    inviteSubmitting.value = false
  }
}

const handleRemoveMember = (member) => {
  dialog.warning({
    title: '移除成员',
    content: `确定将 ${member.displayName || member.username} 移出工作区吗？`,
    positiveText: '移除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await memberApi.remove(activeWorkspaceId.value, member.id)
        message.success('成员已移除')
        await loadWorkspaceDetail(activeWorkspaceId.value)
      } catch (error) {
        console.error('[WorkspacePanel] handleRemoveMember error:', error)
        message.error(error?.response?.data?.message || '操作失败，请稍后重试。')
      }
    }
  })
}

const handlePermissionEdit = (member) => {
  permissionTarget.value = member
  permissionForm.canEdit = Boolean(member.canEdit)
  permissionForm.canShare = Boolean(member.canShare)
  showPermission.value = true
}

const handlePermissionSave = async () => {
  if (!permissionTarget.value) return
  permissionSubmitting.value = true
  try {
    await memberApi.updatePermissions(activeWorkspaceId.value, permissionTarget.value.id, {
      canEdit: permissionForm.canEdit,
      canShare: permissionForm.canShare
    })
    message.success('权限更新成功')
    showPermission.value = false
    permissionTarget.value = null
    await loadWorkspaceDetail(activeWorkspaceId.value)
  } catch (error) {
    console.error('[WorkspacePanel] handlePermissionSave error:', error)
    message.error(error?.response?.data?.message || '更新权限失败。')
  } finally {
    permissionSubmitting.value = false
  }
}

const handleLeave = () => {
  if (!activeWorkspaceId.value) return
  dialog.warning({
    title: '退出工作区',
    content: '确认退出当前工作区吗？',
    positiveText: '退出',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await memberApi.leave(activeWorkspaceId.value)
        message.success('已退出工作区')
        await loadWorkspaces()
      } catch (error) {
        console.error('[WorkspacePanel] handleLeave error:', error)
        message.error(error?.response?.data?.message || '退出失败，请稍后重试。')
      }
    }
  })
}

const handleDelete = () => {
  if (!activeWorkspaceId.value) return
  dialog.error({
    title: '删除工作区',
    content: '删除后将无法恢复，确认删除该工作区吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await workspaceApi.remove(activeWorkspaceId.value)
        message.success('工作区已删除')
        await loadWorkspaces()
      } catch (error) {
        console.error('[WorkspacePanel] handleDelete error:', error)
        message.error(error?.response?.data?.message || '删除失败，请稍后重试。')
      }
    }
  })
}

const resolveInvitationId = (source) => {
  if (source === null || source === undefined) return null
  if (typeof source === 'number') return Number.isFinite(source) ? source : null
  if (typeof source === 'string') {
    const trimmed = source.trim()
    if (!trimmed) return null
    const numeric = Number(trimmed)
    return Number.isFinite(numeric) ? numeric : trimmed
  }
  if (typeof source === 'object') {
    const raw =
      source.invitationId ??
      source.InvitationId ??
      source.id ??
      source.Id ??
      source.invitationID ??
      source.InvitationID ??
      null
    if (raw === null || raw === undefined) return null
    const numeric = Number(raw)
    return Number.isFinite(numeric) ? numeric : raw
  }
  return null
}

const handleAccept = async (invitation) => {
  const invitationId = resolveInvitationId(invitation)
  if (!invitationId) {
    message.warning('邀请信息无效')
    return
  }
  try {
    await invitationApi.accept(invitationId)
    message.success('邀请已接受')
    await loadInvitations()
    await loadWorkspaces()
  } catch (error) {
    console.error('[WorkspacePanel] handleAccept error:', error)
    message.error(error?.response?.data?.message || '操作失败，请稍后重试。')
  }
}

const handleReject = async (invitation) => {
  const invitationId = resolveInvitationId(invitation)
  if (!invitationId) {
    message.warning('邀请信息无效')
    return
  }
  try {
    await invitationApi.reject(invitationId)
    message.success('邀请已拒绝')
    await loadInvitations()
  } catch (error) {
    console.error('[WorkspacePanel] handleReject error:', error)
    message.error(error?.response?.data?.message || '操作失败，请稍后重试。')
  }
}

const handleRevoke = async (invitation) => {
  const invitationId = resolveInvitationId(invitation)
  if (!invitationId) {
    message.warning('邀请信息无效')
    return
  }
  try {
    await invitationApi.revoke(invitationId)
    message.success('邀请已撤销')
    await loadInvitations()
  } catch (error) {
    console.error('[WorkspacePanel] handleRevoke error:', error)
    message.error(error?.response?.data?.message || '操作失败，请稍后重试。')
  }
}

const formatTime = (value) => {
  if (!value) return '--'
  try {
    return format(new Date(value), 'yyyy-MM-dd HH:mm')
  } catch {
    return value
  }
}

const isOwner = computed(() => Boolean(workspaceDetail.value?.isOwner))

const memberColumns = computed(() => {
  const columns = [
    {
      title: '成员',
      key: 'displayName'
    },
    {
      title: '权限',
      key: 'permissions',
      render(row) {
        if (row.isOwner || row.role === 'Owner') {
          return '拥有者'
        }
        const tags = []
        if (row.canEdit) tags.push('可编辑')
        if (row.canShare) tags.push('可邀请')
        return tags.length ? tags.join(' / ') : '只读'
      }
    }
  ]

  columns.push({
    title: '操作',
    key: 'actions',
    width: 180,
    render(row) {
      const buttons = []
      if (isOwner.value && !row.isOwner && row.id !== permissionTarget.value?.id) {
        buttons.push(
          h(
            NButton,
            {
              size: 'tiny',
              quaternary: true,
              onClick: () => handlePermissionEdit(row)
            },
            { default: () => '权限' }
          )
        )
        buttons.push(
          h(
            NButton,
            {
              size: 'tiny',
              quaternary: true,
              type: 'error',
              onClick: () => handleRemoveMember(row)
            },
            { default: () => '移除' }
          )
        )
      } else if (row.isSelf && !isOwner.value) {
        buttons.push(
          h(
            NButton,
            {
              size: 'tiny',
              quaternary: true,
              onClick: handleLeave
            },
            { default: () => '退出' }
          )
        )
      }
      return buttons.length ? buttons : '-' }
  })

  return columns
})

const inviteStatus = (status) => {
  if (!status) return '待处理'
  const map = {
    Pending: '待处理',
    Accepted: '已接受',
    Rejected: '已拒绝',
    Revoked: '已撤销'
  }
  return map[status] || status
}

const isPending = (invite) => !invite.status || invite.status === 'Pending'
const canRevoke = (invite) => Boolean(invite.isSender || invite.isOwner || invite.canRevoke)

onMounted(() => {
  initialize()
})
</script>

<style scoped>
.workspace-panel {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.workspace-content {
  display: flex;
  gap: 16px;
}

.workspace-list {
  width: 40%;
  max-height: 420px;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.workspace-item {
  border-radius: 12px;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.workspace-item.active {
  border-color: #9ca3af;
}

.workspace-item:hover {
  background: #f9fafb;
}

.workspace-detail {
  flex: 1;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.detail-meta h4 {
  margin: 0;
  font-size: 20px;
}

.detail-meta p {
  margin: 6px 0 0;
  color: #64748b;
}

.meta-tags {
  display: flex;
  gap: 8px;
}

.detail-actions {
  display: flex;
  justify-content: space-between;
}

.invite-timeline {
  max-height: 420px;
  overflow: auto;
}

.invite-desc,
.invite-status {
  margin: 0 0 8px;
  color: #475569;
}
</style>







