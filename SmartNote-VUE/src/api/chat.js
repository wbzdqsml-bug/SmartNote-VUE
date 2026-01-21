/**
 * 文件说明：接口封装模块（chat）
 * - 主要职责：封装与后端交互的请求方法，统一请求路径与参数。
 * - 关键接口：标注导出的函数/对象及其入参、返回值与使用场景。
 * - 依赖关系：说明依赖的外部库/配置项，便于排查问题。
 * - 维护提示：新增或调整逻辑时，保持命名一致并补充相应注释。
 */
import axios from '@/api/axios'

const chatApi = {
  // 好友相关
  getFriends: () => axios.get('/friends'),
  getRequests: () => axios.get('/friends/requests'),
  sendRequest: (username) => axios.post(`/friends/request/${username}`, {}), // 单数：对应 [HttpPost("request/{targetUsername}")]
  handleRequest: (id, action) => axios.post(`/friends/requests/${id}/${action}`, {}), // 复数：对应 [HttpPost("requests/{requestId:int}/{action}")]

  // 聊天记录
  getPrivateHistory: (id) => axios.get(`/chat/private/${id}`),
  getWorkspaceHistory: (id) => axios.get(`/chat/workspace/${id}`),
  
  // 工作区列表 (用于左侧列表展示)
  getWorkspaces: () => axios.get('/workspaces')
}

export default chatApi