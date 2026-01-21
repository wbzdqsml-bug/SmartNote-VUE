/**
 * 文件说明：接口封装模块（note）
 * - 主要职责：封装与后端交互的请求方法，统一请求路径与参数。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
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
  getAttachmentInfo: (attachmentId) => axios.get(`/notes/attachments/${attachmentId}`),

  // 导入笔记
  importNote: (workspaceId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post(`/notes/import?workspaceId=${workspaceId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export default noteApi
