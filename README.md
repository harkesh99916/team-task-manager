# Team Task Manager

Team Task Manager is a production-ready full-stack task management app built with Next.js App Router, MongoDB, Mongoose, Tailwind CSS, and JWT authentication stored in HTTP-only cookies.

This version includes:
- Global roles: `admin`, `leader`, `member`, `pending`
- Project-scoped access control
- Admin-managed user creation
- Password change for every authenticated user
- Railway-ready deployment for both the app and MongoDB

## Features

- Email/password authentication with bcrypt hashing
- JWT auth stored in HTTP-only cookies
- Protected routes and API access
- Role-based access control
- Admin can:
  - create projects
  - create users
  - assign role and project
  - view all projects and all tasks
  - delete tasks
- Project Leader can:
  - access only their assigned project
  - create tasks inside that project
  - track project tasks
  - remove members from that project
- Member can:
  - view assigned tasks only
  - update their own task status
- Admin panel with editable user table
- Demo seed users for quick testing
- Railway deployment support for app + database

## Tech Stack

- Next.js 14 App Router
- React 18
- MongoDB + Mongoose
- Tailwind CSS
- `jose` for JWT signing and verification
- `bcryptjs` for password hashing
- `zod` for validation
- `sonner` for toast notifications

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create env files:

```bash
cp .env.example .env.local
cp .env.example .env
```

3. Set variables:

```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-long-random-secret
NODE_ENV=development
```

4. Start the app:

```bash
npm run dev
```

5. Optional seed:

```bash
npm run seed
```

6. Open:

[http://localhost:3000](http://localhost:3000)

## Production Commands

```bash
npm install
npm run build
npm start
```

## Demo Credentials

After running `npm run seed`, use:

- Admin: `admin@gmail.com / Password123!`
- Project Leader: `leader1@gmail.com / Password123!`
- Member: `member1@gmail.com / Password123!`

These same credentials are also shown on the login screen for quick evaluation.

## Roles

### Admin

- Create projects
- Create users
- Assign role and assigned project
- View all users, projects, and tasks
- Create tasks in any project
- Delete tasks

### Project Leader

- Access only their assigned project
- Create tasks inside that project
- Track all tasks in that project
- Remove members from that project

### Member

- View only assigned tasks
- Update only their own task status

### Pending

- New signups start here
- Must be assigned by an admin before receiving project access

## Environment Variables

This app uses:

```env
MONGODB_URI=...
JWT_SECRET=...
NODE_ENV=...
```

Notes:
- `.env.local` is used by the Next.js app locally
- `.env` is used by scripts such as `npm run seed`
- On Railway, set variables in the service dashboard instead of relying on local files

## Railway Deployment

This app can be deployed with:
- one Railway service for the Next.js app
- one Railway MongoDB service for the database

### Recommended Railway Setup

1. Push this repository to GitHub.
2. In Railway, create a new project.
3. Add a MongoDB service using Railway’s MongoDB template.
4. Add a second service from your GitHub repository for the app.
5. In the app service, create variables:
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `MONGODB_URI`
6. For `MONGODB_URI`, point it to the Mongo service connection string provided by Railway.

Railway’s MongoDB docs show that the Mongo service exposes connection variables such as `MONGO_URL`, which you can reference from another service in the same project.

A common setup is:

```env
MONGODB_URI=${{MongoDB.MONGO_URL}}
```

Use the actual Mongo service name from your Railway project if it differs from `MongoDB`.

### Build and Start Commands

This project already uses the correct scripts:

```json
{
  "build": "next build",
  "start": "next start"
}
```

Railway can auto-detect the service, but the effective deployment flow should be:

```bash
npm install
npm run build
npm start
```

### Deploy Steps

1. Create Railway MongoDB service.
2. Create Railway app service from GitHub.
3. Add variables to the app service:
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `MONGODB_URI=${{MongoDB.MONGO_URL}}`
4. Deploy the app service.
5. After first successful deploy, open the generated Railway domain.

### Seed Data on Railway

If you want demo accounts in Railway production:

1. Open the app service shell or run command support.
2. Run:

```bash
npm run seed
```

Make sure the app service already has:
- `MONGODB_URI`
- `JWT_SECRET`

### Post-Deploy Checklist

Verify:
- login works
- admin dashboard loads
- admin can create project
- admin can create user
- leader can access only their project
- member can access only assigned tasks
- password change works

## API Routes

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`

### Admin

- `GET /api/admin/users`
- `POST /api/admin/create-user`
- `PUT /api/admin/update-user`

### Projects

- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `POST /api/projects/add-member`
- `DELETE /api/projects/remove-member`

### Tasks

- `POST /api/tasks`
- `GET /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Supporting

- `GET /api/dashboard`
- `GET /api/users`

## API Response Format

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

## Validation Rules

- Duplicate email signup is blocked
- New users start as `pending`
- `leader` and `member` require an assigned project
- Project leaders cannot access other projects
- Members cannot create tasks or projects
- Only admin can delete tasks
- Members can only update their own task status
- MongoDB ObjectIds are validated

## Project Structure

```text
app/
  (auth)/
  (protected)/
  api/
components/
context/
lib/
models/
scripts/
types/
```

## Notes

- The app uses a simple in-memory rate limiter for auth endpoints
- For a high-scale production system, replace the in-memory limiter with Redis or another shared store
- The app is designed to run as a normal Node.js Next.js server on Railway

## Useful Links

- [Railway MongoDB docs](https://docs.railway.com/guides/mongodb)
- [Railway build and deploy docs](https://docs.railway.com/build-deploy)
- [Railway start command docs](https://docs.railway.com/guides/start-command)
- [Next.js deployment docs](https://nextjs.org/docs/app/getting-started/deploying)
