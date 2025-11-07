import axios from 'axios'

const BASE_URL =
  import.meta.env.MODE === 'development'
    ? 'https://localhost:7079/api'
    : 'https://your-production-domain.com/api'

const safeMessage = (type, text) => {
  if (!text) return
  if (typeof window === 'undefined') return
  const messageApi = window.$message
  messageApi?.[type]?.(text)
}

const shouldForceReauth = (response, config) => {
  if (!response) return false
  const data = response.data || {}
  const code = String(data?.code || data?.errorCode || '').toUpperCase()
  const forceCodes = ['AUTH_EXPIRED', 'TOKEN_EXPIRED', 'UNAUTHENTICATED', 'LOGIN_REQUIRED', 'INVALID_TOKEN']
  const permissionCodes = ['FORBIDDEN', 'PERMISSION_DENIED', 'NO_PERMISSION', 'WORKSPACE_DENIED']
  if (code) {
    if (permissionCodes.includes(code)) return false
    if (forceCodes.includes(code)) return true
  }

  const messageRaw = data?.message || data?.error || ''
  const message = String(messageRaw).toLowerCase()
  const mentionsPermission =
    message.includes('权限') || message.includes('permission') || message.includes('forbidden')
  if (mentionsPermission) {
    return false
  }
  if (message.includes('登录') || message.includes('login') || message.includes('token')) {
    return true
  }
  if (config?.url && config.url.includes('/auth/')) {
    return true
  }
  const wwwAuth = String(response.headers?.['www-authenticate'] || response.headers?.['WWW-Authenticate'] || '')
  if (wwwAuth.toLowerCase().includes('invalid_token')) {
    return true
  }
  // 默认视为登录状态失效，除非明确说明为权限问题
  return true
}

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error

    if (response) {
      const { status, data } = response
      const apiMessage = data?.message || data?.error || ''

      if (status === 404 && config?.url?.includes('/auth/me')) {
        return Promise.reject(error)
      }

      switch (status) {
        case 400:
          safeMessage('error', apiMessage || '请求参数无效，请检查后重试。')
          break
        case 401:
          if (shouldForceReauth(response, config)) {
            safeMessage('warning', '登录状态已失效，请重新登录。')
            localStorage.removeItem('token')
            window.location.href = '/login'
          } else {
            safeMessage('error', apiMessage || '当前操作没有权限。')
          }
          break
        case 404:
          safeMessage('warning', apiMessage || '接口未找到，请联系管理员处理。')
          break
        case 500:
          safeMessage('error', apiMessage || '服务器忙，请稍后再试。')
          break
        default:
          if (status >= 500) {
            safeMessage('error', apiMessage || '系统出现未知错误，请稍后再试。')
          } else if (apiMessage) {
            safeMessage('warning', apiMessage)
          }
      }
    } else {
      safeMessage('error', '网络异常，请检查网络连接后重试。')
    }

    return Promise.reject(error)
  }
)

export default instance
