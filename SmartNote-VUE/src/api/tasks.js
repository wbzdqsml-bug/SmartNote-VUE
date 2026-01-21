/**
 * 文件说明：接口封装模块（tasks）
 * - 主要职责：封装与后端交互的请求方法，统一请求路径与参数。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
import apiClient from '@/api/apiClient'

const basePath = '/tasks'

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
