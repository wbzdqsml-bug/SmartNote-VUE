/**
 * 文件说明：状态管理模块（chatStore）
 * - 主要职责：封装 Pinia 状态、getter 与 action，供页面与组件复用。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import chatApi from '@/api/chat'
import { useUserStore } from '@/store/userStore'

export const useChatStore = defineStore('chat', () => {
  const connection = ref(null)
  const isConnected = ref(false)
  const currentMessages = ref([])
  const activeSession = ref(null) // { type: 'private' | 'workspace', id: number, name: string }
  const currentUserId = ref(0)
  const unreadCounts = ref({}) // key: 'private_{id}' or 'workspace_{id}'
  const userStore = useUserStore()

  const getStoredToken = () => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
    const rawToken = userStore.token || storedToken || ''
    return typeof rawToken === 'string' ? rawToken.replace(/^Bearer\s+/i, '') : ''
  }

  const resolveHubUrl = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'development' ? '/api' : 'http://localhost:5201/api')
    let hubUrl = '/hubs/chat'
    if (apiBase.startsWith('http')) {
      const baseUrl = apiBase.replace(/\/api\/?$/, '')
      hubUrl = `${baseUrl}/hubs/chat`
    }
    return hubUrl
  }

  const isAuthError = (error) => {
    if (!error) return false
    const status = Number(error?.status || error?.statusCode || error?.httpStatus || 0)
    if (status === 401) return true
    const msg = (error?.message || error?.error || '').toString().toLowerCase()
    return msg.includes('401') || msg.includes('unauthorized') || msg.includes('authentication')
  }

  const forceReauthenticate = () => {
    userStore.setToken('')
    userStore.setProfile(null)
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  const handleSignalRError = (error) => {
    if (isAuthError(error)) {
      forceReauthenticate()
    }
  }

  // 初始化连接
  const connect = async () => {
    if (isConnected.value) return

    if (connection.value) {
      try {
        await connection.value.stop()
      } catch (stopError) {
        console.warn('Failed to stop previous SignalR connection', stopError)
      }
      connection.value = null
    }

    const profile = userStore.profile
    if (profile) {
      // 兼容后端可能返回的大小写不同 (id / Id / userId / UserId)
      currentUserId.value = profile.id ?? profile.Id ?? profile.userId ?? profile.UserId ?? 0
    }

    const hubUrl = resolveHubUrl()
    connection.value = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => getStoredToken()
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build()

    // 监听连接状态变化
    connection.value.onclose((error) => {
      isConnected.value = false
      // 只有在非手动断开的情况下才处理错误
      if (error) {
        handleSignalRError(error)
      }
    })
    connection.value.onreconnecting((error) => {
      isConnected.value = false
      handleSignalRError(error)
    })
    connection.value.onreconnected(() => { 
      isConnected.value = true 
      // 待重连后刷新状态，例如重新拉取未读
    })

    // 监听私聊消息
    connection.value.on('ReceivePrivateMessage', (senderId, content, sentAt) => {
      handleIncomingMessage({ 
        type: 'private', 
        senderId, 
        content, 
        sentAt,
        isSelf: String(senderId) === String(currentUserId.value)
      })
    })

    // 监听工作区消息
    connection.value.on('ReceiveWorkspaceMessage', (workspaceId, senderId, content, sentAt) => {
      handleIncomingMessage({ 
        type: 'workspace', 
        workspaceId, 
        senderId, 
        content, 
        sentAt,
        isSelf: String(senderId) === String(currentUserId.value)
      })
    })

    try {
      await connection.value.start()
      isConnected.value = true
      console.log('SignalR Connected')
    } catch (err) {
      console.error('SignalR Connection Error:', err)
      handleSignalRError(err)
    }
  }

  // [修改] 断开连接 - 增加 try-catch 防止报错
  const disconnect = async () => {
    if (connection.value) {
      try {
        await connection.value.stop()
      } catch (err) {
        // 忽略断开连接时的错误（例如连接已关闭）
        console.warn('SignalR disconnect warning (can be ignored):', err)
      } finally {
        isConnected.value = false
        connection.value = null
      }
    }
  }

  // 处理收到的消息
  const handleIncomingMessage = (msg) => {
    // 判断消息是否属于当前打开的会话
    const isCurrentPrivate = activeSession.value?.type === 'private' && 
                             msg.type === 'private' && 
                             (msg.senderId === activeSession.value.id || msg.isSelf)
    
    const isCurrentWorkspace = activeSession.value?.type === 'workspace' && 
                               msg.type === 'workspace' && 
                               msg.workspaceId === activeSession.value.id

    if (isCurrentPrivate || isCurrentWorkspace) {
      currentMessages.value.push(msg)
    } else if (!msg.isSelf) {
      // 只有非当前会话，且不是自己发的消息，才增加未读数
      const key = msg.type === 'private' ? `private_${msg.senderId}` : `workspace_${msg.workspaceId}`
      unreadCounts.value[key] = (unreadCounts.value[key] || 0) + 1
    }
  }

  // 清除指定会话的未读数
  const clearUnread = (type, id) => {
    const key = type === 'private' ? `private_${id}` : `workspace_${id}`
    if (unreadCounts.value[key]) {
      unreadCounts.value[key] = 0
    }
  }

  // 切换当前会话并加载历史记录
  const setActiveSession = async (session) => {
    activeSession.value = session
    currentMessages.value = [] // 清空旧消息
    
    try {
      const res = session.type === 'private' 
        ? await chatApi.getPrivateHistory(session.id) 
        : await chatApi.getWorkspaceHistory(session.id)
      
      // 兼容后端可能返回 { data: [...] } 或直接返回数组的情况
      const history = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      
      currentMessages.value = history.map(m => {
        const senderId = m.senderId ?? m.SenderId ?? m.Sender?.id ?? m.Sender?.Id
        return {
          ...m,
          senderId,
          content: m.content ?? m.Content ?? m.message ?? m.Message,
          sentAt: m.sentAt ?? m.SentAt ?? m.createTime ?? m.CreateTime,
          type: session.type,
          isSelf: String(senderId) === String(currentUserId.value)
        }
      })
    } catch (error) {
      console.error('Failed to load history', error)
    }
  }

  // 发送消息
  const sendMessage = async (content) => {
    if (!connection.value || !activeSession.value) return

    // 乐观更新：先构建消息对象
    const tempMessage = {
      senderId: currentUserId.value,
      content,
      sentAt: new Date().toISOString(),
      isSelf: true,
      type: activeSession.value.type
    }

    try {
      if (activeSession.value.type === 'private') {
        await connection.value.invoke('SendPrivateMessage', activeSession.value.id, content)
        // 乐观更新：立即显示在界面上
        currentMessages.value.push(tempMessage)
      } else {
        await connection.value.invoke('SendWorkspaceMessage', activeSession.value.id, content)
        // 工作区消息通常等待服务器广播回来，或者也可以在此处做乐观更新
      }
    } catch (error) {
      console.error('Send message failed', error)
      throw error
    }
  }

  return {
    isConnected,
    currentMessages,
    activeSession,
    currentUserId,
    unreadCounts,
    connect,
    disconnect,
    clearUnread,
    setActiveSession,
    sendMessage
  }
})