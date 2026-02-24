import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { Server, Plus, Trash2, Plug, Terminal } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConnectSSH() {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [sshUser, setSshUser] = useState('');
  const [sshPass, setSshPass] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const { connectSSH } = useAuth();
  const navigate = useNavigate();
  const api = useApi();

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    try { setProfiles(await api.get('/api/connections')); } catch { /* ignore */ }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!host || !sshUser) { toast.error('Host and username are required.'); return; }
    setLoading(true);
    try {
      await api.post('/api/connections/connect', { host, port: parseInt(port), username: sshUser, password: sshPass });
      connectSSH({ host, port, username: sshUser });
      toast.success('Connected!');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!host || !sshUser) return;
    const name = `${sshUser}@${host}`;
    await api.post('/api/connections', { name, host, port: parseInt(port), username: sshUser });
    toast.success('Profile saved');
    loadProfiles();
  };

  const deleteProfile = async (name) => {
    await api.del(`/api/connections/${encodeURIComponent(name)}`);
    toast.success('Profile deleted');
    loadProfiles();
  };

  const loadProfile = (p) => {
    setHost(p.host);
    setPort(String(p.port || 22));
    setSshUser(p.username);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
            <Terminal size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">SSH Connection</h1>
        </div>

        <div className="card">
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Host</label>
                <input value={host} onChange={e => setHost(e.target.value)} placeholder="192.168.1.100" className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Port</label>
                <input value={port} onChange={e => setPort(e.target.value)} placeholder="22" className="input w-full" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Username</label>
              <input value={sshUser} onChange={e => setSshUser(e.target.value)} placeholder="root" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
              <input type="password" value={sshPass} onChange={e => setSshPass(e.target.value)} placeholder="Password" className="input w-full" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Plug size={16} />
                {loading ? 'Connecting...' : 'Connect'}
              </button>
              <button type="button" onClick={saveProfile} className="btn-secondary flex items-center gap-2">
                <Plus size={16} /> Save
              </button>
            </div>
          </form>
        </div>

        {profiles.length > 0 && (
          <div className="card mt-4">
            <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
              <Server size={14} /> Saved Connections
            </h3>
            <div className="space-y-2">
              {profiles.map(p => (
                <div key={p.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-surface-100 hover:bg-surface-200 transition-colors group">
                  <button onClick={() => loadProfile(p)} className="text-sm text-zinc-300 hover:text-zinc-100 text-left flex-1">
                    {p.name} <span className="text-zinc-500">:{p.port || 22}</span>
                  </button>
                  <button onClick={() => deleteProfile(p.name)} className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
