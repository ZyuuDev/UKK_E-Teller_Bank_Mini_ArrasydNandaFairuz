import { useEffect, useMemo, useState } from 'react'
import {
  Banknote,
  Calculator,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  Minus,
  Plus,
  RotateCcw,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { money } from './api'
import { Button, Modal, toast } from './ui'
import './cash-calculator.css'

export const DENOMINATIONS = [
  // Uang Kertas (Rupiah Emisi Terbaru & Beredar)
  { id: 'k100k', value: 100000, label: 'Rp 100.000', category: 'kertas', unit: 'lembar', badgeClass: 'cash-denom-badge--100k' },
  { id: 'k50k',  value: 50000,  label: 'Rp 50.000',  category: 'kertas', unit: 'lembar', badgeClass: 'cash-denom-badge--50k' },
  { id: 'k20k',  value: 20000,  label: 'Rp 20.000',  category: 'kertas', unit: 'lembar', badgeClass: 'cash-denom-badge--20k' },
  { id: 'k10k',  value: 10000,  label: 'Rp 10.000',  category: 'kertas', unit: 'lembar', badgeClass: 'cash-denom-badge--10k' },
  { id: 'k5k',   value: 5000,   label: 'Rp 5.000',   category: 'kertas', unit: 'lembar', badgeClass: 'cash-denom-badge--5k' },
  { id: 'k2k',   value: 2000,   label: 'Rp 2.000',   category: 'kertas', unit: 'lembar', badgeClass: 'cash-denom-badge--2k' },
  { id: 'k1k',   value: 1000,   label: 'Rp 1.000',   category: 'kertas', unit: 'lembar', badgeClass: 'cash-denom-badge--1k' },
  // Uang Logam (Koin)
  { id: 'c1k',   value: 1000,   label: 'Rp 1.000',   category: 'logam',  unit: 'keping', badgeClass: 'cash-denom-badge--coin' },
  { id: 'c500',  value: 500,    label: 'Rp 500',     category: 'logam',  unit: 'keping', badgeClass: 'cash-denom-badge--coin' },
  { id: 'c200',  value: 200,    label: 'Rp 200',     category: 'logam',  unit: 'keping', badgeClass: 'cash-denom-badge--coin' },
  { id: 'c100',  value: 100,    label: 'Rp 100',     category: 'logam',  unit: 'keping', badgeClass: 'cash-denom-badge--coin' },
]

export function formatBreakdownText(counts, expectedAmount = null, tellerName = '') {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeStr = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const lines = []
  lines.push('================================================')
  lines.push(' BANK MINI SMKN 1 BANTUL')
  lines.push(' SLIP HITUNGAN FISIK KASIR / TELLER CLOSING')
  lines.push(` Tanggal : ${dateStr} ${timeStr} WIB`)
  if (tellerName) lines.push(` Teller  : ${tellerName}`)
  lines.push('================================================')
  lines.push('')
  lines.push('[ UANG KERTAS ]')
  let kertasTotal = 0
  let kertasSheets = 0
  DENOMINATIONS.filter((d) => d.category === 'kertas').forEach((d) => {
    const qty = Number(counts[d.id] || 0)
    if (qty > 0) {
      const sub = qty * d.value
      kertasTotal += sub
      kertasSheets += qty
      lines.push(` • ${d.label.padEnd(10)} x ${String(qty).padStart(4)} lembar = ${money(sub)}`)
    }
  })
  if (kertasSheets === 0) lines.push(' (Tidak ada uang kertas yang dihitung)')
  lines.push(` Subtotal Kertas : ${money(kertasTotal)} (${kertasSheets} lembar)`)
  lines.push('')

  lines.push('[ UANG LOGAM / KOIN ]')
  let logamTotal = 0
  let logamCoins = 0
  DENOMINATIONS.filter((d) => d.category === 'logam').forEach((d) => {
    const qty = Number(counts[d.id] || 0)
    if (qty > 0) {
      const sub = qty * d.value
      logamTotal += sub
      logamCoins += qty
      lines.push(` • ${d.label.padEnd(10)} x ${String(qty).padStart(4)} keping = ${money(sub)}`)
    }
  })
  if (logamCoins === 0) lines.push(' (Tidak ada uang logam yang dihitung)')
  lines.push(` Subtotal Logam  : ${money(logamTotal)} (${logamCoins} keping)`)
  lines.push('')
  lines.push('------------------------------------------------')
  const grandTotal = kertasTotal + logamTotal
  lines.push(` TOTAL KAS FISIK DI LACI : ${money(grandTotal)}`)
  if (expectedAmount != null && Number.isFinite(Number(expectedAmount))) {
    const exp = Number(expectedAmount)
    const diff = grandTotal - exp
    lines.push(` PATOKAN KAS SISTEM      : ${money(exp)}`)
    if (diff === 0) {
      lines.push(` STATUS REKONSILIASI     : SEIMBANG / PAS (Selisih Rp 0)`)
    } else if (diff > 0) {
      lines.push(` STATUS REKONSILIASI     : LEBIH KAS (+${money(diff)})`)
    } else {
      lines.push(` STATUS REKONSILIASI     : KURANG KAS (-${money(Math.abs(diff))})`)
    }
  }
  lines.push('================================================')
  return lines.join('\n')
}

export function CashDenominationCalculator({
  value,
  onChange,
  expectedAmount = null,
  storageKey = 'bank_cash_counts_session',
  className = '',
  compact = false,
  showTitle = true,
  onReset,
}) {
  const [counts, setCounts] = useState(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const saved = sessionStorage.getItem(storageKey)
        if (saved) return JSON.parse(saved)
      } catch (err) {
        console.warn('Gagal membaca saved counts:', err)
      }
    }
    return {}
  })

  const [copied, setCopied] = useState(false)

  // Subtotal per category and Grand Total calculation
  const { kertasTotal, logamTotal, kertasSheets, logamCoins, grandTotal } = useMemo(() => {
    let kt = 0
    let lt = 0
    let ks = 0
    let lc = 0
    DENOMINATIONS.forEach((d) => {
      const count = Math.max(0, parseInt(counts[d.id], 10) || 0)
      const sub = count * d.value
      if (d.category === 'kertas') {
        kt += sub
        ks += count
      } else {
        lt += sub
        lc += count
      }
    })
    return {
      kertasTotal: kt,
      logamTotal: lt,
      kertasSheets: ks,
      logamCoins: lc,
      grandTotal: kt + lt,
    }
  }, [counts])

  // Sync to parent onChange whenever counts change
  useEffect(() => {
    if (onChange) {
      onChange(grandTotal, counts)
    }
    if (typeof window !== 'undefined' && storageKey) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(counts))
      } catch (err) {
        console.warn('Gagal menyimpan counts ke sessionStorage:', err)
      }
    }
  }, [counts, grandTotal, onChange, storageKey])

  function handleCountChange(id, newCount) {
    const parsed = newCount === '' ? '' : Math.max(0, parseInt(newCount, 10) || 0)
    setCounts((prev) => ({
      ...prev,
      [id]: parsed,
    }))
  }

  function handleStep(id, delta) {
    const current = Math.max(0, parseInt(counts[id], 10) || 0)
    const next = Math.max(0, current + delta)
    handleCountChange(id, next === 0 ? '' : next)
  }

  function handleReset() {
    setCounts({})
    if (typeof window !== 'undefined' && storageKey) {
      try {
        sessionStorage.removeItem(storageKey)
      } catch {}
    }
    if (onReset) onReset()
    toast.info('Hitungan pecahan kas telah dikosongkan.')
  }

  async function handleCopy() {
    const text = formatBreakdownText(counts, expectedAmount)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      toast.success('Rincian fisik kas berhasil disalin ke clipboard!')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Gagal menyalin rincian kas ke clipboard.')
    }
  }

  // Calculate discrepancy vs expected
  const hasExpected = expectedAmount !== null && Number.isFinite(Number(expectedAmount))
  const expectedNum = hasExpected ? Number(expectedAmount) : 0
  const diff = grandTotal - expectedNum

  return (
    <div className={`cash-calc ${className}`}>
      {showTitle && (
        <div className="cash-calc__header">
          <div className="cash-calc__title-group">
            <span className="cash-calc__icon-badge" aria-hidden="true">
              <Calculator size={20} />
            </span>
            <div>
              <h3 className="cash-calc__title">Kalkulator Pecahan Uang Fisik</h3>
              <p className="cash-calc__subtitle">
                Hitung uang kas laci teller berdasarkan lembar dan keping pecahan Rupiah.
              </p>
            </div>
          </div>
          <div className="cash-calc__actions">
            <Button
              variant="secondary"
              type="button"
              onClick={handleCopy}
              title="Salin rincian fisik ke clipboard"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Tersalin' : 'Salin Rincian'}</span>
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={handleReset}
              disabled={grandTotal === 0 && Object.keys(counts).length === 0}
              title="Reset semua hitungan ke 0"
            >
              <RotateCcw size={16} />
              <span>Reset</span>
            </Button>
          </div>
        </div>
      )}

      {/* Discrepancy Radar if expected amount is provided */}
      {hasExpected && (
        <div
          className={`cash-calc__radar ${
            diff === 0
              ? 'cash-calc__radar--balanced'
              : diff > 0
              ? 'cash-calc__radar--surplus'
              : 'cash-calc__radar--shortage'
          }`}
          role="status"
        >
          <div className="cash-calc__radar-info">
            <span className="cash-calc__radar-icon">
              {diff === 0 ? (
                <CheckCircle2 size={20} />
              ) : diff > 0 ? (
                <TrendingUp size={20} />
              ) : (
                <TrendingDown size={20} />
              )}
            </span>
            <div className="cash-calc__radar-text">
              <strong>
                {diff === 0
                  ? 'Kas Fisik Seimbang Sempurna'
                  : diff > 0
                  ? 'Terdapat Selisih Lebih (Surplus Kas)'
                  : 'Terdapat Selisih Kurang (Defisit Kas)'}
              </strong>
              <span>
                {diff === 0
                  ? `Uang fisik (${money(grandTotal)}) tepat sesuai dengan catatan sistem.`
                  : diff > 0
                  ? `Fisik di laci lebih banyak ${money(diff)} dari saldo sistem (${money(expectedNum)}).`
                  : `Fisik di laci kurang ${money(Math.abs(diff))} dari saldo sistem (${money(expectedNum)}).`}
              </span>
            </div>
          </div>
          <span className="cash-calc__radar-badge">
            {diff === 0 ? 'SEIMBANG (Rp 0)' : diff > 0 ? `+${money(diff)}` : `-${money(Math.abs(diff))}`}
          </span>
        </div>
      )}

      {/* Denominations Sections: Uang Kertas & Uang Logam */}
      <div className="cash-calc__sections">
        {/* Section 1: Uang Kertas */}
        <section className="cash-calc__section">
          <div className="cash-calc__section-header">
            <span className="cash-calc__section-title">
              <Banknote size={16} aria-hidden="true" />
              <span>Uang Kertas</span>
            </span>
            <span className="cash-calc__section-badge">
              {kertasSheets} lbr · {money(kertasTotal)}
            </span>
          </div>
          <div className="cash-denom-list">
            {DENOMINATIONS.filter((d) => d.category === 'kertas').map((denom) => {
              const qty = counts[denom.id]
              const numQty = Math.max(0, parseInt(qty, 10) || 0)
              const subtotal = numQty * denom.value
              const isActive = numQty > 0
              return (
                <div
                  key={denom.id}
                  className={`cash-denom-row ${isActive ? 'cash-denom-row--active' : ''}`}
                >
                  <label htmlFor={`denom-${denom.id}`} className="cash-denom-label">
                    <span className={`cash-denom-badge ${denom.badgeClass}`} aria-hidden="true" />
                    <span>{denom.label}</span>
                  </label>
                  <div className="cash-denom-stepper">
                    <button
                      type="button"
                      className="cash-denom-step-btn"
                      onClick={() => handleStep(denom.id, -1)}
                      disabled={numQty <= 0}
                      aria-label={`Kurangi 1 lembar ${denom.label}`}
                    >
                      <Minus size={13} />
                    </button>
                    <input
                      id={`denom-${denom.id}`}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className="cash-denom-input"
                      placeholder="0"
                      value={qty !== undefined ? qty : ''}
                      onChange={(e) => handleCountChange(denom.id, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      aria-label={`Jumlah lembar ${denom.label}`}
                    />
                    <button
                      type="button"
                      className="cash-denom-step-btn"
                      onClick={() => handleStep(denom.id, 1)}
                      aria-label={`Tambah 1 lembar ${denom.label}`}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="cash-denom-subtotal" title={`Subtotal: ${money(subtotal)}`}>
                    {money(subtotal)}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Section 2: Uang Logam */}
        <section className="cash-calc__section">
          <div className="cash-calc__section-header">
            <span className="cash-calc__section-title">
              <Coins size={16} aria-hidden="true" />
              <span>Uang Logam (Koin)</span>
            </span>
            <span className="cash-calc__section-badge">
              {logamCoins} kpg · {money(logamTotal)}
            </span>
          </div>
          <div className="cash-denom-list">
            {DENOMINATIONS.filter((d) => d.category === 'logam').map((denom) => {
              const qty = counts[denom.id]
              const numQty = Math.max(0, parseInt(qty, 10) || 0)
              const subtotal = numQty * denom.value
              const isActive = numQty > 0
              return (
                <div
                  key={denom.id}
                  className={`cash-denom-row ${isActive ? 'cash-denom-row--active' : ''}`}
                >
                  <label htmlFor={`denom-${denom.id}`} className="cash-denom-label">
                    <span className={`cash-denom-badge ${denom.badgeClass}`} aria-hidden="true" />
                    <span>{denom.label}</span>
                  </label>
                  <div className="cash-denom-stepper">
                    <button
                      type="button"
                      className="cash-denom-step-btn"
                      onClick={() => handleStep(denom.id, -1)}
                      disabled={numQty <= 0}
                      aria-label={`Kurangi 1 keping ${denom.label}`}
                    >
                      <Minus size={13} />
                    </button>
                    <input
                      id={`denom-${denom.id}`}
                      type="number"
                      min={0}
                      inputMode="numeric"
                      className="cash-denom-input"
                      placeholder="0"
                      value={qty !== undefined ? qty : ''}
                      onChange={(e) => handleCountChange(denom.id, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      aria-label={`Jumlah keping ${denom.label}`}
                    />
                    <button
                      type="button"
                      className="cash-denom-step-btn"
                      onClick={() => handleStep(denom.id, 1)}
                      aria-label={`Tambah 1 keping ${denom.label}`}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="cash-denom-subtotal" title={`Subtotal: ${money(subtotal)}`}>
                    {money(subtotal)}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Grand Total Summary Card */}
      <div className="cash-calc__summary-card">
        <div className="cash-calc__summary-left">
          <span className="cash-calc__summary-label">Total Kas Fisik Terhitung</span>
          <span className="cash-calc__summary-counts">
            {kertasSheets} lembar kertas + {logamCoins} keping koin ({kertasSheets + logamCoins} unit fisik)
          </span>
        </div>
        <div className="cash-calc__summary-right">
          <strong className="cash-calc__grand-total" aria-live="polite">
            {money(grandTotal)}
          </strong>
          {hasExpected && (
            <span className="cash-calc__expected-sub">
              Saldo sistem: {money(expectedNum)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Standalone Modal untuk Kalkulator Kas Fisik Teller
 */
export function CashCalculatorModal({
  open,
  onClose,
  expectedAmount = null,
  onApply,
  storageKey = 'bank_cash_counts_standalone',
}) {
  const [total, setTotal] = useState(0)
  const [countsData, setCountsData] = useState({})

  function handleCalculate(newTotal, newCounts) {
    setTotal(newTotal)
    setCountsData(newCounts)
  }

  function handleApply() {
    if (onApply) {
      onApply(total, countsData)
    }
    toast.success(`Nominal ${money(total)} berhasil diterapkan!`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Kalkulator Kas Fisik & Pecahan Uang">
      <div className="cash-calc-modal-wrapper">
        <CashDenominationCalculator
          className="cash-calc--modal"
          expectedAmount={expectedAmount}
          onChange={handleCalculate}
          storageKey={storageKey}
          showTitle={false}
        />
        <div className="bank-actions bank-actions--end">
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
          {onApply && (
            <Button variant="primary" onClick={handleApply}>
              Gunakan Nilai Ini ({money(total)})
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
