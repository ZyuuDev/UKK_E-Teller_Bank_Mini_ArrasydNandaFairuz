import { ArrowLeft, CheckCircle2, Landmark, ShieldCheck, Sparkles } from 'lucide-react'
import './AuthLayout.css'

export default function AuthLayout({ title, description, children, onBack }) {
  return (
    <div className="bank-auth-page">
      {/* 1. Latar Belakang Gradasi & Suasana 3D Selaras Landing Page */}
      <div className="bank-auth-bg-scene" aria-hidden="true">
        <div className="bank-auth-bg-overlay" />
        <div className="bank-auth-bokeh bank-auth-bokeh--top-left" />
        <div className="bank-auth-bokeh bank-auth-bokeh--bottom-right" />
      </div>

      {/* 2. Top Nav Bar Melayang (Pill Glass) */}
      <header className="bank-auth-nav">
        <div className="bank-auth-nav__inner">
          {onBack ? (
            <button
              type="button"
              className="bank-auth-back-btn"
              onClick={onBack}
              title="Kembali ke Halaman Utama"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Beranda</span>
            </button>
          ) : (
            <div className="bank-auth-nav__brand">
              <div className="bank-auth-nav__logo-circle">
                <Landmark size={14} />
              </div>
              <span>Bank Mini SMKN 1 Bantul</span>
            </div>
          )}

          <div className="bank-auth-nav__badge">
            <span className="bank-auth-nav__dot" />
            <span>Sistem Operasional Aktif</span>
          </div>
        </div>
      </header>

      {/* 3. Kontainer Utama Glassmorphism */}
      <main className="bank-auth-main">
        <div className="bank-auth-card">
          {/* Kolom Kiri: Branding & Nilai Keunggulan */}
          <aside className="bank-auth__brand">
            <div className="bank-auth__brand-header">
              <img
                src="/brand/bank-mini-full.png?v=2"
                alt="Bank Mini SMKN 1 Bantul"
                className="bank-auth__brand-logo"
                width={190}
                height={174}
              />
              <div className="bank-auth__eyebrow-pill">
                <Sparkles size={13} />
                <span>Portal Petugas & Loket</span>
              </div>
            </div>

            <div className="bank-auth__brand-body">
              <h2>
                Tabungan Siswa,
                <br />
                Dikelola Lebih <span className="bank-auth__highlight">Modern</span> & Tertib.
              </h2>
              <p>
                Ruang kerja terpadu petugas untuk tata kelola nasabah, transaksi loket
                teller, dan rekonsiliasi kas Bank Mini SMKN 1 Bantul.
              </p>

              {/* Fitur Utama (Pill Glass) */}
              <div className="bank-auth__features">
                <div className="bank-auth__feature-item">
                  <CheckCircle2 size={16} className="bank-auth__feature-icon" />
                  <span>Layanan loket cepat & cetak bukti transaksi</span>
                </div>
                <div className="bank-auth__feature-item">
                  <ShieldCheck size={16} className="bank-auth__feature-icon" />
                  <span>Keamanan sandi, PIN transaksi, & audit kas</span>
                </div>
                <div className="bank-auth__feature-item">
                  <Landmark size={16} className="bank-auth__feature-icon" />
                  <span>Terhubung langsung dengan aplikasi HP siswa</span>
                </div>
              </div>
            </div>

            <div className="bank-auth__brand-footer">
              <small>Identitas Jelas · Transaksi Tercatat · Kas Terperiksa</small>
            </div>
          </aside>

          {/* Kolom Kanan: Formulir Autentikasi */}
          <section className="bank-auth__content">
            <div className="bank-auth__form-card">
              <header className="bank-auth__form-header">
                <div className="bank-auth__form-logo-wrap">
                  <img
                    src="/brand/bank-mini-full.png?v=2"
                    alt="Bank Mini SMKN 1 Bantul"
                    className="bank-auth__form-logo"
                    width={160}
                    height={147}
                  />
                </div>
                <h1>{title}</h1>
                <p>{description}</p>
              </header>

              <div className="bank-auth__form-body">
                {children}
              </div>

              <footer className="bank-auth__form-footer">
                <p>© {new Date().getFullYear()} Bank Mini · SMK Negeri 1 Bantul</p>
              </footer>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
