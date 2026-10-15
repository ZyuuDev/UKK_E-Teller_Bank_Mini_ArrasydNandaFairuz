import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function QrScanner({ onResult }) {
  const id = 'qr' + useId().replaceAll(':', '')
  const callback = useRef(onResult)
  const [mode, setMode] = useState('manual')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    callback.current = onResult
  }, [onResult])
  useEffect(() => {
    if (mode !== 'camera') return undefined
    let disposed = false
    let accepted = false
    let scanner
    async function start() {
      await Promise.resolve()
      if (disposed) return
      scanner = new Html5Qrcode(id)
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 220 },
          (value) => {
            if (disposed || accepted) return
            accepted = true
            callback.current(value)
            setMode('manual')
          },
          () => undefined
        )
        if (disposed) await scanner.stop()
      } catch (failure) {
        if (!disposed)
          setError(
            `Kamera belum dapat digunakan. Pilih unggah gambar atau manual. ${String(failure)}`
          )
      }
    }
    start()
    return () => {
      disposed = true
      if (scanner?.isScanning)
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => undefined)
    }
  }, [mode, id])
  async function upload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    const scanner = new Html5Qrcode(id)
    try {
      callback.current(await scanner.scanFile(file, false))
    } catch {
      setError('QR tidak terbaca. Pilih gambar yang jelas atau gunakan nomor rekening.')
    } finally {
      scanner.clear()
      setBusy(false)
    }
  }
  return (
    <section style={{ marginTop: 16 }}>
      <div className="actions">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setError('')
            setMode('camera')
          }}
        >
          Kamera
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setError('')
            setMode('upload')
          }}
        >
          Unggah QR
        </button>
        <button type="button" className="secondary" onClick={() => setMode('manual')}>
          Hentikan kamera
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <div id={id} style={{ marginTop: 16 }} />
      {mode === 'upload' && (
        <label>
          Pilih gambar QR
          <input type="file" accept="image/*" disabled={busy} onChange={upload} />
        </label>
      )}
      {mode === 'manual' && (
        <p>Gunakan kolom pencarian nomor siswa atau rekening pada halaman pelayanan.</p>
      )}
    </section>
  )
}