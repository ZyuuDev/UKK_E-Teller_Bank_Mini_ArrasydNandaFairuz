import { useState, useEffect } from 'react'
import { getUsers, createUser, updateUser, deleteUser } from '../../api/admin'
import { Plus, Pencil, Trash2, X, AlertCircle, TextInitialIcon } from 'lucide-react'

//komponen modal form crud
function UserFormModal({ isOpen, onClose, onSubmit, initial }) {
    const [form, setForm] = useState({
        username: '', password: '', name: '', role: 'Teller'
    })
    const [loading,setLoading] = useState(false)
    const [error, setError] = useState('')
    //menjalankan useefek saat berubah dan mengisi form dengan data user yg mau diedit

    useEffect(() => {
        if (initial) {
            setForm({
                username: initial.username || '',
                password: '',
                name: initial.name || '',
                role: initial.role || 'Teller',
            })
        } else {
            //reset form kosong
            setForm({ username: '', password: '', name: '', role: 'Teller'})
        }
        setError('')
    }, [initial, isOpen])

    //saat modul tdk dibuka jgn render apapun
    if (!isOpen) return null
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const payload = { ...form }
            if (initial && !payload.password) {
                delete payload.password
            }
            
            await onSubmit(payload)
            onClose()
        } catch (err) {
            const laravelErrors = err.response?.data?.errors
            if (laravelErrors) {
                const firstError = Object.values(laravelErrors)[0][0]
                setError(firstError)
            } else {
                setError(err.response?.data?.message || 'Terjadi Kesalahan, Mohon hubungi admin setempat.')
            }
        } finally {
            setLoading(false)
        }
    }
    return (
        // Overlay gelap di belakang modal — klik overlay = tutup modal
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            {/* Box modal — stopPropagation mencegah klik di dalam modal menutup modal */}
            <div
                className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header modal */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h3 className="text-white font-semibold text-lg">
                        {initial ? 'Edit User' : 'Tambah User Baru'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Nama lengkap */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Nama Lengkap</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Nama lengkap"
                            required
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Username</label>
                        <input
                            type="text"
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Username untuk login"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">
                            Password
                            {/* Tampilkan keterangan tambahan saat mode edit */}
                            {initial && (
                                <span className="text-slate-500 ml-1">(kosongkan jika tidak ingin ganti)</span>
                            )}
                        </label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                            placeholder={initial ? '(opsional)' : 'Minimal 6 karakter'}
                            // required hanya saat tambah baru, tidak saat edit
                            required={!initial}
                            minLength={form.password ? 6 : undefined}
                        />
                    </div>

                    {/* Role — dropdown pilihan */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Role</label>
                        <select
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                        >
                            {/* Nasabah tidak bisa dipilih di sini — dibuat via menu Kelola Nasabah */}
                            <option value="Teller">Teller</option>
                            <option value="Supervisor">Supervisor</option>
                            <option value="Administrator">Administrator</option>
                        </select>
                    </div>

                    {/* Pesan error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    {/* Tombol aksi */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : (initial ? 'Simpan Perubahan' : 'Tambah User')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

//komponen utqma halaman manajemen user
export default function UserManagement() {
    const[users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editTarget, setEditTarget] = useState(null)
    const [deleteId, setDeleteId] = useState(null)
    const [deleteError, setDeleteError] = useState('')

   //fungsi mengabil data user dri API
   const fetchUsers = async () => {
    setLoading(true)
    try {
        const res = await getUsers()
        setUsers(res.data.data)
    } catch {
        console.error('Gagal mengambil data user, segera hubungi developer')
    } finally {
        setLoading(false)
        }
    }

    //use efek jalan pertama kali dimuaf dgn aray kosong
    useEffect(() => { fetchUsers() }, [])

    //simpan user baru atau update user yg diedit
    const handleSave = async (formData) => {
        if (editTarget) {
            await updateUser(editTarget.id, formData)
        } else {
            await createUser(formData)
        }
        fetchUsers()
    }

    //hapus user
    const handleDelete = async (id) => {
        setDeleteError('')
        try {
            await deleteUser(id)
            setDeleteId(null)
            fetchUsers()
        } catch (err) {
            //409 user tdk bisa dihapus karena FK RESTRICT
            //403 admin tdk bs hapus diri sneidir
            setDeleteError(
                err.response?.data?.message || 'Gagal menghapus user.'
            )
        }
    }

    //map warna badge
    const roleBadge = {
        Administrator: 'bg-purple-500/20 text-purple-400',
        Supervisor: 'bg-blue-500/20 text-blue-400',
        Teller: 'bg-green-500/20 text-green-400',
        Nasabah: 'bg-amber-500/20 text-amber-400',
    }

    return (
        <div className="space-y-6">

            {/*header halaman*/}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Kelola User</h2>
                    <p className="text-slate-400 text-sm">Kelola akun Teller, Supervisor, dan Administrator</p>
                </div>
                <button
                    onClick={() => { setEditTarget(null); setModalOpen(true) }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
                >
                    <Plus size={16} /> Tambah User
                </button>
            </div>

            {/*tabel user*/}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">No</th>
                                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Nama</th>
                                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Username</th>
                                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Role</th>
                                <th className="text-left px-6 py-4 text-slate-400 text-sm font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-500">
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                //tampilkan pesan jika tidak ada data
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-slate-500">
                                        Belum ada user. Klik "Tambah User" untuk mulai.
                                    </td>
                                </tr>
                            ) : (
                                //render baris untuk setiap user
                                users.map((u, index) => (
                                    <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                                        <td className="px-6 py-4 text-slate-500 text-sm">{index + 1}</td>
                                        <td className="px-6 py-4 text-white font-medium">{u.name}</td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{u.username}</td>
                                        <td className="px-6 py-4">
                                            {/*badge warna sesuai role*/}
                                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${roleBadge[u.role] || ''}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {/*tombol edit*/}
                                                <button
                                                    onClick={() => { setEditTarget(u); setModalOpen(true) }}
                                                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                                                    title="Edit user"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                {/*tombol hapus*/}
                                                <button
                                                    onClick={() => { setDeleteId(u.id); setDeleteError('') }}
                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                                    title="Hapus user"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*modal form tambah/edit*/}
            <UserFormModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditTarget(null) }}
                onSubmit={handleSave}
                initial={editTarget}
            />

            {/*dialog konfirmasi hapus*/}
            {/*muncul saat deleteId tidak null*/}
            {deleteId && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-700 p-6">
                        <h3 className="text-white font-semibold mb-2">konfirmasi hapus</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Yakin ingin menghapus user ini? Aksi ini tidak bisa dibatalkan.
                        </p>

                        {/*pesan error jika hapus gagal (misal: user masih punya transaksi)*/}
                        {deleteError && (
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                {deleteError}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setDeleteId(null); setDeleteError('') }}
                                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleDelete(deleteId)}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}