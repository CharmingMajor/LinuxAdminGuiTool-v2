import { Router } from 'express';
import * as ssh from '../services/sshManager.js';
import { addSystemLog } from '../services/db.js';
import { requireRole } from '../middleware/roleGuard.js';

const router = Router();
function connId() { return ssh.getActiveConnection(); }

router.get('/', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    const result = await ssh.executeCommand(id,
      "systemctl list-units --type=service --state=running --no-pager --no-legend | head -50");
    const services = result.stdout.split('\n').filter(Boolean).map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        name: parts[0]?.replace('.service', ''),
        load: parts[1],
        active: parts[2],
        sub: parts[3],
        description: parts.slice(4).join(' '),
      };
    });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:name/restart', requireRole('senior'), async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    await ssh.executeCommand(id, `systemctl restart ${req.params.name}`, true);
    await addSystemLog(req.user.username, 'restart_service', req.params.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:name/stop', requireRole('senior'), async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    await ssh.executeCommand(id, `systemctl stop ${req.params.name}`, true);
    await addSystemLog(req.user.username, 'stop_service', req.params.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
