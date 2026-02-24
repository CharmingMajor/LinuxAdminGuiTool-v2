import { Router } from 'express';
import * as ssh from '../services/sshManager.js';
import { recordMetrics, getMetricsHistory } from '../services/db.js';

const router = Router();

function getConnId() {
  return ssh.getActiveConnection();
}

router.get('/info', async (req, res) => {
  const connId = getConnId();
  if (!connId) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    const [hostname, os, kernel, uptime] = await Promise.all([
      ssh.executeCommand(connId, 'hostname'),
      ssh.executeCommand(connId, 'cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d \'"\''),
      ssh.executeCommand(connId, 'uname -r'),
      ssh.executeCommand(connId, 'uptime -p'),
    ]);
    res.json({
      hostname: hostname.stdout,
      os: os.stdout,
      kernel: kernel.stdout,
      uptime: uptime.stdout,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/resources', async (req, res) => {
  const connId = getConnId();
  if (!connId) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    const [cpuRaw, memRaw, diskRaw, hostnameRaw] = await Promise.all([
      ssh.executeCommand(connId, "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'"),
      ssh.executeCommand(connId, "free -b | awk 'NR==2{printf \"%s %s %s\", $2, $3, $7}'"),
      ssh.executeCommand(connId, "df -B1 / | awk 'NR==2{printf \"%s %s %s\", $2, $3, $4}'"),
      ssh.executeCommand(connId, 'hostname'),
    ]);

    const cpu = parseFloat(cpuRaw.stdout) || 0;
    const [memTotal, memUsed, memAvail] = (memRaw.stdout || '0 0 0').split(' ').map(Number);
    const [diskTotal, diskUsed, diskAvail] = (diskRaw.stdout || '0 0 0').split(' ').map(Number);

    const memory = { total: memTotal, used: memUsed, available: memAvail, percent: memTotal ? (memUsed / memTotal * 100) : 0 };
    const disk = { total: diskTotal, used: diskUsed, available: diskAvail, percent: diskTotal ? (diskUsed / diskTotal * 100) : 0 };

    try {
      await recordMetrics(hostnameRaw.stdout.trim(), cpu, memory, disk);
    } catch { /* don't fail the response if metrics recording fails */ }

    res.json({ cpu, memory, disk });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (req, res) => {
  const connId = getConnId();
  if (!connId) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    const hostnameRaw = await ssh.executeCommand(connId, 'hostname');
    const hours = parseInt(req.query.hours) || 24;
    const history = await getMetricsHistory(hostnameRaw.stdout.trim(), hours);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/processes', async (req, res) => {
  const connId = getConnId();
  if (!connId) return res.status(400).json({ error: 'No active SSH connection' });
  try {
    const result = await ssh.executeCommand(connId, "ps aux --sort=-%cpu | head -50");
    const lines = result.stdout.split('\n').filter(Boolean);
    const processes = lines.slice(1).map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        user: parts[0], pid: parts[1], cpu: parts[2], mem: parts[3],
        vsz: parts[4], rss: parts[5], stat: parts[7],
        command: parts.slice(10).join(' '),
      };
    });
    res.json(processes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
