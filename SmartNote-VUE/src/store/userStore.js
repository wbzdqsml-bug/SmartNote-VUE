/**
 * 文件说明：状态管理模块（userStore）
 * - 主要职责：封装 Pinia 状态、getter 与 action，供页面与组件复用。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
import { defineStore } from 'pinia'
import userApi from '@/api/user'
import request from '@/api/axios'


const PROFILE_FETCH_ENABLED = true

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

const normaliseProfile = (payload) => {
  if (!payload || typeof payload !== 'object') return payload
  const avatar = payload.avatar ?? payload.avatarUrl ?? payload.Avatar ?? payload.AvatarUrl
  if (!avatar) return payload
  return {
    ...payload,
    avatar,
    avatarUrl: payload.avatarUrl ?? payload.avatar ?? avatar
  }
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

    // ⭐⭐⭐ 前端退出登录：新增真正调用后端的退出接口
    async logout() {
      try {
        // 通知后端退出（删除 Redis 的 token:{userId}）
        await request.post('/auth/logout')
      } catch (e) {
        // 如果 token 已失效，后端可能返回 401，继续退出即可
        console.warn('[logout] 后端 token 已无效，忽略错误', e)
      }

      // 清除前端
      this.setToken('')
      this.setProfile(null)

      // 跳到登录页
      window.location.href = '/login'
    },

    // 更新基本资料 (email, phone, bio)
    async updateProfile(info) {
      try {
        await request.put('/user/profile', info)
        // 更新成功后，同步更新本地状态
        if (this.profile) {
          this.setProfile({ ...this.profile, ...info })
        }
      } catch (error) {
        console.error('[userStore] updateProfile error:', error)
        throw error
      }
    },

    // 上传头像
    async uploadAvatar(file) {
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('头像文件大小不能超过 2MB')
      }

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await request.post('/user/profile/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        const data = resolvePayload(response, {})
        const avatarUrl = data.avatarUrl ?? data.avatar
        if (avatarUrl) {
          if (this.profile) {
            this.setProfile({ ...this.profile, avatar: avatarUrl, avatarUrl })
          }
          return avatarUrl
        }
        return null
      } catch (error) {
        console.error('[userStore] uploadAvatar error:', error)
        throw error
      }
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
          this.setProfile(normaliseProfile(payload))
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
