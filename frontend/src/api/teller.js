import api from './axios'
export const searchCustomer = (params) => api.get('/teller/search', { params })
export const deposit = (data) => api.post('/teller/deposit', data)
export const withdraw = (data) => api.post('/teller/withdraw', data)
export const submitRecon = (data) => api.post('/teller/reconciliation', data)
export const getReconReport = (id) => api.get(`/teller/report/${id}`)