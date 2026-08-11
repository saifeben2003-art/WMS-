---
Task ID: 3
Agent: Main Agent
Task: Stage 3 — NextAuth.js v4 + Middleware + Roles + Timeline + Track

Work Log:
- Migrated from custom SHA-256 token auth to NextAuth.js v4 Credentials Provider
- Created nextauth.ts config with JWT strategy + bcrypt password verification
- Created next-auth.d.ts type augmentations (Session with id/role, JWT with id/role)
- Created [..nextauth] route handler replacing old login/logout/me routes
- Deleted src/app/api/auth/{login,logout,me}/ (3 files)
- Updated auth.ts: removed custom token functions, added authGuard/requireRole/getAuthSession
- Updated AuthProvider: useSession + signIn/signOut from next-auth/react
- Wrapped app in SessionProvider in page.tsx
- Updated register route to not set custom cookies (returns success, client calls signIn)
- Created middleware.ts: protects all /api/* except /api/auth/*, /api/track/*, /api/seed
- Added authGuard(['ADMIN','MANAGER']) to 4 DELETE routes (cargo/equipment/locations/projects)
- Added authGuard(['ADMIN']) to users DELETE route
- Created cargo-timeline.tsx: vertical timeline with icons per movement type
- Integrated timeline into cargo detail dialog (cargo-page.tsx)
- Created rate-limit.ts: in-memory 10 req/min/IP limiter with auto-cleanup
- Created GET /api/track/[code]: public, no auth, returns limited cargo data
- Added Track Cargo search section to login page (public, no login required)
- Migrated roles: ADMIN/SUPERVISOR/OPERATOR/VIEWER → ADMIN/MANAGER/STAFF/VIEWER
- Updated users-page.tsx ROLES and roleStyles accordingly
- Fixed .env.example: NEXTAUTH_SECRET + NEXTAUTH_URL (no real secrets)
- Fixed SETUP.md: references NEXTAUTH_SECRET, PostgreSQL setup guide
- Fixed .gitignore: .env* blocked, !.env.example allowed
- Build passes (22 routes), lint clean
- Committed as d48cf36 on feature/production-upgrade, pushed
- main branch untouched

Stage Summary:
- 7 new files created, 11 files modified, 3 files deleted
- Authentication: custom token → NextAuth.js v4 with JWT
- Authorization: middleware + authGuard role-based access
- 19 API routes (was 20, removed 3 old auth, added 2 new)
- Public tracking: /api/track/[code] with rate limiting
- Visual: Cargo timeline + Track search on login page
