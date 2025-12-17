import axios from '@/api/axios'

const tagApi = {
  list: () => axios.get('/tags'),
  create: (payload) => axios.post('/tags', payload),
  delete: (id) => axios.delete(`/tags/${id}`)
}

export default tagApi
