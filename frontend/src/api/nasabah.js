import api from './axios'
export const getBalance = () => api.get('/nasabah/balance')
export const getMutations = () => api.get('/nasabah/mutations')