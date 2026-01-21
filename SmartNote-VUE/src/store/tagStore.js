/**
 * 文件说明：状态管理模块（tagStore）
 * - 主要职责：封装 Pinia 状态、getter 与 action，供页面与组件复用。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
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
    },

    async deleteTag(tagId) {
      try {
        await tagApi.delete(tagId)
        await this.loadTags(true)
      } catch (error) {
        console.error('[tagStore] deleteTag error:', error)
        throw error
      }
    }
  }
})
