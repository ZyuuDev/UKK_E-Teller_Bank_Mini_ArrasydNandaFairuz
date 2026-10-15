import { useEffect, useRef } from 'react'
import { money } from './api'

const labels = {
  active: 'Aktif',
  inactive: 'Belum aktif',
  pending: 'Menunggu pemeriksaan',
  disputed: 'Ada selisih',
  approved: 'Disetujui',
  rejected: 'Dikembalikan',
  open: 'Terbuka',
  submitted: 'Diajukan',
  valid: 'Valid',
  invalid: 'Perlu diperbaiki',
  duplicate: 'Duplikat',
}

export function Status({ value }) {
  return <span className={`status ${value}`}>{labels[value] || value}</span>
}

export function Notice({ error, children }) {
  return children ? (
    <div className={`notice ${error ? 'error' : ''}`} role={error ? 'alert' : 'status'}>
      {children}
    </div>
  ) : null
}

export function Modal({ open, title, onClose, children }) {
  const ref = useRef(null)
  useEffect(() => {
    if (open && !ref.current.open) ref.current.showModal()
    if (!open && ref.current.open) ref.current.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      aria-label={title}
    >
      <div
        className="actions"
        style={{ justifyContent: 'space-between', marginBottom: 20 }}
      >
        <h2 style={{ margin: 0 }}>{title}</h2>
        <button className="secondary" onClick={onClose} type="button">
          Tutup
        </button>
      </div>
      {children}
    </dialog>
  )
}

export function DataTable({ rows, columns, actions }) {
  if (!rows?.length) return <p className="muted">Belum ada data yang sesuai.</p>
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map(([key, label]) => (
              <th key={key}>{label}</th>
            ))}
            {actions && <th>Tindakan</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id ?? row.user_id ?? row.row}>
              {columns.map(([key, , type]) => (
                <td key={key} className={type === 'money' ? 'money' : ''}>
                  {type === 'money' ? (
                    money(row[key])
                  ) : type === 'status' ? (
                    <Status value={row[key]} />
                  ) : typeof row[key] === 'object' && row[key] !== null ? (
                    <details>
                      <summary>Lihat rincian</summary>
                      <pre>{JSON.stringify(row[key], null, 2)}</pre>
                    </details>
                  ) : (
                    (row[key] ?? 'Belum diisi')
                  )}
                </td>
              ))}
              {actions && (
                <td className="actions-cell">
                  <div className="actions">{actions(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pager({ data, page, onChange }) {
  return data?.last_page > 1 ? (
    <div className="actions" style={{ marginTop: 16 }}>
      <button
        className="secondary"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Sebelumnya
      </button>
      <span>
        Halaman {page} dari {data.last_page}
      </span>
      <button
        className="secondary"
        disabled={page >= data.last_page}
        onClick={() => onChange(page + 1)}
      >
        Berikutnya
      </button>
    </div>
  ) : null
}