import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import { FolderKey, FileKey, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Permissions() {
  const api = useApi();
  const { auth } = useAuth();
  const isSenior = auth?.role === 'senior';

  const [chmodPath, setChmodPath] = useState('');
  const [permissions, setPermissions] = useState('755');
  const [chmodRecursive, setChmodRecursive] = useState(false);

  const [chownPath, setChownPath] = useState('');
  const [owner, setOwner] = useState('');
  const [group, setGroup] = useState('');
  const [chownRecursive, setChownRecursive] = useState(false);

  const [aclPath, setAclPath] = useState('');
  const [aclSpec, setAclSpec] = useState('');
  const [aclOutput, setAclOutput] = useState('');
  const [aclRecursive, setAclRecursive] = useState(false);

  const handleChmod = async () => {
    if (!chmodPath || !permissions) { toast.error('Path and permissions required'); return; }
    try {
      await api.post('/api/permissions/mode', { path: chmodPath, permissions, recursive: chmodRecursive });
      toast.success('Permissions updated');
    } catch (e) { toast.error(e.message); }
  };

  const handleChown = async () => {
    if (!chownPath) { toast.error('Path required'); return; }
    try {
      await api.post('/api/permissions/ownership', { path: chownPath, owner, group, recursive: chownRecursive });
      toast.success('Ownership updated');
    } catch (e) { toast.error(e.message); }
  };

  const handleViewAcl = async () => {
    if (!aclPath) { toast.error('Path required'); return; }
    try {
      const res = await api.get(`/api/permissions/acl?path=${encodeURIComponent(aclPath)}`);
      setAclOutput(res.output);
    } catch (e) { toast.error(e.message); }
  };

  const handleSetAcl = async () => {
    if (!aclPath || !aclSpec) { toast.error('Path and ACL spec required'); return; }
    try {
      await api.post('/api/permissions/acl', { path: aclPath, spec: aclSpec, recursive: aclRecursive });
      toast.success('ACL updated');
      handleViewAcl();
    } catch (e) { toast.error(e.message); }
  };

  const handleRemoveAcl = async () => {
    if (!aclPath || !aclSpec) { toast.error('Path and ACL spec required'); return; }
    try {
      await api.del('/api/permissions/acl', { path: aclPath, spec: aclSpec, recursive: aclRecursive });
      toast.success('ACL entry removed');
      handleViewAcl();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <Card title="Change Permissions (chmod)" icon={FolderKey}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2">
          <div className="sm:col-span-2">
            <label className="block text-xs text-zinc-400 mb-1">Path</label>
            <input value={chmodPath} onChange={e => setChmodPath(e.target.value)} placeholder="/home/user/file.txt" className="input w-full" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Mode</label>
            <input value={permissions} onChange={e => setPermissions(e.target.value)} placeholder="755" className="input w-full" />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
              <input type="checkbox" checked={chmodRecursive} onChange={e => setChmodRecursive(e.target.checked)} className="rounded border-zinc-600" />
              Recursive
            </label>
            <button onClick={handleChmod} disabled={!isSenior} className="btn-primary text-xs flex-1">Apply</button>
          </div>
        </div>
      </Card>

      <Card title="Change Ownership (chown)" icon={FileKey}>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-2">
          <div className="sm:col-span-2">
            <label className="block text-xs text-zinc-400 mb-1">Path</label>
            <input value={chownPath} onChange={e => setChownPath(e.target.value)} placeholder="/home/user/file.txt" className="input w-full" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Owner</label>
            <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="root" className="input w-full" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Group</label>
            <input value={group} onChange={e => setGroup(e.target.value)} placeholder="root" className="input w-full" />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
              <input type="checkbox" checked={chownRecursive} onChange={e => setChownRecursive(e.target.checked)} className="rounded border-zinc-600" />
              Recursive
            </label>
            <button onClick={handleChown} disabled={!isSenior} className="btn-primary text-xs flex-1">Apply</button>
          </div>
        </div>
      </Card>

      <Card title="Access Control Lists (ACL)" icon={ShieldCheck}>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Path</label>
              <input value={aclPath} onChange={e => setAclPath(e.target.value)} placeholder="/home/user" className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">ACL Spec</label>
              <input value={aclSpec} onChange={e => setAclSpec(e.target.value)} placeholder="u:user:rwx" className="input w-full" />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleViewAcl} className="btn-secondary text-xs flex-1">View ACL</button>
              {isSenior && <button onClick={handleSetAcl} className="btn-primary text-xs">Set</button>}
              {isSenior && <button onClick={handleRemoveAcl} className="btn-danger text-xs">Remove</button>}
            </div>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
            <input type="checkbox" checked={aclRecursive} onChange={e => setAclRecursive(e.target.checked)} className="rounded border-zinc-600" />
            Recursive
          </label>
          {aclOutput && (
            <pre className="p-4 bg-surface-100 rounded-lg text-xs text-zinc-300 font-mono overflow-x-auto max-h-48 overflow-y-auto">{aclOutput}</pre>
          )}
        </div>
      </Card>
    </div>
  );
}
