import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api, money, useResource } from './api'
import { DataTable, Modal, Notice, Pager, Status } from './ui'
import { printReport } from './printing'

export function MembersPage() {
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [credentials, setCredentials] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const list = useResource(`/admin/members?page=${page}${filter}`)
  async function save(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    setBusy(true)
    setError('')
    try {
      await api(editing ? `/admin/members/${editing.user_id}` : '/admin/members', {
        method: editing ? 'PUT' : 'POST',
        body: { ...values, graduation_year: Number(values.graduation_year) },
      })
      setEditing(null)
      form.reset()
      setMessage('Data anggota disimpan. Rekening tidak dibuat oleh tindakan ini.')
      list.refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  async function action(row, type) {
    if (
      type === 'delete' &&
      !window.confirm(`Hapus anggota ${row.full_name} yang belum memiliki rekening?`)
    )
      return
    setBusy(true)
    setError('')
    try {
      if (type === 'credentials')
        setCredentials(
          (await api(`/admin/members/${row.user_id}/credentials`, { method: 'POST' }))
            .data
        )
      if (type === 'delete')
        await api(`/admin/members/${row.user_id}`, { method: 'DELETE' })
      if (type === 'access')
        await api(`/admin/student-access/${row.user_id}`, {
          method: 'PATCH',
          body: { is_active: !row.user.is_active },
        })
      list.refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Notice>{message}</Notice>
      <Notice error>{error}</Notice>
      <section className="panel">
        <h2>{editing ? 'Perbaiki anggota' : 'Daftarkan anggota'}</h2>
        <form className="form" key={editing?.user_id || 'new'} onSubmit={save}>
          <div className="field-row">
            <label>
              Nomor siswa
              <input
                name="student_number"
                defaultValue={editing?.student_number}
                inputMode="numeric"
                pattern="[0-9]{1,20}"
                required
              />
            </label>
            <label>
              Nama lengkap
              <input
                name="full_name"
                defaultValue={editing?.full_name}
                maxLength={100}
                required
              />
            </label>
            <label>
              Tahun kelulusan
              <input
                name="graduation_year"
                type="number"
                min={2000}
                max={2200}
                defaultValue={editing?.graduation_year || ''}
                required
              />
            </label>
          </div>
          <div className="actions">
            <button disabled={busy}>Simpan anggota</button>
            {editing && (
              <button
                type="button"
                className="secondary"
                onClick={() => setEditing(null)}
              >
                Batal edit
              </button>
            )}
          </div>
        </form>
      </section>
      <section className="panel">
        <h2>Data anggota</h2>
        <form
          className="field-row"
          onSubmit={(event) => {
            event.preventDefault()
            setFilter('&' + new URLSearchParams(new FormData(event.currentTarget)))
            setPage(1)
          }}
        >
          <label>
            Cari nomor atau nama
            <input name="q" />
          </label>
          <label>
            Tahun kelulusan
            <input name="graduation_year" type="number" />
          </label>
          <label>
            Status
            <select name="account_status">
              <option value="">Semua</option>
              <option value="inactive">Belum aktif</option>
              <option value="active">Aktif</option>
            </select>
          </label>
          <button>Cari anggota</button>
        </form>
        <Notice error>{list.error}</Notice>
        {list.loading ? (
          <p role="status">Memuat anggota...</p>
        ) : (
          <DataTable
            rows={list.data?.data}
            columns={[
              ['student_number', 'Nomor siswa'],
              ['full_name', 'Nama'],
              ['graduation_year', 'Tahun lulus'],
              ['account_status', 'Rekening', 'status'],
            ]}
            actions={(row) => (
              <>
                <button className="secondary" onClick={() => setEditing(row)}>
                  Edit
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => action(row, 'credentials')}
                >
                  Terbitkan akses
                </button>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => action(row, 'access')}
                >
                  {row.user.is_active ? 'Blokir layanan' : 'Aktifkan layanan'}
                </button>
                {row.account_status === 'inactive' && (
                  <button
                    className="danger"
                    disabled={busy}
                    onClick={() => action(row, 'delete')}
                  >
                    Hapus
                  </button>
                )}
              </>
            )}
          />
        )}
        <Pager data={list.data} page={page} onChange={setPage} />
      </section>
      <Modal
        open={!!credentials}
        title="Akses sementara siswa"
        onClose={() => setCredentials(null)}
      >
        <p>
          Serahkan secara pribadi. Password ini tidak tersimpan pada halaman setelah
          ditutup.
        </p>
        <pre>
          {credentials &&
            `Username: ${credentials.username}\nPassword sementara: ${credentials.temporary_password}`}
        </pre>
      </Modal>
    </>
  )
}

export function ImportPage() {
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function upload(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setResult(null)
    try {
      setPreview(
        (
          await api('/admin/member-imports', {
            method: 'POST',
            body: new FormData(event.currentTarget),
          })
        ).data
      )
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  async function commit() {
    setBusy(true)
    setError('')
    try {
      let progress
      do {
        progress = (
          await api(`/admin/member-imports/${preview.id}/commit`, { method: 'POST' })
        ).data
        setResult(progress)
      } while (!progress.complete)
      setPreview(null)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  async function template() {
    try {
      const response = await fetch('/api/admin/member-imports/template', {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('bank-token')}` },
      })
      if (!response.ok) throw new Error('Template tidak dapat diunduh.')
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = 'student-import-template.csv'
      link.click()
      URL.revokeObjectURL(url)
    } catch (failure) {
      setError(failure.message)
    }
  }
  return (
    <section className="panel">
      <h2>Impor angkatan baru</h2>
      <p>
        Gunakan nomor siswa sebagai teks. Data ganda dilewati dan tidak mengubah saldo
        penabung.
      </p>
      <Notice error>{error}</Notice>
      <button className="secondary" onClick={template}>
        Unduh template CSV
      </button>
      <form className="form" onSubmit={upload} style={{ marginTop: 20 }}>
        <label>
          File XLSX atau CSV
          <input name="file" type="file" accept=".xlsx,.csv" required />
        </label>
        <button disabled={busy}>Periksa dan tampilkan pratinjau</button>
      </form>
      {result && (
        <Notice>
          {result.created} anggota ditambahkan, {result.skipped} dilewati,{' '}
          {result.invalid} baris perlu diperbaiki. Diproses {result.processed} dari{' '}
          {result.total}; {result.complete ? 'selesai' : 'belum selesai'}.
        </Notice>
      )}
      {preview && (
        <>
          <h2 style={{ marginTop: 28 }}>Pratinjau</h2>
          <p>
            {preview.rows.filter((row) => row.status === 'valid').length} baris valid.
            Konfirmasi berlaku 30 menit; baris invalid tidak diimpor.
          </p>
          <DataTable
            rows={preview.rows.map((row) => ({
              ...row.data,
              row: row.row,
              status: row.status,
              errors: row.errors.join(' '),
            }))}
            columns={[
              ['row', 'Baris'],
              ['student_number', 'Nomor siswa'],
              ['full_name', 'Nama'],
              ['graduation_year', 'Lulus'],
              ['status', 'Hasil', 'status'],
              ['errors', 'Perbaikan'],
            ]}
          />
          <button
            style={{ marginTop: 18 }}
            disabled={busy || !preview.rows.some((row) => row.status === 'valid')}
            onClick={commit}
          >
            {result && !result.complete
              ? 'Lanjutkan impor'
              : 'Konfirmasi impor baris valid'}
          </button>
        </>
      )}
    </section>
  )
}

export function SaversPage() {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const list = useResource(`/admin/savers?page=${page}&q=${encodeURIComponent(query)}`)
  return (
    <section className="panel">
      <h2>Rekening penabung</h2>
      <p>Rekening terbentuk melalui setoran pertama di teller.</p>
      <form
        className="actions"
        onSubmit={(event) => {
          event.preventDefault()
          setQuery(new FormData(event.currentTarget).get('q'))
          setPage(1)
        }}
      >
        <label>
          Cari rekening atau siswa
          <input name="q" />
        </label>
        <button>Cari</button>
      </form>
      <Notice error>{list.error}</Notice>
      {list.loading ? (
        <p>Memuat rekening...</p>
      ) : (
        <DataTable
          rows={list.data?.data}
          columns={[
            ['account_number', 'Rekening'],
            ['full_name', 'Nama'],
            ['graduation_year', 'Lulus'],
            ['balance', 'Saldo', 'money'],
            ['available_balance', 'Tersedia', 'money'],
          ]}
          actions={(row) => (
            <button className="secondary" onClick={() => setSelected(row)}>
              Tampilkan QR
            </button>
          )}
        />
      )}
      <Pager data={list.data} page={page} onChange={setPage} />
      <Modal
        open={!!selected}
        title="Identitas rekening"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="qr">
            <QRCodeSVG value={selected.qr_code_token} size={220} level="M" />
            <strong>{selected.full_name}</strong>
            <span>{selected.account_number}</span>
          </div>
        )}
      </Modal>
    </section>
  )
}

export function StaffPage() {
  const list = useResource('/admin/users')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function create(event) {
    event.preventDefault()
    const form = event.currentTarget
    setBusy(true)
    try {
      await api('/admin/users', {
        method: 'POST',
        body: Object.fromEntries(new FormData(form)),
      })
      form.reset()
      list.refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  async function update(row) {
    setBusy(true)
    try {
      await api(`/admin/users/${row.id}`, {
        method: 'PATCH',
        body: { name: row.name, is_active: !row.is_active },
      })
      list.refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Notice error>{error || list.error}</Notice>
      <section className="panel">
        <h2>Daftarkan petugas</h2>
        <form className="form" onSubmit={create}>
          <div className="field-row">
            <label>
              Username
              <input name="username" required />
            </label>
            <label>
              Nama
              <input name="name" required />
            </label>
            <label>
              Password sementara
              <input name="password" type="password" minLength={12} required />
            </label>
            <label>
              Peran
              <select name="role">
                <option value="teller">Teller</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <button disabled={busy}>Simpan petugas</button>
        </form>
      </section>
      <section className="panel">
        <h2>Petugas terdaftar</h2>
        {list.loading ? (
          <p>Memuat petugas...</p>
        ) : (
          <DataTable
            rows={list.data}
            columns={[
              ['username', 'Username'],
              ['name', 'Nama'],
              ['role', 'Peran'],
            ]}
            actions={(row) => (
              <button className="secondary" disabled={busy} onClick={() => update(row)}>
                {row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            )}
          />
        )}
      </section>
    </>
  )
}

export function ReportsPage({ teller = false }) {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const list = useResource(
    teller
      ? `/teller/reports?page=${page}`
      : `/admin/reconciliations?page=${page}&status=${status}`
  )
  async function review(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const values = Object.fromEntries(new FormData(event.currentTarget))
    try {
      await api(`/admin/reconciliations/${selected.id}/${values.action}`, {
        method: 'POST',
        body: { reason: values.reason },
      })
      setSelected(null)
      list.refresh()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="panel">
      <h2>{teller ? 'Laporan kas saya' : 'Pemeriksaan laporan teller'}</h2>
      <Notice error>{error || list.error}</Notice>
      {!teller && (
        <label>
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="">Semua</option>
            {['pending', 'disputed', 'approved', 'rejected'].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      )}
      {list.loading ? (
        <p>Memuat laporan...</p>
      ) : (
        <DataTable
          rows={list.data?.data}
          columns={[
            ['date', 'Tanggal'],
            ['expected_closing_balance', 'Kas sistem', 'money'],
            ['actual_cash_on_hand', 'Kas fisik', 'money'],
            ['discrepancy', 'Selisih', 'money'],
            ['status', 'Status', 'status'],
            ['rejection_reason', 'Alasan pengembalian'],
          ]}
          actions={(row) => (
            <>
              <button className="secondary" onClick={() => setSelected(row)}>
                Detail
              </button>
              <button
                className="secondary"
                disabled={!['pending', 'approved'].includes(row.status)}
                onClick={() => printReport(row)}
              >
                Cetak {row.status === 'approved' ? 'arsip' : 'draf'}
              </button>
            </>
          )}
        />
      )}
      <Pager data={list.data} page={page} onChange={setPage} />
      <Modal
        open={!!selected}
        title="Rincian laporan kas"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <p>Teller: {selected.teller?.name || `ID ${selected.teller_id}`}</p>
            <p>
              Awal {money(selected.opening_balance)}; setoran{' '}
              {money(selected.total_deposits)}; penarikan{' '}
              {money(selected.total_withdrawals)}.
            </p>
            <p>
              Kas sistem {money(selected.expected_closing_balance)}; fisik{' '}
              {money(selected.actual_cash_on_hand)}; selisih {money(selected.discrepancy)}
              .
            </p>
            <Status value={selected.status} />
            {!teller &&
              selected.cash_session_id &&
              ['pending', 'disputed'].includes(selected.status) && (
                <form className="form" onSubmit={review} style={{ marginTop: 20 }}>
                  <label>
                    Tindakan
                    <select name="action">
                      <option value="reject">Kembalikan untuk diperiksa</option>
                      <option value="approve" disabled={selected.status !== 'pending'}>
                        Setujui penyerahan kas
                      </option>
                    </select>
                  </label>
                  <label>
                    Alasan pengembalian
                    <textarea name="reason" minLength={5} />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" required />
                    Saya sudah memeriksa bukti dan kondisi kas fisik.
                  </label>
                  <button disabled={busy}>Simpan keputusan</button>
                </form>
              )}
          </>
        )}
      </Modal>
    </section>
  )
}

export function LedgerPage({ audit = false }) {
  const [page, setPage] = useState(1)
  const list = useResource(`/admin/${audit ? 'audit-logs' : 'journals'}?page=${page}`)
  const columns = audit
    ? [
        ['created_at', 'Waktu'],
        ['actor_id', 'Petugas'],
        ['action', 'Aktivitas'],
        ['subject_id', 'Referensi'],
        ['details', 'Rincian'],
      ]
    : [
        ['id', 'ID'],
        ['transaction_id', 'Transaksi'],
        ['cash_transfer_id', 'Penyerahan kas'],
        ['cash_session_id', 'Modal sesi'],
        ['account_code', 'Akun'],
        ['entry_type', 'Posisi'],
        ['amount', 'Nominal', 'money'],
      ]
  return (
    <section className="panel">
      <h2>{audit ? 'Jejak aktivitas' : 'Jurnal pembukuan'}</h2>
      <Notice error>{list.error}</Notice>
      {list.loading ? (
        <p>Memuat data...</p>
      ) : (
        <DataTable rows={list.data?.data} columns={columns} />
      )}
      <Pager data={list.data} page={page} onChange={setPage} />
    </section>
  )
}