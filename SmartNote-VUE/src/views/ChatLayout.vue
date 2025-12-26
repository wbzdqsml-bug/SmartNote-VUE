<template>
  <div class="chat-layout">
    <!-- 连接状态指示器 -->
    <div v-if="isReady && !chatStore.isConnected" class="connection-banner">
      <n-alert type="error" :show-icon="true" :bordered="false" class="connection-alert">
        网络连接已断开，正在尝试重连...
      </n-alert>
    </div>

    <!-- 左侧侧边栏 -->
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <n-tabs type="segment" v-model:value="activeTab" size="small">
          <n-tab-pane name="friends" tab="好友" />
          <n-tab-pane name="workspaces" tab="工作区" />
        </n-tabs>
      </div>

      <div class="sidebar-list">
        <n-spin :show="loadingList">
          <!-- 好友列表 -->
          <div v-if="activeTab === 'friends'">
            <div 
              class="list-item manage-item" 
              @click="showFriendManager = true"
            >
              <div class="item-avatar icon-avatar"><n-icon :component="PersonAddOutline" /></div>
              <div class="item-content">
                <div class="item-title">新的朋友 / 管理</div>
              </div>
            </div>

            <div 
              v-for="friend in friends" 
              :key="friend.id" 
              class="list-item"
              :class="{ active: isSessionActive('private', friend.id) }"
              @click="selectSession('private', friend)"
            >
              <n-badge :value="chatStore.unreadCounts[`private_${friend.id}`]" :max="99">
                <n-avatar size="medium" :src="friend.avatar" round fallback-src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg" />
              </n-badge>
              <div class="item-content">
                <div class="item-title">{{ friend.nickname || friend.username }}</div>
                <div class="item-subtitle">点击开始聊天</div>
              </div>
            </div>
          </div>

          <!-- 工作区列表 -->
          <div v-if="activeTab === 'workspaces'">
            <div 
              v-for="ws in workspaces" 
              :key="ws.id" 
              class="list-item"
              :class="{ active: isSessionActive('workspace', ws.id) }"
              @click="selectSession('workspace', ws)"
            >
              <n-badge :value="chatStore.unreadCounts[`workspace_${ws.id}`]" :max="99">
                <n-avatar size="medium" shape="square" :style="{ backgroundColor: ws.color || '#2080f0' }">
                  {{ ws.name.charAt(0) }}
                </n-avatar>
              </n-badge>
              <div class="item-content">
                <div class="item-title">{{ ws.name }}</div>
                <div class="item-subtitle">工作区群聊</div>
              </div>
            </div>
          </div>
        </n-spin>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-main">
      <template v-if="chatStore.activeSession">
        <!-- 聊天头部 -->
        <div class="chat-header">
          <div class="header-title">{{ chatStore.activeSession.name }}</div>
          <div class="header-actions">
            <n-button quaternary circle size="small"><template #icon><n-icon :component="EllipsisHorizontal" /></template></n-button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="message-area" ref="messageContainer" @scroll="handleScroll">
          <div 
            v-for="(msg, index) in chatStore.currentMessages" 
            :key="index" 
            class="message-row"
            :class="{ 'message-self': msg.isSelf }"
          >
            <n-avatar 
              v-if="!msg.isSelf" 
              size="small" 
              round 
              class="msg-avatar"
              src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg" 
            />
            <div class="message-content-wrapper">
              <div class="message-bubble">
                {{ msg.content }}
              </div>
              <div class="message-time">{{ formatTime(msg.sentAt) }}</div>
            </div>
            <n-avatar v-if="msg.isSelf" size="small" round class="msg-avatar" src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg" />
          </div>
        </div>

        <!-- 新消息提示 -->
        <div v-if="showNewMessageTip" class="new-message-tip" @click="scrollToBottom">
          <n-button round type="primary" size="small" class="tip-btn">
            <template #icon><n-icon :component="ArrowDown" /></template>
            有新消息
          </n-button>
        </div>

        <!-- 输入框 -->
        <div class="input-area">
          <n-input
            v-model:value="inputText"
            type="textarea"
            placeholder="按 Enter 发送"
            :autosize="{ minRows: 1, maxRows: 4 }"
            @keydown.enter.prevent="handleSend"
            class="chat-input"
          />
          <div class="input-actions">
            <n-button type="primary" size="small" @click="handleSend" :disabled="!inputText.trim()">发送</n-button>
          </div>
        </div>
      </template>

      <div v-else class="empty-chat">
        <n-empty description="选择一个联系人开始聊天" size="large" />
      </div>
    </div>

    <!-- 好友管理弹窗 -->
    <n-modal v-model:show="showFriendManager" preset="card" style="width: 600px" title="好友管理">
      <FriendManager @chat="handleStartChatFromManager" />
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useChatStore } from '@/store/chatStore'
import chatApi from '@/api/chat'
import FriendManager from '@/components/FriendManager.vue'
import { NTabs, NTabPane, NAvatar, NInput, NButton, NIcon, NSpin, NEmpty, NModal, NBadge, useMessage, NAlert } from 'naive-ui'
import { PersonAddOutline, EllipsisHorizontal, ArrowDown } from '@vicons/ionicons5'
import { format } from 'date-fns'
import { resolveStaticUrl } from '@/api/resource'

const chatStore = useChatStore()
const activeTab = ref('friends')
const friends = ref([])
const workspaces = ref([])
const loadingList = ref(false)
const inputText = ref('')
const messageContainer = ref(null)
const showFriendManager = ref(false)
const isReady = ref(false)
const message = useMessage()
const showNewMessageTip = ref(false)
const isUserAtBottom = ref(true)

// 加载列表数据
const loadLists = async () => {
  loadingList.value = true
  try {
    const [friendsRes, wsRes] = await Promise.all([
      chatApi.getFriends(),
      chatApi.getWorkspaces() // 假设有此接口
    ])
    friends.value = (friendsRes.data.data || friendsRes.data || []).map(item => {
      const id = item.id ?? item.Id ?? item.friendId ?? item.FriendId ?? item.userId ?? item.UserId
      return {
        ...item,
        id: id,
        nickname: item.nickname ?? item.Nickname ?? item.username ?? item.Username,
        avatar: resolveStaticUrl(item.avatar ?? item.Avatar)
      }
    }).filter(item => item.id || item.id === 0) // 过滤掉无效 ID (保留 0)

    workspaces.value = (wsRes.data.data || wsRes.data || []).map(item => {
      return {
        ...item,
        id: item.id ?? item.Id ?? item.workspaceId ?? item.WorkspaceId,
        name: item.name ?? item.Name,
        color: item.color ?? item.Color
      }
    }).filter(item => item.id || item.id === 0)
  } catch (e) {
    console.error(e)
  } finally {
    loadingList.value = false
  }
}

const isSessionActive = (type, id) => {
  return chatStore.activeSession?.type === type && chatStore.activeSession?.id === id
}

const selectSession = async (type, item) => {
  const session = {
    type,
    id: item.id,
    name: item.nickname || item.username || item.name,
    avatar: item.avatar
  }
  chatStore.clearUnread(type, item.id) // 清除未读红点
  await chatStore.setActiveSession(session)
  showNewMessageTip.value = false // 切换会话时重置提示
  scrollToBottom()
}

const handleSend = async () => {
  const content = inputText.value.trim()
  if (!content) return
  
  try {
    await chatStore.sendMessage(content)
    inputText.value = ''
    scrollToBottom()
  } catch (e) {
    // Error handled in store
    message.error('消息发送失败')
  }
}

const handleScroll = () => {
  if (!messageContainer.value) return
  const { scrollTop, scrollHeight, clientHeight } = messageContainer.value
  // 判断是否接近底部 (阈值 50px)
  isUserAtBottom.value = scrollHeight - scrollTop - clientHeight <= 50
  
  if (isUserAtBottom.value) {
    showNewMessageTip.value = false
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
      showNewMessageTip.value = false
    }
  })
}

const handleStartChatFromManager = (friend) => {
  showFriendManager.value = false
  activeTab.value = 'friends'
  selectSession('private', friend)
}

const formatTime = (isoString) => {
  if (!isoString) return ''
  return format(new Date(isoString), 'HH:mm')
}

// 监听新消息自动滚动
watch(() => chatStore.currentMessages.length, (newLen) => {
  if (newLen === 0) return
  
  const lastMsg = chatStore.currentMessages[newLen - 1]
  
  // 如果是自己发的消息，或者用户当前就在底部，则自动滚动
  if (lastMsg.isSelf || isUserAtBottom.value) {
    scrollToBottom()
  } else {
    showNewMessageTip.value = true
  }
})

onMounted(async () => {
  try {
    await chatStore.connect()
  } finally {
    isReady.value = true
  }
  loadLists()
})

onUnmounted(() => {
  chatStore.disconnect()
})
</script>

<style scoped>
.chat-layout { display: flex; height: 100%; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #eef2f8; position: relative; }
.connection-banner { position: absolute; top: 0; left: 0; right: 0; z-index: 100; }
.connection-alert { border-radius: 0; }
.chat-sidebar { width: 260px; border-right: 1px solid #eef2f8; display: flex; flex-direction: column; background: #f9fafb; }
.sidebar-header { padding: 12px; border-bottom: 1px solid #eef2f8; }
.sidebar-list { flex: 1; overflow-y: auto; }
.list-item { display: flex; align-items: center; padding: 12px; cursor: pointer; transition: background 0.2s; gap: 12px; }
.list-item:hover { background: #f3f4f6; }
.list-item.active { background: #e0e7ff; }
.manage-item { color: #666; }
.icon-avatar { width: 40px; height: 40px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; }
.item-content { flex: 1; min-width: 0; }
.item-title { font-weight: 500; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-subtitle { font-size: 12px; color: #9ca3af; }

.chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.chat-main { position: relative; }
.chat-header { height: 60px; border-bottom: 1px solid #eef2f8; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; font-weight: 600; font-size: 16px; }
.message-area { flex: 1; overflow-y: auto; padding: 20px; background: #f9fafb; display: flex; flex-direction: column; gap: 16px; }
.message-row { display: flex; gap: 10px; max-width: 70%; }
.message-self { align-self: flex-end; flex-direction: row-reverse; }
.message-bubble { padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-break: break-word; background: #fff; border: 1px solid #e5e7eb; color: #374151; }
.message-self .message-bubble { background: #2080f0; color: #fff; border: none; }
.message-time { font-size: 10px; color: #9ca3af; margin-top: 4px; text-align: right; }
.input-area { padding: 16px; border-top: 1px solid #eef2f8; background: #fff; }
.input-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
.empty-chat { flex: 1; display: flex; align-items: center; justify-content: center; background: #f9fafb; }
.new-message-tip { position: absolute; bottom: 130px; right: 20px; z-index: 10; }
.new-message-tip .tip-btn { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
</style>
