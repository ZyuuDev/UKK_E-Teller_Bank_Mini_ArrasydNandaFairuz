import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api, money, useResource } from '../api'
import { downloadSaverStatement } from '../downloadReport'
import {
  Button,
  ConfirmDialog,
  Notice,
  DataTable,
  DetailRow,
  Drawer,
  FormField,
  Input,
  Modal,
  PageHeader,
  Pager,
  ResourceState,
  SearchField,
  Status,
} from '../ui'

function todayWib() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const part = (name) => parts.find((item) => item.type === name).value
  return `${part('year')}-${part('month')}-${part('day')}`
}

function SaverStatementModal({ saver, onClose }) {
  const [month, setMonth] = useState(() => todayWib().slice(0, 7))
  const [busy, setBusy] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [exportBusy, setExportBusy] = useState(false)

  async function loadData(targetMonth) {
    if (!saver) return
    setBusy(true)
    setError('')
    try {
      const res = await api(`/admin/savers/${saver.id}/statement?month=${targetMonth}`)
      setData(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (saver) {
      loadData(month)
    }
  }, [saver, month])

  async function handleExport(format) {
    if (exportBusy || !saver) return
    setExportBusy(true)
    setError('')
    try {
      await downloadSaverStatement(saver.id, month, format)
    } catch (err) {
      setError(err.message)
    } finally {
      setExportBusy(false)
    }
  }

  function handlePrevMonth() {
    const [y, m] = month.split('-').map(Number)
    const prev = new Date(y, m - 2, 1)
    const newMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
    setMonth(newMonth)
  }

  function handleCurrentMonth() {
    setMonth(todayWib().slice(0, 7))
  }

  return (
    <Modal
      open={!!saver}
      title="Rekap Bulanan & Rekening Koran Nasabah"
      busy={busy || exportBusy}
      variant="modal bank-overlay--wide"
      onClose={onClose}
    >
      {saver && (
        <div style={{ maxWidth: '820px', width: '100%' }}>
          <div
            style={{
              marginBottom: '16px',
              padding: '14px 18px',
              background: 'var(--surface-subdued, #f8fafc)',
              borderRadius: '12px',
              border: '1px solid var(--border, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: 'var(--text)' }}>
                {saver.full_name}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                No. Rekening: <strong>{saver.account_number}</strong> · NIS: <strong>{saver.student_number}</strong>
                {saver.major ? ` · Jurusan: ${saver.major}` : ''}
              </p>
            </div>
            <Status value={saver.account_status || 'active'} />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              marginBottom: '16px',
            }}
          >
            <div style={{ minWidth: '160px' }}>
              <FormField label="Pilih Bulan Rekap">
                <Input
                  type="month"
                  value={month}
                  disabled={busy || exportBusy}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </FormField>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
              <Button
                type="button"
                variant="secondary"
                disabled={busy || exportBusy}
                onClick={handlePrevMonth}
              >
                Bulan Lalu
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy || exportBusy}
                onClick={handleCurrentMonth}
              >
                Bulan Ini
              </Button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', marginBottom: '4px' }}>
              <Button
                type="button"
                variant="primary"
                disabled={busy || exportBusy || !data}
                onClick={() => handleExport('pdf')}
              >
                {exportBusy ? 'Mengunduh...' : '📄 Unduh PDF'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy || exportBusy || !data}
                onClick={() => handleExport('csv')}
              >
                📊 Unduh CSV
              </Button>
            </div>
          </div>

          <Notice error>{error}</Notice>

          {busy && !data && (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Memuat mutasi rekening...
            </div>
          )}

          {data && (
            <>
              <div className="admin-cash-comparison" style={{ marginTop: 0, marginBottom: '16px' }}>
                <div>
                  <small>Saldo Awal Bulan</small>
                  <strong style={{ color: 'var(--text)' }}>
                    {money(data.summary.starting_balance)}
                  </strong>
                </div>
                <div>
                  <small>Total Setoran (Kredit)</small>
                  <strong style={{ color: '#059669' }}>
                    + {money(data.summary.total_deposits)}
                  </strong>
                </div>
                <div>
                  <small>Total Penarikan (Debet)</small>
                  <strong style={{ color: '#dc2626' }}>
                    - {money(data.summary.total_withdrawals)}
                  </strong>
                </div>
                <div>
                  <small>Saldo Akhir Bulan</small>
                  <strong style={{ color: 'var(--action, #2563eb)' }}>
                    {money(data.summary.ending_balance)}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <span>
                  Periode: <strong>{data.period.label}</strong> ({data.summary.transaction_count} transaksi)
                </span>
                <span>
                  Arus Kas Bersih:{' '}
                  <strong style={{ color: data.summary.net_flow >= 0 ? '#059669' : '#dc2626' }}>
                    {money(data.summary.net_flow)}
                  </strong>
                </span>
              </div>

              <DataTable
                caption={`Mutasi rekening ${saver.account_number} bulan ${data.period.label}`}
                rows={data.transactions}
                columns={[
                  ['date', 'Tanggal'],
                  ['created_at', 'Waktu WIB'],
                  ['ref', 'Referensi'],
                  [
                    'type_label',
                    'Jenis Transaksi',
                    null,
                    (row) => (
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: row.transaction_type === 'Deposit' ? '#ecfdf5' : '#fef2f2',
                          color: row.transaction_type === 'Deposit' ? '#065f46' : '#991b1b',
                          border: `1px solid ${row.transaction_type === 'Deposit' ? '#a7f3d0' : '#fecaca'}`,
                        }}
                      >
                        {row.type_label}
                      </span>
                    ),
                  ],
                  [
                    'amount',
                    'Nominal',
                    null,
                    (row) => (
                      <span
                        style={{
                          fontWeight: 600,
                          color: row.transaction_type === 'Deposit' ? '#059669' : '#dc2626',
                        }}
                      >
                        {row.transaction_type === 'Deposit' ? '+ ' : '- '}
                        {money(row.amount)}
                      </span>
                    ),
                  ],
                  ['balance_after', 'Saldo Sesudah', 'money'],
                  ['teller_name', 'Teller'],
                  ['notes', 'Catatan'],
                ]}
              />
            </>
          )}
        </div>
      )}
    </Modal>
  )
}

export default function SaversPage() {
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [resettingPin, setResettingPin] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [statementSaver, setStatementSaver] = useState(null)
  const list = useResource(`/admin/savers?page=${page}&q=${encodeURIComponent(query)}`)
  async function changeAccess() {
    if (!selected || busy) return
    setBusy(true)
    setError('')
    try {
      const next = !selected.service_active
      await api(`/admin/student-access/${selected.user_id}`, {
        method: 'PATCH',
        body: { is_active: next },
      })
      setMessage(
        next
          ? 'Akses nasabah diaktifkan. Siswa perlu login kembali.'
          : 'Akses nasabah dinonaktifkan. Sesi lama diakhiri. Saldo dan riwayat tetap tersimpan.',
      )
      setConfirming(false)
      setSelected(null)
      list.refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <PageHeader
        title="Rekening penabung"
        description="Saldo dan identitas rekening yang terbentuk melalui setoran pertama teller."
      />
      <Notice>{message}</Notice>
      <section className="bank-panel">
        <form
          className="admin-search"
          onSubmit={(event) => {
            event.preventDefault()
            setQuery(draft)
            setPage(1)
          }}
        >
          <SearchField
            label="Cari rekening atau siswa"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Nomor rekening, nomor siswa, atau nama"
          />
          <Button type="submit">Cari</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDraft('')
              setQuery('')
              setPage(1)
            }}
          >
            Reset
          </Button>
        </form>
      </section>
      <section className="bank-panel">
        <h2>Daftar rekening</h2>
        <ResourceState resource={list}>
          <DataTable
            caption="Daftar rekening penabung"
            rows={list.data?.data}
            columns={[
              ['account_number', 'Nomor rekening'],
              ['full_name', 'Nama siswa'],
              ['student_number', 'Nomor siswa'],
              ['balance', 'Saldo total', 'money'],
              ['available_balance', 'Saldo tersedia', 'money'],
              [
                'service_active',
                'Akses nasabah',
                null,
                (row) => (
                  <Status
                    value={row.service_active ? 'service_active' : 'service_blocked'}
                  />
                ),
              ],
            ]}
            actions={(row) => (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelected(row)
                    setError('')
                    setConfirming(false)
                  }}
                >
                  Detail dan QR
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStatementSaver(row)
                  }}
                >
                  Rekap Bulanan
                </Button>
              </div>
            )}
          />
          <Pager data={list.data} page={page} onChange={setPage} />
        </ResourceState>
      </section>
      <Drawer
        open={!!selected}
        title="Detail rekening"
        busy={busy}
        onClose={() => {
          setSelected(null)
          setConfirming(false)
        }}
      >
        {selected && (
          <>
            <h3>{selected.full_name}</h3>
            <dl className="bank-detail-list">
              <DetailRow label="Nomor siswa">{selected.student_number}</DetailRow>
              <DetailRow label="Tahun lulus">{selected.graduation_year}</DetailRow>
              <DetailRow label="Nomor rekening">{selected.account_number}</DetailRow>
              <DetailRow label="Status">
                <Status value={selected.account_status} />
              </DetailRow>
              <DetailRow label="Saldo total">{money(selected.balance)}</DetailRow>
              <DetailRow label="Saldo minimum">
                {money(selected.minimum_balance)}
              </DetailRow>
              <DetailRow label="Saldo dicadangkan">
                {money(selected.reserved_balance)}
              </DetailRow>
              <DetailRow label="Saldo tersedia">
                {money(selected.available_balance)}
              </DetailRow>
            </dl>
            <h3 className="admin-footnote">Akses nasabah</h3>
            <Status
              value={selected.service_active ? 'service_active' : 'service_blocked'}
            />
            <p>
              Nonaktif menghentikan akses login dan transaksi baru. Rekening, saldo,
              jurnal, dan riwayat tidak dihapus. Aktivasi rekening baru tetap melalui
              setoran pertama teller.
            </p>
            <div className="bank-actions">
              <Button
                variant={selected.service_active ? 'danger' : 'primary'}
                disabled={busy}
                onClick={() => {
                  setError('')
                  setConfirming(true)
                }}
              >
                {selected.service_active ? 'Nonaktifkan akses' : 'Aktifkan akses'}
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setError('')
                  setResettingPin(true)
                }}
              >
                Reset PIN (123456)
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setStatementSaver(selected)
                }}
              >
                Rekap Bulanan
              </Button>
            </div>
            <h3 className="admin-footnote">QR identitas rekening</h3>
            {selected.qr_code_token ? (
              <figure className="admin-qr">
                <QRCodeSVG
                  value={selected.qr_code_token}
                  size={220}
                  level="M"
                  title={`QR rekening ${selected.account_number}`}
                />
                <figcaption>
                  Gunakan untuk identifikasi rekening pada layanan teller.
                </figcaption>
              </figure>
            ) : (
              <p>Token QR belum tersedia dari server.</p>
            )}
          </>
        )}
      </Drawer>
      <ConfirmDialog
        open={resettingPin && !!selected}
        title="Reset PIN rekening nasabah?"
        onClose={() => setResettingPin(false)}
        onConfirm={async () => {
          if (!selected || busy) return
          setBusy(true)
          setError('')
          try {
            const res = await api('/admin/savers/' + selected.id + '/reset-pin', { method: 'POST' })
            setMessage(res.data?.message || 'PIN berhasil direset ke 123456.')
            setResettingPin(false)
            setSelected(null)
            list.refresh()
          } catch (failure) {
            setError(failure.message)
          } finally {
            setBusy(false)
          }
        }}
        busy={busy}
        error={error}
        confirmLabel="Ya, reset PIN"
      >
        <p>
          {selected?.full_name} · {selected?.account_number}
        </p>
        <p>
          PIN akan diubah menjadi <strong>123456</strong>. Beritahukan siswa agar segera mengganti PIN setelah login.
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={confirming && !!selected}
        title={
          selected?.service_active
            ? 'Nonaktifkan akses nasabah?'
            : 'Aktifkan akses nasabah?'
        }
        onClose={() => setConfirming(false)}
        onConfirm={changeAccess}
        busy={busy}
        error={error}
        danger={!!selected?.service_active}
        confirmLabel={
          selected?.service_active ? 'Ya, nonaktifkan akses' : 'Ya, aktifkan akses'
        }
      >
        <p>
          {selected?.full_name} · {selected?.account_number}
        </p>
        <p>
          Perubahan ini hanya berlaku untuk akses layanan. Siswa perlu login kembali
          sesudah akses diaktifkan.
        </p>
      </ConfirmDialog>
      <SaverStatementModal
        saver={statementSaver}
        onClose={() => setStatementSaver(null)}
      />
    </>
  )
}