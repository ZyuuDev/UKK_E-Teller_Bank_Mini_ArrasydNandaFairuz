import { useEffect, useState } from 'react'
import { api, getToken, setToken } from './bank/api'
import { LoginPage, PasswordPage } from './bank/AuthPages'
import {
  ImportPage,
  LedgerPage,
  MembersPage,
  ReportsPage,
  SaversPage,
  StaffPage,
} from './bank/AdminPages'
import TellerPage from './bank/TellerPage'
import { Notice } from './bank/ui'

const pages = {
  members: ['Anggota', MembersPage],
  imports: ['Impor siswa', ImportPage],
  savers: ['Penabung', SaversPage],
  reports: ['Laporan kas', ReportsPage],
  journals: ['Jurnal', LedgerPage],
  audit: ['Audit', LedgerPage],
  staff: ['Petugas', StaffPage],
}

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('members')
  const [loading, setLoading] = useState(!!getToken())
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    if (getToken())
      api('/auth/me')
        .then((result) => {
          if (active) setUser(result.data)
        })
        .catch((failure) => {
          if (active) setError(failure.message)
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    const expired = () => {
      setToken(null)
      setUser(null)
    }
    window.addEventListener('bank-auth-expired', expired)
    return () => {
      active = false
      window.removeEventListener('bank-auth-expired', expired)
    }
  }, [])
  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch (failure) {
      setError(failure.message)
    } finally {
      setToken(null)
      setUser(null)
    }
  }
  if (loading)
    return (
      <main className="login-page">
        <p role="status">Memeriksa sesi...</p>
      </main>
    )
  if (!user)
    return (
      <>
        <Notice error>{error}</Notice>
        <LoginPage
          onAuth={(value) => {
            setUser(value)
            setError('')
          }}
        />
      </>
    )
  if (user.must_change_password) return <PasswordPage onAuth={setUser} />
  if (!['admin', 'teller'].includes(user.role))
    return (
      <main className="login-page">
        <section className="panel">
          <p>Gunakan aplikasi mobile untuk akun siswa.</p>
          <button onClick={logout}>Keluar</button>
        </section>
      </main>
    )
  const Page = pages[page][1]
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <strong>Bank Mini</strong>
        <p>SMKN 1 Bantul</p>
        <nav aria-label="Menu utama">
          {user.role === 'admin' ? (
            Object.entries(pages).map(([key, [label]]) => (
              <button
                key={key}
                aria-current={page === key ? 'page' : undefined}
                onClick={() => setPage(key)}
              >
                {label}
              </button>
            ))
          ) : (
            <button aria-current="page">Pelayanan teller</button>
          )}
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <p>
            <strong>{user.name}</strong>
            <br />
            <small>{user.role === 'admin' ? 'Administrator' : 'Teller'}</small>
          </p>
          <button className="secondary" onClick={logout}>
            Keluar
          </button>
        </header>
        <main className="content">
          <div className="page-head">
            <h1>{user.role === 'admin' ? pages[page][0] : 'Pelayanan tabungan siswa'}</h1>
            <p>
              {user.role === 'admin'
                ? 'Kelola data dan periksa kegiatan bank mini sekolah.'
                : 'Pastikan identitas siswa, nominal, dan uang fisik sesuai sebelum menyimpan.'}
            </p>
          </div>
          <Notice error>{error}</Notice>
          {user.role === 'admin' ? (
            <Page key={page} audit={page === 'audit'} />
          ) : (
            <TellerPage tellerId={user.id} />
          )}
        </main>
      </div>
    </div>
  )
}