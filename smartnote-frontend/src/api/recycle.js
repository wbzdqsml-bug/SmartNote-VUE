import request from './axios'

export const getDeletedNotes = () => request.get('/api/recycle')
export const restoreNotes = ids => request.post('/api/recycle/restore', ids)
export const deletePermanent = ids => request.post('/api/recycle/delete', ids)
