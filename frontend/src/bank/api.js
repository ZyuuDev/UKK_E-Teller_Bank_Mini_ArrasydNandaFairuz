import { useCallback, useEffect, useState } from 'react'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export const getToken = () => sessionStorage.getItem('bank-token')
export const setToken = (token) =>
  token
    ? sessionStorage.setItem('bank-token', token)
    : sessionStorage.removeItem('bank-token')
export const money = (value) =>
  value === null || value === undefined
    ? 'Tidak tersedia'
    : new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(Number(value))

export async function api(path, options = {}) {
  const form = options.body instanceof FormData
  const headers = {
    Accept: 'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...(!form && options.body ? { 'Content-Type': 'application/json' } : {}),
  }
  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    body: options.body && !form ? JSON.stringify(options.body) : options.body,
    cache: 'no-store',
  })
  if (response.status === 204) return null
  const payload = await response
    .json()
    .catch(() => ({ message: 'Respons server tidak dapat dibaca.' }))
  if (!response.ok) {
    if (response.status === 401) {
      setToken(null)
      window.dispatchEvent(new Event('bank-auth-expired'))
    }
    const errors = Object.values(payload.errors || {})
      .flat()
      .join(' ')
    throw new ApiError(errors || payload.message || 'Permintaan gagal.', response.status)
  }
  return payload
}

export function useResource(path) {
  const [version, setVersion] = useState(0)
  const [state, setState] = useState({ path: null, version: -1, data: null, error: '' })
  useEffect(() => {
    const controller = new AbortController()
    api(path, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted)
          setState({ path, version, data: result.data, error: '' })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ path, version, data: null, error: error.message })
      })
    return () => controller.abort()
  }, [path, version])
  const refresh = useCallback(() => setVersion((value) => value + 1), [])
  return {
    data: state.data,
    error: state.error,
    loading: state.path !== path || state.version !== version,
    refresh,
  }
}