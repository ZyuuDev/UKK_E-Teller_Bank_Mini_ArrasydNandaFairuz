import { useState } from 'react'
import { api, money, useResource } from './api'
import { Modal, Notice } from './ui'
import { ReportsPage } from './AdminPages'
import QrScanner from '../components/QrScanner'
import { printReceipt } from './printing'

function readPending(tellerId) {
  try {
    return JSON.parse(sessionStorage.getItem(`bank-pending:${tellerId}`) || 'null')
  } catch {
    return null
  }
}

function Transactions({ onChange, tellerId }) {
  const [query, setQuery] = useState(() => readPending(tellerId)?.query || '')
  const [found, setFound] = useState(null)
  const [mode, setMode] = useState('deposit')
  const [pending, setPending] = useState(() => readPending(tellerId))
  const [rejected, setRejected] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  function remember(value) {
    setPending(value)
    if (value) sessionStorage.setItem(`bank-pending:${tellerId}`, JSON.stringify(value))
    else sessionStorage.removeItem(`bank-pending:${tellerId}`)
  }
  async function search(value) {
    setBusy(true)
    setError('')
    try {
      setFound((await api(`/teller/search?q=${encodeURIComponent(value)}`)).data)
      setQuery(value)
    } catch (failure) {
      setError(failure.message)
      setFound(null)
    } finally {
      setBusy(false)
    }
  }
  async function resolve() {
    setBusy(true)
    setError('')
    try {
      const result = await api(
        `/teller/transactions/by-request/${pending.body.request_id}`
      )
      setReceipt(result.data)
      remember(null)
      onChange()
    } catch (failure) {
      setError(
        failure.status === 404
          ? 'Hasil belum ditemukan. Kirim ulang dengan ID yang sama, bukan membuat transaksi baru.'
          : failure.message
      )
    } finally {
      setBusy(false)
    }
  }
  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    setBusy(true)
    setError('')
    let request = pending
    try {
      if (!request) {
        if (!crypto.randomUUID)
          throw new Error(
            'Gunakan localhost atau HTTPS agar identitas transaksi dapat dibuat.'
          )
        const operation = found.saver ? mode : 'activate'
        request = {
          path: `/teller/${operation}`,
          query,
          body: {
            request_id: crypto.randomUUID(),
            amount: Number(values.amount),
            ...(operation === 'activate'
              ? { member_id: found.member.user_id }
              : {
                  account_number: found.saver.account_number,
                  notes: values.notes || null,
                }),
          },
        }
        remember(request)
      }
      const result = await api(request.path, {
        method: 'POST',
        body: {
          ...request.body,
          ...(request.path.endsWith('/withdraw') || request.path.endsWith('/activate')
            ? { security_pin: values.security_pin }
            : {}),
        },
      })
      setReceipt(result.data)
      remember(null)
      setRejected(false)
      setFound(null)
      form.reset()
      onChange()
    } catch (failure) {
      setError(
        failure.message || 'Koneksi terputus. Periksa hasil sebelum transaksi baru.'
      )
      setRejected(
        failure.status === 422 && !failure.message.includes('Identitas permintaan')
      )
    } finally {
      setBusy(false)
    }
  }
  const needsPin = pending
    ? pending.path.endsWith('/activate') || pending.path.endsWith('/withdraw')
    : !found?.saver || mode === 'withdraw'
  return (
    <section className="panel">
      <h2>Pelayanan tabungan</h2>
      <Notice error>{error}</Notice>
      {pending && (
        <Notice>
          Permintaan {pending.body.request_id} belum selesai dikonfirmasi. Nominal{' '}
          {money(pending.body.amount)}. Periksa atau kirim ulang sebelum melayani
          transaksi berikutnya.
          <div className="actions" style={{ marginTop: 10 }}>
            <button className="secondary" disabled={busy} onClick={resolve}>
              Periksa hasil
            </button>
            {rejected && (
              <button
                className="secondary"
                onClick={() => {
                  remember(null)
                  setRejected(false)
                }}
              >
                Perbaiki permintaan yang ditolak
              </button>
            )}
          </div>
        </Notice>
      )}
      <form
        className="actions"
        onSubmit={(event) => {
          event.preventDefault()
          search(query)
        }}
      >
        <label>
          Nomor siswa atau rekening
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={!!pending}
            required
          />
        </label>
        <button disabled={busy}>Cari siswa</button>
      </form>
      {!pending && (
        <details style={{ marginTop: 18 }}>
          <summary>Gunakan pemindai QR</summary>
          <QrScanner onResult={search} />
        </details>
      )}
      {found && (
        <div style={{ marginTop: 24 }}>
          <h3>{found.member.full_name}</h3>
          <p>
            Nomor siswa {found.member.student_number}; lulus{' '}
            {found.member.graduation_year || 'belum dilengkapi'}.
          </p>
          {found.saver ? (
            <div className="grid">
              <div>
                <small>Saldo total</small>
                <p className="balance">{money(found.saver.balance)}</p>
              </div>
              <div>
                <small>Dapat ditarik</small>
                <p className="balance">{money(found.saver.available_balance)}</p>
              </div>
            </div>
          ) : (
            <Notice>
              Belum memiliki rekening. Setoran pertama minimal Rp10.000 akan mengaktifkan
              rekening.
            </Notice>
          )}
        </div>
      )}
      {(found || pending) && (
        <form className="form" onSubmit={submit} style={{ marginTop: 20 }}>
          {found?.saver && !pending && (
            <label>
              Layanan
              <select value={mode} onChange={(event) => setMode(event.target.value)}>
                <option value="deposit">Setoran</option>
                <option value="withdraw">Penarikan</option>
              </select>
            </label>
          )}
          <label>
            Nominal rupiah
            <input
              name="amount"
              type="number"
              min={found?.saver ? 1 : 10000}
              step={1}
              required
              defaultValue={pending?.body.amount || ''}
              readOnly={!!pending}
            />
          </label>
          {needsPin && (
            <label>
              PIN enam digit, diisi siswa
              <input
                name="security_pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                autoComplete="off"
                required
              />
            </label>
          )}
          {!pending && (
            <label>
              Catatan
              <input name="notes" maxLength={255} />
            </label>
          )}
          <button disabled={busy}>
            {busy
              ? 'Memproses...'
              : pending
                ? 'Kirim ulang permintaan yang sama'
                : found?.saver
                  ? 'Konfirmasi transaksi'
                  : 'Aktifkan dan simpan setoran'}
          </button>
        </form>
      )}
      <Modal open={!!receipt} title="Bukti transaksi" onClose={() => setReceipt(null)}>
        {receipt && (
          <>
            <p>
              {receipt.full_name} · {receipt.account_number}
            </p>
            <p>
              {receipt.transaction_type === 'Deposit' ? 'Setoran' : 'Penarikan'}{' '}
              <strong>{money(receipt.amount)}</strong>
            </p>
            <p>Saldo sesudah transaksi {money(receipt.balance_after)}</p>
            <p>ID transaksi {receipt.id}</p>
            <button onClick={() => printReceipt(receipt)}>Cetak bukti</button>
          </>
        )}
      </Modal>
    </section>
  )
}

export default function TellerPage({ tellerId }) {
  const sessions = useResource('/teller/cash-sessions')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [reportsVersion, setReportsVersion] = useState(0)
  async function open(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/teller/cash-sessions', {
        method: 'POST',
        body: {
          opening_balance: Number(
            new FormData(event.currentTarget).get('opening_balance')
          ),
        },
      })
      sessions.refresh()
      setMessage('Sesi kas diperiksa dan tersedia.')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  async function close(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true)
    setError('')
    try {
      const result = await api(`/teller/cash-sessions/${values.session_id}/submit`, {
        method: 'POST',
        body: { actual_cash_on_hand: Number(values.actual_cash_on_hand) },
      })
      setMessage(
        result.data.status === 'disputed'
          ? 'Laporan diajukan dengan selisih. Tunggu pemeriksaan admin.'
          : 'Laporan diajukan. Transaksi sesi dikunci sampai pemeriksaan admin.'
      )
      sessions.refresh()
      setReportsVersion((value) => value + 1)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  const openSessions = (sessions.data || []).filter((row) => row.status === 'open')
  return (
    <>
      <Notice error>{error || sessions.error}</Notice>
      <Notice>{message}</Notice>
      <section className="panel">
        <h2>Sesi kas teller</h2>
        <form className="actions" onSubmit={open}>
          <label>
            Modal fisik awal hari
            <input type="number" name="opening_balance" min={0} step={1} required />
          </label>
          <button disabled={busy}>Buka atau periksa sesi hari ini</button>
        </form>
        {sessions.loading ? (
          <p>Memuat sesi...</p>
        ) : (
          <ul>
            {(sessions.data || []).map((row) => (
              <li key={row.id}>
                {row.date}: {row.status}; kas sistem {money(row.expected_closing_balance)}
              </li>
            ))}
          </ul>
        )}
      </section>
      <Transactions onChange={sessions.refresh} tellerId={tellerId} />
      <section className="panel">
        <h2>Ajukan tutup kas</h2>
        <p>
          Hitung uang fisik dan periksa slip sebelum mengajukan. Sesudah pengajuan,
          transaksi sesi dihentikan.
        </p>
        <form className="form" onSubmit={close}>
          <label>
            Sesi terbuka
            <select name="session_id" required>
              <option value="">Pilih sesi</option>
              {openSessions.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.date}, kas sistem {money(row.expected_closing_balance)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Uang fisik hasil hitung
            <input type="number" name="actual_cash_on_hand" min={0} step={1} required />
          </label>
          <button disabled={busy || !openSessions.length}>
            Ajukan pemeriksaan admin
          </button>
        </form>
      </section>
      <ReportsPage teller key={reportsVersion} />
    </>
  )
}