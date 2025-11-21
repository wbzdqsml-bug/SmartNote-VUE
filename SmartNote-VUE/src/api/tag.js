import axios from '@/api/axios'

const tagApi = {
  list: () => axios.get('/tags'),
  create: (payload) => axios.post('/tags', payload)
}

export default tagApi
