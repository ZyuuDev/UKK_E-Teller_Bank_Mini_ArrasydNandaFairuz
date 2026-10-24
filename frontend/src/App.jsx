import { useEffect, useState } from 'react'
import {
  BookOpen,
  ClipboardCheck,
  FileUp,
  Landmark,
  LayoutDashboard,
  ShieldCheck,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react'
import { api, getToken, setToken } from './bank/api'
import { LoginPage, PasswordPage } from './bank/AuthPages'
import {
  ImportPage,
  LedgerPage,
  MembersPage,
  OverviewPage,
  ReportsPage,
  SaversPage,
  StaffPage,
} from './bank/AdminPages'
import TellerPage from './bank/TellerPage'
import AppShell from './bank/layout/AppShell'
import AccountSettingsPage from './bank/AccountSettingsPage'
import './bank/teacher-revisions.css'
import { Button, Drawer, Notice, PageHeader } from './bank/ui'
import './bank/redesign.css'

const pages = {
  overview: {
    label: 'Ringkasan',
    group: 'Utama',
    icon: LayoutDashboard,
    component: OverviewPage,
  },
  members: {
    label: 'Kelola anggota',
    group: 'Data sekolah',
    icon: Users,
    component: MembersPage,
  },
  imports: {
    label: 'Impor siswa',
    group: 'Data sekolah',
    icon: FileUp,
    component: ImportPage,
  },
  savers: {
    label: 'Rekening penabung',
    group: 'Data sekolah',
    icon: Landmark,
    component: SaversPage,
  },
  reports: {
    label: 'Laporan kas',
    group: 'Pengawasan',
    icon: ClipboardCheck,
    component: ReportsPage,
  },
  journals: {
    label: 'Jurnal akuntansi',
    group: 'Pengawasan',
    icon: BookOpen,
    component: LedgerPage,
  },
  audit: {
    label: 'Audit aktivitas',
    group: 'Pengawasan',
    icon: ShieldCheck,
    component: LedgerPage,
  },
  staff: {
    label: 'Petugas',
    group: 'Administrasi',
    icon: UsersRound,
    component: StaffPage,
  },
}
const navigation = Object.entries(pages).map(([key, value]) => ({ key, ...value }))

export default function App() {
  const [user, setUser] = useState(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [accountBusy, setAccountBusy] = useState(false)
  const [page, setPage] = useState('overview')
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
      setAccountOpen(false)
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
      setAccountOpen(false)
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
            setAccountOpen(false)
            setUser(value)
            setError('')
            setPage('overview')
          }}
        />
      </>
    )
  if (user.must_change_password) return <PasswordPage onAuth={setUser} />
  if (!['admin', 'teller'].includes(user.role))
    return (
      <main className="login-page">
        <section className="bank-panel">
          <p>Gunakan aplikasi mobile untuk akun siswa.</p>
          <Button onClick={logout}>Keluar</Button>
        </section>
      </main>
    )
  const isAdmin = user.role === 'admin'
  const Page = pages[page].component
  return (
    <AppShell
      user={user}
      navigation={
        isAdmin
          ? navigation
          : [
              {
                key: 'teller',
                label: 'Pelayanan teller',
                group: 'Layanan',
                icon: Wallet,
              },
            ]
      }
      page={isAdmin ? page : 'teller'}
      onNavigate={(key) => {
        if (isAdmin) setPage(key)
      }}
      onAccount={() => setAccountOpen(true)}
      onLogout={logout}
    >
      <Notice error>{error}</Notice>
      {isAdmin ? (
        <Page key={page} audit={page === 'audit'} currentUser={user} />
      ) : (
        <>
          <PageHeader
            title="Pelayanan teller"
            description="Periksa identitas, nominal, dan uang fisik sebelum menyimpan transaksi."
          />
          <TellerPage key={user.id} tellerId={user.id} />
        </>
      )}
      <Drawer
        open={accountOpen}
        title="Kelola akun saya"
        busy={accountBusy}
        onClose={() => setAccountOpen(false)}
      >
        <AccountSettingsPage
          user={user}
          onUserChange={setUser}
          onBusyChange={setAccountBusy}
        />
      </Drawer>
    </AppShell>
  )
}