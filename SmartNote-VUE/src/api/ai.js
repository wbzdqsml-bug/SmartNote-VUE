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
