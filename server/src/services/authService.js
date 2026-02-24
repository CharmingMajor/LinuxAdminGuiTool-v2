import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const USERS_FILE = path.join(ROOT, 'config', 'users.json');
const BRUTE_FORCE_LOG = path.join(ROOT, 'logs', 'brute_force_logs.txt');
const LOCKOUT_DURATION = 300_000;
const MAX_ATTEMPTS = 3;
const IP_MAX_ATTEMPTS = 5;

const failedAttempts = new Map();
const ipAttempts = new Map();

function loadUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveUsers(users) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 4), 'utf-8');
}

function isAccountLocked(username) {
  const users = loadUsers();
  const user = users[username];
  if (!user || !user.locked_until) return { locked: false };
  const remaining = user.locked_until - Date.now();
  if (remaining <= 0) {
    user.locked_until = null;
    user.failed_attempts = 0;
    saveUsers(users);
    return { locked: false };
  }
  return { locked: true, remaining: Math.ceil(remaining / 1000) };
}

function isIpBlocked(ip) {
  const entry = ipAttempts.get(ip);
  if (!entry || entry.count < IP_MAX_ATTEMPTS) return { blocked: false };
  const remaining = (entry.lockedUntil || 0) - Date.now();
  if (remaining <= 0) {
    ipAttempts.delete(ip);
    return { blocked: false };
  }
  return { blocked: true, remaining: Math.ceil(remaining / 1000) };
}

function recordFailedAttempt(username, ip) {
  const users = loadUsers();
  const user = users[username];
  if (user) {
    user.failed_attempts = (user.failed_attempts || 0) + 1;
    user.last_attempt = new Date().toISOString();
    if (user.failed_attempts >= MAX_ATTEMPTS) {
      user.locked_until = Date.now() + LOCKOUT_DURATION;
    }
    saveUsers(users);
  }

  const entry = ipAttempts.get(ip) || { count: 0 };
  entry.count += 1;
  if (entry.count >= IP_MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }
  ipAttempts.set(ip, entry);

  logFailedAttempt(username, ip);
}

function logFailedAttempt(username, ip) {
  try {
    const dir = path.dirname(BRUTE_FORCE_LOG);
    fs.mkdirSync(dir, { recursive: true });
    const line = `[${new Date().toISOString()}] Failed login attempt - User: ${username}, IP: ${ip}\n`;
    fs.appendFileSync(BRUTE_FORCE_LOG, line);
  } catch { /* ignore */ }
}

export function authenticate(username, password, ip) {
  const ipCheck = isIpBlocked(ip);
  if (ipCheck.blocked) {
    return { success: false, message: `IP blocked. Try again in ${ipCheck.remaining}s.` };
  }

  const users = loadUsers();
  const user = users[username];
  if (!user) {
    recordFailedAttempt(username, ip);
    return { success: false, message: 'Invalid username or password.' };
  }

  const lockCheck = isAccountLocked(username);
  if (lockCheck.locked) {
    return { success: false, message: `Account locked. Try again in ${lockCheck.remaining}s.` };
  }

  if (!bcrypt.compareSync(password, user.password)) {
    recordFailedAttempt(username, ip);
    return { success: false, message: 'Invalid username or password.' };
  }

  // Clear failed attempts on success
  user.failed_attempts = 0;
  user.locked_until = null;
  user.last_attempt = null;
  saveUsers(users);
  ipAttempts.delete(ip);

  const token = jwt.sign(
    { username, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return { success: true, token, role: user.role, username };
}

export function changePassword(username, oldPassword, newPassword) {
  const users = loadUsers();
  const user = users[username];
  if (!user) return { success: false, message: 'User not found.' };
  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return { success: false, message: 'Current password is incorrect.' };
  }
  user.password = bcrypt.hashSync(newPassword, 12);
  saveUsers(users);
  return { success: true, message: 'Password changed.' };
}
