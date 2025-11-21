import { defineStore } from 'pinia'
import tagApi from '@/api/tag'

const resolvePayload = (response, fallback = []) => {
  if (!response) return fallback
  const data = response.data ?? fallback
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data ?? fallback
  }
  return data ?? fallback
}

export const useTagStore = defineStore('tag', {
  state: () => ({
    tags: [],
    loading: false
  }),
  getters: {
    options: (state) =>
      state.tags.map((item) => ({
        label: item.name || `标签 #${item.id ?? ''}`,
        value: item.id,
        color: item.color || ''
      }))
  },
  actions: {
    async loadTags(force = false) {
      if (this.loading) return this.tags
      if (!force && this.tags.length) return this.tags
      this.loading = true
      try {
        const response = await tagApi.list()
        const payload = resolvePayload(response, [])
        this.tags = Array.isArray(payload) ? payload : []
        return this.tags
      } catch (error) {
        console.error('[tagStore] loadTags error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createTag(payload) {
      try {
        const response = await tagApi.create(payload)
        const data = resolvePayload(response, null)
        if (data && typeof data === 'object') {
          await this.loadTags(true)
          const targetId = data.id ?? data.tagId ?? data.TagId
          const matched =
            this.tags.find((item) => item.id === targetId || item.tagId === targetId) || null
          return matched || data
        }
        return null
      } catch (error) {
        console.error('[tagStore] createTag error:', error)
        throw error
      }
    }
  }
})
