import axios from '@/api/axios'

const memberApi = {
  list: (workspaceId) => axios.get(`/workspaces/${workspaceId}/members`),
  remove: (workspaceId, targetUserId) =>
    axios.delete(`/workspaces/${workspaceId}/members/${targetUserId}`),
  updatePermissions: (workspaceId, targetUserId, payload) =>
    axios.patch(
      `/workspaces/${workspaceId}/members/${targetUserId}/permissions`,
      payload
    ),
  leave: (workspaceId) => axios.post(`/workspaces/${workspaceId}/members/leave`)
}

export default memberApi
