/**
 * 文件说明：接口封装模块（ai）
 * - 主要职责：封装与后端交互的请求方法，统一请求路径与参数。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
import apiClient from '@/api/apiClient'

const aiApi = {
  summary: async (noteId, maxLength) => {
    const data = await apiClient.post('/ai/summary', { noteId, maxLength })
    return data?.summary ?? ''
  },

  knowledgeExtension: async (noteId, maxItems) => {
    const data = await apiClient.post('/ai/knowledge-extension', { noteId, maxItems })
    return Array.isArray(data?.items) ? data.items : []
  },

  textToMindmap: async (noteId, maxNodes) => {
    // returns { nodes, edges }
    const data = await apiClient.post('/ai/text-to-mindmap', { noteId, maxNodes })
    return data ?? null
  },

  quiz: async (noteId, count) => {
    const data = await apiClient.post('/ai/quiz', { noteId, count })
    return Array.isArray(data?.questions) ? data.questions : []
  }
}

export default aiApi
