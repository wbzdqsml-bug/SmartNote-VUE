import { defineStore } from 'pinia'
import userApi from '@/api/user'

const PROFILE_FETCH_ENABLED = import.meta.env.VITE_ENABLE_PROFILE === 'true'

const readProfileFromStorage = () => {
  try {
    const raw = localStorage.getItem('profile')
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.warn('[userStore] 读取本地用户信息失败：', error)
    return null
  }
}

const resolvePayload = (response, fallback = {}) => {
  if (!response) return fallback
  if (typeof response.data !== 'undefined') {
    const data = response.data
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data ?? fallback
    }
    return data ?? fallback
  }
  return fallback
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    profile: readProfileFromStorage(),
    loading: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token)
  },
  actions: {
    setToken(token) {
      this.token = token || ''
      if (this.token) {
        localStorage.setItem('token', this.token)
      } else {
        localStorage.removeItem('token')
      }
    },
    setProfile(profile) {
      if (profile) {
        this.profile = { ...profile }
        try {
          localStorage.setItem('profile', JSON.stringify(this.profile))
        } catch (error) {
          console.warn('[userStore] 储存本地用户信息失败：', error)
        }
      } else {
        this.profile = null
        localStorage.removeItem('profile')
      }
    },
    logout() {
      this.setToken('')
      this.setProfile(null)
    },
    async fetchProfile() {
      if (!this.token) return null
      if (!PROFILE_FETCH_ENABLED) {
        return this.profile
      }
      this.loading = true
      try {
        const response = await userApi.profile()
        const payload = resolvePayload(response, null)
        if (payload) {
          this.setProfile(payload)
        }
        return payload
      } catch (error) {
        if (error?.response?.status !== 404) {
          console.warn('获取用户资料失败', error)
        }
        return null
      } finally {
        this.loading = false
      }
    }
  }
})
