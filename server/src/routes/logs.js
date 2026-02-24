import { Router } from 'express';
import { getSystemLogs } from '../services/db.js';
import { requireRole } from '../middleware/roleGuard.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');

const router = Router();

router.get('/', requireRole('senior'), async (req, res) => {
  const { file, filter, lines } = req.query;
  const limit = parseInt(lines) || 100;

  if (file === 'app' || file === 'brute_force') {
    const logFile = file === 'app'
      ? path.join(ROOT, 'logs', 'app.log')
      : path.join(ROOT, 'logs', 'brute_force_logs.txt');
    try {
      if (!fs.existsSync(logFile)) return res.json({ lines: [] });
      const content = fs.readFileSync(logFile, 'utf-8');
      let logLines = content.split('\n').filter(Boolean);
      if (filter) {
        logLines = logLines.filter(l => l.toUpperCase().includes(filter.toUpperCase()));
      }
      res.json({ lines: logLines.slice(-limit) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    try {
      const logs = await getSystemLogs(limit);
      res.json({ logs });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;
