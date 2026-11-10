import { useState } from 'react'
import { api, money, useResource } from '../api'
import {
  Button,
  ConfirmDialog,
  DataTable,
  FormField,
  Input,
  Modal,
  Notice,
  PageHeader,
  Pager,
  ResourceState,
  Select,
  Status,
} from '../ui'

// [Admin] Halaman Verifikasi & Persetujuan Perjanjian Penarikan Dana Siswa (> Rp 1.000.000, H-1)
export default function AppointmentsPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [actionType, setActionType] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const params = new URLSearchParams()
  params.set('page', page)
  if (status) params.set('status', status)
  if (query.trim()) params.set('q', query.trim())

  const appointments = useResource(`/admin/appointments?${params.toString()}`)

  // 1. Aksi Admin: Menyetujui (Approve) permohonan perjanjian penarikan
  async function handleApprove() {
    if (!selected || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await api(`/admin/appointments/${selected.id}/approve`, { method: 'POST' })
      setMessage(res.message || 'Perjanjian penarikan berhasil disetujui.')
      setSelected(null)
      setActionType('')
      appointments.refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  // 2. Aksi Admin: Menolak (Reject) permohonan perjanjian penarikan dengan alasan
  async function handleReject(event) {
    event.preventDefault()
    if (!selected || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await api(`/admin/appointments/${selected.id}/reject`, {
        method: 'POST',
        body: { reason: rejectionReason.trim() },
      })
      setMessage(res.message || 'Perjanjian penarikan telah ditolak.')
      setSelected(null)
      setActionType('')
      setRejectionReason('')
      appointments.refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  // 3. Konfigurasi kolom tabel antrian perjanjian penarikan siswa
  const columns = [
    {
      key: 'code',
      header: 'Kode Tiket',
      render: (item) => (
        <div>
          <strong className="mono">{item.appointment_code}</strong>
          <div className="subtext">
            Diajukan oleh: {item.creator_role === 'student' ? 'Siswa' : 'Teller'}
          </div>
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Nasabah',
      render: (item) => (
        <div>
          <strong>{item.saver?.member?.full_name || '-'}</strong>
          <div className="subtext">
            NIS: {item.saver?.member?.student_number || '-'} &bull; Rek:{' '}
            {item.saver?.account_number || '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Nominal',
      render: (item) => (
        <div>
          <strong className="mono text-primary">{money(item.amount)}</strong>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Tgl Pengambilan',
      render: (item) => (
        <div>
          <span>{item.scheduled_date}</span>
          {item.notes && <div className="subtext italic">"{item.notes}"</div>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        if (item.status === 'pending') {
          return <Status tone="warning">Menunggu Persetujuan</Status>
        }
        if (item.status === 'approved') {
          return <Status tone="success">Disetujui Admin</Status>
        }
        if (item.status === 'completed') {
          return <Status tone="neutral">Selesai Dicairkan</Status>
        }
        return (
          <div>
            <Status tone="danger">Ditolak</Status>
            {item.rejection_reason && (
              <div className="subtext text-danger">{item.rejection_reason}</div>
            )}
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'Aksi Admin',
      render: (item) => {
        if (item.status === 'pending') {
          return (
            <div className="button-group">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelected(item)
                  setActionType('approve')
                }}
              >
                Setujui
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setSelected(item)
                  setActionType('reject')
                  setRejectionReason('')
                }}
              >
                Tolak
              </Button>
            </div>
          )
        }
        if (item.status === 'approved') {
          return (
            <span className="subtext">
              Di-ACC oleh {item.approver?.name || 'Admin'}
            </span>
          )
        }
        return <span className="subtext">-</span>
      },
    },
  ]

  return (
    <div className="page-stack">
      <PageHeader
        title="Perjanjian Penarikan Kas Besar"
        subtitle="Verifikasi dan persetujuan penarikan nasabah di atas Rp1.000.000 (Minimal H-1)."
      />

      {message && <Notice tone="success">{message}</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}

      <div className="card">
        {/* 4. Baris filter status dan pencarian keyword (kode tiket, NIS, nama siswa) */}
        <div className="filter-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input
              type="search"
              placeholder="Cari kode tiket, nama siswa, NIS, atau rekening..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div style={{ width: '220px' }}>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Semua Status</option>
              <option value="pending">Menunggu Persetujuan</option>
              <option value="approved">Disetujui</option>
              <option value="completed">Selesai Dicairkan</option>
              <option value="rejected">Ditolak</option>
            </Select>
          </div>
          <Button variant="outline" onClick={() => appointments.refresh()}>
            Segarkan
          </Button>
        </div>

        <ResourceState
          resource={appointments}
          emptyLabel="Belum ada pengajuan perjanjian penarikan."
        >
          {() => (
            <>
              <DataTable
                columns={columns}
                rows={appointments.data?.data || []}
              />
              <Pager
                page={appointments.data?.current_page || 1}
                totalPages={appointments.data?.last_page || 1}
                totalItems={appointments.data?.total || 0}
                onPageChange={(p) => setPage(p)}
              />
            </>
          )}
        </ResourceState>
      </div>

      {/* 5. Dialog konfirmasi persetujuan (Approve Modal) */}
      <ConfirmDialog
        open={actionType === 'approve' && !!selected}
        title="Setujui Perjanjian Penarikan?"
        confirmLabel="Ya, Setujui"
        busy={busy}
        onConfirm={handleApprove}
        onCancel={() => {
          setSelected(null)
          setActionType('')
        }}
      >
        <p>
          Anda akan menyetujui penarikan sebesar{' '}
          <strong>{selected ? money(selected.amount) : ''}</strong> untuk nasabah{' '}
          <strong>{selected?.saver?.member?.full_name}</strong> pada tanggal{' '}
          <strong>{selected?.scheduled_date}</strong>.
        </p>
        <p className="subtext">
          Setelah disetujui, kas pada loket teller dapat dicairkan pada tanggal tersebut sesuai kode tiket.
        </p>
      </ConfirmDialog>

      {/* 6. Modal penolakan dengan input alasan (Reject Modal) */}
      <Modal
        open={actionType === 'reject' && !!selected}
        title="Tolak Perjanjian Penarikan"
        onClose={() => {
          setSelected(null)
          setActionType('')
        }}
      >
        <form onSubmit={handleReject} className="stack">
          <p>
            Menolak permohonan penarikan{' '}
            <strong>{selected ? money(selected.amount) : ''}</strong> untuk{' '}
            <strong>{selected?.saver?.member?.full_name}</strong>.
          </p>
          <FormField label="Alasan Penolakan" required>
            <Input
              required
              placeholder="Contoh: Ketersediaan kas fisik terbatas / salah input nominal"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </FormField>
          <div className="button-group modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelected(null)
                setActionType('')
              }}
            >
              Batal
            </Button>
            <Button type="submit" variant="danger" busy={busy}>
              Tolak Permohonan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

