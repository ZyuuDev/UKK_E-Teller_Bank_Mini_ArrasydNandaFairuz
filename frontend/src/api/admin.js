import api from "./axios"
export const getUsers = () => api.get('/admin/users')
export const createUser = (data) => api.post('/admin/users', data)
export const updateUser = (id, d) => api.put(`/admin/users/${id}`, d)
export const deleteUser = (id) => api.delete(`/admin/users/${id}`)

export const getCustomers = () => api.get('/admin/customers')
export const createCustomer = (data) => api.post('/admin/customers', data)
export const updateCustomer = (id, d) => api.put(`/admin/customers/${id}`, d)
export const showCustomer = (id) => api.get(`/admin/customers/${id}`)