import { useState } from 'react'
import { api, getToken, setToken } from '../api'
import { Button, DataTable, FormField, Input, Notice, PageHeader, StatCard } from '../ui'

export default function ImportPage() {
  const [preview, setPreview] = useState(null)
  const [progress, setProgress] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [started, setStarted] = useState(false)
  const [expired, setExpired] = useState(false)
  const [busy, setBusy] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const step = progress?.complete ? 3 : preview ? 2 : 1
  async function upload(event) {
    event.preventDefault()
    const file = new FormData(event.currentTarget).get('file')
    if (!file || file.size > 5 * 1024 * 1024) {
      setError('Pilih file maksimal 5 MB.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      setPreview((await api('/admin/member-imports', { method: 'POST', body })).data)
      setProgress(null)
      setConfirmed(false)
      setStarted(false)
      setExpired(false)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }
  async function commit() {
    setBusy(true)
    setError('')
    setStarted(true)
    try {
      let result
      do {
        result = (
          await api(`/admin/member-imports/${preview.id}/commit`, { method: 'POST' })
        ).data
        setProgress(result)
      } while (!result.complete)
    } catch (failure) {
      const previewExpired =
        failure.status === 422 && failure.message.includes('Pratinjau kedaluwarsa')
      setExpired(previewExpired)
      setError(
        previewExpired
          ? failure.message
          : `${failure.message} Pratinjau dan hasil batch sebelumnya tetap tersedia. Lanjutkan memakai impor yang sama.`,
      )
    } finally {
      setBusy(false)
    }
  }
  async function template() {
    setDownloading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/member-imports/template', {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: 'text/csv' },
        cache: 'no-store',
      })
      if (response.status === 401) {
        setToken(null)
        window.dispatchEvent(new Event('bank-auth-expired'))
      }
      if (!response.ok)
        throw new Error('Template tidak dapat diunduh. Periksa sesi dan koneksi.')
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = 'student-import-template.csv'
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setDownloading(false)
    }
  }
  return (
    <>
      <PageHeader
        title="Impor siswa"
        description="Unggah, periksa setiap baris, kemudian konfirmasi data yang valid."
      />
      <ol className="admin-steps" aria-label="Tahap impor">
        {['Upload file', 'Pratinjau dan konfirmasi', 'Hasil pemrosesan'].map(
          (label, index) => (
            <li key={label} aria-current={step === index + 1 ? 'step' : undefined}>
              <span>{index + 1}</span>
              {label}
            </li>
          ),
        )}
      </ol>
      <Notice error>{error}</Notice>
      {step === 1 && (
        <section className="bank-panel">
          <h2>1. Upload file</h2>
          <p>
            CSV UTF-8 atau XLSX, maksimal 5 MB dan 2.000 baris. Untuk XLSX gunakan lembar
            pertama tanpa formula. Simpan nomor siswa sebagai teks.
          </p>
          <Button variant="secondary" busy={downloading} onClick={template}>
            Unduh template CSV
          </Button>
          <form className="bank-form admin-upload" onSubmit={upload}>
            <FormField
              label="Pilih file CSV atau XLSX"
              hint="Kolom: student_number, full_name, graduation_year."
            >
              <Input
                name="file"
                type="file"
                accept=".csv,.xlsx"
                required
                disabled={busy}
              />
            </FormField>
            <Button type="submit" busy={busy}>
              Periksa file
            </Button>
          </form>
        </section>
      )}
      {preview && !progress?.complete && (
        <section className="bank-panel">
          <h2>2. Periksa dan konfirmasi</h2>
          <p>
            Pratinjau berlaku {preview.expires_in_minutes ?? 30} menit. Duplikat dilewati;
            baris invalid perlu diperbaiki pada file sumber.
          </p>
          <div className="bank-stats">
            {[
              ['valid', 'Baris valid'],
              ['duplicate', 'Duplikat'],
              ['invalid', 'Baris invalid'],
            ].map(([status, label]) => (
              <StatCard
                key={status}
                label={label}
                value={preview.rows.filter((row) => row.status === status).length}
              />
            ))}
          </div>
          <DataTable
            caption="Hasil validasi impor"
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
              ['graduation_year', 'Tahun lulus'],
              ['status', 'Hasil', 'status'],
              ['errors', 'Detail kesalahan'],
            ]}
          />
          <label className="bank-checkbox admin-footnote">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={busy || started}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            Saya sudah memeriksa isi file dan menyetujui impor baris yang valid.
          </label>
          <div className="bank-actions admin-footnote">
            <Button
              disabled={
                expired ||
                !confirmed ||
                !preview.rows.some((row) => row.status === 'valid')
              }
              busy={busy}
              onClick={commit}
            >
              {started ? 'Lanjutkan impor yang sama' : 'Konfirmasi dan mulai impor'}
            </Button>
            {(!started || expired) && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setPreview(null)
                  setError('')
                }}
              >
                Pilih file lain
              </Button>
            )}
          </div>
          <p className="admin-footnote muted">
            Jangan berpindah menu atau menutup tab selama batch diproses. Setelah
            gangguan, gunakan tombol lanjutkan pada halaman ini.
          </p>
        </section>
      )}
      {progress && (
        <section className="bank-panel">
          <h2>{progress.complete ? '3. Impor selesai' : 'Progres impor'}</h2>
          <p role="status">
            Diproses {progress.processed} dari {progress.total} baris;{' '}
            {progress.complete ? 'selesai' : 'belum selesai'}.
          </p>
          <progress
            max={Math.max(progress.total, 1)}
            value={progress.processed}
            aria-label="Progres baris impor"
          />
          <dl className="bank-detail-list">
            <div className="bank-detail-row">
              <dt>Anggota ditambahkan</dt>
              <dd>{progress.created}</dd>
            </div>
            <div className="bank-detail-row">
              <dt>Dilewati</dt>
              <dd>{progress.skipped}</dd>
            </div>
            <div className="bank-detail-row">
              <dt>Invalid</dt>
              <dd>{progress.invalid}</dd>
            </div>
          </dl>
          {progress.complete && (
            <Button
              onClick={() => {
                setPreview(null)
                setProgress(null)
                setConfirmed(false)
                setStarted(false)
                setError('')
              }}
            >
              Impor file berikutnya
            </Button>
          )}
        </section>
      )}
    </>
  )
}