import { useState, useCallback, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import { Activity, Cpu, MemoryStick, HardDrive, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function formatBytes(b) {
  if (!b) return '0 B';
  const k = 1024, s = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
}

const MAX_POINTS = 30;

export default function SystemMonitor() {
  const api = useApi();
  const cpuHistory = useRef([]);
  const memHistory = useRef([]);
  const [charts, setCharts] = useState({ cpu: [], mem: [] });

  const fetchResources = useCallback(async () => {
    const resources = await api.get('/api/system/resources');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    cpuHistory.current = [...cpuHistory.current, { time: now, value: resources.cpu }].slice(-MAX_POINTS);
    memHistory.current = [...memHistory.current, { time: now, value: resources.memory.percent }].slice(-MAX_POINTS);
    setCharts({ cpu: [...cpuHistory.current], mem: [...memHistory.current] });

    return resources;
  }, [api]);

  const fetchProcesses = useCallback(() => api.get('/api/system/processes'), [api]);

  const { data: resources, loading } = usePolling(fetchResources, 3000);
  const { data: processes } = usePolling(fetchProcesses, 5000);

  const processColumns = [
    { key: 'pid', label: 'PID' },
    { key: 'user', label: 'User' },
    { key: 'cpu', label: 'CPU %' },
    { key: 'mem', label: 'MEM %' },
    { key: 'command', label: 'Command' },
  ];

  if (loading || !resources) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-zinc-500">
          <RefreshCw size={20} className="animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  const chartTooltipStyle = { backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#e4e4e7', fontSize: '12px' };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="CPU Usage" icon={Cpu}>
          <div className="h-48 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.cpu}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={v => [`${v.toFixed(1)}%`, 'CPU']} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#cpuGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-2xl font-bold text-zinc-100 mt-2">{resources.cpu.toFixed(1)}%</p>
        </Card>

        <Card title="Memory Usage" icon={MemoryStick}>
          <div className="h-48 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.mem}>
                <defs>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={v => [`${v.toFixed(1)}%`, 'Memory']} />
                <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} fill="url(#memGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-bold text-zinc-100">{resources.memory.percent.toFixed(1)}%</p>
            <p className="text-xs text-zinc-500">{formatBytes(resources.memory.used)} / {formatBytes(resources.memory.total)}</p>
          </div>
        </Card>
      </div>

      <Card title="Disk Usage" icon={HardDrive}>
        <div className="mt-2 flex items-center gap-6">
          <div className="flex-1">
            <div className="w-full h-3 bg-surface-200 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${resources.disk.percent}%` }} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-zinc-100">{resources.disk.percent.toFixed(1)}%</p>
            <p className="text-xs text-zinc-500">{formatBytes(resources.disk.used)} / {formatBytes(resources.disk.total)}</p>
          </div>
        </div>
      </Card>

      <Card title="Processes" icon={Activity}>
        <DataTable columns={processColumns} data={processes || []} emptyMessage="No processes loaded" />
      </Card>
    </div>
  );
}
