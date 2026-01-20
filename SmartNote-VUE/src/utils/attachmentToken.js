import { useUserStore } from '@/store/userStore'

const safeGetDomParser = () => (typeof DOMParser !== 'undefined' ? new DOMParser() : null)

export const getAccessToken = () => {
  try {
    const userStore = useUserStore()
    const token = userStore?.token || localStorage.getItem('token') || ''
    return token.replace(/^Bearer\s+/i, '')
  } catch (error) {
    console.warn('[attachmentToken] getAccessToken fallback to localStorage:', error)
    const token = localStorage.getItem('token') || ''
    return token.replace(/^Bearer\s+/i, '')
  }
}

export const addTokenToAttachmentSrc = (html, token = getAccessToken()) => {
  if (!token || !html) return html || ''

  const parser = safeGetDomParser()
  if (!parser) return html

  const doc = parser.parseFromString(html, 'text/html')
  const images = doc.querySelectorAll('img[src^="/api/notes/attachments/"]')
  images.forEach((img) => {
    const src = img.getAttribute('src') || ''
    if (src.includes('access_token=')) return
    const separator = src.includes('?') ? '&' : '?'
    img.setAttribute('src', `${src}${separator}access_token=${token}`)
  })
  return doc.body.innerHTML
}

export const stripTokenFromAttachmentSrc = (html) => {
  if (!html) return ''

  const parser = safeGetDomParser()
  if (!parser) return html

  const doc = parser.parseFromString(html, 'text/html')
  const images = doc.querySelectorAll('img[src^="/api/notes/attachments/"]')
  images.forEach((img) => {
    const src = img.getAttribute('src') || ''
    const cleaned = src
      .replace(/([?&])access_token=[^&#]+(&)?/, (match, p1, p2) => {
        if (p1 === '?' && p2) return '?'
        if (p1 === '?' && !p2) return ''
        if (p1 === '&') return ''
        return match
      })
      .replace(/[?&]$/, '')
    img.setAttribute('src', cleaned)
  })
  return doc.body.innerHTML
}
