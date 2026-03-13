import request from '@/utils/request'


export function listBanner(query) {
  return request({
    url: '/banner/list',
    method: 'get',
    params: query
  })
}


export function getBanner(bannerId) {
  return request({
    url: '/banner/' + bannerId,
    method: 'get'
  })
}

// 新增
export function addBanner(data) {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
  return request({
    url: '/banner',
    method: 'post',
    ...(isFormData ? { data } : { params: data })
  })
}

// 修改
export function updateBanner(data) {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData
  return request({
    url: '/banner',
    method: 'put',
    ...(isFormData ? { data } : { params: data })
  })
}

// 删除
export function delBanner(bannerIds) {
  return request({
    url: '/banner/' + bannerIds,
    method: 'delete'
  })
}


