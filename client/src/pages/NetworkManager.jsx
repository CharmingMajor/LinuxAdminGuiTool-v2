import { useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Network, Wifi, WifiOff, Globe, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NetworkManager() {
  const api = useApi();
  const { auth } = useAuth();
  const isSenior = auth?.role === 'senior';

  const [pingHost, setPingHost] = useState('8.8.8.8');
  const [pingCount, setPingCount] = useState('4');
  const [pingResult, setPingResult] = useState('');
  const [pinging, setPinging] = useState(false);

  const [ipIface, setIpIface] = useState('');
  const [ipAddr, setIpAddr] = useState('');
  const [netmask, setNetmask] = useState('24');

  const fetchInterfaces = useCallback(() => api.get('/api/network/interfaces'), [api]);
  const { data: interfaces, loading, refetch } = usePolling(fetchInterfaces, 10000);

  const handleEnable = async (name) => {
    try { await api.post(`/api/network/interfaces/${name}/enable`); toast.success(`${name} enabled`); refetch(); } catch (e) { toast.error(e.message); }
  };

  const handleDisable = async (name) => {
    try { await api.post(`/api/network/interfaces/${name}/disable`); toast.success(`${name} disabled`); refetch(); } catch (e) { toast.error(e.message); }
  };

  const handlePing = async () => {
    setPinging(true);
    setPingResult('');
    try {
      const res = await api.post('/api/network/ping', { host: pingHost, count: parseInt(pingCount) });
      setPingResult(res.output);
    } catch (e) { toast.error(e.message); }
    setPinging(false);
  };

  const handleSetIp = async () => {
    if (!ipIface || !ipAddr) { toast.error('Interface and IP required'); return; }
    try {
      await api.post(`/api/network/interfaces/${ipIface}/ip`, { ip_address: ipAddr, netmask });
      toast.success('IP configured');
      refetch();
    } catch (e) { toast.error(e.message); }
  };

  const columns = [
    { key: 'name', label: 'Interface' },
    { key: 'state', label: 'State', render: v => <StatusBadge status={v} /> },
    { key: 'ip_address', label: 'IP Address' },
    ...(isSenior ? [{
      key: 'actions', label: 'Actions', sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={() => handleEnable(row.name)} className="btn-ghost text-xs py-1 px-2 flex items-center gap-1"><Wifi size={12} /> Enable</button>
          <button onClick={() => handleDisable(row.name)} className="btn-ghost text-xs py-1 px-2 flex items-center gap-1"><WifiOff size={12} /> Disable</button>
        </div>
      ),
    }] : []),
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-500"><RefreshCw size={20} className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card title="Network Interfaces" icon={Network} action={<button onClick={refetch} className="btn-ghost text-xs py-1 px-2"><RefreshCw size={14} /></button>}>
        <DataTable columns={columns} data={interfaces || []} emptyMessage="No interfaces found" />
      </Card>

      {isSenior && (
        <Card title="IP Configuration" icon={Network}>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Interface</label>
              <select value={ipIface} onChange={e => setIpIface(e.target.value)} className="input w-full">
                <option value="">Select...</option>
                {(interfaces || []).map(i => <option key={i.name} value={i.name}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">IP Address</label>
              <input value={ipAddr} onChange={e => setIpAddr(e.target.value)} placeholder="192.168.1.100" className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Netmask</label>
              <input value={netmask} onChange={e => setNetmask(e.target.value)} placeholder="24" className="input w-full" />
            </div>
            <div className="flex items-end">
              <button onClick={handleSetIp} className="btn-primary text-xs w-full">Apply</button>
            </div>
          </div>
        </Card>
      )}

      <Card title="Connectivity Check" icon={Globe}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
          <div className="sm:col-span-2">
            <label className="block text-xs text-zinc-400 mb-1">Host</label>
            <input value={pingHost} onChange={e => setPingHost(e.target.value)} className="input w-full" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Count</label>
            <input value={pingCount} onChange={e => setPingCount(e.target.value)} type="number" className="input w-full" />
          </div>
          <div className="flex items-end">
            <button onClick={handlePing} disabled={pinging} className="btn-primary text-xs w-full">
              {pinging ? 'Pinging...' : 'Ping'}
            </button>
          </div>
        </div>
        {pingResult && (
          <pre className="mt-4 p-4 bg-surface-100 rounded-lg text-xs text-zinc-300 font-mono overflow-x-auto max-h-48 overflow-y-auto">{pingResult}</pre>
        )}
      </Card>
    </div>
  );
}
