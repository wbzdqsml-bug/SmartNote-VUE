import request from './axios'

export const getNotes = () => request.get('/api/notes')
export const createNote = data => request.post('/api/notes', data)
export const updateNote = (id, data) => request.put(`/api/notes/${id}`, data)
export const deleteNote = id => request.delete(`/api/notes/${id}`)
