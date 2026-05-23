<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Runway PMS application. The integration covers both client-side and server-side event tracking across all major user journeys — from authentication through project management, sprint planning, task management, bug tracking, and team collaboration.

**New files created:**
- `instrumentation-client.ts` — Client-side PostHog initialization using Next.js 15.3+ instrumentation API. Enables session replay, autocapture, and exception tracking automatically.
- `lib/posthog-server.ts` — Singleton server-side PostHog client (posthog-node) for capturing events from API routes.
- `.env.local` — Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` environment variables.

**Files modified:**
- `next.config.ts` — Added reverse proxy rewrites (`/ingest/*`) to route PostHog requests through Next.js, improving ad-blocker resistance.
- `app/api/auth/register/route.ts` — Server-side `user_signed_up` event + `identify` call after successful registration.
- `app/api/projects/route.ts` — Server-side `project_created` event after project creation.
- `app/api/projects/[id]/tasks/route.ts` — Server-side `task_created` event after task creation.
- `app/api/projects/[id]/tasks/[taskId]/route.ts` — Server-side `task_status_updated` event when task status changes.
- `app/api/projects/[id]/sprints/route.ts` — Server-side `sprint_created` event after sprint creation.
- `app/api/projects/[id]/sprints/[sprintId]/route.ts` — Server-side `sprint_status_updated` event when sprint status changes.
- `app/api/projects/[id]/bugs/route.ts` — Server-side `bug_reported` event after bug creation.
- `app/api/projects/[id]/bugs/[bugId]/route.ts` — Server-side `bug_status_updated` event when bug status changes.
- `app/api/projects/[id]/members/route.ts` — Server-side `member_invited` event after a member is added.
- `components/pages/login-page-client.tsx` — Client-side `user_logged_in` event + `posthog.identify()` on successful credentials login; `user_logged_in_google` event when Google OAuth is initiated.
- `components/pages/register-page-client.tsx` — Client-side `posthog.identify()` after successful registration and auto sign-in.
- `components/pages/projects-page-client.tsx` — Client-side `project_deleted` event after project deletion.

## Events tracked

| Event | Description | File |
|-------|-------------|------|
| `user_signed_up` | Fires when a new user successfully registers via email/password | `app/api/auth/register/route.ts` |
| `user_logged_in` | Fires when a user successfully logs in with email/password credentials | `components/pages/login-page-client.tsx` |
| `user_logged_in_google` | Fires when a user initiates Google OAuth login | `components/pages/login-page-client.tsx` |
| `project_created` | Fires when a new project is successfully created | `app/api/projects/route.ts` |
| `project_deleted` | Fires when a project is successfully deleted | `components/pages/projects-page-client.tsx` |
| `task_created` | Fires when a new task is successfully created in a project | `app/api/projects/[id]/tasks/route.ts` |
| `task_status_updated` | Fires when a task's status changes (e.g. TODO → IN_PROGRESS → DONE) | `app/api/projects/[id]/tasks/[taskId]/route.ts` |
| `sprint_created` | Fires when a new sprint is created for a project | `app/api/projects/[id]/sprints/route.ts` |
| `sprint_status_updated` | Fires when a sprint's status changes (e.g. NOT_STARTED → ACTIVE → COMPLETED) | `app/api/projects/[id]/sprints/[sprintId]/route.ts` |
| `bug_reported` | Fires when a new bug is reported in a project | `app/api/projects/[id]/bugs/route.ts` |
| `bug_status_updated` | Fires when a bug's status changes | `app/api/projects/[id]/bugs/[bugId]/route.ts` |
| `member_invited` | Fires when a new member is invited/added to a project | `app/api/projects/[id]/members/route.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](https://us.posthog.com/project/269217/dashboard/1621187)
- [New Sign-ups Over Time](https://us.posthog.com/project/269217/insights/gduqs5HI) — daily sign-up trend to monitor user growth
- [User Activation Funnel](https://us.posthog.com/project/269217/insights/4eQUST7r) — conversion from sign-up → project → sprint → task creation
- [Project & Sprint Activity](https://us.posthog.com/project/269217/insights/x3iBwY9l) — project and sprint creation trends
- [Bug Reports Over Time](https://us.posthog.com/project/269217/insights/8kE6FYbH) — daily bug report volume to monitor product quality
- [Team Growth - Member Invitations](https://us.posthog.com/project/269217/insights/zyvm00Jf) — member invitation trends to track team expansion

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
