// src/api/auth.js
import request from '@/utils/request' // 1. 导入我们刚刚创建的 axios 实例

/**
 * 登录 API
 * @param {object} data - 包含 username 和 password
 * @returns {Promise<object>} 后端返回的包含 token 和用户信息的对象
 */
export const loginApi = (data) => {
  // 对应后端 AuthController 的 [HttpPost("login")] 路由
  return request({
    url: '/api/Auth/login',
    method: 'post',
    data // axios 会自动将 data 序列化为 JSON
  })
}

/**
 * 注册 API
 * @param {object} data - 包含 username 和 password
 * @returns {Promise<object>} 后端返回的包含 message 的对象
 */
export const registerApi = (data) => {
  // 对应后端 AuthController 的 [HttpPost("register")] 路由
  return request({
    url: '/api/Auth/register',
    method: 'post',
    data
  })
}
