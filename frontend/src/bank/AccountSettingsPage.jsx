import { useState } from 'react'
import { api } from './api'
import { Button, FormField, Input, Notice } from './ui'

export default function AccountSettingsPage({ user, onUserChange, onBusyChange }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function submit(event, path, success) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const body = Object.fromEntries(new FormData(form))
    if (body.password && body.password !== body.password_confirmation) {
      setError('Pengulangan password belum sama.')
      return
    }
    setBusy(true)
    onBusyChange(true)
    setError('')
    setMessage('')
    try {
      const result = await api(path, { method: 'POST', body })
      const current = await api('/auth/me')
      onUserChange(current.data)
      setMessage(result.message || success)
      if (path.endsWith('/verify')) form.reset()
    } catch (failure) {
      setError(failure.message)
    } finally {
      form.querySelectorAll('input[type="password"]').forEach((input) => {
        input.value = ''
      })
      setBusy(false)
      onBusyChange(false)
    }
  }

  return (
    <div className="revision-stack">
      <Notice error>{error}</Notice>
      <Notice>{message}</Notice>
      <section>
        <h3>{user.name}</h3>
        <p>
          @{user.username} · {user.role === 'admin' ? 'Administrator' : 'Teller'}
        </p>
        <p>Email: {user.email || 'Belum didaftarkan'}</p>
        <Notice>
          {user.email_verified_at
            ? 'Email sudah diverifikasi dan dapat digunakan untuk Lupa password.'
            : 'Verifikasi email saat kamu masih dapat login. Email yang belum diverifikasi tidak dapat menerima kode pemulihan password.'}
        </Notice>
        <form
          className="bank-form"
          onSubmit={(event) =>
            submit(event, '/auth/email/request', 'Permintaan kode diproses.')
          }
        >
          <h3>Daftarkan atau perbarui email</h3>
          <FormField label="Email akun sendiri">
            <Input
              name="email"
              type="email"
              maxLength={254}
              defaultValue={user.email || ''}
              autoComplete="email"
              required
              disabled={busy}
            />
          </FormField>
          <FormField label="Password login saat ini">
            <Input
              name="current_password"
              type="password"
              maxLength={100}
              autoComplete="current-password"
              required
              disabled={busy}
            />
          </FormField>
          <Button type="submit" busy={busy}>
            Kirim kode verifikasi email
          </Button>
        </form>
        <form
          className="bank-form revision-gap"
          onSubmit={(event) =>
            submit(event, '/auth/email/verify', 'Email terverifikasi.')
          }
        >
          <FormField label="Kode enam digit dari email">
            <Input
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              autoComplete="one-time-code"
              required
              disabled={busy || !user.email}
            />
          </FormField>
          <Button type="submit" disabled={!user.email} busy={busy}>
            Verifikasi email
          </Button>
        </form>
        <p>
          Kode berlaku 10 menit. Pengiriman ulang dibatasi satu kali per menit dan tiga
          kali per 15 menit.
        </p>
      </section>
      <section>
        <h3>Ganti password ketika masih login</h3>
        <form
          className="bank-form"
          onSubmit={(event) =>
            submit(event, '/auth/password', 'Password berhasil diperbarui.')
          }
        >
          <FormField label="Password saat ini">
            <Input
              name="current_password"
              type="password"
              maxLength={100}
              autoComplete="current-password"
              required
              disabled={busy}
            />
          </FormField>
          <FormField label="Password baru, 12–100 karakter">
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
            Simpan password
          </Button>
        </form>
      </section>
    </div>
  )
}