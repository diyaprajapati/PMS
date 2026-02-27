# Project Guide (Claude)

## Tech Stack
- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS + shadcn/ui components
- Prisma + PostgreSQL
- NextAuth for auth/session

## File System Overview
- `app/`: App Router pages and API routes.
  - `app/api/**`: Server API endpoints (project, sprint, task, bug, auth routes).
  - `app/**/page.tsx`: Route entry pages.
- `components/`: Reusable UI and page-level client components.
  - `components/pages/`: Route shells.
  - `components/ui/`: Design system primitives.
  - `components/tasks|sprints|bugs/`: Domain-specific UI.
- `lib/`: Server/shared utilities (auth, prisma client, permissions, domain services, email).
- `services/`: Client-side API wrappers.
- `queries/`: React Query hooks/config.
- `hooks/`: Reusable React hooks.
- `types/`: Shared TS types.
- `prisma/`: Prisma schema + migrations.
- `public/`: Static assets.

## Industry-Standard Next.js Rules
1. Keep routing concerns in `app/`, reusable UI in `components/`, and business logic in `lib/`.
2. Validate all API input; return consistent JSON errors and status codes.
3. Enforce auth/authorization in every protected route before DB access.
4. Prefer server-side data access in API routes/services; avoid direct DB usage in client components.
5. Use strict TypeScript types for API payloads, DB models, and UI props.
6. Keep components focused: container/page shell + domain component separation.
7. Use optimistic UI only when rollback is implemented.
8. Avoid duplicated logic; create domain services in `lib/*-service.ts`.
9. Keep Prisma schema changes atomic and paired with migration files.
10. Run `npm run build` after meaningful changes to verify type/build health.

## API Conventions
- Pattern: `/api/projects/[id]/**`
- Use `requireProjectAccess` (or stricter helper) for guarded routes.
- Use `GET/POST/PATCH/DELETE` consistently and return structured messages.

## UI Conventions
- Use shadcn components from `components/ui/*`.
- Maintain consistent table/dialog patterns (as in sprint/task/bug modules).
- Keep sidebar project context via `?project=` query propagation.
