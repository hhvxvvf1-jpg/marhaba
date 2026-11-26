# MARHABA V14 — Local Setup Guide

## Prerequisites
- Node.js 20.x or newer (`node -v`)
- npm 10.x or newer (`npm -v`)
- C/C++ build toolchain (`gcc`/`g++`/`make`) if compiling `better-sqlite3` from source

## Step-by-Step Setup
1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Seed the SQLite database (`data/marhaba.db`):
   ```bash
   npm run db:seed
   ```
4. Run tests and type checks:
   ```bash
   npm test
   npx tsc --noEmit
   ```
5. Start development or production server:
   ```bash
   npm run dev
   # or for production:
   npm run build
   npm run start
   ```
6. Verify health endpoint:
   ```bash
   curl http://localhost:3000/api/v1/health
   ```
