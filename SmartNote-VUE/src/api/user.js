import axios from '@/api/axios'

const userApi = {
  login: (payload) => axios.post('/auth/login', payload),
  register: (payload) => axios.post('/auth/register', payload),
  profile: () => axios.get('/auth/me'),
  profileDetail: () => axios.get('/user/profile'),
  updateProfile: (payload) => axios.put('/user/profile', payload)
}

export default userApi
