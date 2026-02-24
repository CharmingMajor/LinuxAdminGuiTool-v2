import { Router } from 'express';
import * as ssh from '../services/sshManager.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(ssh.getSavedConnections());
});

router.post('/', (req, res) => {
  const { name, host, port, username } = req.body;
  if (!name || !host || !username) {
    return res.status(400).json({ error: 'name, host, and username are required.' });
  }
  ssh.saveConnectionProfile({ name, host, port: port || 22, username });
  res.json({ success: true });
});

router.delete('/:name', (req, res) => {
  ssh.deleteConnectionProfile(req.params.name);
  res.json({ success: true });
});

router.post('/connect', async (req, res) => {
  const { host, port, username, password, privateKeyPath } = req.body;
  try {
    const result = await ssh.connect(host, port || 22, username, password, privateKeyPath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/disconnect', (req, res) => {
  const connId = ssh.getActiveConnection();
  if (connId) {
    ssh.disconnect(connId);
    return res.json({ success: true });
  }
  res.status(400).json({ error: 'No active connection.' });
});

router.get('/status', (req, res) => {
  const connId = ssh.getActiveConnection();
  if (connId) {
    const info = ssh.getConnectionInfo(connId);
    return res.json({ connected: true, connId, ...info });
  }
  res.json({ connected: false });
});

export default router;
