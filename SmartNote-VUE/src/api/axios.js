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
          safeMessage('warning', '登录状态已失效，请重新登录。')
          localStorage.removeItem('token')
          window.location.href = '/login'
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
