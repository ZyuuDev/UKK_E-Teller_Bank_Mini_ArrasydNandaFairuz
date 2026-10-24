import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button, Notice } from '../bank/ui'

async function release(scanner) {
  if (!scanner) return
  try {
    if (scanner.isScanning) await scanner.stop()
  } catch {
    /* kamera mungkin sudah berhenti */
  }
  try {
    scanner.clear()
  } catch {
    /* wadah mungkin sudah dilepas */
  }
}

export default function QrScanner({ onResult, autoStart = false }) {
  const id = `bank-qr-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const callback = useRef(onResult)
  const operations = useRef(Promise.resolve())
  const mounted = useRef(false)
  const [mode, setMode] = useState(autoStart ? 'camera' : 'manual')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    callback.current = onResult
  }, [onResult])
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    if (mode !== 'camera') return undefined
    let disposed = false
    let accepted = false
    let scanner
    operations.current = operations.current
      .catch(() => undefined)
      .then(async () => {
        if (disposed) return
        scanner = new Html5Qrcode(id)
        try {
          await scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            (value) => {
              if (disposed || accepted) return
              accepted = true
              setMode('manual')
              callback.current(value)
            },
            () => undefined,
          )
        } catch {
          await release(scanner)
          if (!disposed)
            setError(
              'Kamera belum tersedia. Izinkan akses kamera pada browser, gunakan HTTPS/localhost, atau pilih unggah QR.',
            )
        }
      })
    return () => {
      disposed = true
      // Tunggu start selesai, termasuk bila dialog izin baru dijawab setelah modal ditutup.
      operations.current = operations.current
        .catch(() => undefined)
        .then(() => release(scanner))
    }
  }, [mode, id])

  function upload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || busy) return
    setBusy(true)
    setError('')
    operations.current = operations.current
      .catch(() => undefined)
      .then(async () => {
        if (!mounted.current) return
        const scanner = new Html5Qrcode(id)
        try {
          const value = await scanner.scanFile(file, false)
          if (mounted.current) callback.current(value)
        } catch {
          if (mounted.current)
            setError(
              'QR tidak terbaca. Pilih gambar yang jelas atau tutup pemindai untuk memasukkan nomor siswa/rekening.',
            )
        } finally {
          await release(scanner)
          if (mounted.current) setBusy(false)
        }
      })
  }

  return (
    <section className="revision-scanner" aria-label="Pemindai identitas rekening">
      <div className="revision-scanner__controls">
        <Button
          disabled={busy || mode === 'camera'}
          onClick={() => {
            setError('')
            setMode('camera')
          }}
        >
          Gunakan kamera
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setError('')
            setMode('upload')
          }}
        >
          Unggah QR
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => setMode('manual')}>
          Hentikan kamera
        </Button>
      </div>
      <Notice error>{error}</Notice>
      <div id={id} className="revision-gap" />
      {mode === 'upload' && (
        <label className="bank-field">
          Pilih gambar QR rekening
          <input type="file" accept="image/*" disabled={busy} onChange={upload} />
        </label>
      )}
      {mode === 'manual' && (
        <p>
          Kamera dihentikan. Tutup pemindai untuk menggunakan pencarian nomor siswa atau
          nomor rekening.
        </p>
      )}
      {busy && <p role="status">Membaca gambar QR…</p>}
    </section>
  )
}