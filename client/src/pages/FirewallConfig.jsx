import { useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Shield, Plus, Trash2, Power, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FirewallConfig() {
  const api = useApi();
  const { auth } = useAuth();
  const isSenior = auth?.role === 'senior';
  const [rule, setRule] = useState('');

  const fetchFirewall = useCallback(() => api.get('/api/firewall/status'), [api]);
  const { data, loading, refetch } = usePolling(fetchFirewall, 10000);

  const handleToggle = async () => {
    try {
      await api.post('/api/firewall/toggle', { enable: !data?.active });
      toast.success(data?.active ? 'Firewall disabled' : 'Firewall enabled');
      refetch();
    } catch (e) { toast.error(e.message); }
  };

  const handleAddRule = async () => {
    if (!rule) { toast.error('Enter a rule (e.g. "allow 22/tcp")'); return; }
    try {
      await api.post('/api/firewall/rules', { rule });
      toast.success('Rule added');
      setRule('');
      refetch();
    } catch (e) { toast.error(e.message); }
  };

  const handleDeleteRule = async (number) => {
    try {
      await api.del(`/api/firewall/rules/${number}`);
      toast.success('Rule deleted');
      refetch();
    } catch (e) { toast.error(e.message); }
  };

  const columns = [
    { key: 'number', label: '#' },
    { key: 'to', label: 'To' },
    { key: 'action', label: 'Action', render: v => <StatusBadge status={v} variant={v === 'ALLOW' ? 'success' : v === 'DENY' ? 'error' : 'warning'} /> },
    { key: 'from', label: 'From' },
    {
      key: 'del', label: '', sortable: false,
      render: (_, row) => (
        <button onClick={() => handleDeleteRule(row.number)} className="text-zinc-500 hover:text-red-400"><Trash2 size={14} /></button>
      ),
    },
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-500"><RefreshCw size={20} className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card
        title="Firewall Status"
        icon={Shield}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={data?.active ? 'active' : 'inactive'} variant={data?.active ? 'success' : 'error'} />
            {isSenior && (
              <button onClick={handleToggle} className="btn-ghost text-xs py-1 px-2 flex items-center gap-1">
                <Power size={14} /> {data?.active ? 'Disable' : 'Enable'}
              </button>
            )}
          </div>
        }
      >
        <DataTable columns={columns} data={data?.rules || []} emptyMessage="No firewall rules" />
      </Card>

      <Card title="Add Rule" icon={Plus}>
        <div className="flex gap-3 mt-2">
          <input
            value={rule}
            onChange={e => setRule(e.target.value)}
            placeholder='e.g. allow 22/tcp, deny from 10.0.0.0/8'
            className="input flex-1"
            onKeyDown={e => e.key === 'Enter' && handleAddRule()}
          />
          <button onClick={handleAddRule} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Rule
          </button>
        </div>
      </Card>
    </div>
  );
}
