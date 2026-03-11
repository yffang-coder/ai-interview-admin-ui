import request from '@/utils/request'

// 查询用户列表
export function listUser() {
  return request({
    url: '/ai/chat/users',
    method: 'get'
  })
}

// 查询历史消息
export function listHistory(userId) {
  return request({
    url: '/ai/chat/history/' + userId,
    method: 'get'
  })
}

// 发送消息
export function sendMessage(data) {
  return request({
    url: '/ai/chat',
    method: 'post',
    data: data
  })
}
