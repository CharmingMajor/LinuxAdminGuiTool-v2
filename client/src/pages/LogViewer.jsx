import { useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import Card from '../components/Card';
import { FileText, RefreshCw, Filter } from 'lucide-react';

export default function LogViewer() {
  const api = useApi();
  const [logFile, setLogFile] = useState('app');
  const [filter, setFilter] = useState('');

  const fetchLogs = useCallback(() => {
    const params = new URLSearchParams({ file: logFile, lines: '200' });
    if (filter) params.set('filter', filter);
    return api.get(`/api/logs?${params}`);
  }, [api, logFile, filter]);

  const { data, loading, refetch } = usePolling(fetchLogs, 5000);

  const lines = data?.lines || [];

  const getLineClass = (line) => {
    if (line.includes('ERROR') || line.includes('CRITICAL')) return 'text-red-400';
    if (line.includes('WARNING')) return 'text-amber-400';
    if (line.includes('INFO')) return 'text-blue-400';
    if (line.includes('DEBUG')) return 'text-zinc-500';
    if (line.includes('Failed')) return 'text-red-400';
    return 'text-zinc-300';
  };

  return (
    <Card title="System Logs" icon={FileText}>
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={logFile} onChange={e => setLogFile(e.target.value)} className="input text-sm">
          <option value="app">Application Log</option>
          <option value="brute_force">Brute Force Attempts</option>
          <option value="system">System Audit Log</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter logs (e.g. ERROR, WARNING)"
            className="input w-full pl-8 text-sm"
          />
        </div>
        <button onClick={refetch} className="btn-ghost text-xs py-1 px-3 flex items-center gap-1.5">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="bg-surface-100 rounded-lg p-4 font-mono text-xs max-h-[600px] overflow-y-auto">
        {loading && !lines.length ? (
          <div className="text-zinc-500 flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Loading logs...</div>
        ) : lines.length === 0 ? (
          <div className="text-zinc-500">No log entries found</div>
        ) : (
          lines.map((line, i) => (
            <div key={i} className={`py-0.5 leading-relaxed ${getLineClass(line)}`}>{line}</div>
          ))
        )}
      </div>
    </Card>
  );
}
