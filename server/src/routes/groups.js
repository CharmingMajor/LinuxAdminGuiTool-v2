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
    const result = await ssh.executeCommand(id, 'cat /etc/group');
    const groups = result.stdout.split('\n').filter(Boolean).map(line => {
      const [name, , gid, members] = line.split(':');
      return { name, gid, members: members || '' };
    });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { name, gid } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name required' });
  try {
    const cmd = gid ? `groupadd -g ${gid} ${name}` : `groupadd ${name}`;
    await ssh.executeCommand(id, cmd, true);
    await addSystemLog(req.user.username, 'create_group', `Created group: ${name}`);
    res.json({ success: true, message: `Group ${name} created.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:name', requireRole('senior'), async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { newName, newGid } = req.body;
  try {
    if (newName) await ssh.executeCommand(id, `groupmod -n ${newName} ${req.params.name}`, true);
    if (newGid) await ssh.executeCommand(id, `groupmod -g ${newGid} ${req.params.name}`, true);
    await addSystemLog(req.user.username, 'modify_group', `Modified group: ${req.params.name}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:name', requireRole('senior'), async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    await ssh.executeCommand(id, `groupdel ${req.params.name}`, true);
    await addSystemLog(req.user.username, 'delete_group', `Deleted group: ${req.params.name}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
