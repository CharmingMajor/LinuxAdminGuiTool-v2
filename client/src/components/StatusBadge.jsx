const variants = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  neutral: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const statusMap = {
  running: 'success', active: 'success', completed: 'success', UP: 'success',
  stopped: 'error', failed: 'error', rejected: 'error', DOWN: 'error', UNKNOWN: 'error',
  pending: 'warning', 'in-progress': 'info',
};

export default function StatusBadge({ status, variant }) {
  const v = variant || statusMap[status] || 'neutral';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[v]}`}>
      {status}
    </span>
  );
}
