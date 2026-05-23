# SocialNet — Full-Stack Social Network Application

A full-featured social network built with **Node.js + Express + React + MongoDB Atlas**, developed as a final project for the Android 2 course.

---

## Features

- **Authentication** — Username/password registration and login with bcrypt hashing and session tokens
- **User Feed** — Posts from your friends and joined groups
- **Posts** — Create, edit, delete text/image/video posts; like and comment
- **Groups** — Public and private groups with admin roles, join requests, member management
- **Friends** — Send, accept, reject friend requests; view friends list
- **Real-Time Chat** — WebSocket-based direct messaging using Socket.io
- **Statistics Dashboard** — D3.js charts showing platform activity (live MongoDB data)
- **Canvas Avatar Editor** — Draw and customize your profile picture using HTML5 Canvas
- **Dark / Light Mode** — Persistent theme toggle
- **Advanced Search** — Multi-parameter search for posts (keyword, type, date, group) and users (name, role, date)
- **Admin Panel** — Full CRUD management for users, posts, and groups; seed data button
- **MVC Architecture** — Clear separation: Mongoose models → DB helpers → tRPC routers → React pages

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, tRPC |
| Frontend | React 19, Tailwind CSS 4, Vite |
| Database | MongoDB Atlas (Mongoose ODM) |
| Real-Time | Socket.io (WebSocket transport) |
| Charts | D3.js |
| Auth | bcryptjs, nanoid session tokens |
| Testing | Vitest |

---

## Project Structure (MVC)

```
socialnet/
├── server/
│   ├── mongodb.ts          ← Mongoose models (User, Post, Comment, Like, Group, Message, Friendship, Session)
│   ├── db.ts               ← Database query helpers (Model layer)
│   ├── routers.ts          ← tRPC procedures / API routes (Controller layer)
│   ├── seed.ts             ← Demo data seeder
│   └── _core/              ← Framework: auth, context, Socket.io, OAuth
├── client/src/
│   ├── pages/              ← React page components (View layer)
│   │   ├── Feed.tsx        ← Main feed with post CRUD
│   │   ├── Chat.tsx        ← Real-time Socket.io chat
│   │   ├── Groups.tsx      ← Group browsing and creation
│   │   ├── GroupDetail.tsx ← Group management (admin roles)
│   │   ├── Friends.tsx     ← Friend requests and list
│   │   ├── Profile.tsx     ← User profile + canvas avatar editor
│   │   ├── Stats.tsx       ← D3.js statistics dashboard
│   │   ├── Search.tsx      ← Advanced multi-param search
│   │   └── AdminPanel.tsx  ← Admin CRUD + seed trigger
│   ├── components/
│   │   └── Layout.tsx      ← Sidebar navigation + dark mode toggle
│   └── contexts/
│       ├── AuthContext.tsx  ← Local session state
│       └── ThemeContext.tsx ← Dark/light mode with localStorage
├── drizzle/schema.ts       ← (Legacy MySQL schema — kept for reference)
├── .env.example            ← Environment variable template
└── README.md
```

---

## MongoDB Collections

| Collection | Description |
|---|---|
| `users` | User accounts with hashed passwords, roles, avatars |
| `posts` | Posts with content, media URLs, like/comment counts |
| `comments` | Comments linked to posts |
| `likes` | Post likes (unique per user/post) |
| `groups` | Groups with embedded member list and roles |
| `messages` | Direct messages between users |
| `friendships` | Friend requests and relationships |
| `sessions` | Auth session tokens (auto-expire via TTL index) |

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and pnpm (`npm install -g pnpm`)
- MongoDB Atlas account (free tier works)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd socialnet
pnpm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```
MONGO_URI=mongodb+srv://your_user:your_password@your-cluster.mongodb.net/?appName=your-app-name
```

> **Important:** Never commit `.env` to Git. It is already in `.gitignore`.

### 3. Seed Demo Data

Run the seed script to populate MongoDB with 11 demo users, 5 groups, 25 posts, friendships, and messages:

```bash
npx tsx seed-runner.ts
```

### 4. Start the Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

---

## Demo Accounts

After seeding, you can log in with any of these accounts:

| Username | Password | Role |
|---|---|---|
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
| admin | admin123 | Admin |

---

## MongoDB Configuration

The app connects to MongoDB Atlas using the `MONGO_URI` environment variable. The connection is established lazily on first request via `connectMongoDB()` in `server/mongodb.ts`.

**Database name:** `android2-project-cluster`

All Mongoose models are defined in `server/mongodb.ts`. The `db.ts` file provides clean helper functions that abstract Mongoose queries, keeping the routers (controllers) free of database logic.

---

## Running Tests

```bash
pnpm test
```

21 tests covering auth, users, posts, groups, stats, and friends.

---

## CSS3 Features Used

| Feature | Where Used |
|---|---|
| `@font-face` | SocialNetDisplay font in `index.css` |
| `text-shadow` | All `h1`, `h2` headings |
| `transition` | Buttons, cards, nav items, avatars |
| `border-radius` | Cards, buttons, avatars, inputs |
| `column-count` (multiple-columns) | Feature cards on landing page |

---

## Real-Time Chat

Chat is implemented using **Socket.io** with WebSocket-only transport (no polling fallback). Authentication is done by sending the `sn_session` cookie token after connection. Messages are persisted to MongoDB and loaded from DB on conversation open.

---

## License

Built for educational purposes — Android 2 Course Final Project.
