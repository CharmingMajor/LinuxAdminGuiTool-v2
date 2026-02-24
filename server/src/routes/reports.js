import { Router } from 'express';
import { addReport, getReports, updateReportStatus, addTaskHistory, getTaskHistory, addSystemLog } from '../services/db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const reports = await getReports(req.user.username, req.user.role);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { reportType, description, toUser } = req.body;
  if (!reportType || !description) {
    return res.status(400).json({ error: 'Report type and description are required.' });
  }
  try {
    await addReport(req.user.username, toUser || 'senior', reportType, description);
    await addTaskHistory(req.user.username, reportType, description);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'in-progress', 'completed', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  try {
    await updateReportStatus(parseInt(req.params.id), status);
    await addSystemLog(req.user.username, 'update_report', `Report #${req.params.id} -> ${status}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tasks', async (req, res) => {
  try {
    const tasks = await getTaskHistory(req.user.username);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
