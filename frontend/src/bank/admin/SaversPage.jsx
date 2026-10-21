import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { money, useResource } from '../api'
import {
  Button,
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
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const list = useResource(`/admin/savers?page=${page}&q=${encodeURIComponent(query)}`)
  return (
    <>
      <PageHeader
        title="Rekening penabung"
        description="Saldo dan identitas rekening yang terbentuk melalui setoran pertama teller."
      />
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
            ]}
            actions={(row) => (
              <Button variant="secondary" onClick={() => setSelected(row)}>
                Detail dan QR
              </Button>
            )}
          />
          <Pager data={list.data} page={page} onChange={setPage} />
        </ResourceState>
      </section>
      <Drawer open={!!selected} title="Detail rekening" onClose={() => setSelected(null)}>
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
    </>
  )
}