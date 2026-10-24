import { useState } from 'react'
import { api, money, useResource } from '../api'
import { printReport } from '../printing'
import TransactionReportsPage from './TransactionReportsPage'
import {
  Button,
  DataTable,
  DetailRow,
  Drawer,
  FormField,
  Input,
  Notice,
  PageHeader,
  Pager,
  ResourceState,
  Select,
  Status,
} from '../ui'

export default function ReportsPage({ teller = false }) {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [review, setReview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const list = useResource(
    teller
      ? `/teller/reports?page=${page}`
      : `/admin/reconciliations?page=${page}&status=${status}`,
  )
  const hasSession = !!selected?.cash_session_id
  const canReview =
    !teller && hasSession && ['pending', 'disputed'].includes(selected?.status)
  const canApprove =
    canReview && selected.status === 'pending' && Number(selected.discrepancy) === 0
  const canPrint =
    selected &&
    ['pending', 'approved'].includes(selected.status) &&
    Number(selected.discrepancy) === 0
  async function submit(event) {
    event.preventDefault()
    if (!canReview || (review === 'approve' && !canApprove)) return
    const values = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true)
    setError('')
    try {
      await api(`/admin/reconciliations/${selected.id}/${review}`, {
        method: 'POST',
        body: review === 'reject' ? { reason: values.reason } : {},
      })
      setSelected(null)
      setReview('')
      setMessage(
        review === 'approve'
          ? 'Laporan disetujui.'
          : 'Laporan dikembalikan untuk perbaikan.',
      )
      list.refresh()
    } catch (failure) {
      setError(failure.message)
      if (failure.status === 409) list.refresh()
    } finally {
      setBusy(false)
    }
  }
  function print() {
    try {
      printReport(selected)
    } catch (failure) {
      setError(failure.message)
    }
  }
  return (
    <>
      {!teller && (
        <PageHeader
          title="Pemeriksaan laporan kas"
          description="Bandingkan kas sistem dan uang fisik sebelum memutuskan hasil pemeriksaan."
        />
      )}
      <Notice>{message}</Notice>
      <section className="bank-panel">
        <div className="bank-panel__head">
          <h2>{teller ? 'Riwayat laporan saya' : 'Daftar laporan teller'}</h2>
          <Button variant="secondary" onClick={list.refresh}>
            Muat ulang
          </Button>
        </div>
        {!teller && (
          <div className="admin-filter-single">
            <FormField label="Status laporan">
              <Select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">Semua status</option>
                <option value="pending">Menunggu pemeriksaan</option>
                <option value="disputed">Ada selisih</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Dikembalikan</option>
              </Select>
            </FormField>
          </div>
        )}
        <ResourceState resource={list}>
          <DataTable
            caption="Laporan kas"
            rows={list.data?.data}
            columns={[
              ['date', 'Tanggal'],
              ...(!teller
                ? [
                    [
                      'teller',
                      'Teller',
                      null,
                      (row) => row.teller?.name ?? `ID ${row.teller_id}`,
                    ],
                  ]
                : []),
              ['expected_closing_balance', 'Kas sistem', 'money'],
              ['actual_cash_on_hand', 'Uang fisik', 'money'],
              ['discrepancy', 'Selisih', 'money'],
              ['status', 'Status', 'status'],
            ]}
            actions={(row) => (
              <Button
                variant="secondary"
                onClick={() => {
                  setSelected(row)
                  setReview('')
                  setError('')
                }}
              >
                Periksa detail
              </Button>
            )}
          />
          <Pager data={list.data} page={page} onChange={setPage} />
        </ResourceState>
      </section>
      <TransactionReportsPage isAdmin={!teller} />
      <Drawer
        open={!!selected}
        title="Detail laporan kas"
        busy={busy}
        onClose={() => {
          setSelected(null)
          setReview('')
          setError('')
        }}
      >
        <Notice error>{error}</Notice>
        {selected && (
          <>
            <Status value={selected.status} />
            <dl className="bank-detail-list admin-footnote">
              <DetailRow label="Referensi laporan">{selected.id}</DetailRow>
              <DetailRow label="Tanggal">{selected.date}</DetailRow>
              <DetailRow label="Teller">
                {selected.teller?.name ?? `ID ${selected.teller_id}`}
              </DetailRow>
              <DetailRow label="ID sesi kas">{selected.cash_session_id}</DetailRow>
              <DetailRow label="Modal awal">
                {money(selected.opening_balance)}
              </DetailRow>
              <DetailRow label="Total setoran">
                {money(selected.total_deposits)}
              </DetailRow>
              <DetailRow label="Total penarikan">
                {money(selected.total_withdrawals)}
              </DetailRow>
            </dl>
            <div className="admin-cash-comparison">
              <div>
                <small>Kas sistem</small>
                <strong>{money(selected.expected_closing_balance)}</strong>
              </div>
              <div>
                <small>Uang fisik</small>
                <strong>{money(selected.actual_cash_on_hand)}</strong>
              </div>
              <div data-discrepancy={Number(selected.discrepancy) !== 0}>
                <small>Selisih</small>
                <strong>{money(selected.discrepancy)}</strong>
              </div>
            </div>
            <dl className="bank-detail-list">
              <DetailRow label="Pemeriksa">
                {selected.approver?.name ?? selected.approved_by}
              </DetailRow>
              <DetailRow label="Catatan penolakan">
                {selected.rejection_reason}
              </DetailRow>
            </dl>
            {!hasSession && (
              <Notice>Laporan lama tanpa referensi sesi kas hanya dapat dibaca.</Notice>
            )}
            <div className="bank-actions admin-footnote">
              {canPrint && (
                <Button variant="secondary" onClick={print}>
                  Cetak laporan
                </Button>
              )}
              {canReview && !review && (
                <>
                  <Button
                    disabled={!canApprove}
                    onClick={() => {
                      setError('')
                      setReview('approve')
                    }}
                  >
                    Setujui laporan
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setError('')
                      setReview('reject')
                    }}
                  >
                    Kembalikan laporan
                  </Button>
                </>
              )}
            </div>
            {!canPrint && (
              <p className="admin-footnote muted">
                Cetak tersedia untuk laporan tanpa selisih yang menunggu pemeriksaan
                atau telah disetujui.
              </p>
            )}
            {review && (
              <form className="bank-form admin-review" onSubmit={submit} key={review}>
                <h3>
                  {review === 'approve'
                    ? 'Konfirmasi persetujuan'
                    : 'Alasan pengembalian'}
                </h3>
                {review === 'reject' && (
                  <FormField
                    label="Alasan"
                    hint="5–1.000 karakter, sesuai hasil pemeriksaan."
                  >
                    <Input name="reason" minLength={5} maxLength={1000} required />
                  </FormField>
                )}
                <label className="bank-checkbox">
                  <input type="checkbox" required />
                  Saya telah memeriksa laporan, bukti transaksi, dan uang fisik terkait.
                </label>
                <div className="bank-actions">
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => setReview('')}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant={review === 'reject' ? 'danger' : 'primary'}
                    busy={busy}
                  >
                    {review === 'approve'
                      ? 'Konfirmasi persetujuan'
                      : 'Konfirmasi pengembalian'}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </Drawer>
    </>
  )
}