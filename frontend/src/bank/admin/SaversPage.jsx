import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api, money, useResource } from '../api'
import {
  Button,
  ConfirmDialog,
  Notice,
  DataTable,
  DetailRow,
  Drawer,
  PageHeader,
  Pager,
  ResourceState,
  SearchField,
  Status,
} from '../ui'

export default function SaversPage() {
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
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
    </>
  )
}