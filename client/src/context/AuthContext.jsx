import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    if (token && username && role) return { token, username, role };
    return null;
  });

  const [sshConnected, setSshConnected] = useState(false);
  const [sshInfo, setSshInfo] = useState(null);

  const login = useCallback((token, username, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
    setAuth({ token, username, role });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setAuth(null);
    setSshConnected(false);
    setSshInfo(null);
  }, []);

  const connectSSH = useCallback((info) => {
    setSshConnected(true);
    setSshInfo(info);
  }, []);

  const disconnectSSH = useCallback(() => {
    setSshConnected(false);
    setSshInfo(null);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout, sshConnected, sshInfo, connectSSH, disconnectSSH }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
