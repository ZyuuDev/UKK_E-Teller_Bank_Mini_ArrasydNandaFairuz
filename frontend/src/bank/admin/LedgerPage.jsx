import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useResource } from '../api'
import {
  ACCOUNT_CODE_LABELS,
  AuditActionBadge,
  Button,
  DataTable,
  DetailRow,
  Drawer,
  FormField,
  HumanDetail,
  Input,
  PageHeader,
  Pager,
  ResourceState,
  SearchField,
  Select,
  UserRoleBadge,
  formatAccountCode,
  formatDetailLabel,
  formatDetailValue,
  formatSubject,
} from '../ui'

const emptyAuditFilter = { q: '', action: '', role: '', date: '' }
const emptyJournalFilter = { q: '', account_code: '', entry_type: '', date: '' }

function formatJournalReference(row) {
  if (row.transaction_id) return `Transaksi Tabungan #${row.transaction_id}`
  if (row.cash_transfer_id) return `Serah Terima Kas #${row.cash_transfer_id}`
  if (row.cash_session_id) return `Sesi Kas Loket #${row.cash_session_id}`
  return 'Penyesuaian Sistem'
}

export default function LedgerPage({ audit = false }) {
  const initial = audit ? emptyAuditFilter : emptyJournalFilter
  const [draft, setDraft] = useState(initial)
  const [filter, setFilter] = useState(initial)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)

  const queryParams = new URLSearchParams(
    Object.entries({ ...filter, page }).filter(([, val]) => val !== '' && val !== null),
  )
  const list = useResource(`/admin/${audit ? 'audit-logs' : 'journals'}?${queryParams}`)

  function applyFilter(event) {
    event.preventDefault()
    setFilter(draft)
    setPage(1)
  }

  function resetFilter() {
    const clean = audit ? emptyAuditFilter : emptyJournalFilter
    setDraft(clean)
    setFilter(clean)
    setPage(1)
  }

  const columns = audit
    ? [
        ['id', 'ID', null, (row) => `#${row.id}`],
        [
          'created_at',
          'Waktu Kejadian',
          null,
          (row) => (
            <div style={{ whiteSpace: 'nowrap' }}>
              {new Date(row.created_at).toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          ),
        ],
        [
          'action',
          'Aktivitas Pelayanan',
          null,
          (row) => <AuditActionBadge action={row.action} />,
        ],
        [
          'actor',
          'Petugas / Pelaku',
          null,
          (row) => (
            <div className="audit-actor-card">
              <span className="audit-actor-card__name">
                {row.actor_name || row.actor_username || `Petugas #${row.actor_id}`}
              </span>
              <div className="audit-actor-card__meta">
                <UserRoleBadge role={row.actor_role} />
                {row.actor_username && <span>@{row.actor_username}</span>}
              </div>
            </div>
          ),
        ],
        [
          'subject',
          'Objek Terkait',
          null,
          (row) => (
            <div>
              <strong>{formatSubject(row.subject_type)}</strong>
              {row.subject_id ? <span className="muted"> #{row.subject_id}</span> : null}
            </div>
          ),
        ],
      ]
    : [
        ['id', 'ID Jurnal', null, (row) => `#${row.id}`],
        [
          'created_at',
          'Waktu Pencatatan',
          null,
          (row) =>
            row.created_at
              ? new Date(row.created_at).toLocaleString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-',
        ],
        [
          'account_code',
          'Akun Buku Besar',
          null,
          (row) => <strong>{formatAccountCode(row.account_code)}</strong>,
        ],
        [
          'entry_type',
          'Posisi',
          null,
          (row) => (
            <span
              className={`admin-entry ${row.entry_type === 'Debit' ? 'admin-entry--debit' : ''}`}
            >
              {row.entry_type === 'Debit' ? 'Debit' : 'Kredit'}
            </span>
          ),
        ],
        ['amount', 'Nominal', 'money'],
        [
          'reference',
          'Sumber Referensi',
          null,
          (row) => formatJournalReference(row),
        ],
      ]

  return (
    <>
      <PageHeader
        title={audit ? 'Audit aktivitas' : 'Jurnal akuntansi'}
        description={
          audit
            ? 'Telusuri pelaku, jenis aktivitas pelayanan, dan rincian perubahan yang tercatat otomatis di sistem.'
            : 'Periksa pencatatan akuntansi berpasangan (debit dan kredit) beserta transaksi sumbernya.'
        }
      />

      <section className="bank-panel">
        <form className="admin-filters" onSubmit={applyFilter}>
          <SearchField
            label={audit ? 'Cari petugas atau aktivitas' : 'Cari ID jurnal atau referensi'}
            value={draft.q}
            onChange={(event) => setDraft({ ...draft, q: event.target.value })}
            placeholder={
              audit
                ? 'Nama petugas, username, atau nomor objek'
                : 'Nomor jurnal, transaksi, atau sesi kas'
            }
          />
          {audit ? (
            <>
              <FormField label="Kategori aktivitas">
                <Select
                  value={draft.action}
                  onChange={(event) => setDraft({ ...draft, action: event.target.value })}
                >
                  <option value="">Semua aktivitas</option>
                  <option value="transaction.">Transaksi Tabungan</option>
                  <option value="saver.">Aktivasi & PIN Rekening</option>
                  <option value="cash_session.">Sesi Kas Loket</option>
                  <option value="reconciliation.">Rekonsiliasi & Tutup Kas</option>
                  <option value="cash_request.">Pengajuan Tambahan Kas</option>
                  <option value="member">Data & Impor Siswa</option>
                  <option value="staff.">Manajemen Petugas</option>
                  <option value="service_status.">Status Layanan Loket</option>
                </Select>
              </FormField>
              <FormField label="Peran pelaku">
                <Select
                  value={draft.role}
                  onChange={(event) => setDraft({ ...draft, role: event.target.value })}
                >
                  <option value="">Semua peran</option>
                  <option value="admin">Administrator</option>
                  <option value="teller">Teller Loket</option>
                  <option value="student">Siswa Penabung</option>
                </Select>
              </FormField>
            </>
          ) : (
            <>
              <FormField label="Akun buku besar">
                <Select
                  value={draft.account_code}
                  onChange={(event) =>
                    setDraft({ ...draft, account_code: event.target.value })
                  }
                >
                  <option value="">Semua akun</option>
                  {Object.entries(ACCOUNT_CODE_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Posisi entri">
                <Select
                  value={draft.entry_type}
                  onChange={(event) =>
                    setDraft({ ...draft, entry_type: event.target.value })
                  }
                >
                  <option value="">Semua posisi</option>
                  <option value="Debit">Debit</option>
                  <option value="Credit">Kredit</option>
                </Select>
              </FormField>
            </>
          )}
          <FormField label="Tanggal">
            <Input
              type="date"
              value={draft.date}
              onChange={(event) => setDraft({ ...draft, date: event.target.value })}
            />
          </FormField>
          <div className="bank-actions">
            <Button type="submit">Terapkan</Button>
            <Button variant="secondary" onClick={resetFilter}>
              <RotateCcw size={16} aria-hidden="true" />
              Reset
            </Button>
          </div>
        </form>
      </section>

      <section className="bank-panel">
        <div className="bank-panel__head">
          <h2>{audit ? 'Catatan audit' : 'Entri jurnal'}</h2>
          <Button variant="secondary" onClick={list.refresh}>
            Muat ulang
          </Button>
        </div>
        <ResourceState resource={list}>
          <DataTable
            caption={audit ? 'Catatan audit' : 'Entri jurnal'}
            rows={list.data?.data}
            columns={columns}
            actions={(row) => (
              <Button variant="secondary" onClick={() => setSelected(row)}>
                Rincian lengkap
              </Button>
            )}
          />
          <Pager data={list.data} page={page} onChange={setPage} />
        </ResourceState>
      </section>
      <Drawer
        open={!!selected}
        title={audit ? 'Rincian audit aktivitas' : 'Rincian entri jurnal'}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <dl className="bank-detail-list">
              {Object.entries(selected)
                .filter(([key, val]) => key !== 'details' && val !== null && val !== '')
                .map(([key, value]) => (
                  <DetailRow key={key} label={formatDetailLabel(key)}>
                    {typeof value === 'object' ? (
                      <HumanDetail value={value} />
                    ) : (
                      formatDetailValue(key, value)
                    )}
                  </DetailRow>
                ))}
            </dl>
            {'details' in selected && selected.details && (
              <>
                <h3 className="admin-footnote">Rincian perubahan & informasi tambahan</h3>
                <HumanDetail value={selected.details} />
              </>
            )}
          </>
        )}
      </Drawer>
    </>
  )
}