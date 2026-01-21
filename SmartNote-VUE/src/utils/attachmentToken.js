/**
 * 文件说明：工具函数模块（attachmentToken）
 * - 主要职责：提供可复用的工具/辅助函数，避免业务逻辑重复。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
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
