import axios from '@/api/axios'

const userApi = {
  login: (payload) => axios.post('/auth/login', payload),
  register: (payload) => axios.post('/auth/register', payload),
  profile: () => axios.get('/user/profile'),
  profileDetail: () => axios.get('/user/profile'),
  updateProfile: (payload) => axios.put('/user/profile', payload),
  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post('/user/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export default userApi
