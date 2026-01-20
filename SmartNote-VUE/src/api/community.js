import apiClient from '@/api/apiClient'

const basePath = '/community'

const list = (params = {}) => apiClient.get(basePath, { params })

const detail = (id) => apiClient.get(`${basePath}/${id}`)

const comments = (id) => apiClient.get(`${basePath}/${id}/comments`)

const mine = (params = {}) => apiClient.get(`${basePath}/mine`, { params })

const createComment = (payload) => apiClient.post(`${basePath}/comments`, payload)

const deleteComment = (id) => apiClient.delete(`${basePath}/comments/${id}`)

const cloneContent = (payload) => apiClient.post(`${basePath}/clone`, payload)

const react = (payload) => apiClient.post(`${basePath}/reaction`, payload)

const publish = (payload) => apiClient.post(`${basePath}/publish`, payload)

const updateStatus = (payload) => apiClient.put(`${basePath}/status`, payload)

export default {
  list,
  detail,
  comments,
  mine,
  createComment,
  deleteComment,
  cloneContent,
  react,
  publish,
  updateStatus
}
