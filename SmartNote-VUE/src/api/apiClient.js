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

