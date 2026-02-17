---
name: run
description: Install dependencies and run the app in development mode
allowed-tools: Bash
---

Run both backend and frontend applications in development mode:

1. Start the MySQL database: `docker-compose up -d mysql`
2. Install backend dependencies: `cd backend && npm install`
3. Install frontend dependencies: `cd frontend && npm install`
4. Start the backend dev server in background: `cd backend && npm run dev` (runs in background)
5. Start the frontend dev server in background: `cd frontend && npm run dev` (runs in background)
