<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cloud Agent

- Install dependencies with `npm ci` after the lockfile is in sync. `npm install` repairs a lockfile that is missing peer entries.
- Put runtime variables in `.env`. The dev script loads that file with `dotenv/config` before Prisma generate.
- Required runtime variables: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_AUTH_BASE_URL`, and `NEON_AUTH_COOKIE_SECRET` (at least 32 characters; Neon does not issue the cookie secret).
- `UPSTOX_API_KEY` is required for live option-chain analysis. `GROQ_API_KEY` and `OPENROUTER_API_KEY` are optional explanation providers.
- The app talks to Postgres through the Neon HTTP driver. Apply schema changes with `node -r dotenv/config ./node_modules/prisma/build/index.js migrate deploy`.
- Dev server: `npm run dev -- --hostname 0.0.0.0 --port 3000`.
