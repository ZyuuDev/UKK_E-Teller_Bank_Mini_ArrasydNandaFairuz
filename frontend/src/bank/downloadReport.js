import { ApiError, getToken, setToken } from './api'

export async function downloadReport(params, format) {
  const query = new URLSearchParams({ ...params, format })
  const response = await fetch(`/api/reports/export?${query}`, {
    headers: {
      Accept:
        format === 'pdf'
          ? 'application/pdf, application/json'
          : 'text/csv, application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    cache: 'no-store',
  })
  if (!response.ok) {
    if (response.status === 401) {
      setToken(null)
      window.dispatchEvent(new Event('bank-auth-expired'))
    }
    const payload = await response.json().catch(() => ({}))
    throw new ApiError(
      Object.values(payload.errors || {})
        .flat()
        .join(' ') ||
        payload.message ||
        'Unduhan gagal.',
      response.status,
    )
  }
  const expected = format === 'pdf' ? 'application/pdf' : 'text/csv'
  if (!response.headers.get('Content-Type')?.startsWith(expected)) {
    throw new Error('Server tidak mengirim format file yang diminta.')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  const proposed = response.headers
    .get('Content-Disposition')
    ?.match(/filename="([^"]+)"/)?.[1]
  anchor.download =
    proposed?.replace(/[^a-zA-Z0-9._-]/g, '_') || `laporan-bank-mini.${format}`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}