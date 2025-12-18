<template>
  <div class="friend-manager">
    <n-card title="好友管理" :bordered="false" size="small">
      <n-tabs type="line" animated>
        <!-- 好友列表 Tab -->
        <n-tab-pane name="friends" tab="我的好友">
          <div class="add-friend-bar">
            <n-input-group>
              <n-input v-model:value="searchUsername" placeholder="输入用户名添加好友" />
              <n-button type="primary" :loading="sendingRequest" @click="handleAddFriend">
                发送申请
              </n-button>
            </n-input-group>
          </div>
          
          <n-spin :show="loadingFriends">
            <n-list hoverable clickable>
              <n-list-item v-for="friend in friends" :key="friend.id">
                <template #prefix>
                  <n-avatar round :src="friend.avatar || 'https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg'" />
                </template>
                <div class="friend-info">
                  <div class="friend-name">{{ friend.nickname || friend.username }}</div>
                  <div class="friend-status">在线</div>
                </div>
                <template #suffix>
                  <n-button size="tiny" secondary @click="$emit('chat', friend)">发消息</n-button>
                </template>
              </n-list-item>
              <n-empty v-if="!friends.length" description="暂无好友" class="mt-4" />
            </n-list>
          </n-spin>
        </n-tab-pane>

        <!-- 好友申请 Tab -->
        <n-tab-pane name="requests" tab="好友申请">
          <template #tab>
            好友申请
            <n-badge :value="requests.length" :max="99" v-if="requests.length" style="margin-left: 8px" />
          </template>
          
          <n-spin :show="loadingRequests">
            <n-list>
              <n-list-item v-for="req in requests" :key="req.id">
                <template #prefix>
                  <n-avatar round />
                </template>
                <div class="request-info">
                  <span class="req-name">{{ req.requesterName }}</span>
                  <span class="req-text">请求添加你为好友</span>
                </div>
                <template #suffix>
                  <n-space>
                    <n-button size="tiny" type="primary" @click="handleAction(req.id, 'accept')">接受</n-button>
                    <n-button size="tiny" @click="handleAction(req.id, 'reject')">拒绝</n-button>
                  </n-space>
                </template>
              </n-list-item>
              <n-empty v-if="!requests.length" description="暂无好友申请" class="mt-4" />
            </n-list>
          </n-spin>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { NCard, NTabs, NTabPane, NInput, NInputGroup, NButton, NList, NListItem, NAvatar, NSpin, NEmpty, NSpace, NBadge, useMessage } from 'naive-ui'
import chatApi from '@/api/chat'

const emit = defineEmits(['chat'])
const message = useMessage()

const friends = ref([])
const requests = ref([])
const searchUsername = ref('')
const loadingFriends = ref(false)
const loadingRequests = ref(false)
const sendingRequest = ref(false)

const fetchFriends = async () => {
  loadingFriends.value = true
  try {
    const res = await chatApi.getFriends()
    const list = res.data.data || res.data || []
    friends.value = list.map(item => ({
      ...item,
      id: item.id ?? item.Id ?? item.friendId ?? item.FriendId,
      nickname: item.nickname ?? item.Nickname,
      username: item.username ?? item.Username,
      avatar: item.avatar ?? item.Avatar
    }))
  } finally {
    loadingFriends.value = false
  }
}

const fetchRequests = async () => {
  loadingRequests.value = true
  try {
    const res = await chatApi.getRequests()
    const list = res.data.data || res.data || []
    console.log('好友申请列表原始数据:', list) // 🔍 调试：查看后端返回的真实结构
    requests.value = list.map(item => {
      // 增强 ID 解析：支持 PascalCase、camelCase 以及嵌套对象 (friendRequest.id)
      const id = item.id ?? item.Id ?? 
                 item.friendRequestId ?? item.FriendRequestId ?? 
                 item.requestId ?? item.RequestId ??
                 item.friendRequest?.id ?? item.friendRequest?.Id

      if (!id && id !== 0) console.warn('无法解析好友申请 ID:', item)
      return {
        ...item,
        id: id,
        requesterName: item.requesterName ?? item.RequesterName ?? item.username ?? item.Username ?? item.requester?.nickname ?? item.requester?.username
      }
    })
  } finally {
    loadingRequests.value = false
  }
}

const handleAddFriend = async () => {
  if (!searchUsername.value) return
  sendingRequest.value = true
  try {
    await chatApi.sendRequest(searchUsername.value)
    message.success('好友申请已发送')
    searchUsername.value = ''
  } catch (error) {
    message.error('发送失败：' + (error.response?.data?.message || '未知错误'))
  } finally {
    sendingRequest.value = false
  }
}

const handleAction = async (id, action) => {
  console.log(`发送处理请求: id=${id}, action=${action}`) // 🔍 调试：确认发送的 ID 是否正确
  if (!id && id !== 0) return message.error('无效的申请 ID')
  try {
    await chatApi.handleRequest(id, action)
    message.success(action === 'accept' ? '已添加好友' : '已拒绝申请')
    await fetchRequests()
    if (action === 'accept') await fetchFriends()
  } catch (error) {
    message.error(error.response?.data?.message || '操作失败')
  }
}

onMounted(() => {
  fetchFriends()
  fetchRequests()
})
</script>

<style scoped>
.add-friend-bar { margin-bottom: 16px; }
.friend-info, .request-info { display: flex; flex-direction: column; justify-content: center; }
.friend-name { font-weight: 500; color: #333; }
.friend-status { font-size: 12px; color: #999; }
.mt-4 { margin-top: 16px; }
</style>