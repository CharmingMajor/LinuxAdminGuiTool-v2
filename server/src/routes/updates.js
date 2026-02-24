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
    const osResult = await ssh.executeCommand(id, "cat /etc/os-release | grep ^ID= | cut -d= -f2 | tr -d '\"'");
    const osId = osResult.stdout.trim().toLowerCase();
    let updates = [];

    if (['ubuntu', 'debian'].includes(osId)) {
      await ssh.executeCommand(id, 'apt-get update', true);
      const result = await ssh.executeCommand(id, 'apt list --upgradable 2>/dev/null | tail -n +2');
      updates = result.stdout.split('\n').filter(Boolean).map(line => {
        const match = line.match(/^(\S+)\/\S+\s+(\S+)\s+\S+\s+\[upgradable from: (\S+)\]/);
        if (match) return { package: match[1], available: match[2], current: match[3] };
        return null;
      }).filter(Boolean);
    } else {
      const result = await ssh.executeCommand(id, 'dnf check-update 2>/dev/null | tail -n +3');
      updates = result.stdout.split('\n').filter(Boolean).map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) return { package: parts[0], available: parts[1], current: 'installed' };
        return null;
      }).filter(Boolean);
    }

    res.json(updates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/install', requireRole('senior'), async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    const osResult = await ssh.executeCommand(id, "cat /etc/os-release | grep ^ID= | cut -d= -f2 | tr -d '\"'");
    const osId = osResult.stdout.trim().toLowerCase();
    const cmd = ['ubuntu', 'debian'].includes(osId)
      ? 'DEBIAN_FRONTEND=noninteractive apt-get upgrade -y'
      : 'dnf upgrade -y';
    const result = await ssh.executeCommand(id, cmd, true);
    await addSystemLog(req.user.username, 'install_updates', 'System packages updated');
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
