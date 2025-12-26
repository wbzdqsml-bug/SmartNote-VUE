import axios from '@/api/axios'

const noteApi = {
  // 笔记基础操作
  list: () => axios.get('/notes/all'),
  filter: (params) => axios.get('/notes/filter', { params }),
  getByDate: (date) => axios.get('/notes/by-date', { params: { date } }),
  create: (payload) => axios.post('/notes', payload),
  update: (id, payload) => axios.put(`/notes/${id}`, payload),
  delete: (id) => axios.delete(`/notes/${id}`),
  detail: (id) => axios.get(`/notes/${id}`),
  updateTags: (id, payload) => axios.put(`/notes/${id}/tags`, payload),
  getTags: (id) => axios.get(`/notes/${id}/tags`),
  softDelete: (ids) => axios.post('/notes/soft-delete', ids),

  // 上传附件
  uploadAttachment: (noteId, file) => {
    // 检查文件大小 (20MB)
    if (file.size > 20 * 1024 * 1024) {
      return Promise.reject(new Error('附件大小不能超过 20MB'))
    }
    const formData = new FormData()
    formData.append('file', file)
    return axios.post(`/notes/${noteId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 获取附件列表
  getAttachments: (noteId) => axios.get(`/notes/${noteId}/attachments`),

  // 删除附件
  deleteAttachment: (attachmentId) => axios.delete(`/notes/attachments/${attachmentId}`),

  // 获取附件详情/下载 (通常用于获取元数据，下载建议用 api/resource.js 的 fetchAuthBlob)
  getAttachmentInfo: (attachmentId) => axios.get(`/notes/attachments/${attachmentId}`)
}

export default noteApi
