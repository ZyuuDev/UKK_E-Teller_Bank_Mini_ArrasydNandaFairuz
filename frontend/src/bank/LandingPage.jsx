import { useEffect, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Database,
  Download,
  FileCheck2,
  FileText,
  Landmark,
  Laptop,
  LayoutDashboard,
  Lock,
  Menu,
  Play,
  QrCode,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import './LandingPage.css'

/* -------------------------------------------------------------
 * ANDROID BUGDROID ICON
 * ----------------------------------------------------------- */
function AndroidBugdroidIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.28-.54-.37-.83-.22-.3.16-.42.54-.26.85l1.84 3.18C3.92 11.03 2.24 13.67 2 16.8h20c-.24-3.13-1.92-5.77-4.4-7.32zM7 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  )
}

/* -------------------------------------------------------------
 * LIVE STATUS INDICATOR (CONNECTED TO /api/service-status)
 * ----------------------------------------------------------- */
function LiveStatusIndicator({ variant = 'navbar' }) {
  const [statusData, setStatusData] = useState({
    status: 'buka',
    operating_hours: '07:30 - 17:00 WIB',
    close_time: '17:00 WIB',
  })

  useEffect(() => {
    let active = true
    fetch('/api/service-status')
      .then((res) => res.json())
      .then((json) => {
        if (active && json?.data) {
          setStatusData(json.data)
        }
      })
      .catch(() => {
        const now = new Date()
        const mins = now.getHours() * 60 + now.getMinutes()
        const isOpen = mins >= 7 * 60 + 30 && mins < 17 * 60
        if (active) {
          setStatusData({
            status: isOpen ? 'buka' : 'tutup',
            operating_hours: '07:30 - 17:00 WIB',
            close_time: '17:00 WIB',
          })
        }
      })
    return () => {
      active = false
    }
  }, [])

  const isOpen = statusData.status === 'buka'
  const isBreak = statusData.status === 'istirahat'
  const statusLabel = isOpen
    ? 'Loket Buka'
    : isBreak
    ? 'Loket Istirahat'
    : 'Loket Tutup'

  return (
    <div
      className={`lp-live-pill lp-live-pill--${variant}`}
      title={`Jam Operasional: ${statusData.operating_hours}. Auto-close kas pukul ${statusData.close_time}.`}
    >
      <span
        className={`lp-live-dot ${
          isOpen
            ? 'lp-live-dot--open'
            : isBreak
            ? 'lp-live-dot--break'
            : 'lp-live-dot--closed'
        }`}
      />
      <span className="lp-live-text">{statusLabel}</span>
    </div>
  )
}

/* -------------------------------------------------------------
 * 1. HERO RIGHT: 3D ANGLED PHONE + 4 FLOATING 3D GLASS TILES
 * ----------------------------------------------------------- */
function HeroPhoneMockup() {
  return (
    <div className="lp-hero-phone-stage" aria-hidden="true">
      {/* 3D Glossy Blue Wave Pedestal Under Phone */}
      <svg
        className="lp-hero-wave-pedestal"
        viewBox="0 0 460 190"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pedWaveGrad1" x1="0" y1="0" x2="460" y2="190" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="pedWaveRim" x1="60" y1="20" x2="420" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <ellipse cx="235" cy="138" rx="190" ry="42" fill="url(#pedWaveGrad1)" opacity="0.55" />
        <path
          d="M25 142 C105 178, 285 176, 435 92 C448 84, 456 66, 438 56 C418 46, 385 68, 345 92 C255 144, 125 148, 45 126 Z"
          fill="url(#pedWaveGrad1)"
        />
        <path
          d="M35 135 C120 168, 285 164, 432 82"
          stroke="url(#pedWaveRim)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>

      {/* FLOATING 3D TILE 1 (Top-Left): Frosted Glass Block with 3D Blue Card */}
      <div className="lp-float-3d lp-float-3d--card">
        <div className="lp-glass-tile-3d">
          <div className="lp-tile-inner-card">
            <div className="lp-tile-card-stripe" />
            <div className="lp-tile-card-gold-dot">
              <span />
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING 3D TILE 2 (Mid-Left): Frosted Glass Block with 3D Blue Shield */}
      <div className="lp-float-3d lp-float-3d--shield">
        <div className="lp-glass-tile-3d lp-glass-tile-3d--shield">
          <svg width="42" height="46" viewBox="0 0 42 46" fill="none">
            <defs>
              <linearGradient id="shield3d" x1="0" y1="0" x2="42" y2="46" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="50%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
            </defs>
            <path
              d="M21 3L5 9.5V21.5C5 32.1 11.8 41.3 21 44C30.2 41.3 37 32.1 37 21.5V9.5L21 3Z"
              fill="url(#shield3d)"
              stroke="#93c5fd"
              strokeWidth="1.5"
            />
            <path
              d="M14.5 23L19 27.5L28 18.5"
              stroke="#ffffff"
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* FLOATING 3D TILE 3 (Bottom-Left): Small Gold Coin + Frosted Glass Block with Large 3D Gold Coin */}
      <div className="lp-float-3d lp-float-3d--coin-sm">
        <div className="lp-gold-coin-3d lp-gold-coin-3d--sm">
          <span>B</span>
        </div>
      </div>
      <div className="lp-float-3d lp-float-3d--coin-lg">
        <div className="lp-glass-tile-3d lp-glass-tile-3d--coin">
          <div className="lp-gold-coin-3d lp-gold-coin-3d--lg">
            <span>B</span>
          </div>
        </div>
      </div>

      {/* FLOATING 3D TILE 4 (Mid-Right): Frosted Glass Block with 3D Blue Wallet/Card */}
      <div className="lp-float-3d lp-float-3d--right-card">
        <div className="lp-glass-tile-3d lp-glass-tile-3d--sm">
          <div className="lp-tile-inner-card lp-tile-inner-card--sm">
            <div className="lp-tile-card-stripe" />
            <div className="lp-tile-card-white-dot" />
          </div>
        </div>
      </div>

      {/* 3D ANGLED IPHONE MOCKUP */}
      <div className="lp-phone-3d-body">
        <div className="lp-phone-3d-button-side" />
        <div className="lp-phone-3d-bezel">
          <div className="lp-phone-3d-glare" />
          <div className="lp-phone-3d-screen">
            {/* Status Bar */}
            <div className="lp-p3d-statusbar">
              <span className="lp-p3d-time">9:41</span>
              <div className="lp-p3d-notch" />
              <div className="lp-p3d-status-icons">
                <span className="lp-p3d-sig" />
                <span className="lp-p3d-wifi" />
                <span className="lp-p3d-bat" />
              </div>
            </div>

            {/* App Brand Bar */}
            <div className="lp-p3d-brand">
              <div className="lp-p3d-brand-icon">
                <Landmark size={13} color="#38bdf8" />
              </div>
              <div>
                <div className="lp-p3d-brand-name">Bank Mini</div>
                <div className="lp-p3d-brand-sub">SMKN 1 Bantul</div>
              </div>
            </div>

            {/* Greeting */}
            <div className="lp-p3d-greeting">Halo, Siswa!</div>

            {/* Blue Balance Card */}
            <div className="lp-p3d-balance-card">
              <div className="lp-p3d-balance-left">
                <div className="lp-p3d-balance-lbl">Saldo Utama</div>
                <div className="lp-p3d-balance-val">Rp 250.000</div>
              </div>
              <div className="lp-p3d-balance-badge">
                <Wallet size={14} color="#ffffff" />
              </div>
            </div>

            {/* Transaksi Terakhir */}
            <div className="lp-p3d-tx-hdr">
              <span>Transaksi Terakhir</span>
              <ChevronRight size={12} color="#64748b" />
            </div>

            <div className="lp-p3d-tx-list">
              <div className="lp-p3d-tx-row">
                <div className="lp-p3d-tx-left">
                  <div className="lp-p3d-tx-ico lp-p3d-tx-ico--up">
                    <ArrowDownLeft size={12} />
                  </div>
                  <div>
                    <div className="lp-p3d-tx-title">Top Up</div>
                    <div className="lp-p3d-tx-sub">Setoran Tunai</div>
                  </div>
                </div>
                <div className="lp-p3d-tx-amt lp-p3d-tx-amt--up">+Rp 50.000</div>
              </div>

              <div className="lp-p3d-tx-row">
                <div className="lp-p3d-tx-left">
                  <div className="lp-p3d-tx-ico lp-p3d-tx-ico--down">
                    <CreditCard size={12} />
                  </div>
                  <div>
                    <div className="lp-p3d-tx-title">Pembayaran</div>
                    <div className="lp-p3d-tx-sub">Penarikan Loket</div>
                  </div>
                </div>
                <div className="lp-p3d-tx-amt lp-p3d-tx-amt--down">-Rp 20.000</div>
              </div>
            </div>

            {/* Bottom Nav */}
            <div className="lp-p3d-nav">
              <div className="lp-p3d-nav-item lp-p3d-nav-item--active">
                <Landmark size={12} />
                <span>Beranda</span>
              </div>
              <div className="lp-p3d-nav-item">
                <FileText size={12} />
                <span>Transaksi</span>
              </div>
              <div className="lp-p3d-nav-item">
                <User size={12} />
                <span>Profil</span>
              </div>
            </div>
            <div className="lp-p3d-home-bar" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------
 * 2. ECOSYSTEM CARD 1: TILTED 3D PHONE + THICK 3D BLUE RIBBON
 * ----------------------------------------------------------- */
function EcoMobilePreview() {
  return (
    <div className="lp-eco-phone-stage" aria-hidden="true">
      {/* Back half of 3D Glossy Blue Ribbon Ring */}
      <svg
        className="lp-eco-ribbon-svg"
        viewBox="0 0 380 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ecoRibbonGrad" x1="20" y1="160" x2="360" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.6" />
            <stop offset="55%" stopColor="#3b82f6" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.98" />
          </linearGradient>
          <linearGradient id="ecoRibbonEdge" x1="20" y1="160" x2="360" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        {/* 3D Thick Curved C-Ribbon wrapping around the tilted phone */}
        <path
          d="M 38 158 C 15 118, 85 68, 215 52 C 315 40, 362 66, 342 104 C 325 136, 235 162, 125 174"
          stroke="url(#ecoRibbonGrad)"
          strokeWidth="28"
          strokeLinecap="round"
        />
        <path
          d="M 38 146 C 18 108, 88 58, 215 42 C 312 30, 358 56, 340 94"
          stroke="url(#ecoRibbonEdge)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {/* Small Floating 3D Blue Card Tile on Left of Ribbon */}
      <div className="lp-eco-float-badge">
        <div className="lp-eco-float-badge__inner">
          <CreditCard size={16} color="#ffffff" />
        </div>
      </div>

      {/* Tilted 3D Smartphone */}
      <div className="lp-eco-phone-body">
        <div className="lp-eco-phone-screen">
          <div className="lp-p3d-statusbar" style={{ marginBottom: '6px' }}>
            <span className="lp-p3d-time">9:41</span>
            <div className="lp-p3d-notch" style={{ width: '48px', height: '11px' }} />
            <div className="lp-p3d-status-icons">
              <span className="lp-p3d-wifi" />
              <span className="lp-p3d-bat" />
            </div>
          </div>

          <div className="lp-p3d-brand" style={{ marginBottom: '6px' }}>
            <div className="lp-p3d-brand-icon" style={{ width: '20px', height: '20px' }}>
              <Landmark size={11} color="#38bdf8" />
            </div>
            <div>
              <div className="lp-p3d-brand-name" style={{ fontSize: '10px' }}>Bank Mini</div>
              <div className="lp-p3d-brand-sub" style={{ fontSize: '7.5px' }}>SMKN 1 Bantul</div>
            </div>
          </div>

          <div className="lp-p3d-greeting" style={{ fontSize: '12px', marginBottom: '6px' }}>
            Halo, Siswa!
          </div>

          <div className="lp-p3d-balance-card" style={{ padding: '9px 11px', marginBottom: '8px', borderRadius: '11px' }}>
            <div className="lp-p3d-balance-left">
              <div className="lp-p3d-balance-lbl" style={{ fontSize: '8px' }}>Saldo Utama</div>
              <div className="lp-p3d-balance-val" style={{ fontSize: '14px' }}>Rp 250.000</div>
            </div>
            <div className="lp-p3d-balance-badge" style={{ width: '20px', height: '20px' }}>
              <Wallet size={11} color="#ffffff" />
            </div>
          </div>

          <div className="lp-p3d-tx-hdr" style={{ fontSize: '8.5px', marginBottom: '5px' }}>
            <span>Transaksi Terakhir</span>
            <ChevronRight size={10} color="#64748b" />
          </div>

          <div className="lp-p3d-tx-list" style={{ gap: '5px' }}>
            <div className="lp-p3d-tx-row" style={{ padding: '5px 7px' }}>
              <div className="lp-p3d-tx-left">
                <div className="lp-p3d-tx-ico lp-p3d-tx-ico--up" style={{ width: '18px', height: '18px' }}>
                  <ArrowDownLeft size={10} />
                </div>
                <div>
                  <div className="lp-p3d-tx-title" style={{ fontSize: '8.5px' }}>Top Up</div>
                  <div className="lp-p3d-tx-sub" style={{ fontSize: '6.5px' }}>Setoran Tunai</div>
                </div>
              </div>
              <div className="lp-p3d-tx-amt lp-p3d-tx-amt--up" style={{ fontSize: '8.5px' }}>+Rp 50.000</div>
            </div>

            <div className="lp-p3d-tx-row" style={{ padding: '5px 7px' }}>
              <div className="lp-p3d-tx-left">
                <div className="lp-p3d-tx-ico lp-p3d-tx-ico--down" style={{ width: '18px', height: '18px' }}>
                  <CreditCard size={10} />
                </div>
                <div>
                  <div className="lp-p3d-tx-title" style={{ fontSize: '8.5px' }}>Pembayaran</div>
                  <div className="lp-p3d-tx-sub" style={{ fontSize: '6.5px' }}>Penarikan</div>
                </div>
              </div>
              <div className="lp-p3d-tx-amt lp-p3d-tx-amt--down" style={{ fontSize: '8.5px' }}>-Rp 20.000</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------
 * 3. ECOSYSTEM CARD 2: 3D PERSPECTIVE TILTED MACBOOK LAPTOP
 * ----------------------------------------------------------- */
function LaptopMockup() {
  return (
    <div className="lp-laptop-3d-stage" aria-hidden="true">
      <div className="lp-laptop-3d-unit">
        {/* Laptop Display Lid */}
        <div className="lp-laptop-3d-lid">
          <div className="lp-laptop-3d-screen">
            {/* Blue Top Header Bar */}
            <div className="lp-laptop-topbar">
              <div className="lp-laptop-topbar__left">
                <Landmark size={10} color="#ffffff" />
                <span>Bank Mini SMKN 1 Bantul</span>
              </div>
              <span className="lp-laptop-topbar__right">Loket Teller •</span>
            </div>

            {/* Body: Dark Navy Sidebar + White Form Area */}
            <div className="lp-laptop-body">
              <div className="lp-laptop-sidebar">
                <div className="lp-laptop-nav-item">
                  <LayoutDashboard size={9} />
                  <span>Dashboard</span>
                </div>
                <div className="lp-laptop-nav-item lp-laptop-nav-item--active">
                  <Wallet size={9} />
                  <span>Transaksi</span>
                </div>
                <div className="lp-laptop-nav-item">
                  <FileText size={9} />
                  <span>Laporan</span>
                </div>
                <div className="lp-laptop-nav-item">
                  <Settings size={9} />
                  <span>Pengaturan</span>
                </div>
              </div>

              <div className="lp-laptop-main">
                <div className="lp-laptop-main-title">Transaksi Teller</div>
                <div className="lp-laptop-tabs">
                  <span className="lp-laptop-tab lp-laptop-tab--active">Setoran</span>
                  <span className="lp-laptop-tab">Penarikan</span>
                </div>

                <div className="lp-laptop-fields">
                  <div className="lp-laptop-field">
                    <label>Cari NIS Siswa</label>
                    <div className="lp-laptop-input">
                      <span>Contoh: 12345</span>
                      <div className="lp-laptop-search-ico">
                        <Search size={8} color="#ffffff" />
                      </div>
                    </div>
                  </div>

                  <div className="lp-laptop-field">
                    <label>Nomor Rekening</label>
                    <div className="lp-laptop-input">
                      <span>Pilih Siswa</span>
                      <ChevronRight size={8} color="#94a3b8" />
                    </div>
                  </div>

                  <div className="lp-laptop-field">
                    <label>Nominal</label>
                    <div className="lp-laptop-input">
                      <span>Rp</span>
                    </div>
                  </div>

                  <div className="lp-laptop-submit">Proses Transaksi</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Silver Metallic Laptop Base projecting forward-left */}
        <div className="lp-laptop-3d-base">
          <div className="lp-laptop-3d-notch" />
          <div className="lp-laptop-3d-ports">
            <span />
            <span />
            <i />
          </div>
        </div>
        <div className="lp-laptop-3d-shadow" />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------
 * 4. 3D PERSPECTIVE VIRTUAL STUDENT CARD + SCHOOL WATERMARK
 * ----------------------------------------------------------- */
function VirtualStudentCard() {
  return (
    <div className="lp-vcard-stage" aria-hidden="true">
      {/* Frosted Glass Backing Plate behind Card */}
      <div className="lp-vcard-glass-back" />

      {/* Floating 3D Glass Cubes */}
      <div className="lp-vcard-cube lp-vcard-cube--left" />
      <div className="lp-vcard-cube lp-vcard-cube--right" />

      {/* Back Arc of Glowing Cyan Orbital Ring (Behind Card) */}
      <svg
        className="lp-vcard-ring-svg lp-vcard-ring-svg--back"
        viewBox="0 0 460 270"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="vcardRingGrad" x1="10" y1="200" x2="450" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.88" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <path
          d="M 52 155 C 6 188, 22 238, 128 242 C 258 246, 436 202, 444 142 C 448 110, 412 92, 368 92"
          stroke="url(#vcardRingGrad)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 48 159 C 8 191, 25 240, 130 244 C 260 248, 437 204, 445 144"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Front Tips of Glowing Cyan Orbital Ring (Wraps Around Left & Right Edges Only) */}
      <svg
        className="lp-vcard-ring-svg lp-vcard-ring-svg--front"
        viewBox="0 0 460 270"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 52 155 C 12 184, 18 225, 76 236"
          stroke="url(#vcardRingGrad)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 386 198 C 422 182, 442 162, 444 142"
          stroke="url(#vcardRingGrad)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 386 200 C 422 184, 443 164, 445 144"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      {/* 3D Tilted Dark Navy Metallic Card */}
      <div className="lp-vcard-3d">
        <div className="lp-vcard-3d__shimmer" />
        <div className="lp-vcard-3d__glow-br" />

        {/* Architectural Line-Art Watermark of SMKN 1 Bantul Building */}
        <svg
          className="lp-vcard-3d__watermark"
          viewBox="0 0 200 160"
          fill="none"
          stroke="rgba(147, 197, 253, 0.16)"
          strokeWidth="1.2"
        >
          <path d="M100 18 L100 6 M96 10 L104 10" />
          <path d="M65 55 C65 32, 135 32, 135 55" />
          <polygon points="45,55 100,28 155,55" />
          <rect x="42" y="55" width="116" height="10" />
          <rect x="30" y="65" width="140" height="80" />
          <line x1="52" y1="65" x2="52" y2="145" />
          <line x1="76" y1="65" x2="76" y2="145" />
          <line x1="100" y1="65" x2="100" y2="145" />
          <line x1="124" y1="65" x2="124" y2="145" />
          <line x1="148" y1="65" x2="148" y2="145" />
          <rect x="60" y="78" width="10" height="16" />
          <rect x="84" y="78" width="10" height="16" />
          <rect x="108" y="78" width="10" height="16" />
          <rect x="132" y="78" width="10" height="16" />
          <path d="M88 145 V118 C88 110, 112 110, 112 118 V145" />
        </svg>

        {/* Top Brand Row */}
        <div className="lp-vcard-3d__top">
          <div className="lp-vcard-3d__brand">
            <div className="lp-vcard-3d__logo-box">
              <Landmark size={15} color="#38bdf8" />
            </div>
            <div>
              <div className="lp-vcard-3d__btitle">Bank Mini</div>
              <div className="lp-vcard-3d__bsub">SMKN 1 Bantul</div>
            </div>
          </div>
        </div>

        {/* Gold EMV Chip + Contactless */}
        <div className="lp-vcard-3d__chip-row">
          <div className="lp-vcard-3d__chip">
            <span />
            <span />
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(147, 197, 253, 0.7)" strokeWidth="2">
            <path d="M8.5 16.5a5 5 0 0 1 0-9" />
            <path d="M12 19a9 9 0 0 1 0-14" />
          </svg>
        </div>

        {/* Card Number (Single Line) */}
        <div className="lp-vcard-3d__number">
          <span>3302</span>
          <span>••••</span>
          <span>••••</span>
          <span>1795</span>
        </div>

        {/* Bottom Holder & Active Status */}
        <div className="lp-vcard-3d__bottom">
          <div>
            <div className="lp-vcard-3d__lbl">Nama Pemilik Rekening</div>
            <div className="lp-vcard-3d__name">ARRASYD NANDA FAIRUZ</div>
          </div>
          <div className="lp-vcard-3d__status-col">
            <div className="lp-vcard-3d__lbl">Status Rekening</div>
            <div className="lp-vcard-3d__active">TERDAFTAR AKTIF</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------
 * 5. 3D CURVED S-RECEIPT + CHECKMARK IN GLASS RING BASIN (SVG)
 * ----------------------------------------------------------- */
function TransactionReceiptSphere() {
  return (
    <div className="lp-receipt-3d-stage" aria-hidden="true">
      <svg
        width="230"
        height="175"
        viewBox="0 0 230 175"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="glassBasinRim" x1="15" y1="95" x2="215" y2="155" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="glassBasinFill" x1="115" y1="75" x2="115" y2="165" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="paperGrad" x1="65" y1="15" x2="155" y2="145" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id="paperRollGrad" x1="50" y1="110" x2="135" y2="145" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="checkBadgeGrad" x1="140" y1="72" x2="196" y2="132" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <filter id="softDrop" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#1e3a8a" floodOpacity="0.22" />
          </filter>
        </defs>

        {/* Back Rim of Translucent 3D Elliptical Glass Basin */}
        <ellipse cx="115" cy="118" rx="88" ry="34" fill="url(#glassBasinFill)" stroke="url(#glassBasinRim)" strokeWidth="2" />
        <ellipse cx="115" cy="128" rx="84" ry="30" stroke="#ffffff" strokeOpacity="0.65" strokeWidth="1.5" />

        {/* 3D S-Curved Receipt Paper */}
        <g filter="url(#softDrop)">
          {/* Rolled top edge */}
          <path
            d="M168 24 C178 24, 182 38, 174 48 L152 44 C158 34, 158 24, 168 24 Z"
            fill="#94a3b8"
          />
          {/* Main Curved Receipt Sheet */}
          <path
            d="M95 16 C125 18, 152 22, 168 24 C156 26, 150 48, 144 74 C138 100, 132 122, 122 136 L54 120 C66 106, 72 84, 78 58 C84 32, 86 16, 95 16 Z"
            fill="url(#paperGrad)"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          {/* Receipt Header Logo & Lines */}
          <circle cx="96" cy="36" r="3.5" fill="#3b82f6" />
          <line x1="103" y1="36" x2="128" y2="39" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="140" y1="41" x2="150" y2="42" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />

          <line x1="88" y1="52" x2="144" y2="60" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <line x1="85" y1="64" x2="140" y2="72" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="82" y1="75" x2="136" y2="83" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="78" y1="88" x2="128" y2="96" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="75" y1="98" x2="112" y2="104" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />

          {/* Bottom Rolled Paper Curl */}
          <path
            d="M44 108 C40 116, 44 126, 54 128 L120 144 C112 142, 108 132, 114 122 L44 108 Z"
            fill="url(#paperRollGrad)"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          <ellipse cx="118" cy="133" rx="6" ry="11" fill="#64748b" opacity="0.45" />
        </g>

        {/* 3D Glossy Dark-Navy/Blue Circular Verified Checkmark Badge */}
        <g filter="url(#softDrop)">
          <circle cx="168" cy="104" r="24" fill="#1e3a8a" />
          <circle cx="165" cy="101" r="24" fill="url(#checkBadgeGrad)" stroke="#60a5fa" strokeWidth="2" />
          {/* Glowing Cyan 3D Checkmark */}
          <path
            d="M154 101 L162 109 L177 94"
            stroke="#38bdf8"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.55"
          />
          <path
            d="M154 100 L162 108 L177 93"
            stroke="#ffffff"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Front Rim of Translucent 3D Glass Basin */}
        <path
          d="M27 118 C27 142, 66 156, 115 156 C164 156, 203 142, 203 118"
          stroke="url(#glassBasinRim)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

/* -------------------------------------------------------------
 * MAIN LANDING PAGE COMPONENT
 * ----------------------------------------------------------- */
export default function LandingPage({ onOpenLogin }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [guideModalOpen, setGuideModalOpen] = useState(false)

  const apkDownloadUrl = '/download/BankMini-SKANSABA.apk'

  function scrollToSection(id) {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="lp-root">
      {/* -------------------------------------------------------
       * CONTINUOUS 3D BACKGROUND SCENE (CAMPUS + WAVES + LEAVES)
       * ----------------------------------------------------- */}
      <div className="lp-bg-scene" aria-hidden="true">
        <div className="lp-bg-hero-photo" />

        {/* Left & Right 3D Glossy Blue Ribbon Waves (Vector SVG) */}
        <svg
          className="lp-bg-waves-svg"
          viewBox="0 0 1440 2600"
          fill="none"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bgWaveBlue1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="bgWaveSoft" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.45" />
            </linearGradient>
          </defs>

          {/* Wave 1: Hero Bottom Left & Right Sweeps */}
          <path
            d="M-80 540 C 60 560, 140 620, 260 610 C 160 660, 40 650, -80 620 Z"
            fill="url(#bgWaveBlue1)"
          />
          <path
            d="M1520 530 C 1380 550, 1280 615, 1180 605 C 1280 655, 1400 645, 1520 615 Z"
            fill="url(#bgWaveBlue1)"
          />

          {/* Wave 2: Left Margin Ribbon alongside Ecosystem */}
          <path
            d="M-100 620 C 40 660, 130 740, 160 850 C 70 810, -20 750, -100 710 Z"
            fill="url(#bgWaveSoft)"
          />
          {/* Wave 3: Right Margin Ribbon alongside Ecosystem */}
          <path
            d="M1540 640 C 1380 690, 1300 780, 1270 890 C 1360 850, 1450 780, 1540 730 Z"
            fill="url(#bgWaveSoft)"
          />

          {/* Wave 4: Left Glass Tube above Security Section */}
          <path
            d="M-80 1580 C 30 1630, 120 1710, 150 1790 C 60 1770, -20 1710, -80 1660 Z"
            fill="url(#bgWaveSoft)"
          />

          {/* Wave 5: Right Glossy Blue Ribbon between Security & Process */}
          <path
            d="M1540 1850 C 1380 1890, 1280 1950, 1220 2020 C 1320 2010, 1440 1970, 1540 1930 Z"
            fill="url(#bgWaveBlue1)"
          />
        </svg>

        {/* Soft Bokeh Leaf Accents on Margins */}
        <div className="lp-bokeh-leaf lp-bokeh-leaf--hero-left" />
        <div className="lp-bokeh-leaf lp-bokeh-leaf--mid-right" />
        <div className="lp-bokeh-leaf lp-bokeh-leaf--low-left" />
      </div>

      {/* -------------------------------------------------------
       * 1. FLOATING NAVBAR (MAIN PILL + SEPARATE LOGIN PILL)
       * ----------------------------------------------------- */}
      <header className="lp-navbar-wrapper">
        <div className="lp-navbar-row">
          {/* Left-Center Glass Pill */}
          <div className="lp-navbar-pill">
            <a
              href="#beranda"
              className="lp-brand"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <div className="lp-brand__circle">
                <img
                  src="/brand/bank-mini-symbol.png?v=2"
                  alt="Logo Bank Mini SMKN 1 Bantul"
                  className="lp-brand__logo-img"
                />
              </div>
              <div className="lp-brand__text">
                <span className="lp-brand__title">Bank Mini</span>
                <span className="lp-brand__subtitle">SMKN 1 Bantul</span>
              </div>
            </a>

            <nav className="lp-nav__links" aria-label="Navigasi Utama">
              <a
                href="#ekosistem"
                className="lp-nav__link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('ekosistem')
                }}
              >
                Tentang
              </a>
              <a
                href="#ekosistem"
                className="lp-nav__link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('ekosistem')
                }}
              >
                Fitur
              </a>
              <a
                href="#keamanan"
                className="lp-nav__link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('keamanan')
                }}
              >
                Keunggulan
              </a>
              <a
                href="#alur-layanan"
                className="lp-nav__link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('alur-layanan')
                }}
              >
                Alur Layanan
              </a>
              <button
                type="button"
                className="lp-nav__link"
                onClick={() => setGuideModalOpen(true)}
              >
                Panduan Unduh
              </button>
            </nav>

            <div className="lp-navbar__mobile-right">
              <LiveStatusIndicator variant="navbar-mobile" />
              <button
                type="button"
                className="lp-mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Right Separate Pill: Live Status + Login Button */}
          <div className="lp-navbar-right-group">
            <LiveStatusIndicator variant="navbar" />
            <button
              type="button"
              className="lp-btn-login-pill"
              onClick={onOpenLogin}
              title="Masuk ke Portal Petugas (Teller / Admin)"
            >
              <span>Login</span>
              <span className="lp-btn-login-pill__circle">
                <ArrowRight size={13} strokeWidth={2.8} />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lp-mobile-dropdown">
            <nav className="lp-mobile-dropdown__links">
              <a
                href="#ekosistem"
                className="lp-nav__link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('ekosistem')
                }}
              >
                Tentang
              </a>
              <a
                href="#ekosistem"
                className="lp-nav__link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('ekosistem')
                }}
              >
                Fitur
              </a>
              <a
                href="#kartu-digital"
                className="lp-nav__link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('kartu-digital')
                }}
              >
                Kartu Tabungan Digital
              </a>
              <a
                href="#keamanan"
                className="lp-nav__link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('keamanan')
                }}
              >
                Keunggulan
              </a>
              <a
                href="#alur-layanan"
                className="lp-nav__link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('alur-layanan')
                }}
              >
                Alur Layanan
              </a>
              <button
                type="button"
                className="lp-nav__link"
                style={{ textAlign: 'left' }}
                onClick={() => {
                  setMobileMenuOpen(false)
                  setGuideModalOpen(true)
                }}
              >
                Panduan Unduh
              </button>
            </nav>
            <div className="lp-mobile-dropdown__actions">
              <button
                type="button"
                className="lp-btn-login-pill lp-btn-login-pill--full"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenLogin()
                }}
              >
                <span>Login Portal Petugas</span>
                <span className="lp-btn-login-pill__circle">
                  <ArrowRight size={13} strokeWidth={2.8} />
                </span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* -------------------------------------------------------
       * MAIN CONTENT
       * ----------------------------------------------------- */}
      <main id="beranda">
        {/* 2. HERO SECTION */}
        <section className="lp-hero-section">
          <div className="lp-container">
            <div className="lp-hero-grid">
              {/* Left Hero Content */}
              <div className="lp-hero-content">
                <div className="lp-eyebrow-pill">
                  <span className="lp-eyebrow-dot" />
                  <span>Layanan Perbankan Digital Sekolah</span>
                </div>

                <h1 className="lp-hero-title">
                  Layanan Perbankan
                  <br />
                  Mini Digital <span className="lp-hero-title-blue">SMKN</span>
                  <br />
                  <span className="lp-hero-title-blue">1 Bantul</span>
                </h1>

                <p className="lp-hero-desc">
                  Memudahkan transaksi dan pengelolaan
                  <br />
                  keuangan sekolah dengan teknologi modern,
                  <br />
                  aman, dan terpercaya.
                </p>

                <div className="lp-hero-ctas">
                  <a
                    href={apkDownloadUrl}
                    download="BankMini-SKANSABA.apk"
                    className="lp-btn-hero-primary"
                  >
                    <div className="lp-btn-hero-icon">
                      <Download size={18} strokeWidth={2.5} />
                    </div>
                    <div className="lp-btn-hero-text">
                      <span className="lp-btn-hero-title">Unduh Aplikasi Siswa</span>
                      <span className="lp-btn-hero-sub">Akses Sekarang</span>
                    </div>
                  </a>

                  <button
                    type="button"
                    className="lp-btn-hero-secondary"
                    onClick={onOpenLogin}
                  >
                    <div className="lp-btn-play-circle" style={{ paddingLeft: 0 }}>
                      <ShieldCheck size={14} />
                    </div>
                    <span>Login ke Pengawas</span>
                  </button>
                </div>
              </div>

              {/* Right Hero 3D Phone & Floating Glass Tiles */}
              <div className="lp-hero-showcase">
                <HeroPhoneMockup />
              </div>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------
         * 3. SECTION: SATU EKOSISTEM UNTUK LAYANAN TABUNGAN SEKOLAH
         * --------------------------------------------------- */}
        <section id="ekosistem" className="lp-section">
          <div className="lp-container">
            <div className="lp-glass-card lp-ecosystem-card">
              {/* Header with Inline 3D Blue Cube inside White Orb */}
              <div className="lp-section-header">
                <div className="lp-eco-title-row">
                  <div className="lp-3d-cube-orb" aria-hidden="true">
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                      <polygon points="16,3 28,9.5 16,16 4,9.5" fill="#60a5fa" />
                      <polygon points="4,9.5 16,16 16,29 4,22.5" fill="#2563eb" />
                      <polygon points="16,16 28,9.5 28,22.5 16,29" fill="#1d4ed8" />
                      <circle cx="22" cy="19" r="2.2" fill="#93c5fd" />
                    </svg>
                  </div>
                  <h2 className="lp-section-title">
                    Satu Ekosistem untuk Layanan Tabungan
                    <br />
                    Sekolah
                  </h2>
                </div>
                <p className="lp-section-desc">
                  Mengelola transaksi, memantau saldo, dan menikmati berbagai fitur
                  <br />
                  dalam satu platform terintegrasi.
                </p>
              </div>

              {/* 2 Ecosystem Sub-Cards */}
              <div className="lp-ecosystem-grid">
                {/* Card 1: Mobile Application */}
                <div className="lp-sub-glass-card">
                  <div>
                    <div className="lp-card-tag-pill">
                      <Smartphone size={13} strokeWidth={2.3} />
                      <span>/ MOBILE APPLICATION</span>
                    </div>

                    <h3 className="lp-card-heading">Tabungan dalam Genggaman</h3>
                    <p className="lp-card-subheading">
                      Manfaatkan kemudahan akses kapan saja dan di mana saja dengan aplikasi kami.
                    </p>

                    <ul className="lp-feature-checklist">
                      <li>
                        <div className="lp-check-circle">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>Cek saldo tabungan</span>
                      </li>
                      <li>
                        <div className="lp-check-circle">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>Riwayat transaksi terbaru dan penarikan</span>
                      </li>
                      <li>
                        <div className="lp-check-circle">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>Identifikasi rekening melalui NIK / NIS</span>
                      </li>
                      <li>
                        <div className="lp-check-circle">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>Pemulihan PIN melalui admin</span>
                      </li>
                    </ul>
                  </div>

                  {/* Tilted 3D Phone + Thick 3D Blue Ribbon Ring */}
                  <div className="lp-sub-card-preview">
                    <EcoMobilePreview />
                  </div>
                </div>

                {/* Card 2: Web Application */}
                <div className="lp-sub-glass-card">
                  <div>
                    <div className="lp-card-tag-pill">
                      <Laptop size={13} strokeWidth={2.3} />
                      <span>/ WEB APPLICATION</span>
                    </div>

                    <h3 className="lp-card-heading">Pelayanan Teller yang Terorganisir</h3>
                    <p className="lp-card-subheading">
                      Mengelola transaksi dengan lebih mudah melalui website yang terintegrasi dan aman.
                    </p>

                    <ul className="lp-feature-checklist">
                      <li>
                        <div className="lp-check-circle">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>Pelayanan setoran tunai</span>
                      </li>
                      <li>
                        <div className="lp-check-circle">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>Pelayanan penarikan tunai</span>
                      </li>
                      <li>
                        <div className="lp-check-circle">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>Identifikasi kas lainnya</span>
                      </li>
                      <li>
                        <div className="lp-check-circle">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>Ekspor laporan transaksi PDF dan CSV</span>
                      </li>
                    </ul>
                  </div>

                  {/* 3D Perspective Tilted MacBook Laptop */}
                  <div className="lp-sub-card-preview">
                    <LaptopMockup />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------
         * 4. SECTION: KARTU TABUNGAN DIGITAL SISWA
         * --------------------------------------------------- */}
        <section id="kartu-digital" className="lp-section">
          <div className="lp-container">
            <div className="lp-glass-card lp-card-showcase-card">
              <div className="lp-card-showcase-grid">
                {/* Left Text */}
                <div className="lp-card-showcase-text">
                  <div className="lp-card-tag-pill">
                    <Smartphone size={13} strokeWidth={2.3} />
                    <span>/ KARTU TABUNGAN DIGITAL SISWA</span>
                  </div>

                  <h2 className="lp-card-showcase-title">
                    Identitas Rekening Siswa yang
                    <br />
                    Modern & Praktis
                  </h2>

                  <p className="lp-card-showcase-desc">
                    Setiap siswa yang terdaftar akan mendapatkan kartu rekening digital dengan
                    kode unik untuk transaksi di seluruh layanan Bank Mini.
                  </p>

                  <ul className="lp-feature-checklist" style={{ marginBottom: 0 }}>
                    <li>
                      <div className="lp-check-circle">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span>Nomor rekening unik berdasarkan sekolah</span>
                    </li>
                    <li>
                      <div className="lp-check-circle">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span>QR Code untuk verifikasi instan di hadapan teller</span>
                    </li>
                    <li>
                      <div className="lp-check-circle">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span>Dilindungi PIN transaksi & data pribadi</span>
                    </li>
                    <li>
                      <div className="lp-check-circle">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span>Tersimpan aman di portal pintar dalam aplikasi Bank Mini</span>
                    </li>
                  </ul>
                </div>

                {/* Right 3D Tilted Student Card */}
                <div className="lp-card-showcase-visual">
                  <VirtualStudentCard />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------
         * 5. SECTION: STANDAR KEAMANAN & KEPATUHAN PERBANKAN MINI
         * --------------------------------------------------- */}
        <section id="keamanan" className="lp-section">
          <div className="lp-container">
            <div className="lp-section-header lp-section-header--standalone">
              <h2 className="lp-section-title">
                Standar Keamanan & Kepatuhan Perbankan
                <br />
                Mini
              </h2>
              <p className="lp-section-desc">
                Dirancang dengan arsitektur keamanan berlapis dan kepatuhan terhadap
                <br />
                standar perbankan untuk menjaga setiap data dengan aman.
              </p>
            </div>

            <div className="lp-security-grid">
              {/* Card 1 */}
              <div className="lp-security-card">
                <div className="lp-security-orb">
                  <ShieldCheck size={20} color="#1d4ed8" strokeWidth={2.4} />
                </div>
                <h4 className="lp-security-card__title">Protokol Anti-Spam Login</h4>
                <p className="lp-security-card__desc">
                  Melindungi akun dari akses tidak sah dengan sistem keamanan berlapis.
                </p>
              </div>

              {/* Card 2 */}
              <div className="lp-security-card">
                <div className="lp-security-orb">
                  <Lock size={20} color="#1d4ed8" strokeWidth={2.4} />
                </div>
                <h4 className="lp-security-card__title">Enkripsi Secure Shield</h4>
                <p className="lp-security-card__desc">
                  Data Anda dilindungi dengan enkripsi tingkat tinggi.
                </p>
              </div>

              {/* Card 3 */}
              <div className="lp-security-card">
                <div className="lp-security-orb">
                  <Database size={20} color="#1d4ed8" strokeWidth={2.4} />
                </div>
                <h4 className="lp-security-card__title">Auto-Close Kios Loket</h4>
                <p className="lp-security-card__desc">
                  Transaksi otomatis ditutup untuk menjaga integritas data.
                </p>
              </div>

              {/* Card 4 */}
              <div className="lp-security-card">
                <div className="lp-security-orb">
                  <FileCheck2 size={20} color="#1d4ed8" strokeWidth={2.4} />
                </div>
                <h4 className="lp-security-card__title">Jurnal Akuntansi Seimbang</h4>
                <p className="lp-security-card__desc">
                  Setiap transaksi tercatat secara akurat dan seimbang.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------
         * 6. SECTION: PROSES TRANSAKSI YANG MUDAH DAN TERTIB
         * --------------------------------------------------- */}
        <section id="alur-layanan" className="lp-section">
          <div className="lp-container">
            <div className="lp-glass-card lp-process-card">
              <div className="lp-process-layout">
                {/* Left Process Steps */}
                <div className="lp-process-left">
                  <div className="lp-process-header">
                    <div className="lp-process-plane-icon" aria-hidden="true">
                      <Send size={22} color="#1d4ed8" fill="#3b82f6" />
                    </div>
                    <div>
                      <h2 className="lp-process-title">
                        Proses Transaksi yang Mudah dan Tertib
                      </h2>
                      <p className="lp-process-desc">
                        Setiap transaksi dilakukan melalui alur yang sederhana, cepat, dan aman.
                      </p>
                    </div>
                  </div>

                  <div className="lp-process-steps-row">
                    {/* Step 01 */}
                    <div className="lp-step-item">
                      <div className="lp-step-top">
                        <span className="lp-step-num-circle">01</span>
                        <Landmark size={16} color="#1d4ed8" strokeWidth={2.2} />
                      </div>
                      <div className="lp-step-name">Siswa Datang ke Loket</div>
                      <div className="lp-step-info">
                        Siswa menunjukkan PIN atau kode rekening.
                      </div>
                    </div>

                    <div className="lp-step-arrow">
                      <ChevronRight size={18} />
                    </div>

                    {/* Step 02 */}
                    <div className="lp-step-item">
                      <div className="lp-step-top">
                        <span className="lp-step-num-circle">02</span>
                        <User size={16} color="#1d4ed8" strokeWidth={2.2} />
                      </div>
                      <div className="lp-step-name">Teller Memproses Transaksi</div>
                      <div className="lp-step-info">
                        Teller memverifikasi dan memproses transaksi.
                      </div>
                    </div>

                    <div className="lp-step-arrow">
                      <ChevronRight size={18} />
                    </div>

                    {/* Step 03 */}
                    <div className="lp-step-item">
                      <div className="lp-step-top">
                        <span className="lp-step-num-circle">03</span>
                        <ShieldCheck size={16} color="#1d4ed8" strokeWidth={2.2} />
                      </div>
                      <div className="lp-step-name">Saldo Diperbarui</div>
                      <div className="lp-step-info">
                        Saldo langsung diperbarui secara real-time.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Process 3D Curved S-Receipt in Glass Basin */}
                <div className="lp-process-right">
                  <TransactionReceiptSphere />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------
         * 7. SECTION: CTA "MULAI PANTAU TABUNGANMU"
         * --------------------------------------------------- */}
        <section id="unduh" className="lp-section">
          <div className="lp-container">
            <div className="lp-cta-card">
              {/* Soft Blue Wave Hill at Bottom of CTA Card */}
              <div className="lp-cta-wave-hill" aria-hidden="true" />

              <div className="lp-cta-card__left">
                <div className="lp-cta-top-row">
                  <div className="lp-cta-star-orb" aria-hidden="true">
                    <span>★</span>
                  </div>
                  <div>
                    <h2 className="lp-cta-title">Mulai Pantau Tabunganmu</h2>
                    <p className="lp-cta-desc">
                      Akses informasi saldo dan riwayat transaksi dengan mudah melalui{' '}
                      <strong>aplikasi Bank Mini SMKN 1 Bantul.</strong>
                    </p>
                  </div>
                </div>

                <div className="lp-cta-actions">
                  <a
                    href={apkDownloadUrl}
                    download="BankMini-SKANSABA.apk"
                    className="lp-btn-cta-primary"
                  >
                    <AndroidBugdroidIcon size={17} />
                    <span>Unduh Aplikasi Android</span>
                  </a>

                  <button
                    type="button"
                    className="lp-btn-cta-link"
                    onClick={() => setGuideModalOpen(true)}
                  >
                    <BookOpen size={15} color="#2563eb" />
                    <span>Panduan Instalasi APK</span>
                  </button>
                </div>
              </div>

              {/* Right: Ultra-HD Transparent 3D Bank Mini Building */}
              <div className="lp-cta-card__right">
                <div className="lp-3d-bank-art">
                  <img
                    src="/landing/bank-3d-hd.png"
                    alt="Gedung Bank Mini SMKN 1 Bantul 3D"
                    className="lp-3d-bank-img"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------------------------------------------
       * 8. FOOTER
       * ----------------------------------------------------- */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-content">
            {/* Left Brand */}
            <div className="lp-footer-brand">
              <div className="lp-footer-logo-circle">
                <img
                  src="/brand/bank-mini-symbol.png?v=2"
                  alt="Logo Bank Mini SMKN 1 Bantul"
                  className="lp-footer-logo"
                />
              </div>
              <div>
                <div className="lp-footer-brand-title">Bank Mini</div>
                <div className="lp-footer-brand-sub">SMKN 1 Bantul</div>
              </div>
            </div>

            {/* Center Navigation Links */}
            <nav className="lp-footer-nav" aria-label="Navigasi Footer">
              <a
                href="#ekosistem"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('ekosistem')
                }}
              >
                Tentang
              </a>
              <span className="lp-footer-sep">|</span>
              <a
                href="#alur-layanan"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('alur-layanan')
                }}
              >
                Kontak
              </a>
              <span className="lp-footer-sep">|</span>
              <button
                type="button"
                className="lp-footer-link-btn"
                onClick={() => setGuideModalOpen(true)}
              >
                Panduan
              </button>
              <span className="lp-footer-sep">|</span>
              <a
                href="#keamanan"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('keamanan')
                }}
              >
                FAQ
              </a>
            </nav>

            {/* Right School Identity */}
            <div className="lp-footer-right">
              <div className="lp-footer-school-name">SMK Negeri 1 Bantul</div>
              <div className="lp-footer-school-motto">
                Mengelola Keuangan, Membangun Masa Depan
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* -------------------------------------------------------
       * MODAL PANDUAN INSTALASI APK
       * ----------------------------------------------------- */}
      {guideModalOpen && (
        <div
          className="lp-modal-backdrop"
          onClick={() => setGuideModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lp-modal__header">
              <div className="lp-modal__header-left">
                <div className="lp-modal__icon-box">
                  <Smartphone size={20} color="#2563eb" />
                </div>
                <div>
                  <h3 className="lp-modal__title">Panduan Instalasi APK Android</h3>
                  <div className="lp-modal__sub">Aplikasi Siswa Bank Mini SMKN 1 Bantul</div>
                </div>
              </div>
              <button
                type="button"
                className="lp-modal__close"
                onClick={() => setGuideModalOpen(false)}
                aria-label="Tutup panduan"
              >
                <X size={18} />
              </button>
            </div>

            <div className="lp-modal__body">
              <div className="lp-modal-step">
                <div className="lp-modal-step__num">1</div>
                <div className="lp-modal-step__content">
                  <strong>Unduh Berkas APK Resmi</strong>
                  <p>
                    Klik tombol <em>Unduh File Sekarang</em> di bawah atau di halaman utama untuk mengunduh berkas <code>BankMini-SKANSABA.apk</code>.
                  </p>
                </div>
              </div>

              <div className="lp-modal-step">
                <div className="lp-modal-step__num">2</div>
                <div className="lp-modal-step__content">
                  <strong>Buka Berkas Unduhan</strong>
                  <p>
                    Tarik bilah notifikasi ponsel atau buka aplikasi <em>File Manager</em> di folder <em>Download</em>.
                  </p>
                </div>
              </div>

              <div className="lp-modal-step">
                <div className="lp-modal-step__num">3</div>
                <div className="lp-modal-step__content">
                  <strong>Izinkan Sumber Tidak Dikenal</strong>
                  <p>
                    Jika muncul peringatan keamanan, buka <em>Pengaturan</em> dan aktifkan izin <em>Izinkan dari sumber ini</em> untuk melanjutkan.
                  </p>
                </div>
              </div>

              <div className="lp-modal-step">
                <div className="lp-modal-step__num">4</div>
                <div className="lp-modal-step__content">
                  <strong>Selesaikan Instalasi & Masuk</strong>
                  <p>
                    Pilih <em>Instal</em>. Setelah selesai, buka aplikasi dan masuk menggunakan NIS serta PIN Anda.
                  </p>
                </div>
              </div>
            </div>

            <div className="lp-modal__footer">
              <button
                type="button"
                className="lp-btn-modal-close"
                onClick={() => setGuideModalOpen(false)}
              >
                Tutup
              </button>
              <a
                href={apkDownloadUrl}
                download="BankMini-SKANSABA.apk"
                className="lp-btn-hero-primary"
                onClick={() => setGuideModalOpen(false)}
              >
                <Download size={15} />
                <span>Unduh File Sekarang</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
