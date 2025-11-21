import axios from '@/api/axios'

const noteApi = {
  list: () => axios.get('/notes/all'),
  filter: (params) => axios.get('/notes/filter', { params }),
  detail: (id) => axios.get(`/notes/${id}`),
  create: (payload) => axios.post('/notes', payload),
  update: (id, payload) => axios.put(`/notes/${id}`, payload),
  updateTags: (id, payload) => axios.put(`/notes/${id}/tags`, payload),
  getTags: (id) => axios.get(`/notes/${id}/tags`),
  softDelete: (ids) => axios.post('/notes/soft-delete', ids)
}

export default noteApi
