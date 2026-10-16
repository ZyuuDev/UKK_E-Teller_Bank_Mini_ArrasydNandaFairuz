import { useState } from 'react'
import { submitRecon } from '../../api/teller'
import Badge from '../../components/Badge'
import { 
    Calculator, AlertTriangle, CheckCircle2, 
    Printer, Lock, ArrowRight, ShieldCheck, DollarSign 
} from 'lucide-react'

const formatRupiah = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID')

export default function ReconciliationPage() {
    const [openingBalance, setOpeningBalance] = useState('')
    const [actualCash, setActualCash] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [reconResult, setReconResult] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await submitRecon({
                opening_balance: Number(openingBalance),
                actual_cash_on_hand: Number(actualCash),
            })
            setReconResult(res.data.data)
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memproses rekonsiliasi kas.')
        } finally {
            setLoading(false)
        }
    }

    const handlePrintReport = () => {
        window.print()
    }

    return (
        <div className="space-y-6">
            
            {/*Header*/}
            <div>
                <h2 className="text-xl font-bold text-white">Tutup Kas & Rekonsiliasi Harian</h2>
                <p className="text-slate-400 text-sm">
                    Lakukan pencocokan kas fisik di laci dengan perhitungan transaksi sistem sebelum penyerahan kas ke Supervisor.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/*FORM INPUT REKONSILIASI(Kiri)*/}
                <div className="lg:col-span-5 bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-5">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                            <Calculator size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Input Kas Loket</h3>
                            <p className="text-xs text-slate-400">Data fisik loket hari ini</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Saldo Kas Awal (Opening Balance)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-slate-400 font-bold">Rp</span>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={openingBalance}
                                    onChange={(e) => setOpeningBalance(e.target.value)}
                                    placeholder="Contoh: 500000"
                                    className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Uang modal loket saat buka pelayanan</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Fisik Uang di Laci (Actual Cash on Hand)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-3 text-slate-400 font-bold">Rp</span>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    value={actualCash}
                                    onChange={(e) => setActualCash(e.target.value)}
                                    placeholder="Contoh: 750000"
                                    className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Total hasil hitung fisik uang di laci teller</p>
                        </div>

                        {error && (
                            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
                        >
                            {loading ? 'Menghitung Rekonsiliasi...' : 'Kalkulasi & Kirim ke Supervisor'}
                        </button>
                    </form>
                </div>

                {/*HASIL KALKULASI & LAPORAN(Kanan)*/}
                <div className="lg:col-span-7 space-y-4">
                    {!reconResult ? (
                        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-12 text-center text-slate-500">
                            <Calculator size={40} className="mx-auto mb-3 opacity-40" />
                            <p className="text-base font-medium text-slate-400">Belum ada kalkulasi yang dijalankan</p>
                            <p className="text-xs mt-1">Isi saldo awal dan uang fisik di laci lalu klik tombol kalkulasi.</p>
                        </div>
                    ) : (
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-6">
                            
                            {/*header status*/}
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                <div>
                                    <p className="text-xs text-slate-400">Status Rekonsiliasi</p>
                                    <div className="mt-1">
                                        <Badge status={reconResult.status} />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">Tanggal Transaksi</p>
                                    <p className="text-sm font-semibold text-white font-mono">{reconResult.date}</p>
                                </div>
                            </div>

                            {/*rincian angka audit*/}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800">
                                    <span className="text-xs text-slate-400">Kas Awal</span>
                                    <p className="text-base font-bold text-white font-mono mt-1">
                                        {formatRupiah(reconResult.opening_balance)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800">
                                    <span className="text-xs text-slate-400">Total Setoran (+)</span>
                                    <p className="text-base font-bold text-emerald-400 font-mono mt-1">
                                        {formatRupiah(reconResult.total_deposits)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800">
                                    <span className="text-xs text-slate-400">Total Penarikan (-)</span>
                                    <p className="text-base font-bold text-red-400 font-mono mt-1">
                                        {formatRupiah(reconResult.total_withdrawals)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800">
                                    <span className="text-xs text-slate-400">Saldo Akhir Sistem</span>
                                    <p className="text-base font-bold text-blue-400 font-mono mt-1">
                                        {formatRupiah(reconResult.system_ending_balance)}
                                    </p>
                                </div>
                            </div>

                            {/*komparasi fisik vs selisih*/}
                            <div className={`p-5 rounded-2xl border ${
                                reconResult.status === 'Disputed' 
                                    ? 'bg-red-500/10 border-red-500/30' 
                                    : 'bg-emerald-500/10 border-emerald-500/30'
                            }`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        Fisik Uang di Laci
                                    </span>
                                    <span className="text-lg font-bold font-mono text-white">
                                        {formatRupiah(reconResult.actual_cash_on_hand)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        Selisih Kas (Discrepancy)
                                    </span>
                                    <span className={`text-lg font-black font-mono ${
                                        Number(reconResult.discrepancy) === 0 ? 'text-emerald-400' : 'text-red-400'
                                    }`}>
                                        {formatRupiah(reconResult.discrepancy)}
                                    </span>
                                </div>
                            </div>

                            {reconResult.status === 'Disputed' ? (
                                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
                                    <Lock size={20} className="shrink-0 text-amber-400 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-sm text-amber-300 mb-0.5">MODUL CETAK LAPORAN TERKUNCI</p>
                                        <p>
                                            Ditemukan selisih kas sebesar {formatRupiah(Math.abs(reconResult.discrepancy))}. 
                                            Sesuai SOP UKK Bank Mini, laporan tidak dapat dicetak dan tidak dapat disetujui sampai selisih diselesaikan dengan Supervisor.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                        <span>Kas seimbang (Balance). Laporan siap dicetak dan menunggu otorisasi Supervisor.</span>
                                    </div>
                                    <button
                                        onClick={handlePrintReport}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition"
                                    >
                                        <Printer size={16} /> Cetak Lembar Rekonsiliasi Kas
                                    </button>
                                </div>
                            )}

                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}