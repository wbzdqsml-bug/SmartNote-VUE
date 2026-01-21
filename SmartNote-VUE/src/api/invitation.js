/**
 * 文件说明：接口封装模块（invitation）
 * - 主要职责：封装与后端交互的请求方法，统一请求路径与参数。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
import axios from '@/api/axios'

const invitationApi = {
  myInvitations: () => axios.get('/invitations'),
  send: (workspaceId, payload) =>
    axios.post(`/workspaces/${workspaceId}/invitations`, payload),
  accept: (invitationId) =>
    axios.post(`/invitations/${invitationId}/accept`),
  reject: (invitationId) =>
    axios.post(`/invitations/${invitationId}/reject`),
  revoke: (invitationId) => axios.delete(`/invitations/${invitationId}`)
}

export default invitationApi
