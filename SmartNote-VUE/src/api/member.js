/**
 * 文件说明：接口封装模块（member）
 * - 主要职责：封装与后端交互的请求方法，统一请求路径与参数。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
import axios from '@/api/axios'

const memberApi = {
  list: (workspaceId) => axios.get(`/workspaces/${workspaceId}/members`),
  remove: (workspaceId, targetUserId) =>
    axios.delete(`/workspaces/${workspaceId}/members/${targetUserId}`),
  updatePermissions: (workspaceId, targetUserId, payload) =>
    axios.patch(
      `/workspaces/${workspaceId}/members/${targetUserId}/permissions`,
      payload
    ),
  leave: (workspaceId) => axios.post(`/workspaces/${workspaceId}/members/leave`)
}

export default memberApi
