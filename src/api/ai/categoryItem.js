import request from '@/utils/request'


export function listCategoryItem(query) {
  return request({
    url: '/categoryItem/list',
    method: 'get',
    params: query
  })
}


export function listCategoryNames() {
  return request({
    url: '/categoryItem/getAllCategoryName',
    method: 'get'
  })
}

export function getCategoryItem(categoryItemId) {
  return request({
    url: '/categoryItem/' + categoryItemId,
    method: 'get'
  })
}

// 新增
export function addCategoryItem(data) {
  return request({
    url: '/categoryItem',
    method: 'post',
    data: data
  })
}

// 修改
export function updateCategoryItem(data) {
  return request({
    url: '/categoryItem',
    method: 'put',
    data: data
  })
}

// 删除
export function delCategoryItem(categoryItemIds) {
  return request({
    url: '/categoryItem/' + categoryItemIds,
    method: 'delete'
  })
}


