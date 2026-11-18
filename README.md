<p align="center">
  <img src="apps/mobile/assets/icon.png" alt="OptionPilot app icon" width="112" height="112" />
</p>

<h1 align="center">OptionPilot</h1>

<p align="center">
  <strong>Options strategies built to withstand any volatility.</strong><br />
  A web and mobile analysis platform for the Indian F&amp;O market.
</p>

<p align="center">
  <a href="https://github.com/Chidanandareddyj/OptionPilot/actions/workflows/web.yml">
    <img src="https://github.com/Chidanandareddyj/OptionPilot/actions/workflows/web.yml/badge.svg?branch=main" alt="Web CI" />
  </a>
  <a href="https://github.com/Chidanandareddyj/OptionPilot/actions/workflows/mobile.yml">
    <img src="https://github.com/Chidanandareddyj/OptionPilot/actions/workflows/mobile.yml/badge.svg?branch=main" alt="Mobile CI" />
  </a>
  <img src="https://img.shields.io/badge/PRs-welcome-25B4B6" alt="PRs welcome" />
  <img src="https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
</p>

<p align="center">
  <a href="#what-it-does">What it does</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#tech-stack">Tech stack</a> ·
  <a href="#getting-started">Getting started</a> ·
  <a href="#contributing">Contributing</a>
</p>

OptionPilot is an options strategy analysis platform for Indian markets. It combines a web app and an Expo mobile app with shared payoff and strategy logic, saved analyses, and a live derivatives market-data board.

> [!WARNING]
> **Risk notice:** Options are high-risk financial instruments. OptionPilot provides analysis tools and market-data-based estimates for informational purposes; it is not investment advice and does not place or execute trades. Verify market data and calculations independently before making financial decisions.

## What it does

- 📊 Looks up underlyings and option chains, then calculates payoff tables for 12 options strategies.
- 💾 Lets signed-in users save analyses, compare strategies, and request a risk-budget-aware ranking.
- 📈 Provides a derivatives board with live prices through a separate market-data relay.
- 🕘 Supports analysis history, account settings, and opt-in push alerts.
- 🧩 Shares core TypeScript models, payoff calculations, market-feed rules, and design tokens between web and mobile.

## Architecture

```mermaid
flowchart LR
  subgraph Clients["Clients"]
    Web["Web app<br/>Next.js"]
    Mobile["Mobile app<br/>Expo / React Native"]
  end
  subgraph App["OptionPilot application"]
    API["Next.js App Router<br/>UI and /api/*"]
    Shared["@optionpilot/shared<br/>payoffs, strategies, decisions, feed rules"]
  end
  subgraph Services["External and supporting services"]
    Auth["Neon Auth"]
    DB["Neon Postgres<br/>Prisma"]
    REST["Upstox REST API"]
    Model["OpenRouter<br/>Mercury Decide (optional)"]
    Relay["Node.js market-data relay<br/>SSE"]
    Feed["Upstox market-data<br/>WebSocket"]
    Push["Expo Push Service<br/>(optional)"]
  end
  Web --> API
  Mobile --> API
  Web -. imports .-> Shared
  Mobile -. imports .-> Shared
  API --> Shared
  API <-->|session and auth proxy| Auth
  API -->|Prisma queries| DB
  API -->|instruments, chains, quotes| REST
  API -. optional ranking input .-> Model
  API -->|mints 60-second HMAC token| Web
  API -->|mints 60-second HMAC token| Mobile
  Web -->|SSE connection with token| Relay
  Mobile -->|SSE connection with token| Relay
  Relay -->|market-data WebSocket| Feed
  Relay -->|universe and tick events| Web
  Relay -->|universe and tick events| Mobile
  API -. opt-in alerts .-> Push
```

### Request flow

1. A client sends an authenticated request to the Next.js API.
2. For an analysis, the API resolves the underlying and expiry, fetches the option chain from Upstox, calculates strategy payoffs using the shared package, and saves the result in Postgres.
3. The recommendation endpoint scores strategies against a market view and loss budget. If `OPENROUTER_API_KEY` is configured, it can also use Mercury Decide; unavailable model results fall back to quantitative scoring.
4. For the live board, the API returns a short-lived signed relay token. The client uses it to open an SSE stream; the relay maintains the upstream Upstox WebSocket feed and sends price updates to connected clients.

The relay is only needed for live streaming. Analysis, saved history, and recommendations use the web API and its configured services.

## Tech stack

| Area | Technologies |
| --- | --- |
| Web | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Mobile | Expo SDK 58, Expo Router, React Native, TypeScript |
| Shared domain logic | TypeScript workspace package (`@optionpilot/shared`) |
| Data and identity | Neon Postgres, Prisma, Neon Auth |
| Market data | Upstox REST and WebSocket APIs |
| Live relay | Node.js, WebSocket, Server-Sent Events (SSE) |
| Optional recommendation input | OpenRouter Mercury Decide |

## Repository layout

```text
apps/
  web/                 Next.js web app and API routes
  mobile/              Expo iOS and Android app
packages/
  shared/              Shared domain logic, strategy calculators, types, and theme tokens
relay/                 Live market-data relay service
.github/workflows/     Web and mobile CI workflows
```

## Getting started

### Requirements

- Node.js 22.13 or newer
- npm
- A PostgreSQL database (Neon is used by the deployed app)
- Neon Auth credentials and an Upstox API token for authenticated market-data features

### Install and configure the web app

Install the monorepo workspaces from the repository root:

```bash
npm ci
```

Create `apps/web/.env` and provide the credentials required by the features you want to run:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
# Optional: use the direct/unpooled URL for Prisma migrations.
DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

NEON_AUTH_BASE_URL="https://YOUR_AUTH_HOST"
NEON_AUTH_COOKIE_SECRET="replace-with-a-random-secret-at-least-32-characters-long"
NEON_AUTH_JWKS_URL="https://YOUR_AUTH_HOST/YOUR_JWKS_ENDPOINT"

UPSTOX_API_KEY="your-upstox-api-token"

# Optional live derivatives board. RELAY_SECRET must match relay/.env.
RELAY_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_RELAY_URL="http://localhost:8787"

# Optional AI-assisted ranking. Quantitative ranking works without this.
OPENROUTER_API_KEY="your-openrouter-api-key"

# Optional scheduled push alerts.
CRON_SECRET="your-cron-secret"
```

`NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, and `NEON_AUTH_JWKS_URL` must refer to your Neon Auth project. Use a strong cookie secret outside local development. `DATABASE_URL` is used by the app; `DATABASE_URL_UNPOOLED` is optional and is preferred for migration commands.

Apply the database migrations, then start the web app:

```bash
cd apps/web
npx prisma migrate deploy
cd ../..
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root `dev` script starts the web workspace and generates the Prisma client before running Next.js.

### Run the mobile app

The mobile app uses the deployed API URL by default. To use another API, set `EXPO_PUBLIC_API_BASE_URL` in `apps/mobile/.env` to a URL reachable from the device or simulator.

```bash
cd apps/mobile
npx expo start
```

Use a development build for device testing; Expo Go does not include every native module used by the app. See [apps/mobile/README.md](apps/mobile/README.md) for mobile-specific setup, checks, and feature details.

### Run the live market-data relay

The relay has its own dependencies and environment file. Create `relay/.env`:

```dotenv
UPSTOX_ANALYTICS_TOKEN="your-upstox-market-data-token"
RELAY_SECRET="the-same-value-as-apps-web-RELAY_SECRET"
PORT=8787
ALLOWED_ORIGIN="http://localhost:3000"
```

Then install and run it:

```bash
cd relay
npm ci
npm run dev
```

For a deployed relay, set `NEXT_PUBLIC_RELAY_URL` in the web app to its public HTTPS URL and configure `ALLOWED_ORIGIN` for the client origins that should connect. Keep `RELAY_SECRET` private and identical in the web app and relay.

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Web | PostgreSQL connection used by the application. |
| `DATABASE_URL_UNPOOLED` | Web / Prisma CLI | Optional direct connection for migrations and schema operations. |
| `NEON_AUTH_BASE_URL` | Web | Neon Auth project URL. |
| `NEON_AUTH_COOKIE_SECRET` | Web | Signs the web auth session cookies; use a random secret of at least 32 characters. |
| `NEON_AUTH_JWKS_URL` | Web | JWKS endpoint used to validate mobile bearer tokens. |
| `UPSTOX_API_KEY` | Web | Upstox REST API access for option chains, quotes, and related market data. |
| `OPENROUTER_API_KEY` | Web (optional) | Enables the optional Mercury Decide input to strategy ranking. |
| `RELAY_SECRET` | Web and relay | Shared secret for short-lived signed live-feed tokens. |
| `NEXT_PUBLIC_RELAY_URL` | Web | Public base URL returned to clients for the live-feed connection. |
| `UPSTOX_ANALYTICS_TOKEN` | Relay | Upstox market-data WebSocket access token. |
| `PORT` | Relay (optional) | HTTP listen port; defaults to `8787`. |
| `ALLOWED_ORIGIN` | Relay (optional) | CORS origin for stream clients; defaults to `*`. Set explicitly in deployments. |
| `CRON_SECRET` | Web (optional) | Authorizes the scheduled alerts endpoint. |
| `NEON_API_KEY`, `NEON_PROJECT_ID`, `NEON_BRANCH_ID` | Web (optional) | Enables server-side Neon Auth user deletion when all three are provided. |
| `EXPO_PUBLIC_API_BASE_URL` | Mobile (optional) | Web API base URL; defaults to `https://www.optionpilot.tech`. |

Never commit `.env` files, access tokens, or service credentials. The repository ignores environment files; use your deployment platform's secret store for deployed environments.

## Development commands

From the repository root:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the web app. |
| `npm run build` | Build the web app. |
| `npm run start` | Start the built web app. |
| `npm run lint` | Lint the web app and shared package. |
| `npm test` | Run shared, web, and relay tests. |

Mobile checks run from `apps/mobile`:

```bash
npm run typecheck
npm run lint
npm test
npx expo-doctor
npx expo export --platform ios --platform android --output-dir dist-native
```

The GitHub Actions workflows under `.github/workflows/` run the web and mobile checks on their configured branches and pull requests.

## Contributing

Contributions are welcome. For a substantial change, open an issue first to discuss the scope. For a pull request:

1. Create a focused branch from `main`.
2. Keep reusable business rules in `packages/shared` when both apps need them.
3. Add or update tests for changed behavior.
4. Run the relevant lint, typecheck, and test commands above.
5. Describe the change and include the checks you ran in the pull request.

Please do not include real credentials or personal market data in issues, commits, fixtures, or screenshots.

## Security

Do not report exploitable vulnerabilities in a public issue. Use GitHub's private vulnerability reporting for this repository when it is available.


---
