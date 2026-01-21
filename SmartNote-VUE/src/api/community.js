/**
 * 文件说明：接口封装模块（community）
 * - 主要职责：封装与后端交互的请求方法，统一请求路径与参数。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
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
