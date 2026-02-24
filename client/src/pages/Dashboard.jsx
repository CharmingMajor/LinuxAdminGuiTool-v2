import { useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { Cpu, MemoryStick, HardDrive, Server, Activity, Users, Shield, RefreshCw } from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-zinc-100">{value}</p>
        {sub && <p className="text-xs text-zinc-500 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ value, color = 'bg-brand' }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="w-full h-2 bg-surface-200 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Dashboard() {
  const api = useApi();
  const { auth } = useAuth();

  const fetchData = useCallback(async () => {
    const [info, resources] = await Promise.all([
      api.get('/api/system/info'),
      api.get('/api/system/resources'),
    ]);
    return { info, resources };
  }, [api]);

  const { data, loading } = usePolling(fetchData, 5000);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-zinc-500">
          <RefreshCw size={20} className="animate-spin" />
          <span>Loading system data...</span>
        </div>
      </div>
    );
  }

  const { info, resources } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-100">Welcome back, {auth?.username}</h2>
        <p className="text-sm text-zinc-500 mt-1">Here's an overview of your system</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Cpu} label="CPU Usage" value={`${resources.cpu.toFixed(1)}%`} color="bg-blue-600" />
        <StatCard
          icon={MemoryStick} label="Memory"
          value={`${resources.memory.percent.toFixed(1)}%`}
          sub={`${formatBytes(resources.memory.used)} / ${formatBytes(resources.memory.total)}`}
          color="bg-purple-600"
        />
        <StatCard
          icon={HardDrive} label="Disk"
          value={`${resources.disk.percent.toFixed(1)}%`}
          sub={`${formatBytes(resources.disk.used)} / ${formatBytes(resources.disk.total)}`}
          color="bg-amber-600"
        />
        <StatCard icon={Server} label="Hostname" value={info.hostname} sub={info.os} color="bg-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="System Resources" icon={Activity}>
          <div className="space-y-4 mt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-400">CPU</span>
                <span className="text-zinc-300 font-medium">{resources.cpu.toFixed(1)}%</span>
              </div>
              <ProgressBar value={resources.cpu} color="bg-blue-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-400">Memory</span>
                <span className="text-zinc-300 font-medium">{resources.memory.percent.toFixed(1)}%</span>
              </div>
              <ProgressBar value={resources.memory.percent} color="bg-purple-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-400">Disk</span>
                <span className="text-zinc-300 font-medium">{resources.disk.percent.toFixed(1)}%</span>
              </div>
              <ProgressBar value={resources.disk.percent} color="bg-amber-500" />
            </div>
          </div>
        </Card>

        <Card title="System Information" icon={Server}>
          <div className="space-y-3 mt-2">
            {[
              ['Hostname', info.hostname],
              ['Operating System', info.os],
              ['Kernel', info.kernel],
              ['Uptime', info.uptime],
              ['Role', auth?.role?.charAt(0).toUpperCase() + auth?.role?.slice(1)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1.5 border-b border-zinc-800/40 last:border-0">
                <span className="text-xs text-zinc-500">{k}</span>
                <span className="text-sm text-zinc-200 font-medium">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
