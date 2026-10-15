import { useState } from 'react'
import { api, setToken } from './api'
import { Notice } from './ui'

export function LoginPage({ onAuth }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [recovery, setRecovery] = useState(false)
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const result = await api('/auth/login', {
        method: 'POST',
        body: {
          username: form.get('username'),
          password: form.get('password'),
          client: 'web',
        },
      })
      setToken(result.data.token)
      onAuth(result.data.user)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  if (recovery) return <RecoveryPage onBack={() => setRecovery(false)} />
  return (
    <main className="login-page">
      <section className="panel login-panel">
        <p className="muted">Layanan petugas sekolah</p>
        <h1>
          Bank Mini
          <br />
          SMKN 1 Bantul
        </h1>
        <p>Masuk untuk mengelola anggota dan pelayanan tabungan.</p>
        <Notice error>{error}</Notice>
        <form className="form" onSubmit={submit}>
          <label>
            Username
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button disabled={busy}>{busy ? 'Memeriksa akun...' : 'Masuk'}</button>
        </form>
        <p style={{ marginTop: 20 }}>Siswa menggunakan aplikasi mobile.</p>
        <button className="secondary" onClick={() => setRecovery(true)}>
          Lupa password siswa
        </button>
      </section>
    </main>
  )
}

export function PasswordPage({ onAuth }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await api('/auth/password', {
        method: 'POST',
        body: Object.fromEntries(new FormData(event.currentTarget)),
      })
      onAuth(result.data)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="login-page">
      <section className="panel login-panel">
        <h1>Ganti password sementara</h1>
        <p>Gunakan password pribadi minimal 12 karakter sebelum melanjutkan.</p>
        <Notice error>{error}</Notice>
        <form className="form" onSubmit={submit}>
          <label>
            Password saat ini
            <input
              name="current_password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            Password baru
            <input
              name="password"
              type="password"
              minLength={12}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            Ulangi password baru
            <input
              name="password_confirmation"
              type="password"
              minLength={12}
              autoComplete="new-password"
              required
            />
          </label>
          <button disabled={busy}>Simpan password</button>
        </form>
      </section>
    </main>
  )
}

export function RecoveryPage({ onBack }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const data = Object.fromEntries(new FormData(event.currentTarget))
    try {
      const result = await api(sent ? '/auth/reset-password' : '/auth/forgot-password', {
        method: 'POST',
        body: { ...data, email },
      })
      setMessage(result.message)
      setSent(!sent)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="login-page">
      <section className="panel login-panel">
        <h1>Pulihkan akun siswa</h1>
        <p>
          Gunakan email yang sudah diverifikasi. Jika belum terdaftar, hubungi petugas
          sekolah.
        </p>
        <Notice>{message}</Notice>
        <Notice error>{error}</Notice>
        <form className="form" onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              disabled={sent}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          {sent && (
            <>
              <label>
                Kode enam digit
                <input
                  name="code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                />
              </label>
              <label>
                Password baru
                <input
                  name="password"
                  type="password"
                  minLength={12}
                  autoComplete="new-password"
                  required
                />
              </label>
              <label>
                Ulangi password
                <input
                  name="password_confirmation"
                  type="password"
                  minLength={12}
                  autoComplete="new-password"
                  required
                />
              </label>
            </>
          )}
          <button disabled={busy}>
            {busy ? 'Memproses...' : sent ? 'Simpan password baru' : 'Minta kode'}
          </button>
        </form>
        <div className="actions" style={{ marginTop: 16 }}>
          {sent && (
            <button className="secondary" onClick={() => setSent(false)}>
              Ubah email atau minta ulang
            </button>
          )}
          <button className="secondary" onClick={onBack}>
            Kembali ke login
          </button>
        </div>
      </section>
    </main>
  )
}