import { useEffect, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calculator,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  FileText,
  LayoutDashboard,
  Laptop,
  Lock,
  Menu,
  QrCode,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  User,
  Wallet,
  X,
} from 'lucide-react'
import './LandingPage.css'

function AndroidBugdroidIcon({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={Math.round((size * 28) / 24)}
      viewBox="0 0 24 28"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Antennas */}
      <line
        x1="6.8"
        y1="2.2"
        x2="8.6"
        y2="5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="17.2"
        y1="2.2"
        x2="15.4"
        y2="5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Dome Head */}
      <path d="M 5 11.5 C 5 7.2 8.1 4.5 12 4.5 C 15.9 4.5 19 7.2 19 11.5 Z" />
      {/* Eyes */}
      <circle cx="9" cy="8.5" r="0.8" fill="#ffffff" />
      <circle cx="15" cy="8.5" r="0.8" fill="#ffffff" />
      {/* Torso */}
      <rect x="5" y="13" width="14" height="9.5" rx="1.5" />
      {/* Left Arm */}
      <rect x="1.8" y="13" width="2.4" height="7.5" rx="1.2" />
      {/* Right Arm */}
      <rect x="19.8" y="13" width="2.4" height="7.5" rx="1.2" />
      {/* Left Leg */}
      <rect x="7.2" y="22.5" width="2.6" height="5" rx="1.3" />
      {/* Right Leg */}
      <rect x="14.2" y="22.5" width="2.6" height="5" rx="1.3" />
    </svg>
  )
}

function StudentCounterIcon({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  )
}

function CashRegisterIcon({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Top Display Screen */}
      <rect x="7" y="3" width="10" height="5" rx="1" />
      {/* Register Body with Keypad Area */}
      <path d="M5 8h14l2 8H3l2-8z" />
      {/* Keypad Buttons */}
      <line x1="8" y1="11" x2="10" y2="11" />
      <line x1="14" y1="11" x2="16" y2="11" />
      <line x1="8" y1="13.5" x2="10" y2="13.5" />
      <line x1="14" y1="13.5" x2="16" y2="13.5" />
      {/* Cash Drawer Base */}
      <rect x="2.5" y="16" width="19" height="5" rx="1" />
      <circle cx="12" cy="18.5" r="0.8" fill="currentColor" />
    </svg>
  )
}

function VerifiedBadgeIcon({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="8 12 11 15 16 9" />
    </svg>
  )
}

function PhoneMockup() {
  return (
    <div className="lp-mockup-phone" aria-hidden="true">
      <div className="lp-mockup-phone__screen">
        <div className="lp-mockup-phone__notch" />
        <div className="lp-mockup-phone__header">
          <img
            src="/brand/bank-mini-symbol.png?v=2"
            alt="Logo Bank Mini"
            className="lp-mockup-phone__logo-img"
          />
          <div>
            <div className="lp-mockup-phone__brand-name">Bank Mini</div>
            <div className="lp-mockup-phone__brand-sub">SMKN 1 Bantul</div>
          </div>
        </div>

        <div className="lp-mockup-phone__user">
          <div className="lp-mockup-phone__avatar">AP</div>
          <div>
            <div className="lp-mockup-phone__user-name">Andi Pratama</div>
            <div className="lp-mockup-phone__user-class">XII TKJ 1</div>
          </div>
        </div>

        <div className="lp-mockup-phone__balance-card">
          <div className="lp-mockup-phone__balance-label">Saldo Tabungan</div>
          <div className="lp-mockup-phone__balance-amount">Rp 250.000</div>
          <div className="lp-mockup-phone__balance-icon">
            <Wallet size={13} />
          </div>
        </div>

        <div className="lp-mockup-phone__section-title">
          <span>Riwayat Transaksi</span>
          <span className="lp-mockup-phone__section-link">Lihat Semua &gt;</span>
        </div>

        <div className="lp-mockup-phone__tx-list">
          <div className="lp-mockup-phone__tx-item">
            <div className="lp-mockup-phone__tx-left">
              <div className="lp-mockup-phone__tx-icon lp-mockup-phone__tx-icon--in">
                <ArrowDownLeft size={11} />
              </div>
              <div>
                <div className="lp-mockup-phone__tx-title">Setoran</div>
                <div className="lp-mockup-phone__tx-date">12 Apr 2025</div>
              </div>
            </div>
            <div className="lp-mockup-phone__tx-amount lp-mockup-phone__tx-amount--in">
              + Rp 50.000
            </div>
          </div>

          <div className="lp-mockup-phone__tx-item">
            <div className="lp-mockup-phone__tx-left">
              <div className="lp-mockup-phone__tx-icon lp-mockup-phone__tx-icon--out">
                <ArrowUpRight size={11} />
              </div>
              <div>
                <div className="lp-mockup-phone__tx-title">Penarikan</div>
                <div className="lp-mockup-phone__tx-date">10 Apr 2025</div>
              </div>
            </div>
            <div className="lp-mockup-phone__tx-amount lp-mockup-phone__tx-amount--out">
              - Rp 20.000
            </div>
          </div>
        </div>

        <div className="lp-mockup-phone__qr-box">
          <QrCode size={18} className="lp-mockup-phone__qr-icon" />
          <div>
            <div className="lp-mockup-phone__qr-text">QR Rekening</div>
            <div className="lp-mockup-phone__qr-sub">Scan untuk identifikasi</div>
          </div>
        </div>

        <div className="lp-mockup-phone__bottom-nav">
          <div className="lp-mockup-phone__nav-item lp-mockup-phone__nav-item--active">
            <img
              src="/brand/bank-mini-symbol.png?v=2"
              alt=""
              style={{ width: '12px', height: '12px', objectFit: 'contain' }}
            />
            <span>Beranda</span>
          </div>
          <div className="lp-mockup-phone__nav-item">
            <FileText size={11} />
            <span>Transaksi</span>
          </div>
          <div className="lp-mockup-phone__nav-item">
            <User size={11} />
            <span>Profil</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LaptopMockup() {
  return (
    <div className="lp-mockup-laptop" aria-hidden="true">
      <div className="lp-mockup-laptop__screen">
        <div className="lp-mockup-laptop__topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="/brand/bank-mini-symbol.png?v=2"
              alt="Logo Bank Mini"
              style={{ width: '16px', height: '16px', objectFit: 'contain' }}
            />
            <span>Bank Mini SMKN 1 Bantul</span>
          </div>
          <span style={{ fontSize: '9px', opacity: 0.9 }}>Loket Teller Aktif</span>
        </div>

        <div className="lp-mockup-laptop__body">
          <div className="lp-mockup-laptop__sidebar">
            <div className="lp-mockup-laptop__nav-item">
              <LayoutDashboard size={11} />
              <span>Dashboard</span>
            </div>
            <div className="lp-mockup-laptop__nav-item lp-mockup-laptop__nav-item--active">
              <Wallet size={11} />
              <span>Transaksi</span>
            </div>
            <div className="lp-mockup-laptop__nav-item">
              <FileText size={11} />
              <span>Laporan</span>
            </div>
            <div className="lp-mockup-laptop__nav-item">
              <Settings size={11} />
              <span>Pengaturan</span>
            </div>
          </div>

          <div className="lp-mockup-laptop__main">
            <h4 className="lp-mockup-laptop__title">Transaksi Teller</h4>

            <div className="lp-mockup-laptop__tabs">
              <span className="lp-mockup-laptop__tab lp-mockup-laptop__tab--active">
                Setoran
              </span>
              <span className="lp-mockup-laptop__tab">Penarikan</span>
            </div>

            <div className="lp-mockup-laptop__form">
              <div className="lp-mockup-laptop__field">
                <span className="lp-mockup-laptop__field-label">Cari NIS Siswa</span>
                <div className="lp-mockup-laptop__field-input lp-mockup-laptop__field-input--search">
                  <span>Contoh: 12345</span>
                  <div className="lp-mockup-laptop__search-btn">
                    <Search size={9} color="#ffffff" />
                  </div>
                </div>
              </div>

              <div className="lp-mockup-laptop__field">
                <span className="lp-mockup-laptop__field-label">Nomor Rekening</span>
                <div className="lp-mockup-laptop__field-input">
                  <span style={{ color: '#64748b' }}>Pilih Siswa</span>
                  <ChevronRight size={10} color="#94a3b8" />
                </div>
              </div>

              <div className="lp-mockup-laptop__field">
                <span className="lp-mockup-laptop__field-label">Nominal</span>
                <div className="lp-mockup-laptop__field-input">
                  <span>Rp</span>
                </div>
              </div>

              <div className="lp-mockup-laptop__btn">Proses Transaksi</div>
            </div>
          </div>
        </div>
      </div>
      <div className="lp-mockup-laptop__base">
        <div className="lp-mockup-laptop__notch" />
      </div>
    </div>
  )
}

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

  const subLabel = isOpen
    ? '07:30 - 17:00 WIB'
    : isBreak
    ? 'Buka pukul 13:00 WIB'
    : 'Auto-Close 17:00 WIB'

  return (
    <div
      className={`lp-live-pill ${variant === 'hero' ? 'lp-live-pill--hero' : ''}`}
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
      <span>
        <strong>{statusLabel}</strong> • {subLabel}
      </span>
    </div>
  )
}

function SavingsGoalSimulator() {
  const PRESETS = [
    { id: 'laptop', label: 'Laptop Praktik RPL', amount: 5000000, icon: '💻' },
    { id: 'ukk', label: 'Biaya Uji Sertifikasi (UKK)', amount: 500000, icon: '🎓' },
    { id: 'modul', label: 'Paket Buku & Modul', amount: 300000, icon: '📚' },
    { id: 'custom', label: 'Target Kustom Saya', amount: 1500000, icon: '🎯' },
  ]

  const [activePreset, setActivePreset] = useState('laptop')
  const [targetAmount, setTargetAmount] = useState(5000000)
  const [contribution, setContribution] = useState(10000)
  const [freq, setFreq] = useState('daily')

  function handleSelectPreset(preset) {
    setActivePreset(preset.id)
    if (preset.id !== 'custom') {
      setTargetAmount(preset.amount)
    }
  }

  const periodsNeeded = Math.max(1, Math.ceil(targetAmount / contribution))
  const daysNeeded = freq === 'daily' ? periodsNeeded : periodsNeeded * 7

  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysNeeded)
  const formattedDate = targetDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="lp-calculator-container">
      <div className="lp-calc-controls">
        <div className="lp-calc-result-badge">
          <Calculator size={13} />
          <span>Kalkulator Impian Siswa</span>
        </div>
        <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
          Simulasi Target Menabung Siswa
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--lp-text-muted)', marginBottom: '24px' }}>
          Tentukan impian masa depanmu, atur setoran dari sisa uang saku sekolah, dan lihat estimasi kapan targetmu terwujud tanpa potongan administrasi sepeser pun.
        </p>

        <div className="lp-calc-presets">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`lp-calc-preset-btn ${activePreset === p.id ? 'lp-calc-preset-btn--active' : ''}`}
              onClick={() => handleSelectPreset(p)}
            >
              <span style={{ fontSize: '18px' }}>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        <div className="lp-calc-slider-group">
          <div className="lp-calc-slider-header">
            <span className="lp-calc-slider-title">Target Tabungan Impian</span>
            <span className="lp-calc-slider-val">Rp {targetAmount.toLocaleString('id-ID')}</span>
          </div>
          <input
            type="range"
            min="100000"
            max="10000000"
            step="50000"
            value={targetAmount}
            onChange={(e) => {
              setActivePreset('custom')
              setTargetAmount(Number(e.target.value))
            }}
            className="lp-calc-slider-range"
            aria-label="Target Tabungan Impian"
          />
        </div>

        <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--lp-text-muted)' }}>
          Frekuensi Setoran Tabungan
        </div>
        <div className="lp-calc-freq-tabs">
          <button
            type="button"
            className={`lp-calc-freq-btn ${freq === 'daily' ? 'lp-calc-freq-btn--active' : ''}`}
            onClick={() => {
              setFreq('daily')
              if (contribution > 50000) setContribution(10000)
            }}
          >
            Harian (Uang Saku)
          </button>
          <button
            type="button"
            className={`lp-calc-freq-btn ${freq === 'weekly' ? 'lp-calc-freq-btn--active' : ''}`}
            onClick={() => {
              setFreq('weekly')
              if (contribution < 20000) setContribution(50000)
            }}
          >
            Mingguan
          </button>
        </div>

        <div className="lp-calc-slider-group">
          <div className="lp-calc-slider-header">
            <span className="lp-calc-slider-title">
              {freq === 'daily' ? 'Nominal Setoran Per Hari' : 'Nominal Setoran Per Minggu'}
            </span>
            <span className="lp-calc-slider-val">Rp {contribution.toLocaleString('id-ID')}</span>
          </div>
          <input
            type="range"
            min={freq === 'daily' ? '2000' : '10000'}
            max={freq === 'daily' ? '50000' : '200000'}
            step={freq === 'daily' ? '1000' : '5000'}
            value={contribution}
            onChange={(e) => setContribution(Number(e.target.value))}
            className="lp-calc-slider-range"
            aria-label="Nominal Setoran"
          />
        </div>
      </div>

      <div className="lp-calc-result-card">
        <div className="lp-calc-result-header">
          <div className="lp-calc-result-badge">
            <TrendingUp size={14} />
            <span>Estimasi Waktu Pencapaian</span>
          </div>
          <div className="lp-calc-result-days">
            {freq === 'daily' ? `${periodsNeeded} Hari` : `${periodsNeeded} Minggu`}
          </div>
          <div className="lp-calc-result-date">
            Target impian tercapai sekitar <strong>{formattedDate}</strong> ({daysNeeded} hari kalender)
          </div>
        </div>

        <div className="lp-calc-result-features">
          <div className="lp-calc-result-feature-item">
            <Check size={16} color="#38bdf8" />
            <span>Bebas biaya administrasi bulanan (tabungan 100% utuh)</span>
          </div>
          <div className="lp-calc-result-feature-item">
            <Check size={16} color="#38bdf8" />
            <span>Setoran tunai mudah di loket kasir teller sekolah</span>
          </div>
          <div className="lp-calc-result-feature-item">
            <Check size={16} color="#38bdf8" />
            <span>Riwayat mutasi dan saldo dipantau real-time lewat ponsel</span>
          </div>
          <div className="lp-calc-result-feature-item">
            <Check size={16} color="#38bdf8" />
            <span>Bunga 0% sesuai prinsip pendidikan dan syariah</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function VirtualStudentCard() {
  return (
    <div className="lp-fintech-card">
      <div className="lp-fintech-card__shimmer" />
      <div className="lp-fintech-card__top">
        <div className="lp-fintech-card__brand">
          <img
            src="/brand/bank-mini-symbol.png?v=2"
            alt="Logo Bank Mini"
            className="lp-fintech-card__logo"
          />
          <div>
            <div className="lp-fintech-card__title">Bank Mini SKANSABA</div>
            <div className="lp-fintech-card__subtitle">Kartu Tabungan Digital Siswa</div>
          </div>
        </div>
        <div className="lp-fintech-card__qr-badge">
          <QrCode size={14} />
          <span>PASS</span>
        </div>
      </div>

      <div className="lp-fintech-card__emv">
        <div className="lp-emv-chip" />
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
          <path d="M8.5 16.5a5 5 0 0 1 0-9" />
          <path d="M12 19a9 9 0 0 1 0-14" />
          <path d="M15.5 21.5a13 13 0 0 1 0-19" />
        </svg>
      </div>

      <div className="lp-fintech-card__num">
        3302 •••• •••• 1795
      </div>

      <div className="lp-fintech-card__bottom">
        <div>
          <div className="lp-fintech-card__holder-label">Nama Pemilik Rekening</div>
          <div className="lp-fintech-card__holder-name">ARRASYD NANDA FAIRUZ</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="lp-fintech-card__holder-label">Status Tabungan</div>
          <div style={{ fontSize: '11px', color: '#86efac', fontWeight: 700 }}>
            TERVERIFIKASI AKTIF
          </div>
        </div>
      </div>
    </div>
  )
}

function InstitutionalSecuritySection() {
  const securityItems = [
    {
      icon: ShieldCheck,
      badge: 'Anti-Brute Force',
      title: 'Proteksi Anti-Spam Login',
      desc: 'Batas 5x kesalahan login berturut-turut memicu penguncian akun selama 15 menit serta pembatasan IP address untuk mencegah serangan brute force.',
    },
    {
      icon: Clock,
      badge: 'Auto-Lock 5 Menit',
      title: 'Inactivity Screen Shield',
      desc: 'Jika pengguna tidak melakukan aksi selama 5 menit (siswa) atau 10 menit (petugas), sesi otomatis terkunci demi melindungi kerahasiaan saldo rekening.',
    },
    {
      icon: Scale,
      badge: 'Batas 17:00 WIB',
      title: 'Auto-Close Kas Loket',
      desc: 'Sesi kas teller yang lupa ditutup otomatis diselesaikan sistem pada pukul 17:00 WIB dengan pencatatan fisik Rp 0 dan pengawasan supervisor.',
    },
    {
      icon: Lock,
      badge: 'Double-Entry',
      title: 'Jurnal Akuntansi Berimbang',
      desc: 'Setiap transaksi debit dan kredit wajib seimbang (balanced double-entry) tanpa toleransi selisih saldo di pembukuan sekolah.',
    },
  ]

  return (
    <div className="lp-security-grid">
      {securityItems.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.title} className="lp-security-card">
            <div className="lp-security-card__icon-box">
              <Icon size={22} />
            </div>
            <span className="lp-security-card__badge">{item.badge}</span>
            <h4 className="lp-security-card__title">{item.title}</h4>
            <p className="lp-security-card__desc">{item.desc}</p>
          </div>
        )
      })}
    </div>
  )
}

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
      {/* 1. NAVBAR */}
      <header className="lp-navbar">
        <div className="lp-container">
          <div className="lp-navbar__inner">
            <a
              href="#beranda"
              className="lp-brand"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <img
                src="/brand/bank-mini-symbol.png?v=2"
                alt="Logo Bank Mini SMKN 1 Bantul"
                className="lp-brand__logo-img"
              />
              <div className="lp-brand__text">
                <span className="lp-brand__title">Bank Mini</span>
                <span className="lp-brand__subtitle">SMKN 1 Bantul</span>
              </div>
            </a>

            <nav className="lp-nav__links" aria-label="Navigasi Utama">
              <a
                href="#tentang"
                className="lp-nav__link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('ekosistem')
                }}
              >
                Tentang
              </a>
              <a
                href="#kalkulator-impian"
                className="lp-nav__link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('kalkulator-impian')
                }}
              >
                Simulasi Impian
              </a>
              <a
                href="#kartu-digital"
                className="lp-nav__link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('kartu-digital')
                }}
              >
                Kartu Digital
              </a>
              <a
                href="#keamanan"
                className="lp-nav__link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('keamanan')
                }}
              >
                Keamanan
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
                style={{ background: 'none', border: 'none', padding: 0 }}
                onClick={() => setGuideModalOpen(true)}
              >
                Panduan Unduh
              </button>
            </nav>

            <div className="lp-nav__actions">
              <LiveStatusIndicator variant="navbar" />
              <button
                type="button"
                className="lp-btn lp-btn--outline"
                onClick={onOpenLogin}
              >
                Portal Petugas
              </button>
              <a
                href={apkDownloadUrl}
                download="BankMini-SKANSABA.apk"
                className="lp-btn lp-btn--primary"
              >
                <Download size={15} />
                <span>Unduh APK</span>
              </a>
            </div>

            <button
              type="button"
              className="lp-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '16px 24px 24px',
              borderTop: '1px solid var(--lp-border)',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <a
              href="#ekosistem"
              className="lp-nav__link"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('ekosistem')
              }}
            >
              Tentang & Ekosistem
            </a>
            <a
              href="#kalkulator-impian"
              className="lp-nav__link"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('kalkulator-impian')
              }}
            >
              Simulasi Target Menabung
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
              Standar Keamanan
            </a>
            <a
              href="#alur-layanan"
              className="lp-nav__link"
              onClick={(e) => {
                e.preventDefault()
                scrollToSection('alur-layanan')
              }}
            >
              Alur Layanan Loket
            </a>
            <button
              type="button"
              className="lp-nav__link"
              style={{
                background: 'none',
                border: 'none',
                textAlign: 'left',
                padding: 0,
              }}
              onClick={() => {
                setMobileMenuOpen(false)
                setGuideModalOpen(true)
              }}
            >
              Panduan Unduh APK
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                className="lp-btn lp-btn--outline"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenLogin()
                }}
              >
                Portal Petugas
              </button>
              <a
                href={apkDownloadUrl}
                download="BankMini-SKANSABA.apk"
                className="lp-btn lp-btn--primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Download size={16} />
                <span>Unduh APK Siswa</span>
              </a>
            </div>
          </div>
        )}
      </header>

      <main id="beranda">
        {/* 2. HERO SECTION */}
        <section className="lp-hero">
          <div className="lp-container">
            <div className="lp-hero__grid">
              <div className="lp-hero__content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <div className="lp-eyebrow" style={{ margin: 0 }}>Layanan Perbankan Digital Sekolah</div>
                  <LiveStatusIndicator variant="hero" />
                </div>

                <h1 className="lp-hero__title">
                  Layanan Perbankan Mini Digital{' '}
                  <span className="lp-hero__title-highlight">SMKN 1 Bantul</span>
                </h1>

                <p className="lp-hero__desc">
                  Membiasakan budaya menabung siswa dengan pencatatan digital yang
                  transparan, aman, dan tertib administrasi loket sekolah.
                </p>

                <div className="lp-hero__ctas">
                  <a
                    href={apkDownloadUrl}
                    download="BankMini-SKANSABA.apk"
                    className="lp-hero__cta-main"
                  >
                    <div className="lp-hero__cta-icon-box">
                      <AndroidBugdroidIcon size={24} />
                    </div>
                    <div className="lp-hero__cta-text">
                      <span className="lp-hero__cta-title">Unduh Aplikasi Siswa</span>
                      <span className="lp-hero__cta-sub">Aplikasi Android (.APK)</span>
                    </div>
                  </a>

                  <button
                    type="button"
                    className="lp-hero__cta-secondary"
                    onClick={onOpenLogin}
                  >
                    Masuk ke Portal Petugas
                  </button>
                </div>

                <div className="lp-hero__micro">
                  <div className="lp-hero__micro-item">
                    <AndroidBugdroidIcon size={16} />
                    <span>Aplikasi Android untuk siswa.</span>
                  </div>
                  <div className="lp-hero__micro-divider" />
                  <div className="lp-hero__micro-item">
                    <Laptop size={16} />
                    <span>Portal web untuk petugas.</span>
                  </div>
                </div>
              </div>

              {/* Showcase Dual Mockup */}
              <div className="lp-hero__showcase">
                <PhoneMockup />
                <LaptopMockup />
              </div>
            </div>
          </div>
        </section>

        {/* 3. SECTION: SATU EKOSISTEM */}
        <section id="ekosistem" className="lp-section">
          <div className="lp-container">
            <div className="lp-section-header">
              <h2 className="lp-section-title">
                Satu Ekosistem untuk Layanan Tabungan Sekolah
              </h2>
              <p className="lp-section-desc">
                Menghubungkan aktivitas menabung siswa dengan pelayanan transaksi dan
                administrasi petugas dalam satu sistem terintegrasi.
              </p>
            </div>

            <div className="lp-ecosystem__grid">
              {/* Card 1: Mobile App */}
              <div className="lp-card">
                <div className="lp-card__badge">01 / MOBILE APPLICATION</div>
                <h3 className="lp-card__title">Tabungan dalam Genggaman</h3>
                <p className="lp-card__desc">
                  Memberikan kemudahan bagi siswa untuk memantau informasi rekening dan
                  aktivitas tabungan.
                </p>

                <ul className="lp-card__list">
                  <li className="lp-card__item">
                    <div className="lp-check-badge">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>Cek saldo tabungan.</span>
                  </li>
                  <li className="lp-card__item">
                    <div className="lp-check-badge">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>Riwayat transaksi setoran dan penarikan.</span>
                  </li>
                  <li className="lp-card__item">
                    <div className="lp-check-badge">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>Identifikasi rekening melalui QR Code.</span>
                  </li>
                  <li className="lp-card__item">
                    <div className="lp-check-badge">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>Pemulihan PIN melalui email.</span>
                  </li>
                </ul>

                <div className="lp-card__preview">
                  <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                    <PhoneMockup />
                  </div>
                </div>
              </div>

              {/* Card 2: Web App */}
              <div className="lp-card">
                <div className="lp-card__badge">02 / WEB APPLICATION</div>
                <h3 className="lp-card__title">Pelayanan Teller yang Terorganisir</h3>
                <p className="lp-card__desc">
                  Mendukung operasional loket sekolah melalui pencatatan transaksi dan
                  pengelolaan administrasi yang terstruktur.
                </p>

                <ul className="lp-card__list">
                  <li className="lp-card__item">
                    <div className="lp-check-badge">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>Pelayanan setoran tunai.</span>
                  </li>
                  <li className="lp-card__item">
                    <div className="lp-check-badge">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>Pelayanan penarikan tunai.</span>
                  </li>
                  <li className="lp-card__item">
                    <div className="lp-check-badge">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>Rekonsiliasi kas harian.</span>
                  </li>
                  <li className="lp-card__item">
                    <div className="lp-check-badge">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>Ekspor laporan transaksi PDF dan CSV.</span>
                  </li>
                </ul>

                <div className="lp-card__preview">
                  <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
                    <LaptopMockup />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: KALKULATOR IMPIAN MENABUNG SISWA */}
        <section
          id="kalkulator-impian"
          className="lp-section"
          style={{ background: '#ffffff', borderTop: '1px solid var(--lp-border)' }}
        >
          <div className="lp-container">
            <div className="lp-section-header">
              <h2 className="lp-section-title">
                Rencanakan Impian Masa Depanmu
              </h2>
              <p className="lp-section-desc">
                Hitung estimasi waktu menabung dari sisa uang saku sekolah. Tanpa potongan biaya bulanan, tanpa bunga, dan saldo tercatat resmi di sistem kasir sekolah.
              </p>
            </div>

            <SavingsGoalSimulator />
          </div>
        </section>

        {/* SECTION: KARTU TABUNGAN DIGITAL SISWA */}
        <section id="kartu-digital" className="lp-section">
          <div className="lp-container">
            <div className="lp-card-showcase-grid">
              <div>
                <div className="lp-card__badge">KARTU TABUNGAN DIGITAL SISWA</div>
                <h2 className="lp-section-title" style={{ textAlign: 'left', marginBottom: '16px' }}>
                  Identitas Rekening Siswa yang Modern & Praktis
                </h2>
                <p className="lp-section-desc" style={{ textAlign: 'left', marginBottom: '24px' }}>
                  Setiap siswa yang terdaftar di Bank Mini SKANSABA memiliki Kartu Tabungan Digital terverifikasi lengkap dengan kode identifikasi QR unik untuk transaksi kilat di loket teller tanpa perlu antre lama.
                </p>

                <ul className="lp-card__list">
                  <li className="lp-card__item">
                    <div className="lp-check-badge">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>Nomor rekening unik berstandar perbankan sekolah.</span>
                  </li>
                  <li className="lp-card__item">
                    <div className="lp-check-badge">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>QR Code Pass untuk verifikasi instan di hadapan teller kasir.</span>
                  </li>
                  <li className="lp-card__item">
                    <div className="lp-check-badge">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>Dilindungi PIN transaksi 6 digit rahasia milik siswa.</span>
                  </li>
                  <li className="lp-card__item">
                    <div className="lp-check-badge">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span>Tersimpan aman di ponsel pintar dalam aplikasi Bank Mini.</span>
                  </li>
                </ul>
              </div>

              <div>
                <VirtualStudentCard />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: KEAMANAN & AKUNTANSI PERBANKAN */}
        <section
          id="keamanan"
          className="lp-section"
          style={{ background: '#f8fafc', borderTop: '1px solid var(--lp-border)' }}
        >
          <div className="lp-container">
            <div className="lp-section-header">
              <h2 className="lp-section-title">
                Standar Keamanan & Kepatuhan Perbankan Mini
              </h2>
              <p className="lp-section-desc">
                Dirancang dengan arsitektur keamanan bertingkat dan kepatuhan akuntansi double-entry untuk menjamin setiap rupiah uang tabungan siswa terlindungi.
              </p>
            </div>

            <InstitutionalSecuritySection />
          </div>
        </section>

        {/* 4. SECTION: ALUR TRANSAKSI */}
        <section
          id="alur-layanan"
          className="lp-section"
          style={{ background: '#ffffff', borderTop: '1px solid var(--lp-border)', borderBottom: '1px solid var(--lp-border)' }}
        >
          <div className="lp-container">
            <div className="lp-section-header">
              <h2 className="lp-section-title">
                Proses Transaksi yang Mudah dan Tertib
              </h2>
              <p className="lp-section-desc">
                Setiap transaksi dilakukan melalui pelayanan loket dengan pencatatan digital
                yang terstruktur.
              </p>
            </div>

            <div className="lp-timeline">
              {/* Step 1 */}
              <div className="lp-step-card">
                <div className="lp-step-card__top">
                  <div className="lp-step-icon">
                    <StudentCounterIcon size={24} />
                  </div>
                  <div className="lp-step-badge">01</div>
                </div>
                <h3 className="lp-step-card__title">Siswa Datang ke Loket</h3>
                <p className="lp-step-card__desc">
                  Siswa menunjukkan informasi rekening melalui buku tabungan atau QR Code.
                </p>
              </div>

              <div className="lp-timeline__arrow">
                <ChevronRight size={24} />
              </div>

              {/* Step 2 */}
              <div className="lp-step-card">
                <div className="lp-step-card__top">
                  <div className="lp-step-icon">
                    <CashRegisterIcon size={24} />
                  </div>
                  <div className="lp-step-badge">02</div>
                </div>
                <h3 className="lp-step-card__title">Teller Memproses Transaksi</h3>
                <p className="lp-step-card__desc">
                  Teller memeriksa uang fisik, memverifikasi rekening, dan memasukkan transaksi ke sistem.
                </p>
              </div>

              <div className="lp-timeline__arrow">
                <ChevronRight size={24} />
              </div>

              {/* Step 3 */}
              <div className="lp-step-card">
                <div className="lp-step-card__top">
                  <div className="lp-step-icon">
                    <VerifiedBadgeIcon size={24} />
                  </div>
                  <div className="lp-step-badge">03</div>
                </div>
                <h3 className="lp-step-card__title">Saldo Diperbarui</h3>
                <p className="lp-step-card__desc">
                  Setelah transaksi berhasil, informasi saldo dan riwayat transaksi dapat dilihat melalui aplikasi siswa.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. SECTION: DOWNLOAD CARD */}
        <section id="unduh" className="lp-section">
          <div className="lp-container">
            <div className="lp-download-card">
              <div className="lp-download-card__left">
                <h2 className="lp-download-card__title">Mulai Pantau Tabunganmu</h2>
                <p className="lp-download-card__desc">
                  Akses informasi saldo dan riwayat transaksi tabungan sekolah melalui{' '}
                  <strong style={{ color: 'var(--lp-text)' }}>
                    aplikasi Bank Mini SMKN 1 Bantul
                  </strong>
                  .
                </p>

                <div className="lp-download-card__actions">
                  <a
                    href={apkDownloadUrl}
                    download="BankMini-SKANSABA.apk"
                    className="lp-download-card__btn"
                  >
                    <AndroidBugdroidIcon size={20} />
                    <span>Unduh Aplikasi Android</span>
                  </a>

                  <button
                    type="button"
                    className="lp-download-card__guide-link"
                    onClick={() => setGuideModalOpen(true)}
                  >
                    <BookOpen size={16} />
                    <span>Panduan Instalasi APK</span>
                  </button>
                </div>
              </div>

              <div className="lp-download-card__mascot" aria-hidden="true">
                <AndroidBugdroidIcon size={140} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer__top">
            <div>
              <div className="lp-brand">
                <img
                  src="/brand/bank-mini-symbol.png?v=2"
                  alt="Logo Bank Mini SMKN 1 Bantul"
                  className="lp-brand__logo-img"
                  style={{ width: '40px', height: '40px' }}
                />
                <div className="lp-brand__text">
                  <span className="lp-brand__title" style={{ fontSize: '16px' }}>
                    Bank Mini
                  </span>
                  <span className="lp-brand__subtitle">SMKN 1 Bantul</span>
                </div>
              </div>
              <p className="lp-footer__brand-desc">
                Layanan perbankan mini digital untuk mendukung budaya menabung dan
                administrasi keuangan di lingkungan sekolah.
              </p>
            </div>

            <ul className="lp-footer__links">
              <li>
                <a
                  href="#ekosistem"
                  className="lp-footer__link"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection('ekosistem')
                  }}
                >
                  Tentang
                </a>
              </li>
              <li>
                <a
                  href="#kalkulator-impian"
                  className="lp-footer__link"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection('kalkulator-impian')
                  }}
                >
                  Simulasi Impian
                </a>
              </li>
              <li>
                <a
                  href="#kartu-digital"
                  className="lp-footer__link"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection('kartu-digital')
                  }}
                >
                  Kartu Digital
                </a>
              </li>
              <li>
                <a
                  href="#keamanan"
                  className="lp-footer__link"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection('keamanan')
                  }}
                >
                  Keamanan & Audit
                </a>
              </li>
              <li>
                <a
                  href="#alur-layanan"
                  className="lp-footer__link"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection('alur-layanan')
                  }}
                >
                  Alur Layanan
                </a>
              </li>
              <li>
                <button
                  type="button"
                  className="lp-footer__link"
                  style={{ background: 'none', border: 'none', padding: 0 }}
                  onClick={() => setGuideModalOpen(true)}
                >
                  Panduan Unduh
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="lp-footer__link"
                  style={{ background: 'none', border: 'none', padding: 0 }}
                  onClick={onOpenLogin}
                >
                  Portal Petugas
                </button>
              </li>
            </ul>

            <div className="lp-footer__school">
              <span className="lp-footer__school-name">SMK Negeri 1 Bantul</span>
              <span className="lp-footer__school-loc">
                Bantul, Daerah Istimewa Yogyakarta
              </span>
            </div>
          </div>
        </div>

        <div className="lp-footer__banner">
          Bank Mini SMKN 1 Bantul • Layanan Perbankan Digital Sekolah
        </div>
      </footer>

      {/* MODAL: PANDUAN INSTALASI APK */}
      {guideModalOpen && (
        <div
          className="lp-modal-backdrop"
          onClick={() => setGuideModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lp-modal__header">
              <h3 className="lp-modal__title">Panduan Pemasangan Aplikasi Android</h3>
              <button
                type="button"
                className="lp-modal__close"
                onClick={() => setGuideModalOpen(false)}
                aria-label="Tutup panduan"
              >
                <X size={20} />
              </button>
            </div>

            <div className="lp-modal__body">
              <p>
                Aplikasi siswa Bank Mini SMKN 1 Bantul didistribusikan dalam format APK
                resmi sekolah. Ikuti langkah mudah berikut di ponsel Android Anda:
              </p>

              <div className="lp-modal__step">
                <div className="lp-modal__step-num">1</div>
                <div>
                  <strong>Unduh File APK</strong>
                  <div>
                    Klik tombol <em>Unduh Aplikasi Siswa (.APK)</em>. Tunggu hingga proses
                    unduhan selesai di ponsel Anda.
                  </div>
                </div>
              </div>

              <div className="lp-modal__step">
                <div className="lp-modal__step-num">2</div>
                <div>
                  <strong>Buka File Unduhan</strong>
                  <div>
                    Buka notifikasi unduhan atau cari file <code>BankMini-SKANSABA.apk</code>{' '}
                    di folder <em>Download</em> pada pengelola berkas ponsel.
                  </div>
                </div>
              </div>

              <div className="lp-modal__step">
                <div className="lp-modal__step-num">3</div>
                <div>
                  <strong>Izinkan Sumber Tidak Dikenal</strong>
                  <div>
                    Jika muncul konfirmasi keamanan ponsel, pilih <em>Pengaturan</em> dan
                    aktifkan opsi <em>Izinkan pemasangan aplikasi dari sumber ini</em>.
                  </div>
                </div>
              </div>

              <div className="lp-modal__step">
                <div className="lp-modal__step-num">4</div>
                <div>
                  <strong>Selesaikan Pemasangan & Masuk</strong>
                  <div>
                    Pilih <em>Instal</em>. Setelah selesai, buka aplikasi dan masuk
                    menggunakan Nomor Induk Siswa (NIS) serta password akun Anda.
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-modal__footer">
              <a
                href={apkDownloadUrl}
                download="BankMini-SKANSABA.apk"
                className="lp-btn lp-btn--primary"
                onClick={() => setGuideModalOpen(false)}
              >
                <Download size={16} />
                <span>Unduh File Sekarang</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
