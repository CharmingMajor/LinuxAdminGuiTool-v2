import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const titles = {
  '/': 'Dashboard',
  '/system': 'System Monitor',
  '/users': 'Users & Groups',
  '/network': 'Network Manager',
  '/firewall': 'Firewall Configuration',
  '/services': 'Service Manager',
  '/permissions': 'Permissions & ACL',
  '/updates': 'System Updates',
  '/backups': 'Backup Manager',
  '/logs': 'Log Viewer',
  '/reports': 'Reports',
};

export default function Header() {
  const { auth } = useAuth();
  const location = useLocation();
  const title = titles[location.pathname] || 'Dashboard';

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-surface-50 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">{title}</h1>
        <p className="text-xs text-zinc-500">Home / {title}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-200">{auth?.username}</p>
          <p className="text-xs text-zinc-500 capitalize">{auth?.role}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-sm font-bold text-white">
          {auth?.username?.[0]?.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
