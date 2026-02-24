import { Router } from 'express';
import { authenticate, changePassword } from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
  const result = authenticate(username, password, ip);
  if (result.success) {
    return res.json({ token: result.token, role: result.role, username: result.username });
  }
  return res.status(401).json({ error: result.message });
});

router.post('/change-password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const result = changePassword(req.user.username, oldPassword, newPassword);
  if (result.success) return res.json({ message: result.message });
  return res.status(400).json({ error: result.message });
});

export default router;
