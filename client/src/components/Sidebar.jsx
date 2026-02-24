import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import {
  LayoutDashboard, Activity, Users, Network, Shield, Server,
  FolderKey, RefreshCw, HardDrive, FileText, ClipboardList,
  LogOut, Terminal, Unplug
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/system', label: 'System Monitor', icon: Activity },
  { path: '/users', label: 'Users & Groups', icon: Users },
  { path: '/network', label: 'Network', icon: Network },
  { path: '/firewall', label: 'Firewall', icon: Shield },
  { path: '/services', label: 'Services', icon: Server, seniorOnly: true },
  { path: '/permissions', label: 'Permissions', icon: FolderKey },
  { path: '/updates', label: 'Updates', icon: RefreshCw },
  { path: '/backups', label: 'Backups', icon: HardDrive },
  { path: '/logs', label: 'Logs', icon: FileText, seniorOnly: true },
  { path: '/reports', label: 'Reports', icon: ClipboardList },
];

export default function Sidebar() {
  const { auth, logout, sshInfo, disconnectSSH } = useAuth();
  const api = useApi();
  const navigate = useNavigate();

  const handleDisconnect = async () => {
    try {
      await api.post('/api/connections/disconnect');
      disconnectSSH();
      navigate('/connect');
      toast.success('Disconnected');
    } catch { /* ignore */ }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filtered = navItems.filter(item => !item.seniorOnly || auth?.role === 'senior');

  return (
    <aside className="w-60 h-screen bg-surface-50 border-r border-zinc-800/80 flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-zinc-800/80">
        <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
          <Terminal size={16} className="text-white" />
        </div>
        <span className="text-base font-bold text-zinc-100">Linux Admin</span>
      </div>

      <div className="px-3 pt-4 pb-2">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2">Navigation</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {filtered.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-muted text-brand border-l-2 border-brand'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-surface-200'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-zinc-800/80 space-y-2">
        {sshInfo && (
          <button onClick={handleDisconnect} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
            <Unplug size={16} />
            <span className="truncate text-xs">{sshInfo.username}@{sshInfo.host}</span>
          </button>
        )}
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
