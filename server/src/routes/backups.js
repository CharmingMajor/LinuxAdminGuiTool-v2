import { Router } from 'express';
import * as ssh from '../services/sshManager.js';
import { addSystemLog } from '../services/db.js';

const router = Router();
function connId() { return ssh.getActiveConnection(); }

router.get('/', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    const result = await ssh.executeCommand(id, "cat /var/log/backup.log 2>/dev/null || echo ''");
    const backups = result.stdout.split('\n').filter(Boolean).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        const parts = line.split('|');
        if (parts.length >= 4) {
          return { date: parts[0], type: parts[1], source: parts[2], destination: parts[3], status: parts[4] || 'unknown' };
        }
        return null;
      }
    }).filter(Boolean);
    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { source, destination, type } = req.body;
  if (!source || !destination) return res.status(400).json({ error: 'Source and destination required' });
  try {
    await ssh.executeCommand(id, `mkdir -p "${destination}"`, true);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.tar.gz`;
    const excludes = '--exclude=/proc --exclude=/sys --exclude=/dev --exclude=/run';
    const cmd = type === 'incremental'
      ? `tar czf "${destination}/${filename}" ${excludes} --newer-mtime="1 day ago" "${source}"`
      : `tar czf "${destination}/${filename}" ${excludes} "${source}"`;
    await ssh.executeCommand(id, cmd, true);

    const logEntry = JSON.stringify({ date: new Date().toISOString(), type: type || 'full', source, destination: `${destination}/${filename}`, status: 'completed' });
    await ssh.executeCommand(id, `echo '${logEntry}' | sudo tee -a /var/log/backup.log`, true);
    await addSystemLog(req.user.username, 'create_backup', `${source} -> ${destination}/${filename}`);
    res.json({ success: true, filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/restore', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  const { backupFile, restorePath } = req.body;
  if (!backupFile || !restorePath) return res.status(400).json({ error: 'Backup file and restore path required' });
  try {
    await ssh.executeCommand(id, `tar xzf "${backupFile}" -C "${restorePath}"`, true);
    await addSystemLog(req.user.username, 'restore_backup', `${backupFile} -> ${restorePath}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:file', async (req, res) => {
  const id = connId();
  if (!id) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    await ssh.executeCommand(id, `rm -f "${req.params.file}"`, true);
    await addSystemLog(req.user.username, 'delete_backup', req.params.file);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
