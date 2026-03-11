import request from '@/utils/request'

const baseUrl = '/alarm'

// 查询告警列表（分页/筛选）
export function listAlarm(query) {
  return request({
    url: `${baseUrl}/list`,
    method: 'get',
    params: query
  })
}

// 查询告警详细
export function getAlarm(alarmId) {
  return request({
    url: `${baseUrl}/${alarmId}`,
    method: 'get'
  })
}

// 新增告警
export function addAlarm(data) {
  return request({
    url: baseUrl,
    method: 'post',
    data: data
  })
}

// 编辑告警
export function updateAlarm(data) {
  return request({
    url: baseUrl,
    method: 'put',
    data: data
  })
}

// 删除告警（单/批量）
export function delAlarm(alarmIds) {
  return request({
    url: `${baseUrl}/${alarmIds}`,
    method: 'delete'
  })
}

// 处理告警（填写处理结果并标记已处理）
export function handleAlarm(alarmId, handleResult) {
  return request({
    url: `${baseUrl}/handle/${alarmId}`,
    method: 'put',
    data: { handleResult }
  })
}

