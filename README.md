# SocialNet - Full-Stack Social Network

SocialNet is a final-project social network built with Node.js, Express, React, MongoDB Atlas, Socket.io, D3.js, Canvas, CSS3, and jQuery AJAX.

## Quick Start For The Examiner

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env` in the project root:

```env
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/?appName=socialnet
JWT_SECRET=replace-with-any-long-secret
```

Do not commit `.env`. The PORT will be auto-detected (starts at 3000, increments if busy).

### 3. Seed demo data

```bash
npx tsx seed-runner.ts
```

This creates demo users, groups, posts, friendships, messages, likes, and comments.

### 4. Run verification (TypeScript + Tests + Build)

```bash
npm run check    # Verify TypeScript has no errors
npm run test     # Run 21 unit tests
npm run build    # Create production build
```

All three should pass before proceeding.

### 5. Start development server

**Option A: Development mode (Hot reload)**

```bash
npm run dev
```

Opens a Vite dev server with hot module reload. The app will automatically detect an available port (starting at 3000). Check console output for the actual URL. Example:

```text
http://localhost:3000
```

(Or `3001`, `3002`, etc. if 3000 is busy.)

**To run on a specific port:**

- **macOS/Linux:**
  ```bash
  PORT=3100 npm run dev
  ```

- **Windows (PowerShell):**
  ```powershell
  $env:PORT=3100; npm run dev
  ```

- **Windows (Command Prompt):**
  ```cmd
  set PORT=3100 && npm run dev
  ```

**Option B: Production mode (After building)**

```bash
npm run build
npm start
```

This serves the compiled app from `dist/` on port 3000 or the next available port.

**Option C: Docker (recommended for consistent demo environment)**

1. Create `.env` (same as above).
2. Build and run app container:

```bash
docker compose up --build -d app
```

3. (Optional, one-time) seed demo data inside containerized environment:

```bash
docker compose run --rm --profile tools seed
```

4. Open:

```text
http://localhost:3000
```

5. Stop containers:

```bash
docker compose down
```

### 6. Demo accounts

| Username | Password | Role |
|---|---|---|
| admin | admin123 | System admin |
| alice | password123 | User |
| bob | password123 | User |
| carol | password123 | User |
| david | password123 | User |
| emma | password123 | User |
| frank | password123 | User |
| grace | password123 | User |
| henry | password123 | User |
| iris | password123 | User |
| jack | password123 | User |

## Verification Commands

```bash
npm run check
npm test
npm run build
```

Expected result:

- TypeScript passes.
- Vitest passes 21 tests.
- Production build is created in `dist/`.

## Technical Requirements Mapping

| # | Requirement | Where to verify |
|---|---|---|
| 15 | Node.js + Express server, React client | `server/_core/index.ts`, `client/src/main.tsx`, `package.json` |
| 16 | MongoDB storage/retrieval | `server/mongodb.ts`, `server/db.ts`, `.env` `MONGO_URI` |
| 17 | MVC separation | Models: `server/mongodb.ts`; DB/model helpers: `server/db.ts`; Controllers/API: `server/routers.ts` and `server/_core/jqueryRoutes.ts`; Views: `client/src/pages/*` |
| 18 | At least 3 models | User, Post, Group, Comment, Like, Message, Friendship, Session in `server/mongodb.ts` |
| 19 | CRUD/List/Search on models via UI | Posts: Feed/Profile/Admin; Users: Profile/Admin/Search; Groups: Groups/Group Detail/Admin/Search |
| 20 | 2+ multi-parameter searches | `/search` supports Posts search by keyword/type/group/date range and Users search by name/role/join dates |
| 21 | Group management and permissions | `/groups`, `/groups/:id`; server-side guards in `server/routers.ts` restrict private data, group admin actions, post ownership, friendships, and messages |
| 22 | Personal posts and feed | `/profile/:id` shows user's posts; `/feed` shows own, friends', and joined-groups posts |
| 23 | Demo social-network data | `server/seed.ts`, `seed-runner.ts`, Admin Panel seed button |
| 24 | Error handling and validation | Zod validation in `server/routers.ts`; client required fields, disabled buttons, toast errors |
| 25 | jQuery and AJAX | jQuery CDN in `client/index.html`; REST AJAX routes in `server/_core/jqueryRoutes.ts`; AJAX panel/search in `/search` |
| 26 | React with Video and Canvas | Video posts in `Feed.tsx`, `GroupDetail.tsx`, `Profile.tsx`; Canvas avatar editor in `Profile.tsx` |
| 27 | CSS3 | `client/src/index.css`: `@font-face`, `text-shadow`, `transition`, `column-count`, `border-radius` |
| 28 | Socket.io / WebSockets chat | `server/_core/index.ts`, `client/src/pages/Chat.tsx`, `/chat` |
| 29 | D3.js dynamic charts | `/stats`, `client/src/pages/Stats.tsx`, stats router reads MongoDB live data |

## Suggested Examiner Demo Flow

1. Log in as `admin / admin123`.
2. Open `/admin`: show CRUD controls and seed button.
3. Open `/feed`: create a text/image/video post, edit it, delete it, like/comment.
4. Open `/groups`: create a public/private group.
5. Open a group as manager: update group details, approve requests, manage members, publish group post.
6. Open `/search`: run Posts search with at least 3 filters; click `AJAX Search` to demonstrate jQuery Ajax.
7. Switch to Users search and filter by name/role/date.
8. Open `/profile/:id`: show personal posts and Canvas avatar editor.
9. Open `/chat`: send real-time messages through Socket.io.
10. Open `/stats`: show D3 charts based on MongoDB data.

## Project Structure

```text
socialnet/
  server/
    mongodb.ts            Mongoose models
    db.ts                 Database/model helper functions
    routers.ts            tRPC API controllers
    seed.ts               Demo data seeding
    _core/
      index.ts            Express server + Socket.io
      jqueryRoutes.ts     REST endpoints for jQuery AJAX
  client/src/
    pages/                React views
    components/           Shared UI components
    contexts/             Auth and theme context
  shared/                 Shared constants/types
```

## Production Build

```bash
npm run build
npm start
```

`npm start` serves the compiled app from `dist/`.

## Docker Files

- `Dockerfile` multi-stage build (runtime + optional seed target)
- `docker-compose.yml` app service + optional seed service
- `.dockerignore` reduce build context size

## Notes

- MongoDB Atlas must be reachable from the machine running the app.
- `.env` is intentionally ignored by Git.
- The application uses React/tRPC for the main app flow and includes dedicated jQuery AJAX routes and UI to satisfy the jQuery/AJAX technical requirement.
