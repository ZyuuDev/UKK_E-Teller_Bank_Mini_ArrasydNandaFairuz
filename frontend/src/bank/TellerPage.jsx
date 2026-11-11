import { useEffect, useRef, useState } from 'react'
import { Banknote, Calculator } from 'lucide-react'
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
import { CashDenominationCalculator, CashCalculatorModal } from './CashDenominationCalculator'
import QrScanner from '../components/QrScanner'
import { printReceipt } from './printing'
import './teller.css'

const QUICK_TX_DENOMS = [10000, 20000, 50000, 100000, 200000, 500000]
const QUICK_CASH_DENOMS = [250000, 500000, 1000000, 2000000]

function MoneyPreview({ value }) {
  const num = Number(value)
  if (!Number.isFinite(num) || num <= 0) return null
  return (
    <span className="teller-money-preview" aria-live="polite">
      Nominal terbaca: {money(num)}
    </span>
  )
}

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

// [Alur Kerja] Hook useTellerWorkflow: State management transaksi teller (search, draft, verifikasi PIN, submit, struk)
function useTellerWorkflow(tellerId, onChange, canCreate) {
  const [pending, setPending] = useState(() => readPending(tellerId))
  const [query, setQuery] = useState(() => readPending(tellerId)?.query || '')
  const [found, setFound] = useState(null)
  const [mode, setMode] = useState('deposit')
  const [draft, setDraft] = useState({ amount: '', notes: '', appointment_id: '' })
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
      setDraft({ amount: '', notes: '', appointment_id: '' })
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
          appointment_id: draft.appointment_id ? Number(draft.appointment_id) : null,
          request_id: crypto.randomUUID(),
        }
    setReview({
      operation: isActivate ? 'activate' : mode,
      path: `/teller/${isActivate ? 'activate' : mode}`,
      body,
      full_name: found.member.full_name,
      student_number: found.member.student_number,
      appointment_code: draft.appointment_id
        ? found.today_appointments?.find((a) => a.id === Number(draft.appointment_id))?.appointment_code
        : null,
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
  function clearPending() {
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
    clearPending,
  }
}

// [Komponen] TransactionWorkspace: Ruang kerja transaksi loket teller (Langkah 1 - 4)
function TransactionWorkspace({ workflow: tx, canCreate, sessions }) {
  const [confirmResetPin, setConfirmResetPin] = useState(false)
  const [resetMessage, setResetMessage] = useState('')
  const [resetBusy, setResetBusy] = useState(false)

  const [showApptModal, setShowApptModal] = useState(false)
  const [apptAmount, setApptAmount] = useState('')
  const [apptDate, setApptDate] = useState('')
  const [apptNotes, setApptNotes] = useState('')
  const [apptBusy, setApptBusy] = useState(false)
  const [apptError, setApptError] = useState('')
  const [apptMessage, setApptMessage] = useState('')

  const snapshot = tx.pending?.body || tx.review?.body
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

  function getMinApptDate() {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  async function handleCreateAppt(e) {
    e.preventDefault()
    if (apptBusy || !tx.found?.saver) return
    setApptBusy(true)
    setApptError('')
    try {
      const res = await api('/teller/appointments', {
        method: 'POST',
        body: {
          account_number: tx.found.saver.account_number,
          amount: Number(apptAmount),
          scheduled_date: apptDate,
          notes: apptNotes ? apptNotes.trim() : null,
        },
      })
      setApptMessage(res.message || 'Perjanjian berhasil diajukan dan menunggu persetujuan Admin.')
      setShowApptModal(false)
      tx.search(tx.found.saver.account_number)
    } catch (err) {
      setApptError(err.message)
    } finally {
      setApptBusy(false)
    }
  }

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
      {apptMessage && <Notice tone="success">{apptMessage}</Notice>}
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
            <Button
              variant="secondary"
              disabled={tx.busy}
              onClick={tx.clearPending}
            >
              Reset transaksi tertunda
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
          {/* [Langkah 1] Pencarian nasabah via NIS, nomor rekening, atau scan token QR/barcode */}
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
              {/* [Langkah 2] Informasi akun nasabah, saldo total, saldo mengendap Rp 10.000, & limit penarikan */}
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
                      <DetailRow label="Saldo wajib mengendap">
                        {money(10000)}
                      </DetailRow>
                      <DetailRow label="Saldo dapat ditarik">
                        <strong className="text-primary">{money(tx.found.saver.available_balance)}</strong>
                      </DetailRow>
                      <DetailRow label="Sisa limit bebas harian">
                        {money(tx.found.limits?.remaining_daily_limit ?? 1000000)} / {money(1000000)}
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
                      <Button
                        variant="secondary"
                        disabled={tx.busy}
                        onClick={() => {
                          setApptError('')
                          setApptMessage('')
                          setApptAmount(tx.draft.amount || '')
                          setApptDate('')
                          setApptNotes('')
                          setShowApptModal(true)
                        }}
                      >
                        Buat Perjanjian H-1 (&gt; 1 Jt)
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
              {/* [Langkah 3] Formulir transaksi (Setoran, Penarikan, atau Aktivasi Rekening Siswa Baru) */}
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
                  hint="Masukkan angka bulat atau pilih nominal cepat di bawah."
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
                <div>
                  <div className="teller-denom-chips" role="group" aria-label="Pilihan nominal cepat">
                    {QUICK_TX_DENOMS.map((denom) => {
                      const active = Number(tx.draft.amount) === denom
                      return (
                        <button
                          key={denom}
                          type="button"
                          disabled={tx.busy || !canCreate}
                          className={`teller-denom-chip ${active ? 'teller-denom-chip--active' : ''}`}
                          onClick={() =>
                            tx.setDraft({ ...tx.draft, amount: String(denom) })
                          }
                        >
                          {money(denom)}
                        </button>
                      )
                    })}
                  </div>
                  <MoneyPreview value={tx.draft.amount} />
                </div>
                {tx.found.saver && tx.mode === 'withdraw' && (() => {
                  const amountNum = Number(tx.draft.amount) || 0
                  const remainingLimit = tx.found.limits?.remaining_daily_limit ?? 1000000
                  const requiresAppt = amountNum > 1000000 || (tx.found.limits && (tx.found.limits.today_withdrawn + amountNum) > tx.found.limits.daily_withdrawal_limit)
                  const appts = tx.found.today_appointments || []

                  if (!requiresAppt && appts.length === 0) return null

                  if (appts.length > 0) {
                    return (
                      <FormField
                        label="Tiket Perjanjian Disetujui (Admin)"
                        hint="Pilih tiket perjanjian yang telah disetujui Admin untuk hari ini."
                        required={requiresAppt}
                      >
                        <Select
                          value={tx.draft.appointment_id || ''}
                          onChange={(e) =>
                            tx.setDraft({ ...tx.draft, appointment_id: e.target.value })
                          }
                          required={requiresAppt}
                          disabled={tx.busy || !canCreate}
                        >
                          <option value="">
                            {requiresAppt
                              ? '-- Wajib pilih tiket perjanjian disetujui --'
                              : '-- Opsional: Hubungkan tiket perjanjian --'}
                          </option>
                          {appts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.appointment_code} · Plafon {money(a.amount)}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    )
                  }

                  return (
                    <Notice tone="warning">
                      <strong>Wajib Perjanjian H-1:</strong> Penarikan di atas Rp1.000.000 atau melampaui limit harian wajib memiliki tiket perjanjian H-1 yang telah disetujui Admin. Nasabah ini belum memiliki tiket disetujui untuk hari ini.
                      <div style={{ marginTop: '0.5rem' }}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setApptError('')
                            setApptMessage('')
                            setApptAmount(tx.draft.amount || '')
                            setApptDate('')
                            setApptNotes('')
                            setShowApptModal(true)
                          }}
                        >
                          Ajukan Perjanjian Penarikan (H-1)
                        </Button>
                      </div>
                    </Notice>
                  )
                })()}
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
        /* [Langkah 4] Konfirmasi & verifikasi transaksi nasabah (PIN keamanan & struk) */
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
            {snapshot.appointment_id && (
              <DetailRow label="Tiket perjanjian">
                {tx.review?.appointment_code || `ID #${snapshot.appointment_id}`}
              </DetailRow>
            )}
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

      {/* Modal input manual perjanjian penarikan H-1 oleh Teller jika siswa belum punya aplikasi */}
      <Modal
        open={showApptModal}
        title="Ajukan Perjanjian Penarikan Kas Besar"
        onClose={() => setShowApptModal(false)}
      >
        <form onSubmit={handleCreateAppt} className="stack">
          <p>
            Pendaftaran perjanjian penarikan atas nama nasabah{' '}
            <strong>{tx.found?.member?.full_name}</strong> ({tx.found?.saver?.account_number}).
            Pengajuan ini akan diteruskan ke Admin untuk diverifikasi dan disetujui (minimal H-1).
          </p>
          {apptError && <Notice tone="danger">{apptError}</Notice>}
          <FormField
            label="Nominal penarikan (Rupiah)"
            hint="Nominal wajib lebih dari Rp1.000.000"
            required
          >
            <Input
              type="number"
              min={1000001}
              step={1}
              value={apptAmount}
              onChange={(e) => setApptAmount(e.target.value)}
              required
              disabled={apptBusy}
            />
          </FormField>
          <MoneyPreview value={apptAmount} />
          <FormField
            label="Tanggal Pengambilan (Minimal H-1)"
            hint="Pilih tanggal mulai besok atau hari kerja berikutnya"
            required
          >
            <Input
              type="date"
              min={getMinApptDate()}
              value={apptDate}
              onChange={(e) => setApptDate(e.target.value)}
              required
              disabled={apptBusy}
            />
          </FormField>
          <FormField label="Keperluan / Catatan">
            <Input
              placeholder="Contoh: Pembayaran kegiatan sekolah / keperluan keluarga"
              maxLength={255}
              value={apptNotes}
              onChange={(e) => setApptNotes(e.target.value)}
              disabled={apptBusy}
            />
          </FormField>
          <div className="button-group modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowApptModal(false)}
              disabled={apptBusy}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" busy={apptBusy}>
              Kirim ke Admin
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}

// [Sesi Kas] Buka Kasir Loket Awal Hari & Pengajuan Tambahan Modal Kas Fisik
function OpenSession({ sessions, blocked, onChanged }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [openingInput, setOpeningInput] = useState('')
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
            value={openingInput}
            onChange={(event) => setOpeningInput(event.target.value)}
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
      <div style={{ marginTop: '-12px', marginBottom: '20px' }}>
        <div className="teller-denom-chips" role="group" aria-label="Pilihan modal cepat">
          {QUICK_CASH_DENOMS.map((denom) => (
            <button
              key={denom}
              type="button"
              disabled={busy || blocked}
              className={`teller-denom-chip ${Number(openingInput) === denom ? 'teller-denom-chip--active' : ''}`}
              onClick={() => setOpeningInput(String(denom))}
            >
              {money(denom)}
            </button>
          ))}
        </div>
        <MoneyPreview value={openingInput} />
      </div>

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
          <div>
            <div className="teller-denom-chips" role="group" aria-label="Pilihan tambahan kas cepat">
              {QUICK_CASH_DENOMS.map((denom) => (
                <button
                  key={denom}
                  type="button"
                  disabled={requestBusy}
                  className={`teller-denom-chip ${Number(requestAmount) === denom ? 'teller-denom-chip--active' : ''}`}
                  onClick={() => setRequestAmount(String(denom))}
                >
                  {money(denom)}
                </button>
              ))}
            </div>
            <MoneyPreview value={requestAmount} />
          </div>
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

// [Sesi Kas] Tutup Kasir Loket Akhir Hari & Rekonsiliasi Kas Fisik ke Admin
function CloseSession({ sessions, pending, onChanged }) {
  const [sessionId, setSessionId] = useState('')
  const [cash, setCash] = useState('')
  const [calcMode, setCalcMode] = useState('calculator')
  const [review, setReview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const openSessions = (sessions.data || []).filter((row) => row.status === 'open')
  const selected = openSessions.find((row) => String(row.id) === sessionId)

  function prepare(event) {
    event.preventDefault()
    if (!selected || pending || sessions.loading || sessions.error) return
    const actualNum = Number(cash)
    if (!Number.isFinite(actualNum) || actualNum < 0) {
      setError('Masukkan nominal uang fisik yang valid.')
      return
    }
    setReview({ ...selected, actual: actualNum })
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

                  <div className="cash-mode-tabs" role="tablist" aria-label="Metode perhitungan kas fisik">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={calcMode === 'calculator'}
                      className={`cash-mode-tab ${calcMode === 'calculator' ? 'cash-mode-tab--active' : ''}`}
                      onClick={() => setCalcMode('calculator')}
                    >
                      <Calculator size={15} aria-hidden="true" />
                      <span>Hitung Pecahan (Rinci)</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={calcMode === 'manual'}
                      className={`cash-mode-tab ${calcMode === 'manual' ? 'cash-mode-tab--active' : ''}`}
                      onClick={() => setCalcMode('manual')}
                    >
                      <Banknote size={15} aria-hidden="true" />
                      <span>Input Nominal Langsung</span>
                    </button>
                  </div>

                  {calcMode === 'calculator' ? (
                    <CashDenominationCalculator
                      expectedAmount={selected.expected_closing_balance}
                      storageKey={`bank_cash_closing_${selected.id}`}
                      onChange={(grandTotal) => {
                        setCash(grandTotal > 0 ? String(grandTotal) : '')
                      }}
                    />
                  ) : (
                    <>
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
                      <MoneyPreview value={cash} />
                    </>
                  )}

                  <div style={{ marginTop: '16px' }}>
                    <Button type="submit" disabled={busy || cash === '' || Number(cash) < 0}>
                      Lanjutkan ke pemeriksaan tutup kas
                    </Button>
                  </div>
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
          {review.actual === Number(review.expected_closing_balance) ? (
            <Notice tone="success">
              Kas fisik seimbang sempurna dengan catatan sistem (Selisih Rp 0). Pengajuan siap diproses administrator.
            </Notice>
          ) : (
            <Notice tone="warning">
              Perhatian: Terdapat selisih kas fisik sebesar{' '}
              <strong>{money(review.actual - Number(review.expected_closing_balance))}</strong>.
              Sesi akan berstatus &quot;disputed&quot; sampai diperiksa administrator.
            </Notice>
          )}
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

// [Monitoring] Daftar Perjanjian Penarikan H-1 Siswa di Loket Teller
function TellerAppointments() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')

  const params = new URLSearchParams()
  params.set('page', page)
  if (status) params.set('status', status)
  if (query.trim()) params.set('q', query.trim())

  const appointments = useResource(`/teller/appointments?${params.toString()}`)

  const columns = [
    {
      key: 'code',
      header: 'Kode Tiket',
      render: (item) => (
        <div>
          <strong className="mono">{item.appointment_code}</strong>
          <div className="subtext">
            Diajukan oleh: {item.creator_role === 'student' ? 'Siswa' : 'Teller'}
          </div>
        </div>
      ),
    },
    {
      key: 'member',
      header: 'Nasabah',
      render: (item) => (
        <div>
          <strong>{item.saver?.member?.full_name || '-'}</strong>
          <div className="subtext">
            NIS: {item.saver?.member?.student_number || '-'} &bull; Rek:{' '}
            {item.saver?.account_number || '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Nominal',
      render: (item) => (
        <strong className="mono text-primary">{money(item.amount)}</strong>
      ),
    },
    {
      key: 'date',
      header: 'Tgl Pengambilan',
      render: (item) => (
        <div>
          <span>{item.scheduled_date}</span>
          {item.notes && <div className="subtext italic">"{item.notes}"</div>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status Persetujuan Admin',
      render: (item) => {
        if (item.status === 'pending') {
          return <Status tone="warning">Menunggu Persetujuan Admin</Status>
        }
        if (item.status === 'approved') {
          return <Status tone="success">Disetujui Admin</Status>
        }
        if (item.status === 'completed') {
          return <Status tone="neutral">Selesai Dicairkan</Status>
        }
        return (
          <div>
            <Status tone="danger">Ditolak</Status>
            {item.rejection_reason && (
              <div className="subtext text-danger">{item.rejection_reason}</div>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <section className="bank-panel">
      <h2>Daftar Perjanjian Penarikan Kas Besar (&gt; Rp1.000.000)</h2>
      <Notice>
        Penarikan di atas Rp1.000.000 wajib memiliki perjanjian minimal H-1 yang telah disetujui Admin.
      </Notice>
      <div className="filter-row">
        <div className="filter-row__search">
          <Input
            type="search"
            placeholder="Cari kode tiket, nama siswa, NIS, atau rekening..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="filter-row__select">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Semua Status</option>
            <option value="pending">Menunggu Persetujuan</option>
            <option value="approved">Disetujui</option>
            <option value="completed">Selesai Dicairkan</option>
            <option value="rejected">Ditolak</option>
          </Select>
        </div>
        <Button variant="outline" onClick={() => appointments.refresh()}>
          Segarkan
        </Button>
      </div>

      <ResourceState
        resource={appointments}
        emptyLabel="Belum ada data perjanjian penarikan."
      >
        {() => (
          <>
            <DataTable columns={columns} rows={appointments.data?.data || []} />
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center' }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <span className="subtext" style={{ margin: '0 0.75rem' }}>
                Halaman {appointments.data?.current_page || 1} dari {appointments.data?.last_page || 1}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= (appointments.data?.last_page || 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </>
        )}
      </ResourceState>
    </section>
  )
}

// [Halaman Utama] Dashboard Teller Bank Mini (Status Buka/Tutup Loket, Tab Navigasi, Struk)
export default function TellerPage({ tellerId }) {
  const sessions = useResource('/teller/cash-sessions')
  const statusRes = useResource('/teller/service-status')
  const [area, setArea] = useState('session')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [calcModalOpen, setCalcModalOpen] = useState(false)
  const [reportsVersion, setReportsVersion] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  const [overrideStatus, setOverrideStatus] = useState(null)
  const serverStatus = statusRes.data?.status || statusRes.data?.data?.status
  const activeStatus = overrideStatus || serverStatus || 'buka'

  useEffect(() => {
    if (serverStatus) {
      setOverrideStatus(serverStatus)
    }
  }, [serverStatus])

  const current = (sessions.data || []).find((row) => row.date === todayWib())
  const canCreate = !sessions.loading && !sessions.error && current?.status === 'open'

  async function updateStatus(nextStatus) {
    if (nextStatus === activeStatus) return
    setOverrideStatus(nextStatus)
    try {
      const res = await api('/teller/service-status', {
        method: 'POST',
        body: { status: nextStatus },
      })
      const confirmedStatus = res?.data?.status || nextStatus
      setOverrideStatus(confirmedStatus)
      setStatusMessage(`Status layanan loket diubah menjadi ${confirmedStatus.toUpperCase()}.`)
      statusRes.refresh()
    } catch (err) {
      setOverrideStatus(serverStatus || 'buka')
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
    ['appointments', 'Perjanjian penarikan'],
    ['close', 'Tutup kas'],
    ['reports', 'Riwayat laporan'],
  ]
  return (
    <>
      <div className="teller-session-strip">
        <div className="teller-session-strip__left">
          <span className="teller-session-strip__meta">
            <span>Sesi hari ini:</span>
            {sessions.loading ? (
              <span>memeriksa...</span>
            ) : sessions.error ? (
              <span>belum dapat diperiksa</span>
            ) : current ? (
              <Status value={current.status} />
            ) : (
              <span>belum dibuka</span>
            )}
          </span>
          <div className="teller-status-switcher" role="group" aria-label="Status operasional loket">
            <span className="teller-status-switcher__label">Status loket:</span>
            <Button
              variant={activeStatus === 'buka' ? 'primary' : 'secondary'}
              className={`teller-status-btn ${activeStatus === 'buka' ? 'teller-status-btn--buka' : ''}`}
              onClick={() => updateStatus('buka')}
            >
              Buka
            </Button>
            <Button
              variant={activeStatus === 'istirahat' ? 'primary' : 'secondary'}
              className={`teller-status-btn ${activeStatus === 'istirahat' ? 'teller-status-btn--istirahat' : ''}`}
              onClick={() => updateStatus('istirahat')}
            >
              Istirahat
            </Button>
            <Button
              variant={activeStatus === 'tutup' ? 'primary' : 'secondary'}
              className={`teller-status-btn ${activeStatus === 'tutup' ? 'teller-status-btn--tutup' : ''}`}
              onClick={() => updateStatus('tutup')}
            >
              Tutup
            </Button>
          </div>
        </div>
        <div className="bank-actions">
          <Button
            variant="secondary"
            onClick={() => setCalcModalOpen(true)}
            title="Buka kalkulator pecahan uang fisik laci"
          >
            <Calculator size={16} aria-hidden="true" />
            <span>Kalkulator Kas</span>
          </Button>
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

      {current && (
        <section className="teller-kpi-grid" aria-label="Ringkasan kas loket hari ini">
          <div className="teller-kpi-card">
            <span className="teller-kpi-card__label">Modal Kas Awal</span>
            <strong className="teller-kpi-card__value">{money(current.opening_balance)}</strong>
            <span className="teller-kpi-card__sub">
              Tambahan disetujui: {money(current.total_additional_cash || 0)}
            </span>
          </div>
          <div className="teller-kpi-card">
            <span className="teller-kpi-card__label">Setoran Masuk Hari Ini</span>
            <strong className="teller-kpi-card__value teller-kpi-card__value--in">
              +{money(current.total_deposits || 0)}
            </strong>
            <span className="teller-kpi-card__sub">Uang masuk ke laci</span>
          </div>
          <div className="teller-kpi-card">
            <span className="teller-kpi-card__label">Penarikan Keluar Hari Ini</span>
            <strong className="teller-kpi-card__value teller-kpi-card__value--out">
              -{money(current.total_withdrawals || 0)}
            </strong>
            <span className="teller-kpi-card__sub">Uang keluar dari laci</span>
          </div>
          <div className="teller-kpi-card">
            <span className="teller-kpi-card__label">Kas Sistem di Laci Saat Ini</span>
            <strong className="teller-kpi-card__value teller-kpi-card__value--primary">
              {money(current.expected_closing_balance)}
            </strong>
            <span className="teller-kpi-card__sub">Patokan saldo kas loket</span>
          </div>
        </section>
      )}
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
      {area === 'appointments' && <TellerAppointments />}
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
      <CashCalculatorModal
        open={calcModalOpen}
        onClose={() => setCalcModalOpen(false)}
        expectedAmount={current ? current.expected_closing_balance : null}
        storageKey="bank_teller_drawer_calc"
      />
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
