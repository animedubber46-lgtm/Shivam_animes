# SHIVAM ANIMES WEB FOR PREMIUM USERS

A full-stack premium anime access platform with dark futuristic neon UI (black + purple), JWT auth, one-device login enforcement, admin dashboard, anime CMS, protected episode redirect links, solve-link page (non-Indian users only), premium user management, and activity tracking.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at /api)
- `pnpm --filter @workspace/shivam-animes run dev` — run the React frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `MONGODB_URI`, `JWT_SECRET`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, MongoDB + Mongoose, JWT (jsonwebtoken), bcryptjs
- Frontend: React + Vite, TanStack Query, wouter, Tailwind CSS v4
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/routes/` — all Express route handlers (auth, anime, episodes, users, solveLinks, userFeatures, analytics)
- `artifacts/api-server/src/models/` — Mongoose models (User, Anime, Episode, Session, ActivityLog, SolveLink, WatchHistory)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware (requireAuth, requirePremium, requireAdmin)
- `artifacts/api-server/src/lib/mongodb.ts` — MongoDB connection
- `artifacts/api-server/src/lib/activity.ts` — Activity logging helper
- `artifacts/shivam-animes/src/pages/` — all frontend pages (home, login, browse, anime-detail, dashboard, favorites, solve-link, premium, admin/*)
- `artifacts/shivam-animes/src/context/AuthContext.tsx` — JWT auth context
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for all API types)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks

## Architecture decisions

- MongoDB/Mongoose used instead of PostgreSQL/Drizzle for this project (the `@workspace/db` Drizzle lib in the monorepo is NOT imported by api-server)
- One-device login: `deviceId` stored on User; login from second device is blocked unless admin resets it via `POST /admin/users/:id/reset-device`
- Episode redirect: User calls `POST /api/episodes/:id/access` → gets a short-lived JWT token → `GET /api/redirect/:token` validates and 302-redirects to the real destination URL (never exposed to frontend)
- Solve Link page: geo-blocked for Indian users (IN country code) using ipapi.co
- Admin bootstrap: first login with `ADMIN_USERNAME=PremiumWeb` / `ADMIN_PASSWORD=SHIVAMKIT` creates the admin account
- Rate limiting: 200 req/15min global, 20 req/15min on login endpoints

## Product

- Premium anime browsing platform with neon dark UI
- User login with one-device enforcement and JWT auth
- Premium subscription management (15 days / 1 month) via Telegram + QR payment
- Protected episode access via secure redirect (destination URL never leaked to browser)
- Admin panel: manage users, anime CMS, episodes, solve links, activity logs, live sessions
- Favorites and watch history tracking for premium users
- Solve Link page (non-India only) for monetized redirect links

## User preferences

- Admin credentials: username `PremiumWeb`, password `SHIVAMKIT`
- UI: dark black background, neon purple (#a855f7) and electric cyan (#06b6d4) accents
- Telegram channel for premium purchases: https://t.me/A_Gatherers_isekai_In_Hindi
- Premium pricing: ₹10 for 15 days, ₹19 for 1 month

## Gotchas

- Do NOT use `DATABASE_URL` or Drizzle/Postgres for this project — it uses MongoDB via `MONGODB_URI`
- Episode `destinationUrl` is intentionally omitted from the API OpenAPI spec and generated types — it's only used server-side
- Trust proxy is set to `1` in app.ts to fix express-rate-limit with X-Forwarded-For header in proxied environments
- Run `pnpm --filter @workspace/api-spec run codegen` after editing `lib/api-spec/openapi.yaml`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
