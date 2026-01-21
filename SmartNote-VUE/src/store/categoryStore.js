/**
 * 文件说明：状态管理模块（categoryStore）
 * - 主要职责：封装 Pinia 状态、getter 与 action，供页面与组件复用。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
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
    },

    async deleteCategory(categoryId) {
      try {
        await categoryApi.delete(categoryId)
        await this.loadCategories(true)
      } catch (error) {
        console.error('[categoryStore] deleteCategory error:', error)
        throw error
      }
    }
  }
})
