# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build (type-checks + compiles)
npm run lint      # ESLint via next lint
npm run start     # Serve the production build
```

There are no automated tests. Verify changes by running `npm run build` (catches type errors) then manually testing in the browser.

## Environment

Requires `.env.local` (not committed). See `.env.local.example` for required keys:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe for browser
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, bypasses RLS
- `ANTHROPIC_API_KEY` — server-only

## Architecture

**Stack:** Next.js 16 App Router · TypeScript · Tailwind v4 · Supabase (Postgres + Auth) · Anthropic SDK · Framer Motion (`motion` package)

### Design system

Before touching UI, read **`DESIGN.md`** — the "Charge / energy" brand, color
tokens, type roles, and the reusable components in `components/ui/`
(`brand.tsx`, `motion.tsx`, `count-up.tsx`). Reuse the `.tq-*` CSS classes and
tokens rather than inventing one-off styles. Note the deliberate split: dark
"command center" for director/marketing surfaces, **light high-contrast** for
the player meal-plan view (must read in sunlight).

### Two user roles, two access patterns

**Directors** (authenticated) access the app via `/dashboard`. All Supabase queries use the server client (`lib/supabase/server.ts`), which reads the session from cookies and honors Row Level Security — directors only see their own academy's data.

**Players** (unauthenticated) access `/player/[access_token]`. This route uses the admin client (`lib/supabase/admin.ts`, service-role key) to look up the player by their opaque UUID `access_token`. No login needed; the token is the credential.

### AI generation flow

`POST /api/generate-plan` (server route) is the only place the Anthropic SDK is called. It:
1. Fetches player + training schedule from Supabase
2. Calls `claude-sonnet-4-6` with a structured prompt
3. Strips markdown fences and parses the JSON response
4. Validates the shape against `MealPlanJson` (7 days, required fields)
5. Retries once on parse failure
6. Upserts the result into `meal_plans`

The `MealPlanJson` / `MealPlanDay` types in `lib/types.ts` are the contract between the AI prompt and the rest of the UI.

### Supabase clients

| File | Key used | RLS | Use for |
|------|----------|-----|---------|
| `lib/supabase/server.ts` | anon | enforced | All director routes (reads session from cookies) |
| `lib/supabase/admin.ts` | service-role | bypassed | Public player page only |
| `lib/supabase/client.ts` | anon | enforced | Browser-side auth actions (login form) |

### Database schema

Four tables in `supabase/schema.sql`: `academies`, `training_schedules`, `players`, `meal_plans`. RLS is enabled on all four — directors are isolated by `owner_id`. Run the schema SQL directly in the Supabase dashboard SQL editor to apply migrations.

### PWA

`app/manifest.ts` exports the web app manifest (served at `/manifest.webmanifest`). Theme color and viewport meta are set in `app/layout.tsx`.
