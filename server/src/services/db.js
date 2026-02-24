import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'linux_admin',
  user: process.env.PG_USER || 'admin',
  password: process.env.PG_PASSWORD || 'changeme',
  max: 20,
  idleTimeoutMillis: 30000,
});

export async function getDb() {
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      from_user TEXT NOT NULL,
      to_user TEXT NOT NULL,
      report_type TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending'
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS system_logs (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "user" TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS user_settings (
      username TEXT PRIMARY KEY,
      settings JSONB NOT NULL DEFAULT '{}'
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "user" TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'completed'
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS monitoring_history (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      host TEXT NOT NULL,
      cpu_percent REAL,
      mem_total BIGINT,
      mem_used BIGINT,
      mem_percent REAL,
      disk_total BIGINT,
      disk_used BIGINT,
      disk_percent REAL
    )`);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_monitoring_ts ON monitoring_history (timestamp DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_syslog_ts ON system_logs (timestamp DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reports_ts ON reports (timestamp DESC)`);

    console.log('Database tables initialized');
  } finally {
    client.release();
  }
  return pool;
}

function now() {
  return new Date().toISOString();
}

export async function addReport(fromUser, toUser, reportType, description) {
  await pool.query(
    'INSERT INTO reports (timestamp, from_user, to_user, report_type, description) VALUES ($1,$2,$3,$4,$5)',
    [now(), fromUser, toUser, reportType, description]
  );
  return true;
}

export async function getReports(user, role) {
  const col = role === 'senior' ? 'to_user' : 'from_user';
  const { rows } = await pool.query(
    `SELECT * FROM reports WHERE ${col} = $1 ORDER BY timestamp DESC`, [user]
  );
  return rows;
}

export async function updateReportStatus(id, status) {
  await pool.query('UPDATE reports SET status = $1 WHERE id = $2', [status, id]);
  return true;
}

export async function addSystemLog(user, action, details = null) {
  await pool.query(
    'INSERT INTO system_logs (timestamp, "user", action, details) VALUES ($1,$2,$3,$4)',
    [now(), user, action, details]
  );
}

export async function getSystemLogs(limit = 100) {
  const { rows } = await pool.query(
    'SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT $1', [limit]
  );
  return rows;
}

export async function addTaskHistory(user, type, description, status = 'completed') {
  await pool.query(
    'INSERT INTO tasks (timestamp, "user", type, description, status) VALUES ($1,$2,$3,$4,$5)',
    [now(), user, type, description, status]
  );
}

export async function getTaskHistory(user) {
  const { rows } = await pool.query(
    'SELECT * FROM tasks WHERE "user" = $1 ORDER BY timestamp DESC', [user]
  );
  return rows;
}

export async function recordMetrics(host, cpu, memory, disk) {
  await pool.query(
    `INSERT INTO monitoring_history (timestamp, host, cpu_percent, mem_total, mem_used, mem_percent, disk_total, disk_used, disk_percent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [now(), host, cpu, memory.total, memory.used, memory.percent, disk.total, disk.used, disk.percent]
  );
}

export async function getMetricsHistory(host, hours = 24) {
  const { rows } = await pool.query(
    `SELECT * FROM monitoring_history WHERE host = $1 AND timestamp > NOW() - INTERVAL '1 hour' * $2 ORDER BY timestamp ASC`,
    [host, hours]
  );
  return rows;
}
