import { useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Users, UserPlus, UserMinus, KeyRound, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const api = useApi();
  const { auth } = useAuth();
  const isSenior = auth?.role === 'senior';

  const [addOpen, setAddOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', comment: '', shell: '/bin/bash' });
  const [resetPass, setResetPass] = useState('');

  const fetchUsers = useCallback(() => api.get('/api/users'), [api]);
  const fetchGroups = useCallback(() => api.get('/api/groups'), [api]);

  const { data: users, loading, refetch } = usePolling(fetchUsers, 10000);
  const { data: groups, refetch: refetchGroups } = usePolling(fetchGroups, 10000);

  const handleAddUser = async () => {
    if (!form.username) { toast.error('Username required'); return; }
    try {
      await api.post('/api/users', form);
      toast.success(`User ${form.username} created`);
      setAddOpen(false);
      setForm({ username: '', password: '', comment: '', shell: '/bin/bash' });
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteUser = async (username) => {
    if (!confirm(`Delete user ${username}?`)) return;
    try {
      await api.del(`/api/users/${username}?deleteHome=true`);
      toast.success(`User ${username} deleted`);
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  const handleResetPassword = async () => {
    if (!resetPass) { toast.error('Password required'); return; }
    try {
      await api.post(`/api/users/${selected}/reset-password`, { password: resetPass });
      toast.success(`Password reset for ${selected}`);
      setResetOpen(false);
      setResetPass('');
    } catch (err) { toast.error(err.message); }
  };

  const userColumns = [
    { key: 'username', label: 'Username' },
    { key: 'uid', label: 'UID' },
    { key: 'gid', label: 'GID' },
    { key: 'comment', label: 'Comment' },
    { key: 'home', label: 'Home' },
    { key: 'shell', label: 'Shell' },
    {
      key: 'actions', label: 'Actions', sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={() => { setSelected(row.username); setResetOpen(true); }} className="text-xs text-brand hover:text-brand-light">Reset Password</button>
          {isSenior && <button onClick={() => handleDeleteUser(row.username)} className="text-xs text-red-400 hover:text-red-300">Delete</button>}
        </div>
      ),
    },
  ];

  const groupColumns = [
    { key: 'name', label: 'Group' },
    { key: 'gid', label: 'GID' },
    { key: 'members', label: 'Members' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-zinc-500"><RefreshCw size={20} className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card
        title="System Users"
        icon={Users}
        action={
          <button onClick={() => setAddOpen(true)} className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3">
            <UserPlus size={14} /> Add User
          </button>
        }
      >
        <DataTable columns={userColumns} data={users || []} emptyMessage="No users found" />
      </Card>

      <Card title="Groups" icon={Users}>
        <DataTable columns={groupColumns} data={groups || []} emptyMessage="No groups found" />
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Username</label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Comment</label>
            <input value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Shell</label>
            <select value={form.shell} onChange={e => setForm({ ...form, shell: e.target.value })} className="input w-full">
              <option value="/bin/bash">/bin/bash</option>
              <option value="/bin/sh">/bin/sh</option>
              <option value="/usr/sbin/nologin">/usr/sbin/nologin</option>
            </select>
          </div>
          <button onClick={handleAddUser} className="btn-primary w-full">Create User</button>
        </div>
      </Modal>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title={`Reset Password — ${selected}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">New Password</label>
            <input type="password" value={resetPass} onChange={e => setResetPass(e.target.value)} className="input w-full" />
          </div>
          <button onClick={handleResetPassword} className="btn-primary w-full flex items-center justify-center gap-2">
            <KeyRound size={16} /> Reset Password
          </button>
        </div>
      </Modal>
    </div>
  );
}
