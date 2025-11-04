import { useUserStore } from '../store/userStore'
import jwtDecode from 'jwt-decode'

/**
 * 检查用户是否已登录
 */
export function isAuthenticated() {
  const store = useUserStore()
  return !!store.token
}

/**
 * 获取当前登录用户的 ID（从 JWT token 中解析）
 */
export function getUserId() {
  const store = useUserStore()
  if (!store.token) return null
  try {
    const payload = jwtDecode(store.token)
    return parseInt(payload?.sub || payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"])
  } catch {
    return null
  }
}

/**
 * 自动跳转登录页（用于 router 守卫或接口未授权时）
 */
export function redirectToLogin(router) {
  const store = useUserStore()
  store.logout()
  router.push('/login')
}
