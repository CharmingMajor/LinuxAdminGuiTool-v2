import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export function useApi() {
  const { auth, logout } = useAuth();

  const request = useCallback(async (url, options = {}) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      logout();
      throw new Error('Session expired');
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }, [auth, logout]);

  const get = useCallback((url) => request(url), [request]);

  const post = useCallback((url, body) =>
    request(url, { method: 'POST', body: JSON.stringify(body) }), [request]);

  const put = useCallback((url, body) =>
    request(url, { method: 'PUT', body: JSON.stringify(body) }), [request]);

  const del = useCallback((url, body) =>
    request(url, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }), [request]);

  return { get, post, put, del };
}
