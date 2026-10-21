import { useState } from 'react'
import { useResource } from '../api'
import {
  Button,
  DataTable,
  DetailRow,
  Drawer,
  PageHeader,
  Pager,
  ResourceState,
} from '../ui'

function JsonDetail({ value }) {
  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      parsed = value
    }
  }
  return (
    <pre className="admin-json">
      {typeof parsed === 'string'
        ? parsed
        : (JSON.stringify(parsed, null, 2) ?? 'Tidak tersedia')}
    </pre>
  )
}

export default function LedgerPage({ audit = false }) {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const list = useResource(`/admin/${audit ? 'audit-logs' : 'journals'}?page=${page}`)
  const columns = audit
    ? [
        ['id', 'ID audit'],
        [
          'created_at',
          'Waktu',
          null,
          (row) =>
            new Date(row.created_at).toLocaleString('id-ID', {
              timeZone: 'Asia/Jakarta',
            }),
        ],
        ['actor_id', 'ID pelaku'],
        ['action', 'Aktivitas'],
        ['subject_type', 'Jenis objek'],
        ['subject_id', 'ID objek'],
      ]
    : [
        ['id', 'ID jurnal'],
        ['account_code', 'Kode akun'],
        [
          'entry_type',
          'Posisi',
          null,
          (row) => (
            <span
              className={`admin-entry ${row.entry_type === 'Debit' ? 'admin-entry--debit' : ''}`}
            >
              {row.entry_type}
            </span>
          ),
        ],
        ['amount', 'Nominal', 'money'],
        ['transaction_id', 'ID transaksi'],
        ['cash_transfer_id', 'ID transfer kas'],
        ['cash_session_id', 'ID sesi kas'],
      ]
  return (
    <>
      <PageHeader
        title={audit ? 'Audit aktivitas' : 'Jurnal akuntansi'}
        description={
          audit
            ? 'Telusuri pelaku, aktivitas, dan rincian perubahan yang dicatat backend.'
            : 'Periksa entri debit dan kredit beserta referensi sumbernya.'
        }
      />
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
        title={audit ? 'Rincian audit' : 'Rincian jurnal'}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <dl className="bank-detail-list">
              {Object.entries(selected)
                .filter(([key]) => key !== 'details')
                .map(([key, value]) => (
                  <DetailRow key={key} label={key}>
                    {typeof value === 'object' && value !== null ? (
                      <JsonDetail value={value} />
                    ) : (
                      (value ?? 'Tidak tersedia')
                    )}
                  </DetailRow>
                ))}
            </dl>
            {'details' in selected && (
              <>
                <h3 className="admin-footnote">Detail perubahan</h3>
                <JsonDetail value={selected.details} />
              </>
            )}
          </>
        )}
      </Drawer>
    </>
  )
}