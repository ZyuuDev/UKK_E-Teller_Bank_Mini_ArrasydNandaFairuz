import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, Upload, Keyboard } from 'lucide-react'

export default function QrScanner({ onResult }) {
  const [mode, setMode]          = useState('manual')
  const [manualInput, setManual] = useState('')
  const [scanning, setScanning]  = useState(false)
  const html5QrRef = useRef(null)

  //mulai scan via webcam
  const startWebcam = async () => {
    if (!html5QrRef.current) {
      html5QrRef.current = new Html5Qrcode('qr-reader')
    }
    setScanning(true)
    try {
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },          
        (decodedText) => {
          onResult(decodedText)
          stopWebcam()
        },
        () => {}
      )
    } catch {
      alert('Tidak bisa akses kamera. Gunakan tab Upload atau Manual.')
      setScanning(false)
    }
  }

  const stopWebcam = async () => {
    if (html5QrRef.current && scanning) {
      await html5QrRef.current.stop()
      setScanning(false)
    }
  }

  //hentikan kamera saat pindah ke mode lain, nyalakan saat masuk mode webcam
  useEffect(() => {
    if (mode !== 'webcam') stopWebcam()
    if (mode === 'webcam') startWebcam()
    return () => { stopWebcam() }
  }, [mode])

  // Handler upload gambar QR
  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    //scanner terpisah khusus untuk scan file
    const scanner = new Html5Qrcode('qr-reader-hidden')
    try {
      const result = await scanner.scanFile(file, true)
      onResult(result)
    } catch {
      alert('QR Code tidak terbaca dari gambar. Coba foto yang lebih jelas.')
    }
  }

  const tabs = [
    { id: 'webcam', label: 'Kamera',  icon: Camera   },
    { id: 'upload', label: 'Upload',  icon: Upload   },
    { id: 'manual', label: 'Manual',  icon: Keyboard },
  ]

  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
      {/*tombol tab pemilih mode */}
      <div className="flex gap-2 mb-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              mode === id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/*konten berubah sesuai mode yang aktif */}
      {mode === 'webcam' && (
        <div>
          <div id="qr-reader" className="w-full rounded-xl overflow-hidden" style={{ minHeight: 250 }} />
          {scanning && (
            <p className="text-center text-slate-400 text-sm mt-2 animate-pulse">
              Arahkan QR Code ke kamera...
            </p>
          )}
        </div>
      )}

      {mode === 'upload' && (
        <div className="text-center">
          {/*div tersembunyi untuk scanner file*/}
          <div id="qr-reader-hidden" style={{ display: 'none' }} />
          <label className="cursor-pointer flex flex-col items-center gap-3 p-8 border-2 border-dashed border-slate-600 rounded-xl hover:border-blue-500 transition">
            <Upload size={32} className="text-slate-400" />
            <span className="text-slate-400">Klik untuk upload foto QR Code nasabah</span>
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      )}

      {mode === 'manual' && (
        <div className="flex gap-3">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Nomor rekening (BMS-2026-XXXX)"
            className="flex-1 px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
            //langsung cari
            onKeyDown={(e) => e.key === 'Enter' && manualInput && onResult(manualInput)}
          />
          <button
            onClick={() => { if (manualInput) { onResult(manualInput); setManual('') } }}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
          >
            Cari
          </button>
        </div>
      )}
    </div>
  )
}