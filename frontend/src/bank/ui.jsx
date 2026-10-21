import { cloneElement, isValidElement, useEffect, useId, useRef } from 'react'
import { LoaderCircle, Search, X } from 'lucide-react'
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
  invalid: 'Tidak valid',
  duplicate: 'Duplikat',
  service_active: 'Akses aktif',
  service_blocked: 'Akses diblokir',
}

export function Button({
  variant = 'primary',
  busy = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`bank-button bank-button--${variant} ${className}`}
    >
      {busy && <LoaderCircle size={16} className="bank-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

export function Input(props) {
  return <input {...props} />
}
export function Select({ children, ...props }) {
  return <select {...props}>{children}</select>
}

export function FormField({ label, hint, children }) {
  const hintId = useId()
  const control =
    hint && isValidElement(children)
      ? cloneElement(children, {
          'aria-describedby': [children.props['aria-describedby'], hintId]
            .filter(Boolean)
            .join(' '),
        })
      : children
  return (
    <div className="bank-field">
      <label>
        <span>{label}</span>
        {control}
      </label>
      {hint && <small id={hintId}>{hint}</small>}
    </div>
  )
}

export function SearchField({ label = 'Cari', ...props }) {
  return (
    <label className="bank-search">
      <span>{label}</span>
      <span className="bank-search__input">
        <Search size={18} aria-hidden="true" />
        <Input {...props} type="search" />
      </span>
    </label>
  )
}

export function PageHeader({ title, description, actions }) {
  return (
    <header className="bank-page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="bank-actions">{actions}</div>}
    </header>
  )
}

export function StatCard({ label, value, icon: Icon }) {
  return (
    <section className="bank-stat">
      {Icon && (
        <span className="bank-stat__icon">
          <Icon size={20} aria-hidden="true" />
        </span>
      )}
      <div>
        <p>{label}</p>
        <strong className="bank-stat__value">{value ?? 'Tidak tersedia'}</strong>
      </div>
    </section>
  )
}

export function Status({ value }) {
  const tone = ['active', 'approved', 'valid', 'service_active'].includes(value)
    ? 'success'
    : ['disputed', 'invalid', 'service_blocked'].includes(value)
      ? 'danger'
      : ['pending', 'submitted', 'duplicate'].includes(value)
        ? 'warning'
        : 'neutral'
  return (
    <span className={`bank-status bank-status--${tone}`}>
      {labels[value] || value || 'Tidak tersedia'}
    </span>
  )
}

export function Notice({ error, children }) {
  return children ? (
    <div
      className={`bank-notice ${error ? 'bank-notice--error' : ''}`}
      role={error ? 'alert' : 'status'}
    >
      {children}
    </div>
  ) : null
}

export function EmptyState({
  title = 'Belum ada data',
  description = 'Data yang sesuai akan tampil di sini.',
  action,
}) {
  return (
    <div className="bank-empty">
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function LoadingSkeleton() {
  return (
    <div className="bank-skeleton" role="status" aria-label="Memuat data">
      <span />
      <span />
      <span />
    </div>
  )
}

export function ResourceState({ resource, children }) {
  if (resource.loading) return <LoadingSkeleton />
  if (resource.error)
    return (
      <Notice error>
        {resource.error}
        <div className="bank-actions">
          <Button variant="secondary" onClick={resource.refresh}>
            Coba lagi
          </Button>
        </div>
      </Notice>
    )
  return children
}

export function Modal({
  open,
  title,
  onClose,
  busy = false,
  variant = 'modal',
  children,
}) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`bank-overlay bank-overlay--${variant}`}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <div className="bank-overlay__header">
        <h2 id={titleId}>{title}</h2>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={onClose}
          aria-label={`Tutup ${title}`}
        >
          <X size={18} aria-hidden="true" />
          <span>Tutup</span>
        </Button>
      </div>
      <div className="bank-overlay__body">{open ? children : null}</div>
    </dialog>
  )
}

export function Drawer(props) {
  return <Modal {...props} variant="drawer" />
}

export function ConfirmDialog({
  open,
  title,
  children,
  onClose,
  onConfirm,
  busy,
  error,
  confirmLabel = 'Konfirmasi',
  danger = false,
}) {
  return (
    <Modal open={open} title={title} busy={busy} onClose={onClose}>
      {children}
      <Notice error>{error}</Notice>
      <div className="bank-actions bank-actions--end">
        <Button variant="secondary" disabled={busy} onClick={onClose}>
          Batal
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} busy={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

export function DetailRow({ label, children }) {
  return (
    <div className="bank-detail-row">
      <dt>{label}</dt>
      <dd>{children ?? 'Tidak tersedia'}</dd>
    </div>
  )
}

export function DataTable({ rows, columns, actions, caption = 'Daftar data' }) {
  if (!rows?.length) return <EmptyState />
  return (
    <div className="bank-table-scroll" tabIndex={0} role="region" aria-label={caption}>
      <table className="bank-table">
        <caption className="bank-sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map(([key, label, type]) => (
              <th key={key} scope="col" className={type === 'money' ? 'money' : ''}>
                {label}
              </th>
            ))}
            {actions && <th scope="col">Tindakan</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id ?? row.user_id ?? row.row}>
              {columns.map(([key, , type, render]) => (
                <td key={key} className={type === 'money' ? 'money' : ''}>
                  {render ? (
                    render(row)
                  ) : type === 'money' ? (
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
                <td>
                  <div className="bank-actions">{actions(row)}</div>
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
  if (!data) return null
  return (
    <div className="bank-pager">
      <small>
        {data.total > 0
          ? `Menampilkan ${data.from}–${data.to} dari ${data.total} data`
          : '0 data'}
      </small>
      {data.last_page > 1 && (
        <div className="bank-actions">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
          >
            Sebelumnya
          </Button>
          <span>
            Halaman {page} / {data.last_page}
          </span>
          <Button
            variant="secondary"
            disabled={page >= data.last_page}
            onClick={() => onChange(page + 1)}
          >
            Berikutnya
          </Button>
        </div>
      )}
    </div>
  )
}