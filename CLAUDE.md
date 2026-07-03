# BiiALab — biialab.org

Spanish-language free course platform (BiiA LAB / Jürgen Klarić's brand). Users watch
YouTube-hosted lessons, track progress, take final exams, and earn LinkedIn-shareable
certificates. Built July 2026.

## Stack

- **Next.js 16** (App Router, Turbopack) on **Vercel** (project `biialab`, prod = `main`, auto-deploy on push)
- **Neon Postgres** via **drizzle** — schema in `src/lib/db/schema.ts`, client in `src/lib/db/index.ts`
- **better-auth** (email/password) — server instance `src/lib/auth.ts`, react client `src/lib/auth-client.ts`, handler `/api/auth/[...all]`. Sessions/users in Postgres (uuid ids via `advanced.database.generateId`)
- **Tailwind v4** — ⚠️ `tailwind.config.js` is DEAD (never read). All design tokens live in
  `@theme` blocks in `src/app/globals.css` (`--color-background`, `--color-accent: #ff4d14`, `--color-surface`, …)
- Light "marketplace" theme (Whop-inspired), orange accent, Oswald available as `--font-display`
  (used only on the certificate page)

## Build & typecheck

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/dummy" BETTER_AUTH_SECRET="dummy" npm run build
npx tsc --noEmit
```

- Build must reach "Compiled successfully". A `Failed query …` log during prerender is EXPECTED
  with the dummy DB (homepage/sitemap null-guard to empty).
- `ignoreBuildErrors` is on; two PRE-EXISTING tsc errors are known
  (`courses/[id]/lessons/[lessonId]/page.tsx`, `admin/youtube/page.tsx`) — don't count them as new.
- eslint flat-config is broken at HEAD (circular JSON error) — pre-existing.

## Data model (high level)

`courses → modules → lessons` (lessons embed YouTube videos via `youtubeVideoId` → `youtube_videos`).
`enrollments` + `lesson_progress` per user. `quizzes` (one per course via `course_id`) →
`quiz_questions` → `quiz_attempts`. `certificates` (unique `certificate_number` `BIIA-XXXX-XXXX-XXXX`).
`waitlist` doubles as contact-form storage (`source: 'contact'`, message in `metadata`).

## Admin & operational endpoints

All gated by `ADMIN_PASSWORD` env (weak dev fallback `biialab2026` — real one is set in Vercel).
The admin UI (`/admin`, client gate stores the password in sessionStorage key `biialab_admin_auth`)
passes it to these:

- `POST /api/admin/migrate` — applies embedded schema migrations (`src/lib/db/migration-sql.ts`),
  idempotent, statement-by-statement; the auth-reshape (0001) is guarded to never re-run once users exist.
  New schema changes: append a new `MIGRATION_SQL_000N` constant + run it in the route.
- `POST /api/admin/seed-courses` — `{password, courses?: [...]}`; without a body uses the committed
  `src/lib/db/seed/ai-courses.json`; idempotent by slug (slugify: lowercase, strip accents, non-alnum → `-`).
- `POST /api/admin/seed-exams` — `{password, exams: [{courseSlug, title, passingScore, questions[…]}]}`;
  upserts one exam per course (replaces questions, preserves quiz id). Batch ≤8 per request (60s maxDuration).
- `POST /api/admin/waitlist` — returns subscriber list (view at `/admin/waitlist`).
- `POST /api/admin/test-certificate` — issues a cert to test user `certificado-prueba@biialab.org`
  and returns the `/verify/<credential>` URL (button in `/admin/courses`).

## User-facing flows

- Auto-enroll on first lesson visit; "Marcar como completada" persists (`src/lib/db/actions/progress.ts`).
- Final exam at `/courses/[slug]/examen` — server-graded (`src/lib/db/actions/exams.ts`; correct answers
  never sent to the client), pass ≥70% ⇒ certificate auto-issued.
- Certificate: public `/verify/[code]` page + "Añadir a LinkedIn" (official Add-to-Profile URL).
- Password reset: `/forgot-password` → Resend email (`sendResetPassword` in `src/lib/auth.ts`).

## Env vars (Vercel, Production)

`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_PASSWORD`,
`NEXT_PUBLIC_YOUTUBE_API_KEY`, `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID` (channel `UCNV3OUmerDvoj-PQIArnTkw`, @BiiALAB),
`RESEND_API_KEY` (NOT yet set — password reset fails until it is; verify biialab.org domain in Resend first),
`NEXT_PUBLIC_GA_ID` (GA4 measurement id — analytics code no-ops until it is set).
Env changes require a redeploy. The Vercel CLI (`npx vercel`) has been used with `env add` from this repo.

## Conventions

- **Spanish only** in user-facing copy. No emojis in UI (line icons in `src/components/icons.tsx`).
- No fabricated social proof: testimonials in `src/lib/data/social-proof.json` are verbatim public
  YouTube comments from the channel, attributed; stats are real (2M subs). Keep it that way.
- Server actions are public endpoints: derive the user from the better-auth session, never from args;
  admin mutations require the admin password parameter.
- Images: `i.ytimg.com`, `images.pexels.com`, `yt3.ggpht.com` are allowlisted in `next.config.ts`.
- Git: PR to `main` per change; deploys are automatic on merge. Direct SSH pushes fail on this
  machine (read-only key) — use HTTPS/`gh`.

## Known leftovers / backlog

- `RESEND_API_KEY` missing → password reset inactive (code shipped).
- Lesson player page still has the old dark design + client-only notes + mock quiz tab; no auto
  watch-progress (`lesson_progress.watched_seconds` unused).
- No "continue learning" section for signed-in users on the homepage.
- GA4 wired (`src/lib/analytics.ts` + `GoogleAnalytics` in root layout, custom events on auth/lessons/exams/certs) but `NEXT_PUBLIC_GA_ID` is not set yet. Waitlist subscribers never got a launch email.
- `/certificate/[id]` is an unreferenced legacy page with pre-rebrand "BiiAMind" branding — `/verify/[code]`
  is the real one; consider deleting.
- Google Search Console: verify biialab.org + submit `/sitemap.xml`.
- Legal drafts at `/privacidad` + `/terminos` should get an owner read-through.
