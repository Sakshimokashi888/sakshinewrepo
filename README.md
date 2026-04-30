# TaskFlow — Team Task Manager

A full-stack team task management app with authentication, role-based access control, kanban boards, and a real-time dashboard.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Deployment | Railway |

## Project Structure

```
sakshinewrepo/
├── backend/     # Express REST API + Prisma
└── frontend/    # React + Vite SPA
```

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### 1. Backend Setup

```bash
cd backend
npm install
# Edit .env — set your local DATABASE_URL and JWT_SECRET
npx prisma db push        # Creates tables
npx prisma generate       # Generates client
npm run dev               # Starts on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
# .env already points to http://localhost:5000/api
npm run dev               # Starts on http://localhost:5173
```

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/taskmanager"
JWT_SECRET="your-secret-key-here"
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

## API Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | /api/auth/signup | Register | Public |
| POST | /api/auth/login | Login | Public |
| GET | /api/users/me | My profile | Required |
| GET | /api/users | All users | Admin |
| GET | /api/projects | My projects | Required |
| POST | /api/projects | Create project | Required |
| GET | /api/projects/:id | Project detail | Member |
| PUT | /api/projects/:id | Update project | Project Admin |
| DELETE | /api/projects/:id | Delete project | Project Admin |
| POST | /api/projects/:id/members | Add member | Project Admin |
| DELETE | /api/projects/:id/members/:uid | Remove member | Project Admin |
| GET | /api/projects/:id/tasks | Project tasks | Member |
| POST | /api/projects/:id/tasks | Create task | Project Admin |
| PUT | /api/tasks/:id | Update task | Admin or Assignee |
| DELETE | /api/tasks/:id | Delete task | Project Admin |
| GET | /api/tasks/dashboard | Dashboard stats | Required |

## Roles

- **ADMIN** (project-level): Can create/edit/delete tasks, manage members, delete project
- **MEMBER** (project-level): Can view tasks, update status of their own assigned tasks

## Deployment on Railway

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step Railway deployment guide.