import axios from '@/api/axios'

const categoryApi = {
  list: () => axios.get('/categories'),
  create: (payload) => axios.post('/categories', payload)
}

export default categoryApi
