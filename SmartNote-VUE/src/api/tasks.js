import apiClient from '@/api/apiClient'

const basePath = '/api/tasks'

const list = (params = {}) => apiClient.get(basePath, { params })

const range = (params = {}) => apiClient.get(`${basePath}/range`, { params })

const create = (payload) => apiClient.post(basePath, payload)

const update = (id, payload) => apiClient.put(`${basePath}/${id}`, payload)

const sort = (payload) => apiClient.put(`${basePath}/sort`, payload)

const remove = (id) => apiClient.delete(`${basePath}/${id}`)

export default {
  list,
  range,
  create,
  update,
  sort,
  remove
}
