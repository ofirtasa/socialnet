# SocialNet - Project TODO

## Database & Backend
- [x] Design and apply DB schema: users, posts, groups, group_members, friendships, messages, post_likes, post_comments
- [x] Backend: username/password auth (register, login, logout) with bcrypt
- [x] Backend: posts router (CRUD + list + search)
- [x] Backend: groups router (CRUD + join/leave/approve/reject + search)
- [x] Backend: friends router (send/accept/reject + list)
- [x] Backend: feed router (own posts + friends + groups)
- [x] Backend: messages router + Socket.io real-time chat
- [x] Backend: stats router (D3.js data endpoints)
- [x] Backend: users router (CRUD + search + profile update)
- [x] Backend: seed endpoint with demo data

## Frontend - Core
- [x] Global CSS: @font-face, CSS variables, text-shadow, transitions, border-radius, multiple-columns
- [x] App layout: top navbar, sidebar, responsive grid
- [x] Auth pages: Login and Register with elegant design
- [x] Home/Feed page: posts feed with like, comment, share
- [x] Create post: text, image URL, video URL, canvas drawing

## Frontend - Groups
- [x] Groups list page (browse public groups)
- [x] Group detail page (posts, members, join/leave)
- [x] Create group page
- [x] Group manager dashboard (approve/reject join requests, manage members)

## Frontend - Friends
- [x] Friends list page
- [x] Friend requests page (sent/received)
- [x] User profile page with friend action button

## Frontend - Chat
- [x] Real-time chat sidebar/panel using Socket.io
- [x] Conversation list and message history

## Frontend - Search
- [x] Search posts (keyword + date range + group) - multi-param
- [x] Search users (name + role + join date) - multi-param

## Frontend - Dashboard & Stats
- [x] D3.js chart: posts per month (bar chart)
- [x] D3.js chart: user activity over time (line chart)
- [x] Stats page with live DB data

## Frontend - React Features
- [x] Video post support (embed/play video in feed)
- [x] Canvas avatar editor (draw/customize profile picture)

## CSS3 Checklist
- [x] text-shadow applied on headings/hero text
- [x] transitions on buttons, cards, nav items
- [x] multiple-columns on news/feed sections
- [x] @font-face custom font loaded
- [x] border-radius on all cards, buttons, avatars

## Testing & Polish
- [x] Vitest tests for auth, posts, groups routers (22 tests all passing)
- [x] Seed demo data (11 users, 5 groups, 25 posts, friendships, messages)
- [x] Error handling and validation (server + client)
- [x] Final checkpoint

## MongoDB Integration
- [x] Install mongoose, connect to MongoDB Atlas via MONGO_URI env var
- [x] Create Mongoose models: User, Post, Comment, Like, Group, Message
- [x] Migrate all server/db.ts queries to use Mongoose
- [x] Migrate seed.ts to use Mongoose
- [x] Keep MySQL schema for Drizzle but route all runtime queries through Mongoose

## Bug Fixes
- [x] Fix auth: login fails after register (session cookie + user lookup)
- [x] Fix chat: "Connecting..." stuck state - fix Socket.io auth flow
- [x] Fix media: images/videos from URL not rendering in posts (onError fallback)
- [x] Fix video player in feed

## New Features
- [x] Edit post: add edit option in post menu (owner only), update DB + UI
- [x] Group admin roles: admin/member, admin can add/remove users, edit group, delete group
- [x] Dark/light mode toggle with localStorage persistence

## Delivery
- [x] README.md with setup, run instructions, MongoDB config
- [x] env-example.txt file
- [x] ZIP package of entire project (socialnet-project.zip)

## Mobile Responsiveness
- [x] Layout: replace fixed sidebar with bottom nav on mobile, hamburger menu for sidebar
- [x] Feed: full-width cards, touch-friendly buttons
- [x] Groups: single-column grid on mobile
- [x] GroupDetail: stacked layout on mobile
- [x] Chat: full-screen on mobile, proper keyboard handling
- [x] Friends: single-column on mobile
- [x] Profile: compact header on mobile
- [x] Stats: responsive D3 charts
- [x] Search: full-width form on mobile
- [x] AdminPanel: responsive tables/lists
- [x] Home landing page: mobile hero section
- [x] Login/Register: mobile-optimized forms
- [x] Global CSS: mobile-first breakpoints, touch targets min 44px
