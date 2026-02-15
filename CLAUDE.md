# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Local Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled server

### Docker

#### Development Mode (with hot reloading)
- `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d` - Start in dev mode
- Frontend runs on port 5173 with Vite dev server
- Source files are mounted as volumes - changes reflect immediately
- No container rebuild needed for source code changes

#### Production Mode
- `docker-compose up -d` - Start all services (frontend, backend, mysql)
- `docker-compose down` - Stop all services
- `docker-compose up -d --build [service]` - Rebuild and restart a service

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development workflow
See [DOCKER.md](./DOCKER.md) for complete Docker documentation

## Architecture

Fastify server in TypeScript using ES modules. Source code is in `src/`, compiled output goes to `dist/`.

Entry point: `src/server.ts`

## Model & Database Synchronization Rules

**CRITICAL**: Follow these rules whenever making changes to models or database schema:

1. **Model Changes → Backend Package Update**
   - If ANY changes occur in the `model/` package, regenerate the backend package
   - Run `npm install` in the backend directory to pick up the updated model package

2. **Database Changes → Model Update**
   - If ANY database schema changes occur, update the model package to match
   - This includes: table structure, columns, relationships, constraints, etc.

3. **Semantic Versioning**
   - Use semantic versioning (semver) in both `model/package.json` and `backend/package.json`
   - Each change should correspond to a **patch version increase** (e.g., 1.0.0 → 1.0.1)
   - Increment the version in `model/package.json` first, then update backend

4. **Workflow for Model/Database Changes**
   ```bash
   # 1. Make changes to model files
   # 2. Increment version in model/package.json (patch bump)
   cd model && npm version patch
   # 3. Build the model package
   npm run build
   # 4. Regenerate backend package
   cd ../backend && npm install
   # 5. Test the changes
   ```

## Design Guide

### Icons
- **Prioritize Codicons**: Use icons from the Codicon library (https://microsoft.github.io/vscode-codicons/dist/codicon.html)
- Avoid emoji icons when a suitable Codicon is available
- Common Codicon usage:
  - `codicon-search` for search functionality
  - `codicon-calendar` for date/time features
  - `codicon-arrow-right`, `codicon-arrow-left` for navigation
  - `codicon-chevron-*` for expandable sections
  - Refer to the Codicon reference for complete icon set
