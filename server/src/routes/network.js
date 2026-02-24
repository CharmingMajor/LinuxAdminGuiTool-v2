import { Router } from 'express';
import * as ssh from '../services/sshManager.js';
import { addSystemLog } from '../services/db.js';
import { requireRole } from '../middleware/roleGuard.js';

const router = Router();
function connId() { return ssh.getActiveConnection(); }

router.get('/interfaces', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    const result = await ssh.executeCommand(id, "ip -br addr show");
    const interfaces = result.stdout.split('\n').filter(Boolean).map(line => {
      const parts = line.trim().split(/\s+/);
      return { name: parts[0], state: parts[1], ip_address: parts.slice(2).join(', ') || 'N/A' };
    });
    res.json(interfaces);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/interfaces/:name/enable', requireRole('senior'), async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    await ssh.executeCommand(id, `ip link set ${req.params.name} up`, true);
    await addSystemLog(req.user.username, 'enable_interface', req.params.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/interfaces/:name/disable', requireRole('senior'), async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    await ssh.executeCommand(id, `ip link set ${req.params.name} down`, true);
    await addSystemLog(req.user.username, 'disable_interface', req.params.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/interfaces/:name/ip', requireRole('senior'), async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { ip_address, netmask } = req.body;
  try {
    await ssh.executeCommand(id, `ip addr flush dev ${req.params.name}`, true);
    await ssh.executeCommand(id, `ip addr add ${ip_address}/${netmask || '24'} dev ${req.params.name}`, true);
    await addSystemLog(req.user.username, 'set_ip', `${req.params.name}: ${ip_address}/${netmask || '24'}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ping', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { host, count } = req.body;
  try {
    const result = await ssh.executeCommand(id, `ping -c ${count || 4} ${host || '8.8.8.8'}`);
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
