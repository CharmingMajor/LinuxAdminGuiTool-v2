import { useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import { RefreshCw, Download, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Updates() {
  const api = useApi();
  const { auth } = useAuth();
  const isSenior = auth?.role === 'senior';
  const [installing, setInstalling] = useState(false);

  const fetchUpdates = useCallback(() => api.get('/api/updates'), [api]);
  const { data: updates, loading, refetch } = usePolling(fetchUpdates, 60000);

  const handleInstall = async () => {
    if (!confirm('Install all available updates?')) return;
    setInstalling(true);
    try {
      await api.post('/api/updates/install');
      toast.success('Updates installed successfully');
      refetch();
    } catch (e) { toast.error(e.message); }
    setInstalling(false);
  };

  const columns = [
    { key: 'package', label: 'Package' },
    { key: 'current', label: 'Current Version' },
    { key: 'available', label: 'Available Version' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-500"><RefreshCw size={20} className="animate-spin" /></div>;

  return (
    <Card
      title="Available Updates"
      icon={Package}
      action={
        <div className="flex gap-2">
          <button onClick={refetch} className="btn-ghost text-xs py-1 px-2"><RefreshCw size={14} /></button>
          {isSenior && (
            <button onClick={handleInstall} disabled={installing || !updates?.length} className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3">
              <Download size={14} /> {installing ? 'Installing...' : 'Install All'}
            </button>
          )}
        </div>
      }
    >
      {!isSenior && (
        <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
          Updates require senior admin approval to install.
        </div>
      )}
      <DataTable columns={columns} data={updates || []} emptyMessage="System is up to date" />
    </Card>
  );
}
