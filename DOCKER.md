# Docker Setup Guide

This guide explains how to run the complete HOPS application stack using Docker containers.

## Architecture

The application consists of three Docker services:
- **Frontend** - Vue.js app served by nginx (port 80)
- **Backend** - Fastify API server (port 3000)
- **MySQL** - Database server (port 3306)

## Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)

## Quick Start

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **(Optional) Edit `.env` to customize configuration**

3. **Build and start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Check if containers are running:**
   ```bash
   docker-compose ps
   ```

5. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:3000
   - Backend Health: http://localhost:3000/health
   - MySQL: localhost:3306

## Services

### Frontend (`frontend`)
- **Container:** hops-frontend
- **Port:** 80
- **Technology:** Vue 3 + Vite, served by nginx
- **Build:** Multi-stage build (npm build → nginx)
- **Features:**
  - Serves static files
  - Proxies `/api` requests to backend
  - Vue Router support (SPA mode)
  - Gzip compression enabled

### Backend (`backend`)
- **Container:** hops-backend
- **Port:** 3000
- **Technology:** Fastify with TypeScript
- **Build:** Multi-stage build including model package
- **Dependencies:** Waits for MySQL to be healthy
- **Health Check:** `/health` endpoint

### MySQL (`mysql`)
- **Container:** hops-mysql
- **Port:** 3306
- **Image:** MySQL 8.0
- **Database:** hops_db
- **User:** hops_user
- **Data:** Persisted in Docker volume `mysql_data`

## Common Commands

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Rebuild after code changes
```bash
# Rebuild all
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Check service status
```bash
docker-compose ps
```

### Execute commands in containers
```bash
# Backend shell
docker-compose exec backend sh

# MySQL CLI
docker-compose exec mysql mysql -u hops_user -p hops_db

# Frontend nginx shell
docker-compose exec frontend sh
```

### Remove containers and volumes (⚠️ destroys data)
```bash
docker-compose down -v
```

## Development Workflow

### Making Backend Changes

1. Edit code in `backend/` or `model/`
2. Rebuild backend:
   ```bash
   docker-compose up -d --build backend
   ```
3. View logs:
   ```bash
   docker-compose logs -f backend
   ```

### Making Frontend Changes

1. Edit code in `frontend/`
2. Rebuild frontend:
   ```bash
   docker-compose up -d --build frontend
   ```
3. Clear browser cache and reload

### Making Model Changes

When model changes occur, follow the versioning rules in CLAUDE.md:

1. Update model files in `model/src/`
2. Bump version in `model/package.json`:
   ```bash
   cd model && npm version patch
   ```
3. Rebuild backend (includes model package):
   ```bash
   cd .. && docker-compose up -d --build backend
   ```

## Networking

All services communicate via the `hops-network` Docker bridge network:

- Frontend → Backend: `http://backend:3000`
- Backend → MySQL: `mysql:3306`
- Frontend nginx proxies `/api/*` to backend

External access:
- Frontend: http://localhost:80
- Backend: http://localhost:3000
- MySQL: localhost:3306

## Environment Variables

The `.env` file in the root directory configures all services:

```env
# MySQL Configuration
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=hops_db
MYSQL_USER=hops_user
MYSQL_PASSWORD=hops_password
MYSQL_PORT=3306

# Backend Configuration
PORT=3000
```

Backend container automatically uses `DB_HOST=mysql` to connect to the database.

## Health Checks

Each service includes health monitoring:

- **MySQL:** Checks if daemon is responding (`mysqladmin ping`)
- **Backend:** Checks `/health` endpoint returns 200 OK
- **Frontend:** Checks nginx is serving content

View health status:
```bash
docker-compose ps
```

## Data Persistence

- **MySQL data:** Stored in Docker volume `mysql_data`
- **Schema initialization:** SQL files in `model/` run on first startup
- Data persists across container restarts
- Use `docker-compose down -v` to remove all data

## Troubleshooting

### Backend can't connect to database
```bash
# Check MySQL is healthy
docker-compose ps

# View MySQL logs
docker-compose logs mysql

# Check backend environment
docker-compose exec backend env | grep DB
```

### Frontend shows errors
```bash
# Check backend is running
curl http://localhost:3000/health

# Check nginx logs
docker-compose logs frontend

# View nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

### Changes not reflecting
- Rebuild the service: `docker-compose up -d --build [service]`
- Clear browser cache (Ctrl+Shift+R)
- Check build logs for errors

### Port already in use
```bash
# Find process using the port
# Windows:
netstat -ano | findstr :80
netstat -ano | findstr :3000

# Stop the conflicting service or edit docker-compose.yml to use different ports
```

### Database connection refused
- Ensure MySQL is healthy: `docker-compose ps`
- Check backend is waiting for MySQL: backend has `depends_on` with health check
- Restart backend: `docker-compose restart backend`

## Production Considerations

For production deployment, consider:

1. **Environment variables:** Use secrets management (not `.env` file)
2. **nginx SSL:** Add SSL certificates and configure HTTPS
3. **Database backups:** Set up regular backups of `mysql_data` volume
4. **Resource limits:** Add CPU/memory limits to docker-compose.yml
5. **Logging:** Configure log aggregation (ELK, CloudWatch, etc.)
6. **Monitoring:** Add application monitoring (Prometheus, DataDog, etc.)
