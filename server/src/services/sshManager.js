import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const PROFILES_FILE = path.join(ROOT, 'config', 'ssh_connections.json');
const connections = new Map();

function ensureProfilesFile() {
  const dir = path.dirname(PROFILES_FILE);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(PROFILES_FILE)) {
    fs.writeFileSync(PROFILES_FILE, '[]', 'utf-8');
  }
}

export function getSavedConnections() {
  ensureProfilesFile();
  try {
    return JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export function saveConnectionProfile(profile) {
  const profiles = getSavedConnections();
  const idx = profiles.findIndex(p => p.name === profile.name);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.push(profile);
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
  return true;
}

export function deleteConnectionProfile(name) {
  const profiles = getSavedConnections().filter(p => p.name !== name);
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
  return true;
}

export function connect(host, port, username, password, privateKeyPath) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const connId = `${username}@${host}:${port}`;

    const config = { host, port: parseInt(port) || 22, username, readyTimeout: 10000 };

    if (privateKeyPath && fs.existsSync(privateKeyPath)) {
      config.privateKey = fs.readFileSync(privateKeyPath);
    }
    if (password) {
      config.password = password;
    }

    conn.on('ready', () => {
      connections.set(connId, { conn, password, host, port, username });
      resolve({ connId, success: true });
    });

    conn.on('error', (err) => {
      reject(new Error(err.message || 'SSH connection failed'));
    });

    conn.connect(config);
  });
}

export function disconnect(connId) {
  const entry = connections.get(connId);
  if (entry) {
    entry.conn.end();
    connections.delete(connId);
    return true;
  }
  return false;
}

export function executeCommand(connId, command, useSudo = false) {
  return new Promise((resolve, reject) => {
    const entry = connections.get(connId);
    if (!entry) return reject(new Error('Not connected'));

    let cmd = command;
    if (useSudo && entry.password) {
      cmd = `echo '${entry.password.replace(/'/g, "'\\''")}' | sudo -S ${command}`;
    } else if (useSudo) {
      cmd = `sudo ${command}`;
    }

    entry.conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = '';
      let stderr = '';
      stream.on('data', (data) => { stdout += data.toString(); });
      stream.stderr.on('data', (data) => { stderr += data.toString(); });
      stream.on('close', () => {
        // Strip sudo password prompt from stderr
        stderr = stderr.replace(/\[sudo\].*?:\s*/g, '').trim();
        resolve({ stdout: stdout.trim(), stderr });
      });
    });
  });
}

export function getActiveConnection() {
  const entries = Array.from(connections.entries());
  if (entries.length === 0) return null;
  return entries[entries.length - 1][0];
}

export function isConnected(connId) {
  return connections.has(connId);
}

export function getConnectionInfo(connId) {
  const entry = connections.get(connId);
  if (!entry) return null;
  return { host: entry.host, port: entry.port, username: entry.username };
}
