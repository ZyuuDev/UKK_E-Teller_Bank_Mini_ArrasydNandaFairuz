import { LogOut, Sun, Moon } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";
import { logout } from "../api/auth";
import { useNavigate } from "react-router-dom";

//title
export default function Navbar({title}){
    const { user, clearAuth }=useAuthStore();
    const { isDark, toggle }=useThemeStore();
    const navigate = useNavigate();
    
    const handleLogout = async () => {
    try {
        await logout()
    } catch {}
    clearAuth()
    navigate('/login')
    }

    return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
        <h2 className="text-white font-semibold">{title}</h2>
        <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">{user?.name}</span>

            <button onClick={toggle} className="p-2 text-slate-400 hover:text-white transition">
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-sm"
            >
            <LogOut size={14} /> Keluar
        </button>
        </div>
    </header>
    )
}