import api from './axios'
export const getReconciliations = (params) => api.get('/supervisor/reconciliations', { params })
export const approveRecon = (id) => api.post(`/supervisor/approve/${id}`)