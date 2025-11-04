import request from './axios'

export const getWorkspaces = () => request.get('/api/workspaces')
export const createWorkspace = data => request.post('/api/workspaces', data)
export const deleteWorkspace = id => request.delete(`/api/workspaces/${id}`)
