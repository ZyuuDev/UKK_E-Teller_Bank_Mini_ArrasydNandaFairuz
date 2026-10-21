import './AuthLayout.css'

export default function AuthLayout({ title, description, children }) {
  return (
    <main className="bank-auth">
      <aside className="bank-auth__brand">
        <img
          src="/brand/bank-mini-full.png"
          alt="Bank Mini SMKN 1 Bantul"
          width={246}
          height={225}
        />
        <div>
          <p className="bank-auth__eyebrow">Layanan perbankan sekolah</p>
          <h2>
            Tabungan siswa,
            <br />
            dikelola dengan tertib.
          </h2>
          <p>
            Ruang kerja petugas untuk data anggota, pelayanan tabungan, dan pemeriksaan
            kas Bank Mini SMKN 1 Bantul.
          </p>
        </div>
        <small>Identitas jelas. Transaksi tercatat. Kas diperiksa.</small>
      </aside>
      <section className="bank-auth__content">
        <div className="bank-auth__form">
          <img
            className="bank-auth__mobile-logo"
            src="/brand/bank-mini-full.png"
            alt="Bank Mini SMKN 1 Bantul"
            width={132}
            height={121}
          />
          <header>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {children}
          <p className="bank-auth__footer">Bank Mini · SMKN 1 Bantul</p>
        </div>
      </section>
    </main>
  )
}