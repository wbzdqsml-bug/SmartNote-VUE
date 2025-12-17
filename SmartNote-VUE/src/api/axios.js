import axios from 'axios'

const BASE_URL =
  import.meta.env.MODE === 'development' ? '/api' : 'http://localhost:5201/api'

// ------------------------------
// 安全提示
// ------------------------------
const safeMessage = (type, text) => {
  if (!text) return
  if (typeof window === 'undefined') return
  const messageApi = window.$message
  messageApi?.[type]?.(text)
}

// ------------------------------
// 判断是否需要强制退出登录
// ------------------------------
const shouldForceReauth = (response, config) => {
  if (!response) return false

  const data = response.data || {}
  const code = String(data?.code || data?.errorCode || '').toUpperCase()

  // ⭐ 后端会返回这些 code → 必须退出
  if (['TOKEN_EXPIRED', 'TOKEN_CHANGED', 'INVALID_TOKEN'].includes(code)) {
    return true
  }

  // ⭐ 权限相关的 code → 不退出
  const permissionCodes = [
    'FORBIDDEN',
    'NO_PERMISSION',
    'PERMISSION_DENIED',
    'WORKSPACE_DENIED'
  ]

  if (permissionCodes.includes(code)) return false

  // ⭐ message 字段判断（兼容一些接口）
  const msg = String(data?.message || data?.error || '').toLowerCase()

  if (msg.includes('权限') || msg.includes('permission') || msg.includes('forbidden')) {
    return false
  }

  if (msg.includes('登录') || msg.includes('login') || msg.includes('token')) {
    return true
  }

  // auth 接口报错 → 强制退出
  if (config?.url && config.url.includes('/auth/')) return true

  // WWW-Authenticate 判断（备用）
  const wwwAuth = String(
    response.headers?.['www-authenticate'] || response.headers?.['WWW-Authenticate'] || ''
  )
  if (wwwAuth.toLowerCase().includes('invalid_token')) {
    return true
  }

  return false
}

// ------------------------------
// axios 实例
// ------------------------------
const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ------------------------------
// 请求拦截器：自动带上 Token
// ------------------------------
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

// ------------------------------
// 响应拦截器
// ------------------------------
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error

    // 网络层错误（服务器没返回 JSON）
    if (!response) {
      safeMessage('error', '网络异常，请检查网络连接后重试。')
      return Promise.reject(error)
    }

    const { status, data } = response
    const apiMessage = data?.message || data?.error || ''

    switch (status) {
      case 400:
        safeMessage('error', apiMessage || '请求参数无效，请检查后重试。')
        break

      case 401:
        // ⭐ 核心：是否是令牌失效？
        if (shouldForceReauth(response, config)) {
          safeMessage('warning', '登录状态已失效，请重新登录。')
          localStorage.removeItem('token')
          localStorage.removeItem('profile')
          window.location.href = '/login'
        } else {
          safeMessage('error', apiMessage || '当前操作没有权限。')
        }
        break

      case 403:
        safeMessage('error', apiMessage || '没有权限执行此操作。')
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

    return Promise.reject(error)
  }
)

export default instance
