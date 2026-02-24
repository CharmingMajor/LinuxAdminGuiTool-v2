# Linux Admin GUI Tool

A modern web-based dashboard for managing Linux systems remotely via SSH. Features role-based access control, real-time monitoring, and integrated analytics with Metabase.

## Tech Stack


| Layer         | Technologies                                         |
| ------------- | ---------------------------------------------------- |
| **Frontend**  | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons |
| **Backend**   | Node.js, Express, SSH2, WebSocket                    |
| **Database**  | PostgreSQL 16                                        |
| **Analytics** | Metabase                                             |
| **Auth**      | JWT, bcrypt                                          |
| **Infra**     | Docker, Docker Compose                               |


## Features

### System Administration

- **Dashboard** — Real-time CPU, memory, disk, and process overview
- **User & Group Management** — Full CRUD for Linux users and groups
- **Network Manager** — Interface configuration, connectivity testing
- **Firewall Config** — UFW rule management
- **Service Manager** — Start, stop, restart systemd services
- **File Permissions** — Permission and ACL management
- **System Updates** — View and install package updates
- **Backup Management** — Create and restore system backups
- **Log Viewer** — Browse and search system logs
- **Reports** — Junior admin task reporting

### Role-Based Access


| Capability        | Senior       | Junior                   |
| ----------------- | ------------ | ------------------------ |
| System monitoring | Full         | Read-only                |
| User management   | Full CRUD    | Create & reset passwords |
| Network           | Full config  | Monitor & ping           |
| Firewall          | Full config  | —                        |
| Services          | Full control | —                        |
| Permissions       | Full edit    | View only                |
| Logs              | Full access  | —                        |
| Reports           | Review       | Submit                   |


## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/) & Docker Compose

### 1. Clone and configure

```bash
git clone https://github.com/CharmingMajor/LinuxAdminGuiTool.git
cd LinuxAdminGuiTool
cp server/.env.example server/.env
```

### 2. Start infrastructure

```bash
docker compose up -d postgres test-system-1 test-system-2
```

This starts:

- **PostgreSQL** on port `5432`
- **test-system-1** on port `2222` (SSH: `adminuser` / `admin123`)
- **test-system-2** on port `2223` (SSH: `testuser` / `password123`)

### 3. Start the backend

```bash
cd server
npm install
npm run dev
```

API server runs at `http://localhost:3001`.

### 4. Start the frontend

```bash
cd client
npm install
npm run dev
```

UI opens at `http://localhost:5173`.

### 5. Login


| Username | Password | Role                 |
| -------- | -------- | -------------------- |
| `senior` | `senior` | Senior — full access |
| `junior` | `junior` | Junior — restricted  |


After login, connect to a test container via the SSH connection page (host: `localhost`, port: `2222`, user: `adminuser`, pass: `admin123`).

### Docker Compose (full stack)

To run everything in containers:

```bash
docker compose up -d
```

This starts all services including the client (port `5173`), server (port `3001`), PostgreSQL, and test SSH containers.

## Metabase Analytics (Optional)

```bash
docker compose up -d metabase
```

Available at `http://localhost:3000` after startup. Auto-discovers these tables:


| Table                | Contents                                 |
| -------------------- | ---------------------------------------- |
| `monitoring_history` | CPU, memory, disk metrics per poll cycle |
| `system_logs`        | Audit trail of admin actions             |
| `reports`            | Task reports from junior admins          |
| `tasks`              | Task completion history                  |


## Project Structure

```
├── client/                  # React + Vite frontend
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── context/         # Auth context provider
│       ├── hooks/           # API & polling hooks
│       └── pages/           # Route page components
├── server/                  # Node.js + Express API
│   └── src/
│       ├── middleware/      # JWT auth & role guard
│       ├── routes/          # REST API endpoints
│       └── services/        # Auth, DB, SSH services
├── config/                  # Runtime config (gitignored)
├── docker/                  # Test container Dockerfile
└── docker-compose.yml       # Full stack orchestration
```

## Configuration


| File                          | Purpose                                           |
| ----------------------------- | ------------------------------------------------- |
| `server/.env`                 | Server environment variables (see `.env.example`) |
| `config/users.json`           | App user credentials (auto-created on first run)  |
| `config/ssh_connections.json` | Saved SSH connection profiles                     |


## License
