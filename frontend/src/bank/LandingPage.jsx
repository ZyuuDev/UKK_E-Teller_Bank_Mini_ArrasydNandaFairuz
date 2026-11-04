import { useState } from 'react'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Download,
  FileText,
  LayoutDashboard,
  Laptop,
  Menu,
  QrCode,
  Search,
  Settings,
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
                href="#fitur-siswa"
                className="lp-nav__link"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('ekosistem')
                }}
              >
                Fitur Siswa
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
              Tentang & Fitur Siswa
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
                <div className="lp-eyebrow">Layanan Perbankan Digital Sekolah</div>

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
                  href="#ekosistem"
                  className="lp-footer__link"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToSection('ekosistem')
                  }}
                >
                  Fitur Siswa
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
