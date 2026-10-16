import { useState, useEffect } from 'react'
import { getReconciliations, approveRecon } from '../../api/supervisor'
import Badge from '../../components/Badge'
import StatCard from '../../components/StatCard'
import { 
    CheckCheck, AlertTriangle, Clock, CheckCircle2, 
    XCircle, Eye, ShieldAlert, X, RefreshCw 
} from 'lucide-react'

//helper format rupiah
const formatRupiah = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID')

//modal detail rincian rekonsiliasi
function DetailModal({ item, onClose, onApprove, approving }) {
    if (!item) return null

    const isPending = item.status === 'Pending'
    const isDisputed = item.status === 'Disputed'
    const isApproved = item.status === 'Approved'

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-6">
                
                {/*header modal*/}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                        <h3 className="text-lg font-bold text-white">Lembar Audit Rekonsiliasi</h3>
                        <p className="text-xs text-slate-400">ID Laporan: #{item.id} • Tanggal: {item.date}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
                        <X size={18} />
                    </button>
                </div>

                {/*info petugas teller */}
                <div className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800 text-sm">
                    <div>
                        <p className="text-xs text-slate-400">Petugas Teller</p>
                        <p className="font-semibold text-white">{item.teller?.name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400">Status Saat Ini</p>
                        <div className="mt-0.5">
                            <Badge status={item.status} />
                        </div>
                    </div>
                </div>

                {/*rincian angka keuangan*/}
                <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between text-slate-400">
                        <span>Saldo Kas Awal (Opening)</span>
                        <span className="font-mono text-white">{formatRupiah(item.opening_balance)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                        <span>Total Setoran Hari Ini (+)</span>
                        <span className="font-mono text-emerald-400 font-semibold">{formatRupiah(item.total_deposits)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                        <span>Total Penarikan Hari Ini (-)</span>
                        <span className="font-mono text-red-400 font-semibold">{formatRupiah(item.total_withdrawals)}</span>
                    </div>
                    
                    <div className="my-2 border-t border-slate-800"></div>

                    <div className="flex justify-between text-slate-300 font-medium">
                        <span>Saldo Akhir Perhitungan Sistem</span>
                        <span className="font-mono text-blue-400 font-bold">{formatRupiah(item.system_ending_balance)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 font-medium">
                        <span>Fisik Uang Riil di Laci Teller</span>
                        <span className="font-mono text-white font-bold">{formatRupiah(item.actual_cash_on_hand)}</span>
                    </div>

                    <div className="my-2 border-t border-slate-800"></div>

                    <div className={`p-4 rounded-2xl border flex justify-between items-center ${
                        isDisputed ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'
                    }`}>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Selisih Kas (Discrepancy)
                        </span>
                        <span className={`text-lg font-black font-mono ${
                            Number(item.discrepancy) === 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                            {formatRupiah(item.discrepancy)}
                        </span>
                    </div>
                </div>

                {/*status approval info*/}
                {isApproved && (
                    <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 space-y-1">
                        <p className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 size={14} /> Telah Disetujui & Kas Masuk Brankas
                        </p>
                        <p className="text-slate-400">Disetujui oleh: <strong className="text-white">{item.supervisor?.name || 'Supervisor'}</strong></p>
                        <p className="text-slate-500">{item.approved_at}</p>
                    </div>
                )}

                {/*peringatan jika disputed*/}
                {isDisputed && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                        <ShieldAlert size={16} className="shrink-0 text-amber-400 mt-0.5" />
                        <span>
                            <strong>Perhatian:</strong> Laporan ini tidak bisa disetujui karena ada selisih kas. Teller wajib menghitung ulang fisik uang dan memeriksa mutasi jurnal sebelum approval diberikan.
                        </span>
                    </div>
                )}

                {/*tombol aksi*/}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition text-sm font-medium"
                    >
                        Tutup
                    </button>

                    {isPending && (
                        <button
                            onClick={() => onApprove(item.id)}
                            disabled={approving}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <CheckCheck size={16} />
                            {approving ? 'Memproses...' : 'Setujui Rekonsiliasi'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

//komponen utama reconciliationapproval
export default function ReconciliationApproval() {
    const [reconciliations, setReconciliations] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')
    const [selectedItem, setSelectedItem] = useState(null)
    const [approving, setApproving] = useState(false)
    const [actionMessage, setActionMessage] = useState({ type: '', text: '' })

    const fetchRecons = async () => {
        setLoading(true)
        setActionMessage({ type: '', text: '' })
        try {
            const params = statusFilter ? { status: statusFilter } : {}
            const res = await getReconciliations(params)
            setReconciliations(res.data.data)
        } catch (err) {
            console.error('Gagal mengambil data rekonsiliasi:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRecons()
    }, [statusFilter])

    const handleApprove = async (id) => {
        setApproving(true)
        setActionMessage({ type: '', text: '' })
        try {
            const res = await approveRecon(id)
            setActionMessage({
                type: 'success',
                text: res.data.message || 'Rekonsiliasi berhasil disetujui. Kas resmi dipindahkan ke brankas.'
            })
            setSelectedItem(null)
            fetchRecons()
        } catch (err) {
            setActionMessage({
                type: 'error',
                text: err.response?.data?.message || 'Gagal menyetujui rekonsiliasi.'
            })
        } finally {
            setApproving(false)
        }
    }

    //statistik cepat
    const totalPending = reconciliations.filter(r => r.status === 'Pending').length
    const totalDisputed = reconciliations.filter(r => r.status === 'Disputed').length
    const totalApproved = reconciliations.filter(r => r.status === 'Approved').length

    const filterTabs = [
        { id: '',          label: 'Semua Laporan' },
        { id: 'Pending',   label: 'Menunggu Approval (Pending)' },
        { id: 'Disputed',  label: 'Ada Selisih (Disputed)' },
        { id: 'Approved',  label: 'Disetujui (Approved)' },
    ]

    return (
        <div className="space-y-6">

            {/*kartu statistik*/}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Pengajuan"
                    value={reconciliations.length}
                    icon={CheckCheck}
                    color="blue"
                />
                <StatCard
                    title="Menunggu Otorisasi"
                    value={totalPending}
                    icon={Clock}
                    color="amber"
                />
                <StatCard
                    title="Selisih Kas (Disputed)"
                    value={totalDisputed}
                    icon={AlertTriangle}
                    color="red"
                />
                <StatCard
                    title="Kas Masuk Brankas"
                    value={totalApproved}
                    icon={CheckCircle2}
                    color="green"
                />
            </div>

            {/*pesan aksi*/}
            {actionMessage.text && (
                <div className={`p-4 rounded-2xl flex items-center justify-between text-sm ${
                    actionMessage.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                    <span>{actionMessage.text}</span>
                    <button onClick={() => setActionMessage({ type: '', text: '' })}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/*tab filter status & tombol*/}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                                statusFilter === tab.id
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={fetchRecons}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-medium transition"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/*tabel daftar rekonsiliasi*/}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Petugas Teller</th>
                                <th className="px-6 py-4">Kas Awal</th>
                                <th className="px-6 py-4">Saldo Sistem</th>
                                <th className="px-6 py-4">Fisik Laci</th>
                                <th className="px-6 py-4">Selisih</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-slate-500">
                                        Memuat laporan rekonsiliasi...
                                    </td>
                                </tr>
                            ) : reconciliations.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-slate-500">
                                        Tidak ada rekonsiliasi dengan status yang dipilih.
                                    </td>
                                </tr>
                            ) : (
                                reconciliations.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-800/30 transition">
                                        <td className="px-6 py-4 font-mono text-slate-300 font-medium whitespace-nowrap">
                                            {r.date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-white">{r.teller?.name}</p>
                                            <p className="text-xs text-slate-500">@{r.teller?.username}</p>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-300">
                                            {formatRupiah(r.opening_balance)}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-blue-400 font-semibold">
                                            {formatRupiah(r.system_ending_balance)}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-white font-medium">
                                            {formatRupiah(r.actual_cash_on_hand)}
                                        </td>
                                        <td className="px-6 py-4 font-mono">
                                            <span className={Number(r.discrepancy) === 0 ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                                                {formatRupiah(r.discrepancy)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge status={r.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedItem(r)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                                                >
                                                    <Eye size={14} /> Detail
                                                </button>

                                                {r.status === 'Pending' && (
                                                    <button
                                                        onClick={() => handleApprove(r.id)}
                                                        disabled={approving}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
                                                    >
                                                        <CheckCheck size={14} /> Setujui
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*modal detail audit*/}
            <DetailModal
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                onApprove={handleApprove}
                approving={approving}
            />

        </div>
    )
}