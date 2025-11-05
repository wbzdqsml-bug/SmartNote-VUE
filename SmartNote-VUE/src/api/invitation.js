import axios from '@/api/axios'

const invitationApi = {
  myInvitations: () => axios.get('/invitations'),
  send: (workspaceId, payload) =>
    axios.post(`/workspaces/${workspaceId}/invitations`, payload),
  accept: (invitationId) =>
    axios.post(`/invitations/${invitationId}/accept`),
  reject: (invitationId) =>
    axios.post(`/invitations/${invitationId}/reject`),
  revoke: (invitationId) => axios.delete(`/invitations/${invitationId}`)
}

export default invitationApi
