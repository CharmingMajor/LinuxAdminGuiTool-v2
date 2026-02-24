import { Router } from 'express';
import * as ssh from '../services/sshManager.js';
import { addSystemLog } from '../services/db.js';

const router = Router();
function connId() { return ssh.getActiveConnection(); }

router.post('/ownership', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { path: filePath, owner, group, recursive } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path required' });
  try {
    const ownerSpec = [owner, group].filter(Boolean).join(':') || owner;
    const cmd = `chown ${recursive ? '-R ' : ''}${ownerSpec} "${filePath}"`;
    await ssh.executeCommand(id, cmd, true);
    await addSystemLog(req.user.username, 'change_ownership', `${filePath} -> ${ownerSpec}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/mode', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { path: filePath, permissions, recursive } = req.body;
  if (!filePath || !permissions) return res.status(400).json({ error: 'Path and permissions required' });
  if (!/^[0-7]{3,4}$/.test(permissions)) return res.status(400).json({ error: 'Invalid permissions format' });
  try {
    const cmd = `chmod ${recursive ? '-R ' : ''}${permissions} "${filePath}"`;
    await ssh.executeCommand(id, cmd, true);
    await addSystemLog(req.user.username, 'change_permissions', `${filePath} -> ${permissions}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/acl', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { path: filePath } = req.query;
  if (!filePath) return res.status(400).json({ error: 'Path required' });
  try {
    const result = await ssh.executeCommand(id, `getfacl "${filePath}"`);
    res.json({ output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/acl', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { path: filePath, spec, recursive } = req.body;
  if (!filePath || !spec) return res.status(400).json({ error: 'Path and ACL spec required' });
  try {
    const cmd = `setfacl ${recursive ? '-R ' : ''}-m ${spec} "${filePath}"`;
    await ssh.executeCommand(id, cmd, true);
    await addSystemLog(req.user.username, 'set_acl', `${filePath}: ${spec}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/acl', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { path: filePath, spec, recursive } = req.body;
  if (!filePath || !spec) return res.status(400).json({ error: 'Path and ACL spec required' });
  try {
    const cmd = `setfacl ${recursive ? '-R ' : ''}-x ${spec} "${filePath}"`;
    await ssh.executeCommand(id, cmd, true);
    await addSystemLog(req.user.username, 'remove_acl', `${filePath}: ${spec}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
