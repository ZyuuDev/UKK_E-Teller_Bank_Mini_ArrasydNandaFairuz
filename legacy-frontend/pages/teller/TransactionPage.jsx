import { useState } from 'react'
import { searchCustomer, deposit, withdraw } from '../../api/teller'
import QrScanner from '../../components/QrScanner'
import { 
    User, ArrowDownRight, ArrowUpRight, AlertCircle, 
    CheckCircle2, Printer, RefreshCw, CreditCard, ShieldAlert 
} from 'lucide-react'

//format rupiah
const formatRupiah = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID')

//modal struk bukti transaksi
function ReceiptModal({ receipt, onClose }) {
    if (!receipt) return null

    const handlePrint = () => {
        window.print()
    }

    const isDeposit = receipt.transaction_type === 'Deposit'

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl relative">
                
                {/* Header Struk */}
                <div className="text-center pb-4 border-b border-dashed border-slate-700">
                    <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 ${
                        isDeposit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                        <CheckCircle2 size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-wide">struk bukti transaksi</h3>
                    <p className="text-xs text-slate-400">BANK MINI SCHOOL • E-TELLER SYSTEM</p>
                </div>

                {/*rincian transaksi*/}
                <div className="py-4 space-y-2.5 text-sm">
                    <div className="flex justify-between text-slate-400">
                        <span>No. Transaksi</span>
                        <span className="font-mono text-white">#TRX-{String(receipt.transaction_id).padStart(6, '0')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                        <span>Waktu / Tanggal</span>
                        <span className="text-white">{receipt.date || new Date().toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                        <span>Jenis Transaksi</span>
                        <span className={`font-semibold ${isDeposit ? 'text-emerald-400' : 'text-blue-400'}`}>
                            {isDeposit ? 'SETORAN TUNAI' : 'PENARIKAN TUNAI'}
                        </span>
                    </div>

                    <div className="my-2 border-t border-slate-800"></div>

                    <div className="flex justify-between text-slate-400">
                        <span>Nama Nasabah</span>
                        <span className="text-white font-medium">{receipt.customer?.full_name}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                        <span>No. Rekening</span>
                        <span className="font-mono text-white">{receipt.customer?.account_number}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                        <span>Kelas</span>
                        <span className="text-white">{receipt.customer?.class_name}</span>
                    </div>

                    <div className="my-2 border-t border-slate-800"></div>

                    <div className="flex justify-between items-center text-slate-300">
                        <span>Jumlah Transaksi</span>
                        <span className="text-lg font-bold text-emerald-400 font-mono">
                            {formatRupiah(receipt.amount)}
                        </span>
                    </div>

                    {receipt.notes && (
                        <div className="flex justify-between text-slate-400 text-xs">
                            <span>Catatan</span>
                            <span className="text-slate-300 italic">{receipt.notes}</span>
                        </div>
                    )}
                </div>

                {/*footer & tombol aksi*/}
                <div className="pt-4 border-t border-dashed border-slate-700 flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
                    >
                        <Printer size={16} /> Cetak Struk
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition shadow-lg shadow-blue-600/30"
                    >
                        Transaksi Baru
                    </button>
                </div>
            </div>
        </div>
    )
}

//komponen utama halaman transaksi
export default function TransactionPage() {
    const [customer, setCustomer] = useState(null)
    const [searching, setSearching] = useState(false)
    const [searchError, setSearchError] = useState('')

    //form states
    const [activeTab, setActiveTab] = useState('deposit')
    const [amount, setAmount] = useState('')
    const [notes, setNotes] = useState('')
    const [securityPin, setSecurityPin] = useState('')

    const [submitting, setSubmitting] = useState(false)
    const [trxError, setTrxError] = useState('')
    const [receiptData, setReceiptData] = useState(null)

    //handler hasil scanner / pencarian nasabah
    const handleFindCustomer = async (queryValue) => {
        if (!queryValue) return
        setSearching(true)
        setSearchError('')
        setCustomer(null)
        setTrxError('')

        try {
            //cek apakah query berupa nomor rekening atau QR token
            const params = queryValue.startsWith('BMS-') 
                ? { account_number: queryValue }
                : { qr_token: queryValue }

            const res = await searchCustomer(params)
            setCustomer(res.data.data)
        } catch (err) {
            setSearchError(err.response?.data?.message || 'Nasabah tidak ditemukan. Periksa QR Code atau nomor rekening.')
        } finally {
            setSearching(false)
        }
    }

    //refresh data nasabah untuk memperbarui saldo
    const refreshCustomerData = async () => {
        if (!customer) return
        try {
            const res = await searchCustomer({ account_number: customer.account_number })
            setCustomer(res.data.data)
        } catch (err) {
            console.error('Gagal refresh saldo:', err)
        }
    }

    //submit Setoran Tunai
    const handleDeposit = async (e) => {
        e.preventDefault()
        if (!customer || !amount) return

        setSubmitting(true)
        setTrxError('')

        try {
            const res = await deposit({
                account_number: customer.account_number,
                amount: Number(amount),
                notes: notes || undefined,
            })

            // Tampilkan struk
            setReceiptData(res.data.data)
            // Reset form
            setAmount('')
            setNotes('')
            // Refresh saldo
            refreshCustomerData()
        } catch (err) {
            setTrxError(err.response?.data?.message || 'Gagal memproses setoran.')
        } finally {
            setSubmitting(false)
        }
    }

    // Submit Penarikan Tunai
    const handleWithdraw = async (e) => {
        e.preventDefault()
        if (!customer || !amount || !securityPin) return

        setSubmitting(true)
        setTrxError('')

        try {
            const res = await withdraw({
                account_number: customer.account_number,
                amount: Number(amount),
                security_pin: securityPin,
                notes: notes || undefined,
            })

            // Tampilkan struk
            setReceiptData(res.data.data)
            // Reset form
            setAmount('')
            setSecurityPin('')
            setNotes('')
            // Refresh saldo
            refreshCustomerData()
        } catch (err) {
            setTrxError(err.response?.data?.message || 'Gagal memproses penarikan.')
        } finally {
            setSubmitting(false)
        }
    }

    //reset dan ganti nasabah
    const handleResetAll = () => {
        setCustomer(null)
        setAmount('')
        setNotes('')
        setSecurityPin('')
        setTrxError('')
        setSearchError('')
    }

    return (
        <div className="space-y-6">

            {/*pencarian & QR scanner*/}
            {!customer ? (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-bold text-white">Identifikasi rekening nasabah</h2>
                        <p className="text-slate-400 text-sm">Gunakan kamera, upload file QR, atau masukkan nomor rekening nasabah.</p>
                    </div>

                    <QrScanner onResult={handleFindCustomer} />

                    {searching && (
                        <div className="text-center py-6 text-slate-400 animate-pulse">
                            Mencari data nasabah dari database...
                        </div>
                    )}

                    {searchError && (
                        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            <AlertCircle size={18} className="shrink-0" />
                            {searchError}
                        </div>
                    )}
                </div>
            ) : (
                /*nasabah ditemukan & form transaksi*/
                <div className="space-y-6">
                    
                    {/*kartu profil nasabah terpilih*/}
                    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                                <User size={28} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-white">{customer.full_name}</h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                        {customer.class_name}
                                    </span>
                                </div>
                                <p className="text-sm font-mono text-slate-400 mt-0.5">
                                    No. Rekening: <span className="text-blue-400 font-semibold">{customer.account_number}</span>
                                </p>
                            </div>
                        </div>

                        {/*info saldo & tombol ganti nasabah*/}
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
                            <div className="text-right">
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Saldo Tersedia</p>
                                <p className="text-2xl font-black text-emerald-400 font-mono">
                                    {formatRupiah(customer.balance)}
                                </p>
                            </div>
                            <button
                                onClick={handleResetAll}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
                                title="Ganti Nasabah"
                            >
                                <RefreshCw size={14} /> Ganti Nasabah
                            </button>
                        </div>
                    </div>

                    {/*tab pilihan setoran/penarikan*/}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                        <div className="grid grid-cols-2 border-b border-slate-800">
                            <button
                                onClick={() => { setActiveTab('deposit'); setTrxError('') }}
                                className={`py-4 font-semibold text-sm flex items-center justify-center gap-2 transition ${
                                    activeTab === 'deposit'
                                        ? 'bg-slate-800/80 text-emerald-400 border-b-2 border-emerald-500'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                                }`}
                            >
                                <ArrowDownRight size={18} /> Setoran Tunai (Deposit)
                            </button>
                            <button
                                onClick={() => { setActiveTab('withdraw'); setTrxError('') }}
                                className={`py-4 font-semibold text-sm flex items-center justify-center gap-2 transition ${
                                    activeTab === 'withdraw'
                                        ? 'bg-slate-800/80 text-blue-400 border-b-2 border-blue-500'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                                }`}
                            >
                                <ArrowUpRight size={18} /> Penarikan Tunai (Withdrawal)
                            </button>
                        </div>

                        {/* body form*/}
                        <div className="p-6 md:p-8">
                            
                            {/*pesan error transaksi*/}
                            {trxError && (
                                <div className="mb-6 flex items-start gap-2.5 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <span>{trxError}</span>
                                </div>
                            )}

                            {/*form setoran*/}
                            {activeTab === 'deposit' && (
                                <form onSubmit={handleDeposit} className="space-y-5 max-w-lg mx-auto">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                            Nominal Setoran Tunai (Rp)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3 text-slate-400 font-bold">Rp</span>
                                            <input
                                                type="number"
                                                min="1000"
                                                step="1000"
                                                required
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="Contoh: 50000"
                                                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-mono text-lg focus:outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Minimal setoran Rp 1.000</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                            Catatan / Keterangan (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Contoh: Setoran uang tabungan mingguan"
                                            className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base transition shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                                    >
                                        {submitting ? 'Memproses Setoran...' : 'Konfirmasi & Simpan Setoran'}
                                    </button>
                                </form>
                            )}

                            {/*form penarikan*/}
                            {activeTab === 'withdraw' && (
                                <form onSubmit={handleWithdraw} className="space-y-5 max-w-lg mx-auto">
                                    
                                    {/*peringatan aturan saldo Mengendap*/}
                                    <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-2.5 text-xs text-blue-300">
                                        <ShieldAlert size={16} className="shrink-0 mt-0.5 text-blue-400" />
                                        <span>
                                            <strong>Aturan Bank Mini:</strong> Sisa saldo rekening setelah penarikan tidak boleh kurang dari <strong>Rp 10.000</strong>.
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                            Nominal Penarikan Tunai (Rp)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-3 text-slate-400 font-bold">Rp</span>
                                            <input
                                                type="number"
                                                min="1000"
                                                step="1000"
                                                required
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="Contoh: 20000"
                                                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-mono text-lg focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                            PIN Keamanan Nasabah (6 Digit)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                maxLength={6}
                                                minLength={6}
                                                pattern="\d{6}"
                                                required
                                                value={securityPin}
                                                onChange={(e) => setSecurityPin(e.target.value)}
                                                placeholder="••••••"
                                                className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-mono tracking-widest text-center text-lg focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 text-center mt-1">Minta nasabah memasukkan 6 digit angka PIN</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                                            Catatan / Keterangan (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Contoh: Penarikan untuk beli buku"
                                            className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition shadow-lg shadow-blue-600/30 disabled:opacity-50"
                                    >
                                        {submitting ? 'Memverifikasi & Menarik Dana...' : 'Otorisasi & Tarik Tunai'}
                                    </button>
                                </form>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {/*modal bukti struk transaksi*/}
            <ReceiptModal receipt={receiptData} onClose={() => setReceiptData(null)} />
        </div>
    )
}