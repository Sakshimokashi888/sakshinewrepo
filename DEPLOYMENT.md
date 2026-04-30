# Railway Deployment Guide

## Overview

We deploy **two services** on Railway:
1. **Backend** — Node.js/Express API
2. **Frontend** — React/Vite static site

Railway automatically provisions a **PostgreSQL** database.

---

## Step 1 — Push Code to GitHub

```bash
cd e:\sakshinewrepo
git init
git add .
git commit -m "Initial commit: TaskFlow full-stack app"
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

---

## Step 2 — Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `taskflow` repository

---

## Step 3 — Add PostgreSQL Database

1. In your Railway project, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway will create a Postgres instance and expose `DATABASE_URL` automatically

---

## Step 4 — Deploy Backend Service

1. Click **"+ New"** → **"GitHub Repo"** → select your repo
2. Set **Root Directory** to `/backend`
3. Railway auto-detects Node.js via Nixpacks

### Set Environment Variables (Backend)

Go to **Backend service → Variables** and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Copy from PostgreSQL service (click "Connect") |
| `JWT_SECRET` | A long random string e.g. `openssl rand -hex 32` |
| `PORT` | `5000` |
| `FRONTEND_URL` | Your frontend Railway URL (add after frontend is deployed) |

The `railway.toml` in `/backend` will run:
```
npx prisma generate && npx prisma db push && node src/index.js
```
on every deploy — this automatically migrates your database.

---

## Step 5 — Deploy Frontend Service

1. Click **"+ New"** → **"GitHub Repo"** → select your repo again
2. Set **Root Directory** to `/frontend`

### Set Environment Variables (Frontend)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your backend Railway URL + `/api` e.g. `https://backend-xxx.railway.app/api` |

The `railway.toml` in `/frontend` will run:
```
npm run build
npx serve dist -s -l 3000
```

---

## Step 6 — Verify Deployment

1. Visit your **backend URL** `/api/health` — should return `{ "status": "OK" }`
2. Visit your **frontend URL** — should see the TaskFlow login page
3. Sign up as Admin, create a project, add tasks ✅

---

## Environment Variables Summary

### Backend Service
```
DATABASE_URL=postgresql://...  (from Railway PostgreSQL)
JWT_SECRET=your-random-secret
PORT=5000
FRONTEND_URL=https://your-frontend.railway.app
```

### Frontend Service
```
VITE_API_URL=https://your-backend.railway.app/api
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Set `FRONTEND_URL` in backend env to exact frontend Railway URL |
| Prisma errors | Check `DATABASE_URL` is correctly copied from Railway Postgres |
| 401 on all requests | Ensure `JWT_SECRET` is set in backend env |
| Blank frontend page | Check `VITE_API_URL` points to correct backend URL |
