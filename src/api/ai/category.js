import request from '@/utils/request'


export function listCategory(query) {
  return request({
    url: '/category/list',
    method: 'get',
    params: query
  })
}


export function getCategory(categoryId) {
  return request({
    url: '/category/' + categoryId,
    method: 'get'
  })
}

// 新增
export function addCategory(data) {
  return request({
    url: '/category',
    method: 'post',
    data: data
  })
}

// 修改
export function updateCategory(data) {
  return request({
    url: '/category',
    method: 'put',
    data: data
  })
}

// 删除
export function delCategory(categoryIds) {
  return request({
    url: '/category/' + categoryIds,
    method: 'delete'
  })
}


