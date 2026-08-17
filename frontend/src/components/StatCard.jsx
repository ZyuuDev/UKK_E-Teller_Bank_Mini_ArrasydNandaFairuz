// Props:
//title = label kartu, misal "Total Setoran Hari Ini"
//value = nilai yang ditampilkan besar, misal "Rp 500.000"
//icon = komponen ikon dari lucide-react
//color = tema warna kartu ('blue' | 'green' | 'red' | 'amber')
export default function StatCard({ title, value, icon: Icon, color = 'blue' }) {
  //mapping warna ke kelas tailwind
const colors = {
    blue: 'border-blue-500/30 text-blue-400',
    green: 'border-green-500/30 text-green-400',
    red: 'border-red-500/30 text-red-400',
    amber: 'border-amber-500/30 text-amber-400',
}

return (
    <div className={`p-5 rounded-2xl border bg-slate-800/50 ${colors[color]} flex items-center gap-4`}>
    <div className="p-3 rounded-xl bg-slate-700/50">
    <Icon size={24} />
</div>
<div>
    <p className="text-slate-400 text-sm">{title}</p>
    <p className="text-white text-xl font-bold">{value}</p>
</div>
    </div>
)
}