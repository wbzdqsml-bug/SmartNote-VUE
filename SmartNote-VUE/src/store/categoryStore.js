import { defineStore } from 'pinia'
import categoryApi from '@/api/category'

const resolvePayload = (response, fallback = []) => {
  if (!response) return fallback
  const data = response.data ?? fallback
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data ?? fallback
  }
  return data ?? fallback
}

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [],
    loading: false
  }),
  getters: {
    options: (state) =>
      state.categories.map((item) => ({
        label: item.name || `分类 #${item.id ?? ''}`,
        value: item.id,
        color: item.color || ''
      }))
  },
  actions: {
    async loadCategories(force = false) {
      if (this.loading) return this.categories
      if (!force && this.categories.length) return this.categories
      this.loading = true
      try {
        const response = await categoryApi.list()
        const payload = resolvePayload(response, [])
        this.categories = Array.isArray(payload) ? payload : []
        return this.categories
      } catch (error) {
        console.error('[categoryStore] loadCategories error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createCategory(payload) {
      try {
        const response = await categoryApi.create(payload)
        const data = resolvePayload(response, null)
        if (data && typeof data === 'object') {
          await this.loadCategories(true)
          const targetId = data.id ?? data.categoryId ?? data.CategoryId
          const matched =
            this.categories.find((item) => item.id === targetId || item.categoryId === targetId) ||
            null
          return matched || data
        }
        return null
      } catch (error) {
        console.error('[categoryStore] createCategory error:', error)
        throw error
      }
    }
  }
})
