import axios from '@/api/axios'

const categoryApi = {
  list: () => axios.get('/categories'),
  create: (payload) => axios.post('/categories', payload),
  delete: (id) => axios.delete(`/categories/${id}`)
}

export default categoryApi
