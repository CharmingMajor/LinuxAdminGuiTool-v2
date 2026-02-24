import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ConnectSSH from './pages/ConnectSSH';
import Dashboard from './pages/Dashboard';
import SystemMonitor from './pages/SystemMonitor';
import UserManagement from './pages/UserManagement';
import NetworkManager from './pages/NetworkManager';
import FirewallConfig from './pages/FirewallConfig';
import ServiceManager from './pages/ServiceManager';
import Permissions from './pages/Permissions';
import Updates from './pages/Updates';
import Backups from './pages/Backups';
import LogViewer from './pages/LogViewer';
import Reports from './pages/Reports';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/connect" element={<ProtectedRoute><ConnectSSH /></ProtectedRoute>} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/system" element={<SystemMonitor />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/network" element={<NetworkManager />} />
            <Route path="/firewall" element={<FirewallConfig />} />
            <Route path="/services" element={<ProtectedRoute requiredRole="senior"><ServiceManager /></ProtectedRoute>} />
            <Route path="/permissions" element={<Permissions />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/backups" element={<Backups />} />
            <Route path="/logs" element={<ProtectedRoute requiredRole="senior"><LogViewer /></ProtectedRoute>} />
            <Route path="/reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#18181b', color: '#e4e4e7', border: '1px solid #27272a', fontSize: '14px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#18181b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#18181b' } },
        }}
      />
    </AuthProvider>
  );
}
