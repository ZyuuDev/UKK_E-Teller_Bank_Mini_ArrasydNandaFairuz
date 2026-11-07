import { useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Landmark,
  Layers,
  Receipt,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { money, useResource } from '../api'
import {
  AuditActionBadge,
  Button,
  DataTable,
  PageHeader,
  ResourceState,
  UserRoleBadge,
  formatSubject,
} from '../ui'

export default function OverviewPage({ onNavigate }) {
  const stats = useResource('/admin/dashboard-stats')
  const [activeTab, setActiveTab] = useState('transactions')

  const data = stats.data || {}
  const financials = data.financials || {}
  const counter = data.counter_status || {}
  const alerts = data.urgent_alerts || {}
  const trend = data.trend_7_days || []
  const recentTransactions = data.recent_transactions || []
  const recentAuditLogs = data.recent_audit_logs || []

  // Calculate highest amount in 7 days to scale bar chart cleanly
  const maxTrendVal = Math.max(
    ...trend.map((d) => Math.max(d.deposits, d.withdrawals)),
    100000
  )

  const isOpen = counter.status === 'buka'
  const isBreak = counter.status === 'istirahat'
  const statusLabel = isOpen
    ? 'Loket Buka'
    : isBreak
    ? 'Loket Istirahat'
    : 'Loket Tutup'
  const statusClass = isOpen ? 'open' : isBreak ? 'break' : 'closed'

  return (
    <>
      <div className="bank-panel__head" style={{ marginBottom: '16px' }}>
        <PageHeader
          title="Ringkasan Bank Mini"
          description="Pemantauan likuiditas kas sekolah, operasional loket teller harian, dan aktivitas tabungan siswa."
        />
        <Button
          variant="secondary"
          disabled={stats.loading}
          onClick={stats.refresh}
        >
          <RefreshCw
            size={15}
            className={stats.loading ? 'bank-spin' : ''}
            style={{ marginRight: '6px' }}
          />
          <span>Muat Ulang Data</span>
        </Button>
      </div>

      <ResourceState resource={stats}>
        {/* 1. Operational & Teller Monitor Card */}
        <section className="admin-monitor-card" aria-label="Status Layanan Loket">
          <div className="admin-monitor-card__left">
            <span className={`admin-monitor-status-pill admin-monitor-status-pill--${statusClass}`}>
              <span className={`admin-monitor-dot admin-monitor-dot--${statusClass}`} />
              {statusLabel}
            </span>
            <span className="admin-monitor-hours">
              <Clock size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
              Jam Operasional: <strong>{counter.operating_hours || '07:30 - 17:00 WIB'}</strong> (Auto-Close 17:00 WIB)
            </span>
          </div>

          <div className="admin-monitor-card__right">
            {counter.active_sessions?.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 500 }}>Teller Bertugas:</span>
                {counter.active_sessions.map((s) => (
                  <span key={s.id} className="admin-active-teller-badge">
                    <Wallet size={12} />
                    <span>{s.teller_name} (Kas Awal: {money(s.opening_balance)})</span>
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>
                Belum ada sesi kas teller yang dibuka hari ini
              </span>
            )}
          </div>
        </section>

        {/* 2. Actionable Alert Banner (if attention needed) */}
        {alerts.total_attention_required > 0 && (
          <aside className="admin-alert-banner" role="alert">
            <div className="admin-alert-banner__content">
              <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0 }} />
              <div>
                <strong>Perhatian Kas Memerlukan Tindakan:</strong>{' '}
                {alerts.pending_reconciliations > 0 && (
                  <span>
                    {alerts.pending_reconciliations} laporan rekonsiliasi kas menunggu persetujuan.{' '}
                  </span>
                )}
                {alerts.disputed_reconciliations > 0 && (
                  <span>
                    {alerts.disputed_reconciliations} laporan kas terdapat selisih fisik.{' '}
                  </span>
                )}
                {alerts.pending_cash_requests > 0 && (
                  <span>
                    {alerts.pending_cash_requests} pengajuan modal kas teller menunggu verifikasi.{' '}
                  </span>
                )}
              </div>
            </div>
            <div className="admin-alert-banner__actions">
              <Button
                variant="primary"
                onClick={() => onNavigate?.('reports')}
                style={{ height: '36px', fontSize: '13px' }}
              >
                <span>Buka Laporan Kas</span>
                <ArrowRight size={14} style={{ marginLeft: '4px' }} />
              </Button>
            </div>
          </aside>
        )}

        {/* 3. Four Financial & Membership Primary KPI Cards */}
        <section className="admin-kpi-grid" aria-label="Metrik Finansial dan Anggota">
          {/* KPI 1: Total Dana Tabungan */}
          <div className="admin-kpi-card">
            <div className="admin-kpi-card__top">
              <span className="admin-kpi-card__label">Total Dana Tabungan Siswa</span>
              <span className="admin-kpi-card__icon-box admin-kpi-card__icon-box--green">
                <Landmark size={20} />
              </span>
            </div>
            <div className="admin-kpi-card__value">
              {money(financials.total_deposit_pool)}
            </div>
            <div className="admin-kpi-card__meta">
              <strong>{financials.active_savers_count ?? 0}</strong> rekening siswa aktif
            </div>
          </div>

          {/* KPI 2: Arus Kas Bersih Hari Ini */}
          <div className="admin-kpi-card">
            <div className="admin-kpi-card__top">
              <span className="admin-kpi-card__label">Arus Kas Bersih Hari Ini</span>
              <span className="admin-kpi-card__icon-box">
                <TrendingUp size={20} />
              </span>
            </div>
            <div
              className={`admin-kpi-card__value ${
                (financials.today_net_flow || 0) > 0
                  ? 'admin-kpi-card__value--positive'
                  : (financials.today_net_flow || 0) < 0
                  ? 'admin-kpi-card__value--negative'
                  : ''
              }`}
            >
              {(financials.today_net_flow || 0) > 0 ? '+' : ''}
              {money(financials.today_net_flow)}
            </div>
            <div className="admin-kpi-card__meta">
              Masuk: {money(financials.today_deposits)} | Keluar: {money(financials.today_withdrawals)}
            </div>
          </div>

          {/* KPI 3: Transaksi Hari Ini */}
          <div className="admin-kpi-card">
            <div className="admin-kpi-card__top">
              <span className="admin-kpi-card__label">Transaksi Loket Hari Ini</span>
              <span className="admin-kpi-card__icon-box admin-kpi-card__icon-box--purple">
                <Receipt size={20} />
              </span>
            </div>
            <div className="admin-kpi-card__value">
              {financials.today_transactions_count?.toLocaleString('id-ID') ?? 0} Transaksi
            </div>
            <div className="admin-kpi-card__meta">
              Diproses langsung oleh teller loket
            </div>
          </div>

          {/* KPI 4: Aktivasi Rekening Siswa */}
          <div className="admin-kpi-card">
            <div className="admin-kpi-card__top">
              <span className="admin-kpi-card__label">Aktivasi Rekening Siswa</span>
              <span className="admin-kpi-card__icon-box admin-kpi-card__icon-box--amber">
                <UserCheck size={20} />
              </span>
            </div>
            <div className="admin-kpi-card__value">
              {financials.activation_rate_pct ?? 0}%
            </div>
            <div className="admin-kpi-card__meta">
              <strong>{financials.active_savers_count ?? 0}</strong> dari {financials.total_members_count ?? 0} siswa terdaftar
            </div>
          </div>
        </section>

        {/* 4. Layout Grid: 7-Day Trend Chart (62%) + Quick Action Hub (38%) */}
        <div className="admin-chart-quick-grid">
          {/* Left: 7-Day Cashflow Trend */}
          <section className="admin-trend-card" aria-label="Grafik Tren Transaksi 7 Hari Terakhir">
            <div className="admin-trend-card__head">
              <div>
                <h3 className="admin-trend-card__title">Tren Transaksi 7 Hari Terakhir</h3>
                <p className="admin-trend-card__desc">
                  Perbandingan nominal setoran tabungan masuk dan penarikan tunai keluar.
                </p>
              </div>
              <div className="admin-trend-card__legend">
                <span className="admin-legend-item">
                  <span className="admin-legend-dot admin-legend-dot--deposit" />
                  <span>Setoran</span>
                </span>
                <span className="admin-legend-item">
                  <span className="admin-legend-dot admin-legend-dot--withdrawal" />
                  <span>Penarikan</span>
                </span>
              </div>
            </div>

            {trend.length > 0 ? (
              <div className="admin-bar-chart" role="img" aria-label="Grafik Batang Transaksi 7 Hari">
                {trend.map((day) => {
                  const depositHeight = Math.max(
                    Math.round((day.deposits / maxTrendVal) * 100),
                    day.deposits > 0 ? 8 : 2
                  )
                  const withdrawalHeight = Math.max(
                    Math.round((day.withdrawals / maxTrendVal) * 100),
                    day.withdrawals > 0 ? 8 : 2
                  )

                  return (
                    <div
                      key={day.date}
                      className="admin-chart-col"
                      title={`${day.label}: Setoran ${money(day.deposits)} | Penarikan ${money(day.withdrawals)} (${day.count} transaksi)`}
                    >
                      <div className="admin-chart-bars">
                        <div
                          className="admin-bar admin-bar--deposit"
                          style={{ height: `${depositHeight}%` }}
                        />
                        <div
                          className="admin-bar admin-bar--withdrawal"
                          style={{ height: `${withdrawalHeight}%` }}
                        />
                      </div>
                      <span className="admin-chart-label">{day.label}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Belum ada data perputaran transaksi tabungan pada periode ini.
              </div>
            )}
          </section>

          {/* Right: Quick Action Hub */}
          <section className="admin-quick-hub" aria-label="Pusat Tindakan Cepat Admin">
            <div className="admin-quick-hub__head">
              <h3 className="admin-quick-hub__title">Pintasan Cepat Admin</h3>
              <p className="admin-quick-hub__desc">
                Akses cepat menuju menu pengelolaan dan administrasi harian.
              </p>
            </div>

            <div className="admin-quick-hub__list">
              <button
                type="button"
                className="admin-quick-btn"
                onClick={() => onNavigate?.('imports')}
              >
                <div className="admin-quick-btn__content">
                  <span className="admin-quick-btn__icon">
                    <FileSpreadsheet size={16} />
                  </span>
                  <span>Impor Siswa Massal (.CSV)</span>
                </div>
                <ArrowRight size={14} className="admin-quick-btn__arrow" />
              </button>

              <button
                type="button"
                className="admin-quick-btn"
                onClick={() => onNavigate?.('members')}
              >
                <div className="admin-quick-btn__content">
                  <span className="admin-quick-btn__icon">
                    <Users size={16} />
                  </span>
                  <span>Kelola Data Anggota Siswa</span>
                </div>
                <ArrowRight size={14} className="admin-quick-btn__arrow" />
              </button>

              <button
                type="button"
                className="admin-quick-btn"
                onClick={() => onNavigate?.('savers')}
              >
                <div className="admin-quick-btn__content">
                  <span className="admin-quick-btn__icon">
                    <CreditCard size={16} />
                  </span>
                  <span>Rekening Penabung & Reset PIN</span>
                </div>
                <ArrowRight size={14} className="admin-quick-btn__arrow" />
              </button>

              <button
                type="button"
                className="admin-quick-btn"
                onClick={() => onNavigate?.('reports')}
              >
                <div className="admin-quick-btn__content">
                  <span className="admin-quick-btn__icon">
                    <FileText size={16} />
                  </span>
                  <span>Laporan Kas & Rekonsiliasi</span>
                </div>
                <ArrowRight size={14} className="admin-quick-btn__arrow" />
              </button>

              <button
                type="button"
                className="admin-quick-btn"
                onClick={() => onNavigate?.('journals')}
              >
                <div className="admin-quick-btn__content">
                  <span className="admin-quick-btn__icon">
                    <Layers size={16} />
                  </span>
                  <span>Jurnal Akuntansi Kas</span>
                </div>
                <ArrowRight size={14} className="admin-quick-btn__arrow" />
              </button>
            </div>
          </section>
        </div>

        {/* 5. Dual-Tab Realtime Feed: Transaksi Terkini vs Log Audit */}
        <section className="admin-feed-panel" aria-label="Aktivitas dan Transaksi Terkini">
          <div className="admin-feed-panel__head">
            <div className="admin-feed-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'transactions'}
                className={`admin-feed-tab-btn ${
                  activeTab === 'transactions' ? 'admin-feed-tab-btn--active' : ''
                }`}
                onClick={() => setActiveTab('transactions')}
              >
                <Receipt size={15} />
                <span>Transaksi Tabungan Terkini ({recentTransactions.length})</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'audit'}
                className={`admin-feed-tab-btn ${
                  activeTab === 'audit' ? 'admin-feed-tab-btn--active' : ''
                }`}
                onClick={() => setActiveTab('audit')}
              >
                <ShieldCheck size={15} />
                <span>Log Audit Petugas ({recentAuditLogs.length})</span>
              </button>
            </div>

            <div>
              {activeTab === 'transactions' ? (
                <Button
                  variant="secondary"
                  onClick={() => onNavigate?.('reports')}
                  style={{ height: '36px', fontSize: '13px' }}
                >
                  <span>Buka Semua Transaksi</span>
                  <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => onNavigate?.('audit')}
                  style={{ height: '36px', fontSize: '13px' }}
                >
                  <span>Buka Audit Lengkap</span>
                  <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                </Button>
              )}
            </div>
          </div>

          {activeTab === 'transactions' ? (
            <DataTable
              caption="Lima transaksi tabungan terbaru"
              rows={recentTransactions}
              columns={[
                [
                  'created_at',
                  'Waktu & Tanggal',
                  null,
                  (row) => (
                    <div style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                      <div style={{ fontWeight: 600 }}>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleTimeString('id-ID', {
                              timeZone: 'Asia/Jakarta',
                              hour: '2-digit',
                              minute: '2-digit',
                            }) + ' WIB'
                          : row.date}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {row.created_at
                          ? new Date(row.created_at).toLocaleDateString('id-ID', {
                              timeZone: 'Asia/Jakarta',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : ''}
                      </div>
                    </div>
                  ),
                ],
                [
                  'account',
                  'Siswa / Rekening',
                  null,
                  (row) => (
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {row.member_name || 'Siswa'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {row.account_number}
                      </div>
                    </div>
                  ),
                ],
                [
                  'transaction_type',
                  'Jenis Transaksi',
                  null,
                  (row) => {
                    const isDeposit = row.transaction_type === 'Deposit'
                    return (
                      <span
                        className={`admin-tx-badge ${
                          isDeposit ? 'admin-tx-badge--deposit' : 'admin-tx-badge--withdrawal'
                        }`}
                      >
                        {isDeposit ? 'Setoran Tabungan' : 'Penarikan Kas'}
                      </span>
                    )
                  },
                ],
                [
                  'amount',
                  'Nominal',
                  null,
                  (row) => {
                    const isDeposit = row.transaction_type === 'Deposit'
                    return (
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '13.5px',
                          color: isDeposit ? 'var(--success-text)' : 'var(--danger-text)',
                        }}
                      >
                        {isDeposit ? '+' : '-'}
                        {money(row.amount)}
                      </span>
                    )
                  },
                ],
                [
                  'balance_after',
                  'Saldo Akhir',
                  null,
                  (row) => (
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>
                      {money(row.balance_after)}
                    </span>
                  ),
                ],
                [
                  'teller_name',
                  'Petugas Loket',
                  null,
                  (row) => (
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {row.teller_name}
                    </span>
                  ),
                ],
              ]}
            />
          ) : (
            <DataTable
              caption="Lima aktivitas petugas terbaru"
              rows={recentAuditLogs}
              columns={[
                [
                  'created_at',
                  'Waktu',
                  null,
                  (row) => (
                    <span style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                      {new Date(row.created_at).toLocaleTimeString('id-ID', {
                        timeZone: 'Asia/Jakarta',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      WIB
                    </span>
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
                      </div>
                    </div>
                  ),
                ],
                [
                  'subject',
                  'Objek Terkait',
                  null,
                  (row) => (
                    <span>
                      {formatSubject(row.subject_type)}
                      {row.subject_id ? (
                        <span className="muted"> #{row.subject_id}</span>
                      ) : null}
                    </span>
                  ),
                ],
              ]}
            />
          )}
        </section>
      </ResourceState>
    </>
  )
}
