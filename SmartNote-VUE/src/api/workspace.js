import axios from '@/api/axios'

const workspaceApi = {
  list: () => axios.get('/workspaces'),
  create: (payload) => axios.post('/workspaces', payload),
  detail: (workspaceId) => axios.get(`/workspaces/${workspaceId}`),
  remove: (workspaceId) => axios.delete(`/workspaces/${workspaceId}`)
}

export default workspaceApi
