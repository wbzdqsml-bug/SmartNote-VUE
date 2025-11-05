import axios from '@/api/axios'

const noteApi = {
  list: () => axios.get('/notes'),
  detail: (id) => axios.get(`/notes/${id}`),
  create: (payload) => axios.post('/notes', payload),
  update: (id, payload) => axios.put(`/notes/${id}`, payload),
  softDelete: (ids) => axios.post('/notes/soft', ids)
}

export default noteApi
