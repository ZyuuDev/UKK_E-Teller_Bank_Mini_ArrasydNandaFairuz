import { useRef, useState } from 'react'
import { api, money, useResource } from './api'
import { ReportsPage } from './AdminPages'
import {
  Button,
  ConfirmDialog,
  DataTable,
  DetailRow,
  EmptyState,
  FormField,
  Input,
  Modal,
  Notice,
  ResourceState,
  Select,
  StatCard,
  Status,
} from './ui'
import QrScanner from '../components/QrScanner'
import { printReceipt } from './printing'
import './teller.css'

function readPending(tellerId) {
  try {
    return JSON.parse(sessionStorage.getItem(`bank-pending:${tellerId}`) || 'null')
  } catch {
    return null
  }
}

function todayWib() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const value = (type) => parts.find((part) => part.type === type).value
  return `${value('year')}-${value('month')}-${value('day')}`
}

function useTellerWorkflow(tellerId, onChange, canCreate) {
  const [pending, setPending] = useState(() => readPending(tellerId))
  const [query, setQuery] = useState(() => readPending(tellerId)?.query || '')
  const [found, setFound] = useState(null)
  const [mode, setMode] = useState('deposit')
  const [draft, setDraft] = useState({ amount: '', notes: '' })
  const [review, setReview] = useState(null)
  const [rejected, setRejected] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  function remember(value) {
    if (value) sessionStorage.setItem(`bank-pending:${tellerId}`, JSON.stringify(value))
    else sessionStorage.removeItem(`bank-pending:${tellerId}`)
    setPending(value)
  }
  async function search(value) {
    if (lock.current || pending) return
    lock.current = true
    setBusy(true)
    setError('')
    setReview(null)
    try {
      setFound((await api(`/teller/search?q=${encodeURIComponent(value)}`)).data)
      setQuery(value)
      setDraft({ amount: '', notes: '' })
      setMode('deposit')
    } catch (failure) {
      setError(failure.message)
      setFound(null)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  async function resolve() {
    if (lock.current || !pending) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const result = await api(
        `/teller/transactions/by-request/${pending.body.request_id}`,
      )
      remember(null)
      setReceipt(result.data)
      setFound(null)
      setReview(null)
      setRejected(false)
      onChange()
    } catch (failure) {
      setError(
        failure.status === 404
          ? 'Hasil belum ditemukan. Periksa lagi atau kirim ulang dengan ID yang sama. Jangan membuat permintaan baru.'
          : failure.message,
      )
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  function prepare(event) {
    event.preventDefault()
    if (!found || pending || busy) return
    const amount = Number(draft.amount)
    const isActivate = !found.saver
    const body = isActivate
      ? {
          member_id: found.member.user_id,
          amount,
          request_id: crypto.randomUUID(),
        }
      : {
          account_number: found.saver.account_number,
          amount,
          notes: draft.notes ? draft.notes.trim() : null,
          request_id: crypto.randomUUID(),
        }
    setReview({
      operation: isActivate ? 'activate' : mode,
      path: `/teller/${isActivate ? 'activate' : mode}`,
      body,
      full_name: found.member.full_name,
      student_number: found.member.student_number,
    })
    setError('')
  }
  async function submit(event) {
    event.preventDefault()
    if (lock.current || !review || busy) return
    const pin = new FormData(event.currentTarget).get('security_pin')
    const needsPin = ['activate', 'withdraw'].includes(review.operation)
    if (needsPin && !pin) {
      setError('PIN enam digit wajib diisi.')
      return
    }
    const payload = {
      path: review.path,
      body: {
        ...review.body,
        ...(needsPin ? { security_pin: String(pin) } : {}),
      },
    }
    lock.current = true
    setBusy(true)
    setError('')
    remember(payload)
    try {
      const result = await api(payload.path, {
        method: 'POST',
        body: payload.body,
      })
      remember(null)
      setReceipt(result.data)
      setFound(null)
      setReview(null)
      setRejected(false)
      onChange()
    } catch (failure) {
      if ([401, 403, 422].includes(failure.status)) {
        setRejected(true)
        setError(failure.message)
      } else {
        setError(
          `${failure.message} Permintaan dicatat sebagai tertunda. Tekan Periksa hasil sebelum mencoba lagi.`,
        )
      }
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  function correctRejected() {
    if (!pending || !rejected) return
    remember(null)
    setReview(null)
    setRejected(false)
    setError('')
  }
  return {
    pending,
    query,
    setQuery,
    found,
    setFound,
    mode,
    setMode,
    draft,
    setDraft,
    review,
    setReview,
    rejected,
    receipt,
    setReceipt,
    error,
    setError,
    busy,
    search,
    resolve,
    prepare,
    submit,
    correctRejected,
  }
}

function TransactionWorkspace({ workflow: tx, canCreate, sessions }) {
  const [confirmResetPin, setConfirmResetPin] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [resetBusy, setResetBusy] = useState(false)
  const snapshot = tx.pending?.body || tx.review
  const operation = tx.pending
    ? tx.pending.path.split('/').at(-1)
    : tx.review?.operation
  const verifying = !!snapshot
  const needsPin = ['activate', 'withdraw'].includes(operation)
  const label =
    operation === 'withdraw'
      ? 'Penarikan'
      : operation === 'activate'
        ? 'Setoran pertama'
        : 'Setoran'
  const step = tx.receipt ? 4 : verifying ? 3 : tx.found ? 2 : 1

  async function handleResetPin() {
    if (!tx.found?.saver) return
    setResetBusy(true)
    try {
      const result = await api('/teller/reset-pin', {
        method: 'POST',
        body: { account_number: tx.found.saver.account_number },
      })
      setResetMessage(result.data?.message || 'PIN berhasil direset ke 123456.')
      setConfirmResetPin(false)
    } catch (err) {
      tx.setError(err.message)
    } finally {
      setResetBusy(false)
    }
  }

  return (
    <section className="bank-panel">
      <h2>Pelayanan transaksi</h2>
      <ol className="teller-steps" aria-label="Alur transaksi">
        {['Identifikasi', 'Input transaksi', 'Verifikasi', 'Bukti'].map(
          (text, index) => (
            <li key={text} aria-current={step === index + 1 ? 'step' : undefined}>
              <span>{index + 1}</span>
              {text}
            </li>
          ),
        )}
      </ol>
      <Notice error>{tx.error}</Notice>
      {resetMessage && <Notice>{resetMessage}</Notice>}
      {!canCreate && !tx.pending && (
        <Notice>
          Sesi hari ini belum terbuka atau sedang diperiksa. Buka area Sesi kas dan muat
          ulang status sebelum transaksi baru.
          <div className="bank-actions">
            <Button variant="secondary" onClick={sessions.refresh}>
              Periksa status sesi
            </Button>
          </div>
        </Notice>
      )}
      {tx.pending && (
        <Notice>
          Permintaan belum selesai dikonfirmasi. Periksa hasil sebelum melayani
          transaksi berikutnya.
          <p className="teller-reference">ID: {tx.pending.body.request_id}</p>
          <div className="bank-actions">
            <Button variant="secondary" busy={tx.busy} onClick={tx.resolve}>
              Periksa hasil
            </Button>
            {tx.rejected && (
              <Button
                variant="secondary"
                disabled={tx.busy}
                onClick={tx.correctRejected}
              >
                Perbaiki permintaan yang ditolak
              </Button>
            )}
          </div>
        </Notice>
      )}
      {!verifying && (
        <>
          <form
            className="teller-identify"
            onSubmit={(event) => {
              event.preventDefault()
              tx.search(tx.query.trim())
            }}
          >
            <FormField
              label="Nomor siswa atau nomor rekening"
              hint="Masukkan identitas lengkap; pencarian teller tidak memakai nama."
            >
              <Input
                value={tx.query}
                onChange={(event) => tx.setQuery(event.target.value)}
                required
                disabled={tx.busy}
                autoComplete="off"
              />
            </FormField>
            <Button type="submit" busy={tx.busy}>
              Cari siswa
            </Button>
          </form>
          {tx.found && (
            <div className="teller-workgrid">
              <section className="teller-account">
                <span className="bank-avatar" aria-hidden="true">
                  {tx.found.member.full_name.slice(0, 1)}
                </span>
                <h3>{tx.found.member.full_name}</h3>
                <dl className="bank-detail-list">
                  <DetailRow label="Nomor siswa">
                    {tx.found.member.student_number}
                  </DetailRow>
                  {tx.found.member.major && (
                    <DetailRow label="Jurusan">
                      {tx.found.member.major}
                    </DetailRow>
                  )}
                  <DetailRow label="Tahun lulus">
                    {tx.found.member.graduation_year}
                  </DetailRow>
                  <DetailRow label="Rekening">
                    {tx.found.saver?.account_number ?? 'Belum terbentuk'}
                  </DetailRow>
                </dl>
                {tx.found.saver ? (
                  <>
                    <dl className="bank-detail-list">
                      <DetailRow label="Saldo total">
                        {money(tx.found.saver.balance)}
                      </DetailRow>
                      <DetailRow label="Saldo tersedia">
                        {money(tx.found.saver.available_balance)}
                      </DetailRow>
                    </dl>
                    <div className="bank-actions teller-gap">
                      <Button
                        variant="secondary"
                        disabled={tx.busy}
                        onClick={() => {
                          setResetMessage('')
                          setConfirmResetPin(true)
                        }}
                      >
                        Reset PIN siswa (123456)
                      </Button>
                    </div>
                  </>
                ) : (
                  <Notice>
                    Setoran pertama minimal Rp10.000 akan membentuk dan mengaktifkan
                    rekening. Siswa menetapkan PIN enam digit pada tahap verifikasi.
                  </Notice>
                )}
              </section>
              <form className="bank-form" onSubmit={tx.prepare}>
                {tx.found.saver && (
                  <FormField label="Jenis transaksi">
                    <Select
                      value={tx.mode}
                      onChange={(event) => tx.setMode(event.target.value)}
                      disabled={tx.busy || !canCreate}
                    >
                      <option value="deposit">Setoran</option>
                      <option value="withdraw">Penarikan</option>
                    </Select>
                  </FormField>
                )}
                <FormField
                  label="Nominal rupiah"
                  hint="Masukkan angka bulat tanpa titik atau koma."
                >
                  <Input
                    type="number"
                    min={tx.found.saver ? 1 : 10000}
                    max={1000000000000}
                    step={1}
                    value={tx.draft.amount}
                    onChange={(event) =>
                      tx.setDraft({ ...tx.draft, amount: event.target.value })
                    }
                    disabled={tx.busy || !canCreate}
                    required
                  />
                </FormField>
                {tx.found.saver && (
                  <FormField label="Catatan (opsional)">
                    <Input
                      maxLength={255}
                      value={tx.draft.notes}
                      onChange={(event) =>
                        tx.setDraft({ ...tx.draft, notes: event.target.value })
                      }
                      disabled={tx.busy || !canCreate}
                    />
                  </FormField>
                )}
                <Button type="submit" disabled={tx.busy || !canCreate}>
                  Lanjutkan ke verifikasi
                </Button>
              </form>
            </div>
          )}
        </>
      )}
      {verifying && (
        <div className="teller-verify">
          <h3>Periksa {label.toLowerCase()}</h3>
          <dl className="bank-detail-list">
            <DetailRow label="Nama siswa">
              {tx.review?.full_name ?? 'Lihat identitas pada hasil pemeriksaan server'}
            </DetailRow>
            {tx.review?.student_number && (
              <DetailRow label="Nomor siswa">{tx.review.student_number}</DetailRow>
            )}
            <DetailRow
              label={snapshot.account_number ? 'Nomor rekening' : 'ID anggota'}
            >
              {snapshot.account_number ?? snapshot.member_id}
            </DetailRow>
            <DetailRow label="Jenis transaksi">{label}</DetailRow>
            <DetailRow label="Nominal">
              <strong className="teller-amount">{money(snapshot.amount)}</strong>
            </DetailRow>
            {operation !== 'activate' && (
              <DetailRow label="Catatan">{snapshot.notes || 'Tidak ada'}</DetailRow>
            )}
          </dl>
          <form
            className="bank-form"
            onSubmit={tx.submit}
            key={tx.pending?.body.request_id || 'review'}
          >
            {needsPin && (
              <FormField
                label={
                  operation === 'activate'
                    ? 'PIN baru enam digit, diisi siswa'
                    : 'PIN enam digit, diisi siswa'
                }
              >
                <Input
                  name="security_pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  autoComplete="off"
                  required
                  disabled={tx.busy}
                />
              </FormField>
            )}
            <div className="bank-actions">
              <Button
                variant="secondary"
                disabled={tx.busy}
                onClick={() => tx.setReview(null)}
              >
                Batal
              </Button>
              <Button type="submit" busy={tx.busy}>
                Konfirmasi transaksi
              </Button>
            </div>
          </form>
        </div>
      )}
      {!tx.found && !verifying && !tx.receipt && (
        <EmptyState
          title="Identifikasi siswa terlebih dahulu"
          description="Gunakan nomor siswa, nomor rekening, atau QR identitas dari sistem."
        />
      )}

      <ConfirmDialog
        open={confirmResetPin && !!tx.found?.saver}
        title="Reset PIN rekening nasabah?"
        onClose={() => setConfirmResetPin(false)}
        onConfirm={handleResetPin}
        busy={resetBusy}
        confirmLabel="Ya, reset PIN"
      >
        <p>
          Nasabah: <strong>{tx.found?.member?.full_name}</strong> ·{' '}
          {tx.found?.saver?.account_number}
        </p>
        <p>
          PIN akan diubah menjadi default <strong>123456</strong>. Siswa disarankan segera
          mengganti PIN melalui menu profil aplikasi.
        </p>
      </ConfirmDialog>
    </section>
  )
}

function OpenSession({ sessions, blocked, onChanged }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showCashRequestModal, setShowCashRequestModal] = useState(false)
  const [requestAmount, setRequestAmount] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [requestBusy, setRequestBusy] = useState(false)
  const cashRequests = useResource('/teller/cash-requests')

  const currentSession = (sessions.data || []).find((row) => row.date === todayWib())

  async function open(event) {
    event.preventDefault()
    const body = {
      opening_balance: Number(new FormData(event.currentTarget).get('opening_balance')),
    }
    setBusy(true)
    setError('')
    try {
      await api('/teller/cash-sessions', { method: 'POST', body })
      setMessage('Sesi kas diperiksa. Lihat status terbaru di bawah.')
      onChanged()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleCashRequest(event) {
    event.preventDefault()
    setRequestBusy(true)
    setError('')
    try {
      await api('/teller/cash-requests', {
        method: 'POST',
        body: { amount: Number(requestAmount), notes: requestNotes.trim() },
      })
      setMessage('Pengajuan tambahan kas berhasil dikirim ke Admin.')
      setShowCashRequestModal(false)
      setRequestAmount('')
      setRequestNotes('')
      cashRequests.refresh()
      onChanged()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setRequestBusy(false)
    }
  }

  return (
    <section className="bank-panel">
      <h2>Sesi kas</h2>
      <p>
        Catat modal fisik awal. Sesi hari yang sama diperiksa kembali menggunakan modal
        awal yang sama.
      </p>
      <Notice error>{error}</Notice>
      <Notice>{message}</Notice>
      <form className="teller-identify" onSubmit={open}>
        <FormField label="Modal fisik awal hari (rupiah)">
          <Input
            type="number"
            name="opening_balance"
            min={0}
            max={1000000000000}
            step={1}
            required
            disabled={busy || blocked}
          />
        </FormField>
        <div className="bank-actions">
          <Button type="submit" busy={busy} disabled={blocked}>
            Buka atau periksa sesi hari ini
          </Button>
          {currentSession?.status === 'open' && (
            <Button
              variant="secondary"
              onClick={() => {
                setError('')
                setShowCashRequestModal(true)
              }}
            >
              Ajukan tambahan kas
            </Button>
          )}
        </div>
      </form>

      <div className="bank-panel__head teller-gap">
        <h3>Pengajuan tambahan kas hari ini</h3>
        <Button variant="secondary" onClick={cashRequests.refresh}>
          Muat ulang
        </Button>
      </div>
      <ResourceState resource={cashRequests}>
        <DataTable
          caption="Pengajuan tambahan kas teller"
          rows={cashRequests.data}
          columns={[
            ['date', 'Tanggal'],
            ['amount', 'Nominal diajukan', 'money'],
            ['notes', 'Alasan pengajuan'],
            ['status', 'Status', 'status'],
            [
              'rejection_notes',
              'Catatan penolakan',
              null,
              (row) => row.rejection_notes || '-',
            ],
          ]}
        />
      </ResourceState>

      <div className="bank-panel__head teller-gap">
        <h3>30 sesi terakhir</h3>
        <Button variant="secondary" onClick={sessions.refresh}>
          Muat ulang
        </Button>
      </div>
      <ResourceState resource={sessions}>
        <DataTable
          caption="Sesi kas teller"
          rows={sessions.data}
          columns={[
            ['date', 'Tanggal'],
            ['status', 'Status', 'status'],
            ['opening_balance', 'Modal awal', 'money'],
            ['total_additional_cash', 'Tambahan kas disetujui', 'money'],
            ['expected_closing_balance', 'Kas sistem', 'money'],
          ]}
        />
      </ResourceState>

      <Modal
        open={showCashRequestModal}
        title="Ajukan tambahan modal kas loket"
        onClose={() => setShowCashRequestModal(false)}
      >
        <form className="bank-form" onSubmit={handleCashRequest}>
          <FormField label="Nominal tambahan kas (rupiah)" hint="Minimal Rp10.000">
            <Input
              type="number"
              min={10000}
              max={1000000000000}
              step={1}
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              required
              placeholder="Contoh: 500000"
            />
          </FormField>
          <FormField label="Alasan pengajuan kas">
            <Input
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              required
              maxLength={255}
              placeholder="Contoh: Kas loket menipis untuk melayani penarikan"
            />
          </FormField>
          <div className="bank-actions bank-actions--end">
            <Button
              variant="secondary"
              disabled={requestBusy}
              onClick={() => setShowCashRequestModal(false)}
            >
              Batal
            </Button>
            <Button type="submit" busy={requestBusy}>
              Kirim pengajuan ke Admin
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}

function CloseSession({ sessions, pending, onChanged }) {
  const [sessionId, setSessionId] = useState('')
  const [cash, setCash] = useState('')
  const [review, setReview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const openSessions = (sessions.data || []).filter((row) => row.status === 'open')
  const selected = openSessions.find((row) => String(row.id) === sessionId)
  function prepare(event) {
    event.preventDefault()
    if (!selected || pending || sessions.loading || sessions.error) return
    setReview({ ...selected, actual: Number(cash) })
    setError('')
  }
  async function submit(event) {
    event.preventDefault()
    if (!review || pending) return
    setBusy(true)
    setError('')
    try {
      const result = await api(`/teller/cash-sessions/${review.id}/submit`, {
        method: 'POST',
        body: { actual_cash_on_hand: review.actual },
      })
      setMessage(
        result.data.status === 'disputed'
          ? 'Laporan diajukan dengan selisih. Tunggu pemeriksaan administrator.'
          : 'Laporan diajukan. Transaksi sesi dikunci sampai pemeriksaan administrator.',
      )
      setReview(null)
      setCash('')
      setSessionId('')
      onChanged()
    } catch (failure) {
      setError(failure.message)
      sessions.refresh()
      setReview(null)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="bank-panel">
      <h2>Tutup kas</h2>
      <Notice error>{error}</Notice>
      <Notice>{message}</Notice>
      {pending && (
        <Notice>
          Selesaikan pemeriksaan transaksi tertunda pada area Pelayanan transaksi
          sebelum mengajukan tutup kas.
        </Notice>
      )}
      <ResourceState resource={sessions}>
        {!openSessions.length ? (
          <EmptyState
            title="Tidak ada sesi terbuka"
            description="Periksa Sesi kas atau Riwayat laporan untuk melihat status terakhir."
          />
        ) : (
          !review && (
            <form className="bank-form" onSubmit={prepare}>
              <FormField label="Sesi terbuka">
                <Select
                  value={sessionId}
                  onChange={(event) => setSessionId(event.target.value)}
                  required
                >
                  <option value="">Pilih sesi</option>
                  {openSessions.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.date} · Modal awal {money(row.opening_balance)}
                    </option>
                  ))}
                </Select>
              </FormField>
              {selected && (
                <>
                  <dl className="bank-detail-list">
                    <DetailRow label="Tanggal">{selected.date}</DetailRow>
                    <DetailRow label="Modal awal">
                      {money(selected.opening_balance)}
                    </DetailRow>
                    <DetailRow label="Total tambahan kas disetujui">
                      {money(selected.total_additional_cash || 0)}
                    </DetailRow>
                    <DetailRow label="Total setoran">
                      {money(selected.total_deposits)}
                    </DetailRow>
                    <DetailRow label="Total penarikan">
                      {money(selected.total_withdrawals)}
                    </DetailRow>
                    <DetailRow label="Kas sistem saat ini">
                      {money(selected.expected_closing_balance)}
                    </DetailRow>
                  </dl>
                  <FormField
                    label="Uang fisik aktual di laci (rupiah)"
                    hint="Hitung uang fisik di laci tanpa memperhitungkan selisih."
                  >
                    <Input
                      type="number"
                      min={0}
                      max={9000000000000}
                      step={1}
                      value={cash}
                      onChange={(event) => setCash(event.target.value)}
                      required
                      disabled={busy}
                    />
                  </FormField>
                  <Button type="submit" disabled={busy || !cash}>
                    Lanjutkan ke pemeriksaan tutup kas
                  </Button>
                </>
              )}
            </form>
          )
        )}
      </ResourceState>
      {review && (
        <form className="bank-form" onSubmit={submit}>
          <h3>Konfirmasi tutup kas {review.date}</h3>
          <dl className="bank-detail-list">
            <DetailRow label="Kas sistem saat diperiksa">
              {money(review.expected_closing_balance)}
            </DetailRow>
            <DetailRow label="Uang fisik">{money(review.actual)}</DetailRow>
            <DetailRow label="Selisih sementara">
              {money(review.actual - Number(review.expected_closing_balance))}
            </DetailRow>
          </dl>
          <Notice>
            Backend menghitung kembali selisih saat pengajuan dan mengunci sesi. Periksa
            slip dan uang fisik sebelum melanjutkan.
          </Notice>
          <label className="bank-checkbox">
            <input type="checkbox" required disabled={busy} />
            Uang fisik telah dihitung dan siap diperiksa administrator.
          </label>
          <div className="bank-actions">
            <Button variant="secondary" disabled={busy} onClick={() => setReview(null)}>
              Kembali
            </Button>
            <Button type="submit" busy={busy} disabled={!!pending}>
              Ajukan pemeriksaan admin
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}

export default function TellerPage({ tellerId }) {
  const sessions = useResource('/teller/cash-sessions')
  const statusRes = useResource('/teller/service-status')
  const [area, setArea] = useState('session')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [reportsVersion, setReportsVersion] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  const activeStatus = statusRes.data?.data?.status || 'buka'
  const current = (sessions.data || []).find((row) => row.date === todayWib())
  const canCreate = !sessions.loading && !sessions.error && current?.status === 'open'

  async function updateStatus(nextStatus) {
    if (nextStatus === activeStatus) return
    try {
      await api('/teller/service-status', {
        method: 'POST',
        body: { status: nextStatus },
      })
      setStatusMessage(`Status layanan loket diubah menjadi ${nextStatus.toUpperCase()}.`)
      statusRes.refresh()
    } catch (err) {
      setStatusMessage(err.message)
    }
  }

  function refresh() {
    sessions.refresh()
    setReportsVersion((value) => value + 1)
  }
  const tx = useTellerWorkflow(tellerId, refresh, canCreate)
  const [printError, setPrintError] = useState('')
  function print() {
    try {
      printReceipt(tx.receipt)
      setPrintError('')
    } catch (failure) {
      setPrintError(failure.message)
    }
  }
  const areas = [
    ['session', 'Sesi kas'],
    ['transaction', 'Pelayanan transaksi'],
    ['close', 'Tutup kas'],
    ['reports', 'Riwayat laporan'],
  ]
  return (
    <>
      <div
        className="teller-session-strip"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span>
            Sesi hari ini:{' '}
            {sessions.loading ? (
              'memeriksa...'
            ) : sessions.error ? (
              'belum dapat diperiksa'
            ) : current ? (
              <Status value={current.status} />
            ) : (
              'belum dibuka'
            )}
          </span>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'var(--bank-surface-muted, #f1f5f9)',
              padding: '0.2rem 0.35rem',
              borderRadius: '8px',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 600, paddingLeft: '0.25rem' }}>
              Status loket:
            </span>
            <Button
              variant={activeStatus === 'buka' ? 'primary' : 'secondary'}
              style={activeStatus === 'buka' ? { background: '#16a34a', borderColor: '#16a34a' } : {}}
              onClick={() => updateStatus('buka')}
            >
              Buka
            </Button>
            <Button
              variant={activeStatus === 'istirahat' ? 'primary' : 'secondary'}
              style={activeStatus === 'istirahat' ? { background: '#d97706', borderColor: '#d97706' } : {}}
              onClick={() => updateStatus('istirahat')}
            >
              Istirahat
            </Button>
            <Button
              variant={activeStatus === 'tutup' ? 'primary' : 'secondary'}
              style={activeStatus === 'tutup' ? { background: '#dc2626', borderColor: '#dc2626' } : {}}
              onClick={() => updateStatus('tutup')}
            >
              Tutup
            </Button>
          </div>
        </div>
        <div className="bank-actions">
          <Button
            disabled={tx.busy || !!tx.pending}
            onClick={() => setScannerOpen(true)}
          >
            Pindai QR
          </Button>
          <Button variant="secondary" onClick={sessions.refresh}>
            Periksa status
          </Button>
        </div>
      </div>
      {statusMessage && <Notice>{statusMessage}</Notice>}
      {tx.pending && area !== 'transaction' && (
        <Notice>
          Ada transaksi yang belum selesai dikonfirmasi.{' '}
          <Button variant="secondary" onClick={() => setArea('transaction')}>
            Buka transaksi tertunda
          </Button>
        </Notice>
      )}
      <nav className="teller-areas" aria-label="Area kerja teller">
        {areas.map(([key, label]) => (
          <Button
            key={key}
            variant="secondary"
            disabled={tx.busy}
            aria-current={area === key ? 'page' : undefined}
            onClick={() => {
              setArea(key)
              sessions.refresh()
            }}
          >
            {label}
          </Button>
        ))}
      </nav>
      {area === 'session' && (
        <OpenSession sessions={sessions} blocked={!!tx.pending} onChanged={refresh} />
      )}
      {area === 'transaction' && (
        <TransactionWorkspace workflow={tx} canCreate={canCreate} sessions={sessions} />
      )}
      {area === 'close' && (
        <CloseSession sessions={sessions} pending={tx.pending} onChanged={refresh} />
      )}
      {area === 'reports' && <ReportsPage teller key={reportsVersion} />}
      <Modal
        open={scannerOpen}
        title="Pindai QR rekening"
        onClose={() => setScannerOpen(false)}
      >
        {scannerOpen && (
          <QrScanner
            autoStart
            onResult={(value) => {
              setScannerOpen(false)
              setArea('transaction')
              tx.search(value)
            }}
          />
        )}
      </Modal>
      <Modal
        open={!!tx.receipt}
        title="Bukti transaksi"
        onClose={() => {
          tx.setReceipt(null)
          setPrintError('')
        }}
      >
        <Notice error>{printError}</Notice>
        {tx.receipt && (
          <>
            <p className="teller-reference">TRX-{tx.receipt.id}</p>
            <h3>{tx.receipt.full_name}</h3>
            <strong className="teller-receipt-amount">
              {money(tx.receipt.amount)}
            </strong>
            <dl className="bank-detail-list">
              <DetailRow label="Jenis">
                {tx.receipt.transaction_type === 'Deposit' ? 'Setoran' : 'Penarikan'}
              </DetailRow>
              <DetailRow label="Rekening">{tx.receipt.account_number}</DetailRow>
              <DetailRow label="Saldo sesudah transaksi">
                {money(tx.receipt.balance_after)}
              </DetailRow>
              <DetailRow label="Waktu WIB">
                {new Date(tx.receipt.created_at).toLocaleString('id-ID', {
                  timeZone: 'Asia/Jakarta',
                })}
              </DetailRow>
              <DetailRow label="Nomor siswa">
                {tx.receipt.student_number ?? 'Tidak tersedia'}
              </DetailRow>
              <DetailRow label="Catatan">
                {tx.receipt.notes || 'Tidak ada catatan'}
              </DetailRow>
            </dl>
            <div className="bank-actions">
              <Button onClick={print}>Cetak bukti</Button>
              <Button variant="secondary" onClick={() => tx.setReceipt(null)}>
                Selesai
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
