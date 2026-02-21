# Development Guide

## Quick Start

### Using the /dev Command
The fastest way to start the development environment:
```bash
/dev
```

This will:
1. Start Docker Desktop
2. Start MySQL Workbench
3. Open IntelliJ IDEA
4. Start all services in development mode
5. Open Chrome to http://localhost:5173

### Manual Start
If you prefer to start services manually:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## Development Mode Features

### Hot Reloading
- **Frontend**: Changes to Vue components, TypeScript, and CSS are reflected immediately
- **No rebuilds needed**: Source files are mounted as volumes
- **Fast feedback**: Vite HMR provides instant updates

### Service URLs
- Frontend (Vite Dev Server): http://localhost:5173
- Backend API: http://localhost:3000
- MySQL: localhost:3306

### Source File Watching
The following directories are mounted and watched for changes:
- `/frontend/src` - All source code
- `/frontend/public` - Static assets
- `/frontend/index.html` - Entry point
- `/frontend/vite.config.ts` - Vite configuration
- `/frontend/tsconfig.json` - TypeScript configuration

## Production Build

To build for production:
```bash
docker-compose up -d --build
```

This uses the standard `docker-compose.yml` which:
- Builds the frontend with `npm run build`
- Serves static files with nginx on port 80
- Optimizes for production performance

## Switching Between Modes

### Development Mode
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Production Mode
```bash
docker-compose up -d --build
```

### Stop All Services
```bash
docker-compose down
```

## Troubleshooting

### Changes Not Reflecting
1. Check that you're using the dev mode: `docker ps` should show the frontend container running
2. Verify volumes are mounted: `docker inspect hops-frontend`
3. Check Vite logs: `docker logs -f hops-frontend`

### Port Conflicts
- Development uses port 5173 for the frontend
- Production uses port 80 for the frontend
- Make sure the appropriate port is available

### Container Rebuild Needed
You only need to rebuild if:
- Dependencies change (package.json)
- Dockerfile configuration changes
- Docker compose configuration changes

Source code changes are automatically detected via volume mounts.
