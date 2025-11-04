import request from './axios'

export const getInvitations = () => request.get('/api/invitations')
export const sendInvitation = (workspaceId, params) =>
  request.post(`/api/invitations/${workspaceId}/send`, null, { params })
export const acceptInvitation = id =>
  request.post(`/api/invitations/${id}/accept`)
export const declineInvitation = id =>
  request.post(`/api/invitations/${id}/decline`)
export const revokeInvitation = id =>
  request.post(`/api/invitations/${id}/revoke`)
