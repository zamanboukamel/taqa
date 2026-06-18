# Taqa

Taqa is an AI nutrition platform that generates personalized 7-day meal plans for athletes at GCC sports academies, tailored to each player's profile and weekly training schedule.

## Stack

- **Next.js** (App Router, TypeScript)
- **Supabase** (Postgres database + Auth + Row Level Security)
- **Anthropic SDK** (`claude-sonnet-4-6`, called server-side only)
- **Tailwind CSS**
- Deployable to **Vercel** as a PWA

## Run it locally

```bash
# 1. Install dependencies
npm install

# 2. Add your secrets
#    Copy the example file, then fill in real values:
cp .env.local.example .env.local
#    (edit .env.local with your Supabase + Anthropic keys)

# 3. Start the dev server
npm run dev
```

Then open http://localhost:3000.

You'll also need to run the SQL in `supabase/schema.sql` once, inside your Supabase project's SQL Editor, to create the tables and security policies.

## Check the production build (before deploying)

Vercel runs `npm run build` when it deploys. Run it locally first to catch any
error before you push — **stop the dev server (Ctrl+C) first** so they don't
clash over the `.next` folder:

```bash
npm run build
```

A successful run ends with a route list and no red error. Then restart
`npm run dev` to keep developing, or follow `DEPLOYMENT.md` to ship.

## Environment variables

See `.env.local.example` for the full list:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (secret, server-only)
- `ANTHROPIC_API_KEY` (secret, server-only)

## What I learned building it

- How **Row Level Security** in Postgres keeps each director's data private without writing access checks in app code.
- Why secret API keys must stay **server-side** (env vars without the `NEXT_PUBLIC_` prefix) and never reach the browser.
- How to make an LLM return **strict, parseable JSON** — stripping markdown fences, validating the shape, and retrying once before showing a clean error.
