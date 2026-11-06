import { useState } from 'react'
import { money, useResource } from '../api'
import {
  AuditActionBadge,
  Button,
  DataTable,
  DetailRow,
  Drawer,
  PageHeader,
  Pager,
  ResourceState,
  UserRoleBadge,
  formatDetailLabel,
  formatSubject,
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
        ['id', 'ID'],
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
                {row.actor_name || row.actor_username || `ID ${row.actor_id}`}
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
                .map(([key, value]) => {
                  let displayValue = value ?? 'Tidak tersedia'
                  if (
                    [
                      'opening_balance',
                      'expected_closing_balance',
                      'actual_cash_on_hand',
                      'discrepancy',
                      'amount',
                      'balance_after',
                    ].includes(key) &&
                    typeof value === 'number'
                  ) {
                    displayValue = money(value)
                  } else if (key === 'action') {
                    displayValue = <AuditActionBadge action={value} />
                  } else if (key === 'subject_type') {
                    displayValue = formatSubject(value)
                  } else if (key === 'actor_role') {
                    displayValue = <UserRoleBadge role={value} />
                  } else if (
                    (key === 'created_at' || key === 'updated_at') &&
                    value
                  ) {
                    displayValue = new Date(value).toLocaleString('id-ID', {
                      timeZone: 'Asia/Jakarta',
                    })
                  } else if (typeof value === 'object' && value !== null) {
                    displayValue = <JsonDetail value={value} />
                  }

                  return (
                    <DetailRow key={key} label={formatDetailLabel(key)}>
                      {displayValue}
                    </DetailRow>
                  )
                })}
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