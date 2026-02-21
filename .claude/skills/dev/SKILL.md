---
name: dev
description: Setup complete development environment (Docker Desktop, MySQL Workbench, services, and browser)
allowed-tools: Bash
---

Set up the complete development environment:

1. Start Docker Desktop if not running: `start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"`
2. Start MySQL Workbench: `start "" "C:\Program Files\MySQL\MySQL Workbench 8.0 CE\MySQLWorkbench.exe"`
3. Open IntelliJ IDEA with the current directory: `start idea64 "$(pwd)"`
4. Wait a few seconds for Docker Desktop to initialize: `sleep 10`
5. Start all services with docker-compose in dev mode: `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build`
6. Wait for services to be ready: `sleep 15`
7. Open Chrome with the frontend: `start chrome http://localhost:5173`

Notes:
- If Docker Desktop, MySQL Workbench, or IntelliJ IDEA are installed in different locations, the paths may need to be adjusted
- IntelliJ IDEA command assumes `idea64` is in the system PATH
- The sleep commands ensure services have time to start up properly
- The frontend runs on port 5173 (Vite dev server) with hot reloading enabled
- The backend runs on port 3000
- All services (frontend, backend, mysql) will run in Docker containers
- Frontend source files are mounted as volumes, so changes are reflected immediately without rebuilding
