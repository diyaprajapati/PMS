# Agents Guide

## Purpose
Use this file as a shared playbook for coding agents working in this repository.

## Project Map
- `app/`: Routes and API handlers.
- `components/`: UI building blocks and page clients.
- `lib/`: Core server logic and reusable business rules.
- `services/`, `queries/`, `hooks/`: Client-side data and state helpers.
- `types/`: Shared type definitions.
- `prisma/`: Data model and migrations.

## Agent Rules (Next.js Industry Standard)
1. Keep API handlers thin; move logic to service files in `lib/`.
2. Guard protected endpoints with centralized auth helpers.
3. Validate request body and query params before performing writes.
4. Return stable JSON shape for success and errors.
5. Use typed contracts from `types/` across API and UI.
6. Reuse existing UI patterns (table, dialog, form field, badges) before creating new ones.
7. Keep route pages simple; compose from `components/pages/*`.
8. Prefer non-breaking, incremental DB migrations.
9. Never bypass project scoping; every project resource must filter by `projectId`.
10. Build after major changes: `npm run build`.

## Contribution Checklist
- Add/update types for new domain features.
- Add migration when Prisma schema changes.
- Ensure sidebar/project context links preserve `?project=`.
- Verify role-based access behavior for protected mutations.
- Keep naming consistent (`*-service.ts`, `*PageClient`, `*Table`, `*Dialog`).
