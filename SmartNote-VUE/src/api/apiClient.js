/**
 * 文件说明：接口封装模块（apiClient）
 * - 主要职责：封装与后端交互的请求方法，统一请求路径与参数。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
import axios from '@/api/axios'

export class ApiResponseError extends Error {
  constructor(message, { code, data } = {}) {
    super(message || '请求失败')
    this.name = 'ApiResponseError'
    this.code = code
    this.data = data
  }
}

const isApiResponse = (payload) => {
  if (!payload || typeof payload !== 'object') return false
  return 'code' in payload && 'message' in payload
}

const unwrapApiResponse = (payload) => {
  if (!isApiResponse(payload)) return payload

  const code = Number(payload.code ?? 0)
  if (code !== 0) {
    throw new ApiResponseError(payload.message || '请求失败', {
      code,
      data: payload.data
    })
  }
  return payload.data
}

const request = async (config) => {
  const response = await axios.request(config)
  return unwrapApiResponse(response?.data)
}

const apiClient = {
  request,
  get: (url, config) => request({ ...config, url, method: 'GET' }),
  post: (url, data, config) => request({ ...config, url, data, method: 'POST' }),
  put: (url, data, config) => request({ ...config, url, data, method: 'PUT' }),
  delete: (url, config) => request({ ...config, url, method: 'DELETE' })
}

export default apiClient

