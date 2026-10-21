import { ClipboardCheck, Landmark, Users } from 'lucide-react'
import { useResource } from '../api'
import { Button, DataTable, PageHeader, ResourceState, StatCard } from '../ui'

export default function OverviewPage() {
  const members = useResource('/admin/members?page=1')
  const savers = useResource('/admin/savers?page=1')
  const reports = useResource('/admin/reconciliations?page=1&status=pending')
  const audit = useResource('/admin/audit-logs?page=1')
  return (
    <>
      <PageHeader
        title="Ringkasan Bank Mini"
        description="Data anggota, rekening, dan laporan kas dari sistem sekolah."
      />
      <div className="bank-stats">
        {[
          [members, 'Total anggota', Users],
          [savers, 'Rekening penabung', Landmark],
          [reports, 'Laporan menunggu pemeriksaan', ClipboardCheck],
        ].map(([resource, label, icon]) => (
          <div key={label}>
            <ResourceState resource={resource}>
              <StatCard
                label={label}
                value={resource.data?.total?.toLocaleString('id-ID')}
                icon={icon}
              />
            </ResourceState>
          </div>
        ))}
      </div>
      <section className="bank-panel">
        <div className="bank-panel__head">
          <h2>Aktivitas terbaru</h2>
          <Button
            variant="secondary"
            onClick={() => {
              members.refresh()
              savers.refresh()
              reports.refresh()
              audit.refresh()
            }}
          >
            Muat ulang
          </Button>
        </div>
        <p className="muted">
          Lima catatan terbaru. Laporan berstatus ada selisih diperiksa melalui menu
          Laporan kas.
        </p>
        <ResourceState resource={audit}>
          <DataTable
            caption="Lima aktivitas terbaru"
            rows={audit.data?.data?.slice(0, 5)}
            columns={[
              [
                'created_at',
                'Waktu',
                null,
                (row) =>
                  new Date(row.created_at).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                  }),
              ],
              ['action', 'Aktivitas'],
              ['actor_id', 'ID pelaku'],
              ['subject_id', 'ID objek'],
            ]}
          />
        </ResourceState>
      </section>
    </>
  )
}