// Props: status = string status rekonsiliasi ('Pending' | 'Approved' | 'Disputed')
export default function Badge({ status }) {
  const styles = {
    Pending:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    Disputed: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${styles[status] || ''}`}>
      {status}
    </span>
  )
}