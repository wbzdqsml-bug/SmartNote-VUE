import { useUserStore } from '@/store/userStore'

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:5201'
  }
  return ''
}

const getApiRequestBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  if (import.meta.env.MODE === 'development') {
    return '/api'
  }
  return 'http://localhost:5201/api'
}

const resolveApiUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url

  const base = getApiRequestBase()
  if (url.startsWith('/api/')) {
    if (base.startsWith('http')) {
      const root = base.replace(/\/api\/?$/, '')
      return `${root}${url}`
    }
    return url
  }

  const cleanUrl = url.startsWith('/') ? url : `/${url}`
  if (base.startsWith('http')) {
    return `${base.replace(/\/$/, '')}${cleanUrl}`
  }
  return `${base.replace(/\/$/, '')}${cleanUrl}`
}

export const resolveStaticUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url

  const baseUrl = getApiBaseUrl()
  const cleanUrl = url.startsWith('/') ? url : `/${url}`
  return baseUrl ? `${baseUrl}${cleanUrl}` : cleanUrl
}

export const fetchAuthImage = async (url) => {
  const userStore = useUserStore()
  const token = userStore.token
  const headers = {}

  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(resolveApiUrl(url), { headers })
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Fetch auth image failed:', error)
    return url
  }
}

export const fetchAuthBlob = async (url) => {
  const userStore = useUserStore()
  const token = userStore.token
  const headers = {}

  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(resolveApiUrl(url), { headers })
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status}`)
  }
  return res.blob()
}

export const downloadAuthFile = async (url, filename = 'download') => {
  const blob = await fetchAuthBlob(url)
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename || 'download'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
