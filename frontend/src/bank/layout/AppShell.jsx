import { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu } from 'lucide-react'
import { Button, Drawer } from '../ui'

function Navigation({ items, page, onNavigate, collapsed = false }) {
  return (
    <nav className="bank-navigation" aria-label="Menu utama">
      {items.map((item, index) => {
        const showGroup = index === 0 || items[index - 1].group !== item.group
        const Icon = item.icon
        return (
          <div key={item.key}>
            {showGroup && !collapsed && (
              <p className="bank-navigation__group">{item.group}</p>
            )}
            <button
              type="button"
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              aria-current={page === item.key ? 'page' : undefined}
              onClick={() => onNavigate(item.key)}
            >
              <Icon size={20} aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          </div>
        )
      })}
    </nav>
  )
}

function Brand({ collapsed = false }) {
  return (
    <div className="bank-brand">
      <img
        src={collapsed ? '/brand/bank-mini-symbol.png' : '/brand/bank-mini-full.png'}
        alt="Bank Mini SMKN 1 Bantul"
        width={collapsed ? 44 : 132}
        height={collapsed ? 44 : 121}
      />
    </div>
  )
}

export default function AppShell({
  user,
  navigation,
  page,
  onNavigate,
  onLogout,
  onAccount,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const current = navigation.find((item) => item.key === page) || navigation[0]
  const initials = (user.name || user.username || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const closeOnDesktop = (event) => {
      if (event.matches) setMobileOpen(false)
    }
    media.addEventListener('change', closeOnDesktop)
    return () => media.removeEventListener('change', closeOnDesktop)
  }, [])
  function navigate(key) {
    onNavigate(key)
    setMobileOpen(false)
  }
  async function logout() {
    setLoggingOut(true)
    try {
      await onLogout()
    } finally {
      setLoggingOut(false)
    }
  }
  return (
    <div className={`bank-shell ${collapsed ? 'bank-shell--collapsed' : ''}`}>
      <a className="bank-skip" href="#bank-main">
        Lewati ke konten
      </a>
      <aside className="bank-sidebar">
        <Brand collapsed={collapsed} />
        <Navigation
          items={navigation}
          page={page}
          onNavigate={navigate}
          collapsed={collapsed}
        />
        <div className="bank-sidebar__footer">
          <Button
            variant="secondary"
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Perluas sidebar' : 'Ringkas sidebar'}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <>
                <ChevronLeft size={18} />
                Ringkas menu
              </>
            )}
          </Button>
        </div>
      </aside>
      <Drawer
        open={mobileOpen}
        title="Menu Bank Mini"
        onClose={() => setMobileOpen(false)}
      >
        <Brand />
        <Navigation items={navigation} page={page} onNavigate={navigate} />
      </Drawer>
      <div className="bank-workspace">
        <header className="bank-topbar">
          <Button
            variant="secondary"
            className="bank-mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={20} aria-hidden="true" />
          </Button>
          <nav aria-label="Breadcrumb" className="bank-breadcrumb">
            <span>Bank Mini</span>
            <ChevronRight size={14} aria-hidden="true" />
            <strong aria-current="page">{current.label}</strong>
          </nav>
          <details className="bank-profile">
            <summary
              aria-label={`Menu akun ${user.name || user.username || 'pengguna'}`}
            >
              <span className="bank-avatar" aria-hidden="true">
                {initials}
              </span>
              <span className="bank-profile__name">
                {user.name}
                <small>{user.role === 'admin' ? 'Administrator' : 'Teller'}</small>
              </span>
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <div className="bank-profile__menu">
              <strong>{user.name}</strong>
              <p>@{user.username}</p>
              <Button
                variant="secondary"
                onClick={(event) => {
                  event.currentTarget.closest('details').removeAttribute('open')
                  onAccount()
                }}
              >
                Kelola akun
              </Button>
              <Button variant="secondary" busy={loggingOut} onClick={logout}>
                <LogOut size={16} aria-hidden="true" />
                Keluar
              </Button>
            </div>
          </details>
        </header>
        <main id="bank-main" tabIndex={-1} className="bank-content">
          {children}
        </main>
      </div>
    </div>
  )
}