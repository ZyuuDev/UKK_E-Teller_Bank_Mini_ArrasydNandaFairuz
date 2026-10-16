import { useState, useEffect } from 'react'
import { getCustomers, createCustomer, updateCustomer } from '../../api/admin'
import { Plus, Pencil, Copy, Check, AlertCircle, X } from 'lucide-react'

const formatRupiah = (num) =>
    'Rp ' + Number(num).toLocaleString('id-ID')

//func Modal hasil pembuatan rekening
function SuccessModal({ data, onClose }) {
    const [copiedAcc, setCopiedAcc] = useState(false)
    const [copiedQr,  setCopiedQr]  = useState(false)

    const copyToClipboard = (text, setCopied) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!data) return null

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-green-500/30 shadow-2xl p-6">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                        <Check size={32} className="text-green-400" />
                    </div>
                    <h3 className="text-white font-bold text-lg">Rekening Berhasil Dibuat!</h3>
                    <p className="text-slate-400 text-sm mt-1">
                        Catat atau salin informasi berikut sebelum menutup halaman ini.
                    </p>
                </div>

                {/* Nomor rekening */}
                <div className="space-y-3 mb-6">
                    <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                        <p className="text-slate-400 text-xs mb-1">Nomor Rekening</p>
                        <div className="flex items-center justify-between">
                            <p className="text-white font-mono font-bold text-lg">{data.account_number}</p>
                            <button
                                onClick={() => copyToClipboard(data.account_number, setCopiedAcc)}
                                className="p-1.5 text-slate-400 hover:text-white rounded transition"
                                title="Salin nomor rekening"
                            >
                                {copiedAcc ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>

                    {/*QR*/}
                    <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                        <p className="text-slate-400 text-xs mb-1">QR Code Token</p>
                        <div className="flex items-center justify-between gap-3">
                            {/*potong token panjang*/}
                            <p className="text-white font-mono text-xs truncate">{data.qr_code_token}</p>
                            <button
                                onClick={() => copyToClipboard(data.qr_code_token, setCopiedQr)}
                                className="p-1.5 text-slate-400 hover:text-white rounded transition shrink-0"
                                title="Salin QR token"
                            >
                                {copiedQr ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium transition"
                >
                    Mengerti, Tutup
                </button>
            </div>
        </div>
    )
}

//modal tambah rekening
function CreateCustomerModal({ isOpen, onClose, onSuccess }) {
    const [form, setForm] = useState({
        nis: '', full_name: '', class_name: '',
        security_pin: '', username: '', password: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState('')

    useEffect(() => {
        if (isOpen) {
            setForm({ nis: '', full_name: '', class_name: '', security_pin: '', username: '', password: '' })
            setError('')
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await createCustomer(form)
            //kirim data hasil ke parent untuk ditampilkan di SuccessModal
            onSuccess({
                account_number: res.data.data.account_number,
                qr_code_token:  res.data.data.qr_code_token,
            })
            onClose()
        } catch (err) {
            const laravelErrors = err.response?.data?.errors
            if (laravelErrors) {
                const firstError = Object.values(laravelErrors)[0][0]
                setError(firstError)
            } else {
                setError(err.response?.data?.message || 'Gagal membuat rekening.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-900">
                    <h3 className="text-white font-semibold text-lg">Buat Rekening Nasabah Baru</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-medium">
                        Data Nasabah
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">NIS</label>
                            <input
                                type="text" value={form.nis} required maxLength={20}
                                onChange={(e) => setForm({ ...form, nis: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                                placeholder="Nomor Induk Siswa"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Kelas</label>
                            <input
                                type="text" value={form.class_name} required maxLength={20}
                                onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                                placeholder="Contoh: XII RPL 1"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Nama Lengkap</label>
                        <input
                            type="text" value={form.full_name} required maxLength={100}
                            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Nama lengkap nasabah"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1">PIN 6 Digit</label>
                        <input
                            type="password" value={form.security_pin} required
                            onChange={(e) => setForm({ ...form, security_pin: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                            placeholder="PIN untuk otorisasi penarikan"
                            maxLength={6} minLength={6} pattern="\d{6}"
                            title="PIN harus 6 angka"
                        />
                        <p className="text-slate-500 text-xs mt-1">Harus tepat 6 digit angka</p>
                    </div>

                    <p className="text-slate-500 text-xs uppercase tracking-wider font-medium pt-2">
                        Akun Login Nasabah
                    </p>
                    <p className="text-slate-400 text-xs -mt-2">
                        Nasabah akan menggunakan username dan password ini untuk login ke aplikasi.
                    </p>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Username</label>
                        <input
                            type="text" value={form.username} required maxLength={50}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Username untuk login"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Password</label>
                        <input
                            type="password" value={form.password} required minLength={6}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Minimal 6 karakter"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition">
                            Batal
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition disabled:opacity-50">
                            {loading ? 'Memproses...' : 'Buat Rekening'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

//modal edit data nasabah
function EditCustomerModal({ isOpen, onClose, onSubmit, customer }) {
    const [form, setForm] = useState({ nis: '', full_name: '', class_name: '', security_pin: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState('')

    useEffect(() => {
        if (customer) {
            setForm({
                nis:          customer.nis        || '',
                full_name:    customer.full_name  || '',
                class_name:   customer.class_name || '',
                security_pin: '',  // Kosongkan — isi hanya jika mau ganti PIN
            })
        }
        setError('')
    }, [customer, isOpen])

    if (!isOpen || !customer) return null

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const payload = { ...form }
            if (!payload.security_pin) delete payload.security_pin  // Hapus jika kosong
            await onSubmit(customer.id, payload)
            onClose()
        } catch (err) {
            const laravelErrors = err.response?.data?.errors
            if (laravelErrors) {
                setError(Object.values(laravelErrors)[0][0])
            } else {
                setError(err.response?.data?.message || 'Gagal memperbarui data.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl">
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h3 className="text-white font-semibold text-lg">Edit Data Nasabah</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">NIS</label>
                        <input type="text" value={form.nis} maxLength={20}
                            onChange={(e) => setForm({ ...form, nis: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Nama Lengkap</label>
                        <input type="text" value={form.full_name} maxLength={100}
                            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Kelas</label>
                        <input type="text" value={form.class_name} maxLength={20}
                            onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">
                            PIN Baru <span className="text-slate-500">(kosongkan jika tidak ingin ganti)</span>
                        </label>
                        <input type="password" value={form.security_pin} maxLength={6} minLength={6}
                            onChange={(e) => setForm({ ...form, security_pin: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                            placeholder="(opsional)" />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition">
                            Batal
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition disabled:opacity-50">
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

//komponen utama halaman customer management
export default function CustomerManagement() {
    const [customers, setCustomers]       = useState([])
    const [loading, setLoading]           = useState(true)
    const [createOpen, setCreateOpen]     = useState(false)
    const [editTarget, setEditTarget]     = useState(null)
    const [successData, setSuccessData]   = useState(null)

    const fetchCustomers = async () => {
        setLoading(true)
        try {
            const res = await getCustomers()
            setCustomers(res.data.data)
        } catch {
            console.error('Gagal mengambil data nasabah')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchCustomers() }, [])

    // dipanggil setelah CreateCustomerModal berhasil submit
    const handleCreateSuccess = (data) => {
        setSuccessData(data)
        fetchCustomers()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Kelola Nasabah</h2>
                    <p className="text-slate-400 text-sm">Buat rekening baru dan kelola data nasabah</p>
                </div>
                <button
                    onClick={() => setCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
                >
                    <Plus size={16} /> Buat Rekening
                </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">No</th>
                                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Nama</th>
                                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">NIS</th>
                                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">No. Rekening</th>
                                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Kelas</th>
                                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Saldo</th>
                                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-12 text-slate-500">Memuat data...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-slate-500">Belum ada nasabah. Klik "Buat Rekening" untuk mulai.</td></tr>
                            ) : (
                                customers.map((c, index) => (
                                    <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                                        <td className="px-6 py-4 text-slate-500 text-sm">{index + 1}</td>
                                        <td className="px-6 py-4 text-white font-medium">{c.full_name}</td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{c.nis}</td>
                                        <td className="px-6 py-4 text-slate-300 font-mono text-sm">{c.account_number}</td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{c.class_name}</td>
                                        <td className="px-6 py-4 text-green-400 font-medium text-sm">
                                            {formatRupiah(c.balance)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setEditTarget(c)}
                                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                                                title="Edit nasabah"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal-modal */}
            <CreateCustomerModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                onSuccess={handleCreateSuccess}
            />

            <EditCustomerModal
                isOpen={!!editTarget}
                onClose={() => setEditTarget(null)}
                onSubmit={async (id, data) => {
                    await updateCustomer(id, data)
                    fetchCustomers()
                }}
                customer={editTarget}
            />

            <SuccessModal
                data={successData}
                onClose={() => setSuccessData(null)}
            />
        </div>
    )
}