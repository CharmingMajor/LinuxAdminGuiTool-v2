import { useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Server, RotateCcw, Square, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ServiceManager() {
  const api = useApi();

  const fetchServices = useCallback(() => api.get('/api/services'), [api]);
  const { data: services, loading, refetch } = usePolling(fetchServices, 10000);

  const handleRestart = async (name) => {
    try { await api.post(`/api/services/${name}/restart`); toast.success(`${name} restarted`); refetch(); } catch (e) { toast.error(e.message); }
  };

  const handleStop = async (name) => {
    if (!confirm(`Stop service ${name}?`)) return;
    try { await api.post(`/api/services/${name}/stop`); toast.success(`${name} stopped`); refetch(); } catch (e) { toast.error(e.message); }
  };

  const columns = [
    { key: 'name', label: 'Service' },
    { key: 'active', label: 'Status', render: v => <StatusBadge status={v} variant={v === 'active' ? 'success' : 'error'} /> },
    { key: 'description', label: 'Description' },
    {
      key: 'actions', label: 'Actions', sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={() => handleRestart(row.name)} className="btn-ghost text-xs py-1 px-2 flex items-center gap-1"><RotateCcw size={12} /> Restart</button>
          <button onClick={() => handleStop(row.name)} className="btn-danger text-xs py-1 px-2 flex items-center gap-1"><Square size={12} /> Stop</button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-500"><RefreshCw size={20} className="animate-spin" /></div>;

  return (
    <Card title="Running Services" icon={Server} action={<button onClick={refetch} className="btn-ghost text-xs py-1 px-2"><RefreshCw size={14} /></button>}>
      <DataTable columns={columns} data={services || []} emptyMessage="No services running" />
    </Card>
  );
}
