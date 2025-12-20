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