import { useState } from "react";
import { Users, Building2, Landmark, LayoutDashboard } from "lucide-react";
import Navbar from "../../components/Navbar";
import UserManagement from './UserManagement'
import CustomerManagement from './CustomerManagement'
import { useAuthStore } from "../../store/authStore";

export default function AdminDashboard(){
    //state aktif di konten
    //user tampil
    const [activePage, setActivePage] = useState('users')
    const { user } = useAuthStore()

    //menu sidebar
    const menuItems = [
        { id: 'users',     label: 'Kelola User',    icon: Users       },
        { id: 'customers', label: 'Kelola Nasabah', icon: Building2   },
    ]
    return (
        <div className="flex h-screen bg-slate-950 dark:bg-slate-950">

            {/*sidebar*/}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">

                {/*logo di atas sidebar*/}
                <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <Landmark size={16} className="text-white" />
                    </div>
                    <div>
                        <p className="text-white text-sm font-bold">E-Teller</p>
                        <p className="text-slate-500 text-xs">Bank Mini</p>
                    </div>
                </div>

                {/*info user yang login*/}
                <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-slate-400 text-xs">Login sebagai</p>
                    <p className="text-white text-sm font-medium">{user?.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                        {user?.role}
                    </span>
                </div>

                {/*menu navigasi*/}
                <nav className="flex-1 p-3 space-y-1">
                    {menuItems.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActivePage(id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                                activePage === id
                                    ? 'bg-blue-600 text-white'          
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white' 
                            }`}
                        >
                            <Icon size={18} />
                            {label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/*area konten*/}
            <div className="flex-1 flex flex-col overflow-auto">

                {/*navbar atas*/}
                <Navbar title={
                    activePage === 'users'
                        ? 'Kelola User'
                        : 'Kelola Nasabah'
                } />

                {/*konten utama*/}
                <main className="flex-1 p-6">
                    {activePage === 'users'     && <UserManagement />}
                    {activePage === 'customers' && <CustomerManagement />}
                </main>
            </div>
        </div>
    )
}