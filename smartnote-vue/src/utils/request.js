// src/utils/request.js
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user' // 1. 导入 Pinia user store

// 2. 创建 axios 实例
const service = axios.create({
  // VVVVVV 3. (!!重要!!) 确保 baseURL 指向你的后端 API VVVVVV
  // 请将其替换为你的 SmartNote_WebAPI 项目实际运行的 HTTPS 端口
  baseURL: 'https://localhost:7054', // 例如：如果后端运行在 7001 端口
  // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  timeout: 10000 // 请求超时时间
})

// 4. 请求拦截器 (Request Interceptor)
// 作用：在每个请求发送前，检查用户是否登录，并自动在请求头中附加 JWT Token
service.interceptors.request.use(
  (config) => {
    // !!! 注意：useUserStore() 必须在函数内部调用，因为 store 只有在 Vue 应用上下文创建后才可用 !!!
    const userStore = useUserStore()
    if (userStore.isAuthenticated && userStore.token) {
      // 让每个请求携带自定义 token
      // Bearer 后有一个空格！
      config.headers['Authorization'] = 'Bearer ' + userStore.token
    }
    return config
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

// 5. 响应拦截器 (Response Interceptor)
// 作用：统一处理后端返回的成功数据和错误信息
service.interceptors.response.use(
  (response) => {
    // 后端成功 (HTTP 状态码 2xx) 时，直接返回 response.data
    // 我们的后端 { token: "...", message: "..." } 或 { message: "..." }
    return response.data
  },
  (error) => {
    let message = '网络错误，请稍后再试。'

    if (error.response) {
      // 后端返回了错误响应 (HTTP 状态码 4xx, 5xx)
      const data = error.response.data
      if (data && data.message) {
        // 对应我们 AuthController 返回的 { Message = "..." }
        message = data.message
      } else if (error.response.status === 400 && data.errors) {
        // 对应 [ApiController] 自动模型验证失败返回的格式
        // (我们只取第一个错误)
        const errors = data.errors
        const firstErrorKey = Object.keys(errors)[0]
        message = errors[firstErrorKey][0] || '输入数据验证失败'
      } else if (error.response.status === 401) {
        // 401 未授权：通常意味着 Token 无效、过期或权限不足
        message = '登录已过期或权限不足，请重新登录。'
        // (重要) 在这里强制登出，清除本地存储的 token 和用户信息
        const userStore = useUserStore()
        userStore.logout()
        // (可选) 强制刷新页面，让路由守卫重定向到登录页
        // location.reload()
        // 或者直接跳转到登录页 (如果路由已加载)
        // router.push('/login') // 注意：这里直接引用 router 可能需要额外配置
      } else {
        // 其他未处理的后端错误
        message = `错误 ${error.response.status}: ${data.title || error.response.statusText || '未知服务器错误'}`
      }
    } else if (error.request) {
      // 请求已发出，但未收到响应 (例如后端未启动、网络中断、CORS 错误)
      message = '无法连接到服务器，请检查后端是否已启动并配置了 CORS。'
      console.error('Network Error:', error.message)
    } else {
      // 其他错误 (例如设置请求时出错)
      message = error.message
    }

    ElMessage.error(message) // 统一弹出错误提示

    // 将错误继续抛出，让 .vue 页面中的 catch 块能捕获
    return Promise.reject(new Error(message))
  }
)

export default service
