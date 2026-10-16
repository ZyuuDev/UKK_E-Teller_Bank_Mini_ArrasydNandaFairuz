import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { Sun, Moon, Landmark } from 'lucide-react'

const ROLE_REDIRECT = {
    Administrator: '/admin',
    Teller:        '/teller',
    Supervisor:    '/supervisor',
    Nasabah:       '/nasabah',
}

export default function LoginPage() {
    const navigate = useNavigate()
    const setAuth  = useAuthStore((s) => s.setAuth)
    const { isDark, toggle } = useThemeStore()
    const [form, setForm]       = useState({ username: '', password: '' })
    const [error, setError]     = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault() 
        setError('') 
        setLoading(true)

        try {
            const res = await login(form)
            const { token, user } = res.data.data 
            setAuth(token, user) 
            navigate(ROLE_REDIRECT[user.role] || '/login')
        } catch (err) {
            setError(err.response?.data?.message || 'Login gagal. Periksa username dan password.')
        } finally {
            setLoading(false)
        }
    }

    return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 dark:bg-slate-950">
        {/*tombol dark/light*/}
        <button
            onClick={toggle}
            className="absolute top-4 right-4 p-2 rounded-full border border-slate-700 text-slate-400 hover:text-white transition"
        >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/*login*/}
        <div className="w-full max-w-md p-8 rounded-2xl border border-slate-800 shadow-2xl bg-slate-900">

        <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-3">
                <Landmark size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">E-Teller Bank Mini</h1>
            <p className="text-slate-400 text-sm mt-1">Masuk ke sistem perbankan sekolah</p>
        </div>

        {/* Form login */}
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm text-slate-400 mb-1">Username</label>
                <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    placeholder="Masukkan username"
                    required
                />
            </div>

            <div>
                <label className="block text-sm text-slate-400 mb-1">Password</label>
                <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    placeholder="Masukkan password"
                    required
                />
            </div>

            {/*pesan error*/}
            {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {/*teks berubah saat loading*/}
                {loading ? 'Memproses...' : 'Masuk'}
            </button>
        </form>
        </div>
    </div>
    )
}