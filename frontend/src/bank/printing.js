import { money } from './api'

const escape = (value) =>
  String(value ?? 'Tidak tersedia').replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]
  )
const line = (label, value) =>
  `<tr><th>${escape(label)}</th><td>${escape(value)}</td></tr>`

function printDocument(title, content, receipt = false) {
  const frame = document.createElement('iframe')
  frame.title = title
  frame.style.position = 'fixed'
  frame.style.width = '1px'
  frame.style.height = '1px'
  frame.style.opacity = '0'
  document.body.appendChild(frame)
  const doc = frame.contentWindow.document
  frame.onload = () => {
    frame.contentWindow.onafterprint = () => frame.remove()
    frame.contentWindow.focus()
    frame.contentWindow.print()
  }
  doc.open()
  doc.write(
    `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${escape(title)}</title><style>body{font:12pt Arial,sans-serif;color:#111;margin:20px}main{max-width:${receipt ? '72mm' : '185mm'};margin:auto}h1{font-size:17pt;margin-bottom:4px}p{line-height:1.5}table{width:100%;border-collapse:collapse}th,td{padding:9px 0;border-bottom:1px solid #ccc;text-align:left;vertical-align:top}th{width:48%;font-weight:400}td{text-align:right;overflow-wrap:anywhere}footer{margin-top:24px;font-size:10pt}@page{margin:10mm}</style></head><body><main><h1>Bank Mini SMKN 1 Bantul</h1><p>${escape(title)}</p>${content}<footer>Dokumen dari sistem Bank Mini SMKN 1 Bantul. Cocokkan nomor referensi dengan catatan sistem.</footer></main></body></html>`
  )
  doc.close()
  setTimeout(() => {
    if (frame.isConnected) frame.remove()
  }, 120000)
}

export function printReceipt(receipt) {
  const date = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(receipt.created_at))
  const content = `<table>${line('Referensi', `TRX-${receipt.id}`)}${line('Waktu WIB', date)}${line('Nama', receipt.full_name)}${line('Rekening', receipt.account_number)}${line('Transaksi', receipt.transaction_type === 'Deposit' ? 'Setoran' : 'Penarikan')}${line('Nominal', money(receipt.amount))}${line('Saldo sesudah transaksi', money(receipt.balance_after))}${line('Catatan', receipt.notes || 'Tidak ada')}</table>`
  printDocument('Bukti transaksi', content, true)
}

export function printReport(report) {
  if (
    !['pending', 'approved'].includes(report.status) ||
    Number(report.discrepancy) !== 0
  )
    throw new Error(
      'Laporan berselisih atau dikembalikan tidak dapat dicetak sebagai laporan harian.'
    )
  const title =
    report.status === 'approved' ? 'LAPORAN DISETUJUI' : 'DRAF BELUM DISETUJUI'
  const content = `<table>${line('ID laporan', report.id)}${line('Tanggal', report.date)}${line('Teller', report.teller?.name || `ID ${report.teller_id}`)}${line('Saldo awal', money(report.opening_balance))}${line('Total setoran', money(report.total_deposits))}${line('Total penarikan', money(report.total_withdrawals))}${line('Kas sistem', money(report.expected_closing_balance))}${line('Kas fisik', money(report.actual_cash_on_hand))}${line('Selisih', money(report.discrepancy))}${line('Disetujui oleh', report.approver?.name || (report.approved_by ? `ID ${report.approved_by}` : 'Belum disetujui'))}${line('Waktu persetujuan', report.approved_at || 'Belum disetujui')}</table>`
  printDocument(title, content)
}