import { Router } from 'express';
import * as ssh from '../services/sshManager.js';
import { addSystemLog } from '../services/db.js';
import { requireRole } from '../middleware/roleGuard.js';

const router = Router();
function connId() { return ssh.getActiveConnection(); }

router.get('/status', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    const statusResult = await ssh.executeCommand(id, 'sudo ufw status numbered', true);
    const output = statusResult.stdout;
    const active = output.includes('Status: active');
    const rules = [];
    const lines = output.split('\n');
    for (const line of lines) {
      const match = line.match(/\[\s*(\d+)\]\s+(.*?)\s+(ALLOW|DENY|REJECT|LIMIT)\s+(.*)/);
      if (match) {
        rules.push({ number: match[1], to: match[2].trim(), action: match[3], from: match[4].trim() });
      }
    }
    res.json({ active, rules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/toggle', requireRole('senior'), async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { enable } = req.body;
  try {
    const cmd = enable ? 'echo y | sudo ufw enable' : 'sudo ufw disable';
    await ssh.executeCommand(id, cmd, true);
    await addSystemLog(req.user.username, 'firewall_toggle', enable ? 'enabled' : 'disabled');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rules', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { rule } = req.body;
  if (!rule) return res.status(400).json({ error: 'Rule required (e.g. "allow 22/tcp")' });
  try {
    const result = await ssh.executeCommand(id, `sudo ufw ${rule}`, true);
    await addSystemLog(req.user.username, 'add_firewall_rule', rule);
    res.json({ success: true, output: result.stdout });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/rules/:number', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    await ssh.executeCommand(id, `echo y | sudo ufw delete ${req.params.number}`, true);
    await addSystemLog(req.user.username, 'delete_firewall_rule', `Rule #${req.params.number}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
