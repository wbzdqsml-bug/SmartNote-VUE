/**
 * 文件说明：接口封装模块（user）
 * - 主要职责：封装与后端交互的请求方法，统一请求路径与参数。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
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
