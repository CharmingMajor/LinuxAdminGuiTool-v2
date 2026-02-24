import { useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { HardDrive, Plus, RotateCcw, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Backups() {
  const api = useApi();
  const { auth } = useAuth();
  const isSenior = auth?.role === 'senior';

  const [createOpen, setCreateOpen] = useState(false);
  const [source, setSource] = useState('/home');
  const [destination, setDestination] = useState('/tmp/backups');
  const [backupType, setBackupType] = useState('full');
  const [creating, setCreating] = useState(false);

  const fetchBackups = useCallback(() => api.get('/api/backups'), [api]);
  const { data: backups, loading, refetch } = usePolling(fetchBackups, 15000);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await api.post('/api/backups', { source, destination, type: backupType });
      toast.success('Backup created');
      setCreateOpen(false);
      refetch();
    } catch (e) { toast.error(e.message); }
    setCreating(false);
  };

  const handleRestore = async (backup) => {
    const path = backup.destination || backup.path;
    if (!path) { toast.error('No backup path'); return; }
    const restorePath = prompt('Restore to path:', '/');
    if (!restorePath) return;
    try {
      await api.post('/api/backups/restore', { backupFile: path, restorePath });
      toast.success('Backup restored');
    } catch (e) { toast.error(e.message); }
  };

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'source', label: 'Source' },
    { key: 'destination', label: 'Destination' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v || 'unknown'} /> },
    {
      key: 'actions', label: '', sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={() => handleRestore(row)} className="text-xs text-brand hover:text-brand-light flex items-center gap-1"><RotateCcw size={12} /> Restore</button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-500"><RefreshCw size={20} className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card
        title="Backup History"
        icon={HardDrive}
        action={
          isSenior && (
            <button onClick={() => setCreateOpen(true)} className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3">
              <Plus size={14} /> Create Backup
            </button>
          )
        }
      >
        {!isSenior && (
          <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
            You can view and restore backups. Creating backups requires senior access.
          </div>
        )}
        <DataTable columns={columns} data={backups || []} emptyMessage="No backups found" />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Backup">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Source Path</label>
            <input value={source} onChange={e => setSource(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Destination</label>
            <input value={destination} onChange={e => setDestination(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Type</label>
            <select value={backupType} onChange={e => setBackupType(e.target.value)} className="input w-full">
              <option value="full">Full</option>
              <option value="incremental">Incremental</option>
            </select>
          </div>
          <button onClick={handleCreate} disabled={creating} className="btn-primary w-full">
            {creating ? 'Creating...' : 'Create Backup'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
