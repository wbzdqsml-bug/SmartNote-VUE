import axios from 'axios'
import { useUserStore } from '../store/userStore'

const instance = axios.create({
  baseURL: 'https://localhost:7079',
  timeout: 10000
})

instance.interceptors.request.use(config => {
  const store = useUserStore()
  if (store.token) config.headers.Authorization = `Bearer ${store.token}`
  return config
})

instance.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err.response?.data || err)
)

export default instance
