import { useState } from 'react'
import { CheckCheck, Landmark, ShieldCheck, FileSpreadsheet } from 'lucide-react'
import Navbar from '../../components/Navbar'
import ReconciliationApproval from './ReconciliationApproval'
import { useAuthStore } from '../../store/authStore'

export default function SupervisorDashboard() {
    const [activePage, setActivePage] = useState('reconciliations')
    const { user } = useAuthStore()

    const menuItems = [
        { id: 'reconciliations', label: 'Verifikasi Rekonsiliasi', icon: CheckCheck },
    ]

    return (
        <div className="flex h-screen bg-slate-950 dark:bg-slate-950">

            {/*SIDEBAR KIRI*/}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">

                {/*logo & brand*/}
                <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <Landmark size={16} className="text-white" />
                    </div>
                    <div>
                        <p className="text-white text-sm font-bold">E-Teller</p>
                        <p className="text-slate-500 text-xs">Supervisor Panel</p>
                    </div>
                </div>

                {/*info user supervisor*/}
                <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-slate-400 text-xs">Otorisator</p>
                    <p className="text-white text-sm font-medium">{user?.name}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-medium">
                            {user?.role}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">@{user?.username}</span>
                    </div>
                </div>

                {/*navigasi menu*/}
                <nav className="flex-1 p-3 space-y-1">
                    {menuItems.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActivePage(id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                                activePage === id
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <Icon size={18} />
                            {label}
                        </button>
                    ))}
                </nav>

                {/*info otoritas*/}
                <div className="p-4 m-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400">
                    <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
                        <ShieldCheck size={14} className="text-indigo-400" /> otoritas mutlak
                    </p>
                    <p>Laporan yang berstatus <strong>Disputed</strong> tidak dapat disetujui sebelum diverifikasi fisiknya.</p>
                </div>
            </aside>

            {/*area konten kanan*/}
            <div className="flex-1 flex flex-col overflow-auto">
                <Navbar title="Persetujuan & Audit Rekonsiliasi Kas" />

                <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
                    {activePage === 'reconciliations' && <ReconciliationApproval />}
                </main>
            </div>
        </div>
    )
}