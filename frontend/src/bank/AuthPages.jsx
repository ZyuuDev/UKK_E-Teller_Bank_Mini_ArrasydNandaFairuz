import { useState } from 'react'
import { api, setToken } from './api'
import { Button, FormField, Input, Notice } from './ui'
import AuthLayout from './layout/AuthLayout'

export function LoginPage({ onAuth }) {
  const [recovery, setRecovery] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setBusy(true)
    setError('')
    try {
      const result = await api('/auth/login', {
        method: 'POST',
        body: {
          username: values.get('username'),
          password: values.get('password'),
          client: 'web',
        },
      })
      form.reset()
      setToken(result.data.token)
      onAuth(result.data.user)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  if (recovery)
    return (
      <RecoveryPage
        onBack={() => {
          setRecovery(false)
          setError('')
        }}
      />
    )
  return (
    <AuthLayout
      title="Masuk ke Bank Mini"
      description="Gunakan akun petugas untuk melanjutkan pekerjaan."
    >
      <Notice error>{error}</Notice>
      <form className="bank-form" onSubmit={submit}>
        <FormField label="Username">
          <Input
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={busy}
          />
        </FormField>
        <FormField label="Password">
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={busy}
          />
        </FormField>
        <Button type="submit" busy={busy}>
          {busy ? 'Memeriksa akun...' : 'Masuk'}
        </Button>
      </form>
      <div className="bank-auth__links">
        <Button variant="secondary" disabled={busy} onClick={() => setRecovery(true)}>
          Pulihkan akun siswa
        </Button>
        <small>
          Akun siswa digunakan pada aplikasi mobile. Pemulihan tersedia untuk email siswa
          yang sudah diverifikasi.
        </small>
      </div>
    </AuthLayout>
  )
}

export function PasswordPage({ onAuth }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const body = Object.fromEntries(new FormData(form))
    if (body.password !== body.password_confirmation) {
      setError('Pengulangan password belum sama.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await api('/auth/password', { method: 'POST', body })
      form.reset()
      onAuth(result.data)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <AuthLayout
      title="Buat password pribadi"
      description="Ganti password sementara sebelum menggunakan layanan. Gunakan minimal 12 karakter."
    >
      <Notice error>{error}</Notice>
      <form className="bank-form" onSubmit={submit}>
        <FormField label="Password saat ini">
          <Input
            name="current_password"
            type="password"
            autoComplete="current-password"
            required
            disabled={busy}
          />
        </FormField>
        <FormField
          label="Password baru"
          hint="12–100 karakter, berbeda dari password saat ini."
        >
          <Input
            name="password"
            type="password"
            minLength={12}
            maxLength={100}
            autoComplete="new-password"
            required
            disabled={busy}
          />
        </FormField>
        <FormField label="Ulangi password baru">
          <Input
            name="password_confirmation"
            type="password"
            minLength={12}
            maxLength={100}
            autoComplete="new-password"
            required
            disabled={busy}
          />
        </FormField>
        <Button type="submit" busy={busy}>
          Simpan password dan lanjutkan
        </Button>
      </form>
    </AuthLayout>
  )
}

export function RecoveryPage({ onBack }) {
  const [phase, setPhase] = useState('email')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    if (phase === 'code' && values.password !== values.password_confirmation) {
      setError('Pengulangan password belum sama.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await api(
        phase === 'email' ? '/auth/forgot-password' : '/auth/reset-password',
        {
          method: 'POST',
          body: { ...values, email },
        },
      )
      setMessage(
        result.message ||
          (phase === 'email'
            ? 'Permintaan diproses. Periksa email yang memenuhi syarat pemulihan.'
            : 'Password berhasil diperbarui. Silakan masuk melalui aplikasi siswa.'),
      )
      form.reset()
      setPhase(phase === 'email' ? 'code' : 'done')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <AuthLayout
      title={phase === 'done' ? 'Password diperbarui' : 'Pulihkan akun siswa'}
      description="Gunakan email siswa yang sudah diverifikasi. Jika belum terdaftar, hubungi petugas sekolah."
    >
      <Notice>{message}</Notice>
      <Notice error>{error}</Notice>
      {phase !== 'done' && (
        <form className="bank-form" onSubmit={submit} key={phase}>
          {phase === 'email' ? (
            <FormField label="Email terverifikasi">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                disabled={busy}
              />
            </FormField>
          ) : (
            <>
              <p className="bank-auth__email">{email}</p>
              <FormField label="Kode enam digit">
                <Input
                  name="code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  autoComplete="one-time-code"
                  required
                  disabled={busy}
                />
              </FormField>
              <FormField label="Password baru">
                <Input
                  name="password"
                  type="password"
                  minLength={12}
                  maxLength={100}
                  autoComplete="new-password"
                  required
                  disabled={busy}
                />
              </FormField>
              <FormField label="Ulangi password baru">
                <Input
                  name="password_confirmation"
                  type="password"
                  minLength={12}
                  maxLength={100}
                  autoComplete="new-password"
                  required
                  disabled={busy}
                />
              </FormField>
            </>
          )}
          <Button type="submit" busy={busy}>
            {phase === 'email' ? 'Minta kode pemulihan' : 'Simpan password baru'}
          </Button>
        </form>
      )}
      <div className="bank-auth__links">
        {phase === 'code' && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setPhase('email')
              setMessage('')
              setError('')
            }}
          >
            Ubah email atau minta ulang kode
          </Button>
        )}
        <Button variant="secondary" disabled={busy} onClick={onBack}>
          Kembali ke login petugas
        </Button>
      </div>
    </AuthLayout>
  )
}