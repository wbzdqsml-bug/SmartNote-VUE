// src/stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, registerApi } from '@/api/auth' // 1. 导入 auth API

export const useUserStore = defineStore('user', () => {
  // --- State (状态) ---
  // 1. Token：从 localStorage 读取，如果没有则为空字符串
  const token = ref(localStorage.getItem('token') || '')
  // 2. 用户信息：从 localStorage 读取，如果没有则为空对象
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo')) || {})

  // --- Getters (计算属性) ---
  // 方便获取用户ID、用户名、昵称
  const userId = computed(() => userInfo.value?.userId || 0)
  const username = computed(() => userInfo.value?.username || 'Guest')
  const nickname = computed(() => userInfo.value?.nickname || 'Guest')
  // 检查是否已登录 (同时有 token 和 userId)
  const isAuthenticated = computed(() => !!token.value && userId.value > 0)


  // --- Actions (方法) ---

  // (私有辅助方法) 设置登录状态并保存到 localStorage
  const setLoginState = (data) => {
    // data 应该是后端返回的 { token, userId, username, nickname }
    token.value = data.token
    userInfo.value = {
      userId: data.userId,
      username: data.username,
      nickname: data.nickname // 如果后端没有返回 nickname，可能为空
    }
    localStorage.setItem('token', data.token)
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  // (私有辅助方法) 清除登录状态并从 localStorage 移除
  const clearLoginState = () => {
    token.value = ''
    userInfo.value = {}
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  // Action: 执行用户登录
  const login = async (credentials) => {
    // credentials 是 { username, password }
    const response = await loginApi(credentials)

    // response 应该是 { token, userId, username, nickname }
    setLoginState(response)

    return response.message || '登录成功！' // 登录成功，返回后端消息（如果有）
  }

  // Action: 执行用户注册
  const register = async (userData) => {
    // userData 是 { username, password, confirmPassword }
    const response = await registerApi({
        username: userData.username,
        password: userData.password
    })

    // response 应该是 { message: "注册成功！" }
    return response.message || '注册成功！'
  }

  // Action: 执行用户登出
  const logout = () => {
    clearLoginState()
  }

  // 返回所有 state, getters 和 actions
  return {
    token,
    userInfo,
    userId,
    username,
    nickname,
    isAuthenticated,
    login,
    register,
    logout
  }
})
