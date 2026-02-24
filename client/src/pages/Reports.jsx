import { useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { ClipboardList, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reports() {
  const api = useApi();
  const { auth } = useAuth();
  const isSenior = auth?.role === 'senior';

  const [createOpen, setCreateOpen] = useState(false);
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [statusUpdate, setStatusUpdate] = useState({});

  const fetchReports = useCallback(() => api.get('/api/reports'), [api]);
  const { data: reports, loading, refetch } = usePolling(fetchReports, 10000);

  const handleSubmit = async () => {
    if (!reportType || !description) { toast.error('Type and description required'); return; }
    try {
      await api.post('/api/reports', { reportType, description });
      toast.success('Report submitted');
      setCreateOpen(false);
      setReportType('');
      setDescription('');
      refetch();
    } catch (e) { toast.error(e.message); }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/api/reports/${id}/status`, { status });
      toast.success('Status updated');
      refetch();
    } catch (e) { toast.error(e.message); }
  };

  const columns = [
    { key: 'id', label: '#' },
    { key: 'timestamp', label: 'Date' },
    { key: 'from_user', label: 'From' },
    { key: 'report_type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    ...(isSenior ? [{
      key: 'actions', label: 'Update', sortable: false,
      render: (_, row) => (
        <select
          value={statusUpdate[row.id] || row.status}
          onChange={e => {
            setStatusUpdate(s => ({ ...s, [row.id]: e.target.value }));
            handleUpdateStatus(row.id, e.target.value);
          }}
          className="input text-xs py-1"
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      ),
    }] : []),
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-500"><RefreshCw size={20} className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card
        title={isSenior ? 'Junior Admin Reports' : 'My Reports'}
        icon={ClipboardList}
        action={
          <div className="flex gap-2">
            <button onClick={refetch} className="btn-ghost text-xs py-1 px-2"><RefreshCw size={14} /></button>
            {!isSenior && (
              <button onClick={() => setCreateOpen(true)} className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3">
                <Plus size={14} /> Submit Report
              </button>
            )}
          </div>
        }
      >
        <DataTable columns={columns} data={reports || []} emptyMessage="No reports" />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Submit Report">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Report Type</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} className="input w-full">
              <option value="">Select type...</option>
              <option value="task_completion">Task Completion</option>
              <option value="issue_report">Issue Report</option>
              <option value="maintenance">Maintenance</option>
              <option value="security_concern">Security Concern</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input w-full h-32 resize-none"
              placeholder="Describe the task or issue..."
            />
          </div>
          <button onClick={handleSubmit} className="btn-primary w-full">Submit Report</button>
        </div>
      </Modal>
    </div>
  );
}
