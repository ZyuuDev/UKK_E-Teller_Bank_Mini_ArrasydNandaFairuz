import { useState } from 'react'
import { api, money, useResource } from '../api'
import { downloadReport } from '../downloadReport'
import { printReceipt } from '../printing'
import {
  Button,
  DataTable,
  DetailRow,
  FormField,
  Input,
  Modal,
  Notice,
  Pager,
  ResourceState,
  Select,
  StatCard,
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

function TellerFilter({ value, onChange, disabled }) {
  const tellers = useResource('/admin/users')
  return (
    <>
      <FormField label="Lingkup teller">
        <Select
          value={value}
          onChange={onChange}
          disabled={disabled || tellers.loading || !!tellers.error}
        >
          <option value="">Semua teller</option>
          {(tellers.data || [])
            .filter((user) => user.role === 'teller')
            .map((user) => (
              <option value={user.id} key={user.id}>
                {user.name}
                {user.is_active ? '' : ' (nonaktif)'}
              </option>
            ))}
        </Select>
      </FormField>
      {tellers.error && (
        <Notice error>
          {tellers.error}
          <Button variant="secondary" onClick={tellers.refresh}>
            Muat teller
          </Button>
        </Notice>
      )}
    </>
  )
}

export default function TransactionReportsPage({ isAdmin }) {
  const [draft, setDraft] = useState(() => ({
    period: 'daily',
    date: todayWib(),
    month: todayWib().slice(0, 7),
    teller_id: '',
  }))
  const [filters, setFilters] = useState(() => ({ period: 'daily', date: todayWib() }))
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState(null)
  const list = useResource(
    `/reports/transactions?${new URLSearchParams({ ...filters, page })}`,
  )

  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }))
  }
  function apply(event) {
    event.preventDefault()
    setError('')
    setPage(1)
    setFilters({
      period: draft.period,
      ...(draft.period === 'daily' ? { date: draft.date } : { month: draft.month }),
      ...(isAdmin && draft.teller_id ? { teller_id: draft.teller_id } : {}),
    })
  }
  async function exportFile(format) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await downloadReport(filters, format)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  async function openReceipt(row) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      setReceipt((await api(`/teller/transactions/${row.id}`)).data)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="bank-panel revision-gap">
      <h2>Laporan transaksi harian / bulanan</h2>
      <p>
        {isAdmin
          ? 'Lihat transaksi semua teller atau satu teller.'
          : 'Laporan ini hanya mencakup transaksi yang kamu layani.'}
      </p>
      <Notice error>{error}</Notice>
      <form className="revision-filter" onSubmit={apply}>
        <FormField label="Periode">
          <Select
            value={draft.period}
            disabled={busy}
            onChange={(event) => update('period', event.target.value)}
          >
            <option value="daily">Harian</option>
            <option value="monthly">Bulanan</option>
          </Select>
        </FormField>
        {draft.period === 'daily' ? (
          <FormField label="Tanggal WIB">
            <Input
              type="date"
              required
              value={draft.date}
              disabled={busy}
              onChange={(event) => update('date', event.target.value)}
            />
          </FormField>
        ) : (
          <FormField label="Bulan">
            <Input
              type="month"
              required
              value={draft.month}
              disabled={busy}
              onChange={(event) => update('month', event.target.value)}
            />
          </FormField>
        )}
        {isAdmin && (
          <TellerFilter
            value={draft.teller_id}
            disabled={busy}
            onChange={(event) => update('teller_id', event.target.value)}
          />
        )}
        <Button type="submit" disabled={busy}>
          Terapkan periode
        </Button>
      </form>
      <ResourceState resource={list}>
        <p className="revision-gap">
          Periode diterapkan: <strong>{list.data?.filters.label}</strong> ·{' '}
          {list.data?.filters.teller_id
            ? `Teller ID ${list.data.filters.teller_id}`
            : 'Semua teller'}
        </p>
        <div className="revision-metrics">
          <StatCard label="Transaksi" value={list.data?.summary.entries} />
          <StatCard label="Total setoran" value={money(list.data?.summary.deposits)} />
          <StatCard
            label="Total penarikan"
            value={money(list.data?.summary.withdrawals)}
          />
          <StatCard label="Arus bersih" value={money(list.data?.summary.net_flow)} />
        </div>
        <p>
          Arus bersih adalah setoran dikurangi penarikan, bukan saldo kas penutupan. PDF
          juga mencantumkan status dan selisih rekonsiliasi yang sudah diajukan.
        </p>
        <div className="bank-actions revision-gap">
          <Button busy={busy} onClick={() => exportFile('pdf')}>
            Unduh PDF
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => exportFile('csv')}>
            Unduh CSV
          </Button>
          <Button variant="secondary" disabled={busy} onClick={list.refresh}>
            Muat ulang
          </Button>
        </div>
        <DataTable
          caption="Transaksi sesuai periode"
          rows={list.data?.transactions.data}
          columns={[
            ['id', 'Referensi', null, (row) => `TRX-${row.id}`],
            ['created_at', 'Waktu WIB'],
            ['account_number', 'Rekening'],
            ['full_name', 'Nama siswa'],
            ['teller_name', 'Teller'],
            ['type_label', 'Jenis'],
            ['amount', 'Nominal', 'money'],
            ['balance_after', 'Saldo sesudah', 'money'],
          ]}
          actions={
            !isAdmin
              ? (row) => (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => openReceipt(row)}
                  >
                    Bukti / cetak ulang
                  </Button>
                )
              : undefined
          }
        />
        <Pager data={list.data?.transactions} page={page} onChange={setPage} />
      </ResourceState>
      <Modal
        open={!!receipt}
        title="Bukti transaksi tersimpan"
        onClose={() => setReceipt(null)}
      >
        {receipt && (
          <>
            <p>
              TRX-{receipt.id} · {receipt.full_name}
            </p>
            <dl className="bank-detail-list">
              <DetailRow label="Rekening">{receipt.account_number}</DetailRow>
              <DetailRow label="Jenis">
                {receipt.transaction_type === 'Deposit' ? 'Setoran' : 'Penarikan'}
              </DetailRow>
              <DetailRow label="Nominal">{money(receipt.amount)}</DetailRow>
              <DetailRow label="Saldo sesudah">
                {money(receipt.balance_after)}
              </DetailRow>
              <DetailRow label="Request ID">{receipt.request_id}</DetailRow>
            </dl>
            <Button
              onClick={() => {
                try {
                  printReceipt(receipt)
                } catch (failure) {
                  setError(failure.message)
                  setReceipt(null)
                }
              }}
            >
              Cetak bukti
            </Button>
          </>
        )}
      </Modal>
    </section>
  )
}