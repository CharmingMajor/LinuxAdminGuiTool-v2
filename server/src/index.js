import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import connectionRoutes from './routes/connections.js';
import systemRoutes from './routes/system.js';
import userRoutes from './routes/users.js';
import groupRoutes from './routes/groups.js';
import networkRoutes from './routes/network.js';
import firewallRoutes from './routes/firewall.js';
import serviceRoutes from './routes/services.js';
import permissionRoutes from './routes/permissions.js';
import updateRoutes from './routes/updates.js';
import backupRoutes from './routes/backups.js';
import logRoutes from './routes/logs.js';
import reportRoutes from './routes/reports.js';
import { getDb } from './services/db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many login attempts.' } });
app.use('/api/auth/login', loginLimiter);

app.use('/api/auth', authRoutes);

app.use('/api/connections', authMiddleware, connectionRoutes);
app.use('/api/system', authMiddleware, systemRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/groups', authMiddleware, groupRoutes);
app.use('/api/network', authMiddleware, networkRoutes);
app.use('/api/firewall', authMiddleware, firewallRoutes);
app.use('/api/services', authMiddleware, serviceRoutes);
app.use('/api/permissions', authMiddleware, permissionRoutes);
app.use('/api/updates', authMiddleware, updateRoutes);
app.use('/api/backups', authMiddleware, backupRoutes);
app.use('/api/logs', authMiddleware, logRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await getDb();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
