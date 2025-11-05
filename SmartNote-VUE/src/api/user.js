import axios from '@/api/axios'

const userApi = {
  login: (payload) => axios.post('/auth/login', payload),
  register: (payload) => axios.post('/auth/register', payload),
  profile: () => axios.get('/auth/me')
}

export default userApi
