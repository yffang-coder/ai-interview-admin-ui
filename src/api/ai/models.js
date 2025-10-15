import request from '@/utils/request'


export function listModelItem(query) {
  return request({
    url: '/models/list',
    method: 'get',
    params: query
  })
}


// export function listModelNames() {
//   return request({
//     url: '/models/getAllModelName',
//     method: 'get'
//   })
// }

export function getModelItem(modelsId) {
  return request({
    url: '/models/' + modelsId,
    method: 'get'
  })
}

// 新增
export function addModelItem(data) {
  return request({
    url: '/models',
    method: 'post',
    data: data
  })
}

// 修改
export function updateModelItem(data) {
  return request({
    url: '/models',
    method: 'put',
    data: data
  })
}

// 删除
export function delModelItem(modelsIds) {
  return request({
    url: '/models/' + modelsIds,
    method: 'delete'
  })
}


