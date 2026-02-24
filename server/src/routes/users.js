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
    const result = await ssh.executeCommand(id, "cat /etc/passwd");
    const users = result.stdout.split('\n').filter(Boolean).map(line => {
      const [username, , uid, gid, comment, home, shell] = line.split(':');
      return { username, uid, gid, comment, home, shell };
    }).filter(u => {
      const uid = parseInt(u.uid);
      return uid >= 1000 && !u.shell?.includes('nologin') && !u.shell?.includes('false');
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { username, password, groups, shell, comment } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  try {
    let cmd = `useradd -m -s ${shell || '/bin/bash'}`;
    if (comment) cmd += ` -c "${comment}"`;
    cmd += ` ${username}`;
    await ssh.executeCommand(id, cmd, true);
    if (password) {
      await ssh.executeCommand(id, `echo "${username}:${password}" | chpasswd`, true);
    }
    if (groups && groups.length) {
      await ssh.executeCommand(id, `usermod -aG ${groups.join(',')} ${username}`, true);
    }
    await addSystemLog(req.user.username, 'create_user', `Created user: ${username}`);
    res.json({ success: true, message: `User ${username} created.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:username', requireRole('senior'), async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { password, addGroups, removeGroups, shell, comment, lock, unlock } = req.body;
  const target = req.params.username;
  try {
    if (shell) await ssh.executeCommand(id, `usermod -s ${shell} ${target}`, true);
    if (comment) await ssh.executeCommand(id, `usermod -c "${comment}" ${target}`, true);
    if (addGroups?.length) await ssh.executeCommand(id, `usermod -aG ${addGroups.join(',')} ${target}`, true);
    if (removeGroups?.length) {
      for (const g of removeGroups) {
        await ssh.executeCommand(id, `gpasswd -d ${target} ${g}`, true);
      }
    }
    if (password) await ssh.executeCommand(id, `echo "${target}:${password}" | chpasswd`, true);
    if (lock) await ssh.executeCommand(id, `usermod -L ${target}`, true);
    if (unlock) await ssh.executeCommand(id, `usermod -U ${target}`, true);
    await addSystemLog(req.user.username, 'modify_user', `Modified user: ${target}`);
    res.json({ success: true, message: `User ${target} modified.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:username', requireRole('senior'), async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { deleteHome } = req.query;
  try {
    const cmd = deleteHome === 'true' ? `userdel -r ${req.params.username}` : `userdel ${req.params.username}`;
    await ssh.executeCommand(id, cmd, true);
    await addSystemLog(req.user.username, 'delete_user', `Deleted user: ${req.params.username}`);
    res.json({ success: true, message: `User ${req.params.username} deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:username/reset-password', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  try {
    await ssh.executeCommand(id, `echo "${req.params.username}:${password}" | chpasswd`, true);
    await addSystemLog(req.user.username, 'reset_password', `Reset password for: ${req.params.username}`);
    res.json({ success: true, message: `Password reset for ${req.params.username}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
