import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from 'react'
import { Eye, EyeOff, LoaderCircle, Search, X } from 'lucide-react'
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
  buka: 'Loket Buka',
  istirahat: 'Loket Istirahat',
  tutup: 'Loket Tutup',
}

export const ACTION_LABELS = {
  'cash_session.opened': 'Buka Sesi Kas Loket',
  'cash_session.auto_closed': 'Sesi Kas Ditutup Otomatis (17:00 WIB)',
  'reconciliation.submitted': 'Pengajuan Tutup Kas Loket',
  'reconciliation.approved': 'Persetujuan Tutup Kas Loket',
  'reconciliation.rejected': 'Pengembalian Laporan Kas',
  'cash_request.created': 'Pengajuan Tambahan Kas',
  'cash_request.approved': 'Persetujuan Tambahan Kas',
  'cash_request.rejected': 'Penolakan Tambahan Kas',
  'saver.activated': 'Aktivasi Rekening Siswa Baru',
  'transaction.created': 'Transaksi Tabungan Siswa',
  'saver.pin_reset': 'Reset PIN Tabungan Siswa',
  'student.pin_reset': 'Reset Mandiri PIN Siswa',
  'staff.created': 'Pendaftaran Petugas Baru',
  'staff.updated': 'Pembaruan Data Petugas',
  'staff.credentials_issued': 'Reset Password Sementara Petugas',
  'student.access_changed': 'Perubahan Hak Akses Siswa',
  'service_status.updated': 'Pembaruan Status Layanan Loket',
  'member.created': 'Pendaftaran Data Siswa',
  'member.updated': 'Pembaruan Data Siswa',
  'member.deleted': 'Penghapusan Data Siswa',
  'member.credentials_issued': 'Penerbitan Kredensial Siswa',
  'members.imported': 'Impor Massal Siswa Selesai',
  'members.import_progress': 'Progres Impor Massal Siswa',
  'admin.email_verified': 'Verifikasi Email Admin',
  'admin.password_reset': 'Reset Password Admin',
  'teller.email_verified': 'Verifikasi Email Teller',
  'teller.password_reset': 'Reset Password Teller',
  'student.email_verified': 'Verifikasi Email Siswa',
  'student.password_reset': 'Reset Password Siswa',
}

export const SUBJECT_TYPE_LABELS = {
  cash_session: 'Sesi Kas Loket',
  daily_reconciliation: 'Laporan Rekonsiliasi Kas',
  cash_request: 'Pengajuan Tambahan Kas',
  saver: 'Rekening Penabung',
  transaction: 'Transaksi Tabungan',
  user: 'Akun Pengguna',
  member: 'Data Siswa',
  member_import: 'Berkas Impor Siswa',
  pengaturan: 'Pengaturan Sistem',
}

export const ROLE_LABELS = {
  admin: 'Administrator',
  teller: 'Teller Loket',
  student: 'Siswa Penabung',
}

export const ACCOUNT_CODE_LABELS = {
  '101': '101 · Kas Tunai Loket',
  '102': '102 · Kas Brankas Utama',
  '201': '201 · Tabungan Nasabah Siswa',
  '301': '301 · Modal & Penyesuaian Kas',
}

export const DETAIL_FIELD_LABELS = {
  id: 'ID Data',
  actor_id: 'ID Petugas / Pelaku',
  actor_name: 'Nama Petugas',
  actor_username: 'Username Petugas',
  actor_role: 'Peran Petugas',
  action: 'Jenis Aktivitas',
  subject_type: 'Objek Terkait',
  subject_id: 'ID Objek Terkait',
  created_at: 'Waktu Kejadian',
  updated_at: 'Waktu Pembaruan',
  opening_balance: 'Modal Kas Awal',
  expected_closing_balance: 'Kas Sistem (Ekspektasi)',
  actual_cash_on_hand: 'Uang Fisik Kas',
  discrepancy: 'Selisih Kas',
  amount: 'Nominal Transaksi',
  type: 'Jenis Transaksi',
  request_id: 'ID Referensi Permintaan',
  reason: 'Alasan',
  rejection_reason: 'Catatan Penolakan / Keterangan Sistem',
  rejection_notes: 'Catatan Penolakan',
  notes: 'Catatan',
  cash_session_id: 'ID Sesi Kas',
  cash_transfer_id: 'ID Serah Terima Kas',
  daily_reconciliation_id: 'ID Rekonsiliasi Kas',
  transaction_id: 'ID Transaksi',
  teller_id: 'ID Teller',
  account_code: 'Akun Buku Besar',
  entry_type: 'Posisi Buku Besar (Debit/Kredit)',
  balance_after: 'Saldo Setelah Transaksi',
  snapshot_account_number: 'Nomor Rekening',
  snapshot_member_name: 'Nama Siswa',
  account_number: 'Nomor Rekening',
  student_number: 'Nomor Induk Siswa (NIS)',
  full_name: 'Nama Lengkap Siswa',
  graduation_year: 'Tahun Lulus',
  major: 'Jurusan',
  name: 'Nama Lengkap',
  username: 'Username',
  role: 'Peran Akun',
  by_role: 'Dilakukan Oleh Peran',
  is_active: 'Status Akses Layanan',
  before: 'Data Sebelum Perubahan',
  after: 'Data Sesudah Perubahan',
  closing_time: 'Jam Penutupan',
  auto_closed: 'Ditutup Otomatis Sistem',
  created: 'Data Baru Ditambahkan',
  skipped: 'Data Duplikat Dilewati',
  invalid: 'Data Tidak Valid',
  processed: 'Baris Diproses',
  total: 'Total Baris',
  date: 'Tanggal',
  status: 'Status',
}

export function formatAccountCode(code) {
  if (!code) return 'Tidak tersedia'
  return ACCOUNT_CODE_LABELS[String(code)] || `${code} · Akun Buku Besar`
}

export function formatAction(action) {
  if (!action) return 'Aktivitas Tidak Diketahui'
  return ACTION_LABELS[action] || action.replace(/[._]/g, ' ')
}

export function formatSubject(type) {
  if (!type) return 'Objek'
  return SUBJECT_TYPE_LABELS[type] || type.replace(/[._]/g, ' ')
}

export function formatRole(role) {
  if (!role) return 'Pengguna'
  return ROLE_LABELS[role] || role
}

export function formatDetailLabel(key) {
  return DETAIL_FIELD_LABELS[key] || key.replace(/[._]/g, ' ')
}

export function AuditActionBadge({ action }) {
  const isAutoClose = action === 'cash_session.auto_closed'
  const isApprove = action?.includes('approved') || action === 'saver.activated'
  const isReject = action?.includes('rejected') || action?.includes('deleted')
  const isWarning = action?.includes('reset') || isAutoClose

  let variant = 'primary'
  if (isAutoClose || isReject) variant = 'danger'
  else if (isApprove) variant = 'success'
  else if (isWarning) variant = 'warning'

  return (
    <span className={`audit-badge audit-badge--${variant}`}>
      {formatAction(action)}
    </span>
  )
}

export function UserRoleBadge({ role }) {
  return (
    <span className={`role-pill role-pill--${role || 'student'}`}>
      {formatRole(role)}
    </span>
  )
}

const MONEY_KEYS = new Set([
  'opening_balance',
  'expected_closing_balance',
  'actual_cash_on_hand',
  'discrepancy',
  'amount',
  'balance_after',
])

export function formatDetailValue(key, value) {
  if (value === null || value === undefined || value === '') return 'Tidak tersedia'
  if (typeof value === 'boolean') {
    if (key === 'is_active') return value ? 'Aktif' : 'Nonaktif'
    return value ? 'Ya' : 'Tidak'
  }
  if (MONEY_KEYS.has(key) && typeof value === 'number') {
    return money(value)
  }
  if (key === 'action') return <AuditActionBadge action={value} />
  if (key === 'subject_type') return formatSubject(value)
  if (key === 'actor_role' || key === 'role' || key === 'by_role') {
    return <UserRoleBadge role={value} />
  }
  if (key === 'account_code') return formatAccountCode(value)
  if (key === 'type' || key === 'transaction_type') {
    if (value === 'Deposit') return 'Setoran Tunai'
    if (value === 'Withdrawal') return 'Penarikan Tunai'
    return String(value)
  }
  if (key === 'status') return <Status value={value} />
  if ((key === 'created_at' || key === 'updated_at') && value) {
    return new Date(value).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }
  return String(value)
}

export function HumanDetail({ value }) {
  if (value === null || value === undefined || value === '') {
    return <span className="muted">Tidak ada rincian tambahan</span>
  }
  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      return <span>{value}</span>
    }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return <span>{String(parsed)}</span>
  }
  const entries = Object.entries(parsed)
  if (!entries.length) {
    return <span className="muted">Tidak ada rincian tambahan</span>
  }
  return (
    <dl className="bank-detail-list bank-detail-list--nested">
      {entries.map(([key, item]) => (
        <div key={key} className="bank-detail-row">
          <dt>{formatDetailLabel(key)}</dt>
          <dd>
            {typeof item === 'object' && item !== null ? (
              <HumanDetail value={item} />
            ) : (
              formatDetailValue(key, item)
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
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

export function Input({ type = 'text', ...props }) {
  const [visible, setVisible] = useState(false)
  if (type === 'password') {
    return (
      <span className="bank-password-field">
        <input
          {...props}
          type={visible ? 'text' : 'password'}
          data-password="true"
        />
        <button
          type="button"
          className="bank-password-toggle"
          onClick={() => setVisible((current) => !current)}
          disabled={props.disabled}
          aria-label={visible ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
          title={visible ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </span>
    )
  }
  return <input type={type} {...props} />
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

export function Status({ value, tone, children }) {
  const effectiveValue = value ?? children
  const effectiveTone =
    tone ||
    (['active', 'approved', 'valid', 'service_active', 'buka'].includes(effectiveValue)
      ? 'success'
      : ['disputed', 'invalid', 'service_blocked', 'tutup'].includes(effectiveValue)
        ? 'danger'
        : ['pending', 'submitted', 'duplicate', 'istirahat'].includes(effectiveValue)
          ? 'warning'
          : 'neutral')
  return (
    <span className={`bank-status bank-status--${effectiveTone}`}>
      {labels[effectiveValue] || children || effectiveValue || 'Tidak tersedia'}
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
  onCancel,
  onConfirm,
  busy,
  error,
  confirmLabel = 'Konfirmasi',
  danger = false,
}) {
  const handleClose = onClose || onCancel
  return (
    <Modal open={open} title={title} busy={busy} onClose={handleClose}>
      {children}
      <Notice error>{error}</Notice>
      <div className="bank-actions bank-actions--end">
        <Button variant="secondary" disabled={busy} onClick={handleClose}>
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
  const normalizedColumns = (columns || []).map((col) => {
    if (Array.isArray(col)) {
      return {
        key: col[0],
        label: col[1],
        type: col[2],
        render: col[3],
      }
    }
    return {
      key: col.key,
      label: col.header || col.label || col.title || col.name,
      type: col.type,
      render: col.render,
    }
  })

  return (
    <div className="bank-table-scroll" tabIndex={0} role="region" aria-label={caption}>
      <table className="bank-table">
        <caption className="bank-sr-only">{caption}</caption>
        <thead>
          <tr>
            {normalizedColumns.map((col) => (
              <th key={col.key} scope="col" className={col.type === 'money' ? 'money' : ''}>
                {col.label}
              </th>
            ))}
            {actions && <th scope="col" className="bank-table__actions-head">Tindakan</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id ?? row.user_id ?? row.row ?? row.code}>
              {normalizedColumns.map((col) => (
                <td key={col.key} className={col.type === 'money' ? 'money' : ''}>
                  {col.render ? (
                    col.render(row)
                  ) : col.type === 'money' ? (
                    money(row[col.key])
                  ) : col.type === 'status' ? (
                    <Status value={row[col.key]} />
                  ) : typeof row[col.key] === 'object' && row[col.key] !== null ? (
                    <details>
                      <summary>Lihat rincian</summary>
                      <HumanDetail value={row[col.key]} />
                    </details>
                  ) : (
                    (row[col.key] ?? 'Belum diisi')
                  )}
                </td>
              ))}
              {actions && (
                <td className="bank-table__actions-cell">
                  <div className="bank-actions bank-actions--table">{actions(row)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pager({
  data,
  page,
  onChange,
  totalPages,
  totalItems,
  onPageChange,
}) {
  const currentPage = page || data?.current_page || 1
  const lastPage = totalPages || data?.last_page || 1
  const total = totalItems ?? data?.total ?? 0
  const from = data?.from ?? ((currentPage - 1) * 10 + (total > 0 ? 1 : 0))
  const to = data?.to ?? Math.min(currentPage * 10, total)
  const handleChange = onChange || onPageChange || (() => {})

  if (!data && !totalItems && !totalPages) return null
  return (
    <div className="bank-pager">
      <small>
        {total > 0
          ? `Menampilkan ${from}–${to} dari ${total} data`
          : '0 data'}
      </small>
      {lastPage > 1 && (
        <div className="bank-actions">
          <Button
            variant="secondary"
            disabled={currentPage <= 1}
            onClick={() => handleChange(currentPage - 1)}
          >
            Sebelumnya
          </Button>
          <span>
            Halaman {currentPage} / {lastPage}
          </span>
          <Button
            variant="secondary"
            disabled={currentPage >= lastPage}
            onClick={() => handleChange(currentPage + 1)}
          >
            Berikutnya
          </Button>
        </div>
      )}
    </div>
  )
}