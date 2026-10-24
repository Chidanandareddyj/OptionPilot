# Survey Report: Build, Test & Backend Integrations

**Agent**: `explorer_survey_3` (Build, Test & Backend Integrations Explorer)  
**Date**: 2026-10-20  
**Working Directory**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\.agents\teamwork\explorer_survey_3`  
**Reference Document**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\.agents\teamwork\ORIGINAL_REQUEST.md`

---

## 1. Observation

### 1.1 Tool Commands, Execution Results & Current Build/Test Status

All four fundamental build, test, and verification pipelines were executed on the active codebase. Direct observations and exit codes:

1. **Test Runner (`npm test`)**
   - **Command**: `npm test`
   - **Underlying Command** (`package.json:10`):
     ```bash
     node --experimental-strip-types --test lib/analysis.test.ts lib/decision.test.ts app/dashboard/types.test.ts lib/derivativesBoard.test.ts relay/universe.test.mjs
     ```
   - **Exit Code**: `0`
   - **Output Summary**:
     - 26 tests executed across 5 test suites.
     - 26 passed, 0 failed, 0 skipped, 0 cancelled.
     - Total duration: ~3.4s.
     - Test breakdown:
       - `app/dashboard/types.test.ts`: 6 tests (Strategy definitions, Long Straddle normalization, condor & bear put spread legs, short straddle unlimited loss, Bull Call Spread normalization, lot size scaling).
       - `lib/analysis.test.ts`: 10 tests (User ID authorization requirement, non-empty company validation, snapshot storage, decision input parsing with pane handling, legacy vs compare decision parsing, compare decision merging).
       - `lib/decision.test.ts`: 4 tests (Bull call spread payoff capping, long straddle POP vs IV, short straddle 2-sigma move max loss, view mismatch score penalty).
       - `lib/derivativesBoard.test.ts`: 5 tests (Bull call spread per-lot profit/loss/investment, short straddle unlimited loss, stale price detection during market open, median Low/High split and sorting, nearest unexpired expiry filtering).
       - `relay/universe.test.mjs`: 1 test (ATM index and strike window calculation).

2. **TypeScript Compilation Check (`npx tsc --noEmit`)**
   - **Command**: `npx tsc --noEmit`
   - **Exit Code**: `0`
   - **Output**: Clean exit with 0 errors and empty stdout/stderr.
   - **Configuration** (`tsconfig.json`):
     - Target: `ES2017`, module: `esnext`, moduleResolution: `bundler`.
     - Strict mode: `true`, noEmit: `true`, skipLibCheck: `true`.
     - Alias: `"@/*": ["./*"]`.
     - Excludes: `node_modules`, `**/*.test.ts`.

3. **Linter Check (`npm run lint`)**
   - **Command**: `npm run lint` (`eslint`)
   - **Exit Code**: `0`
   - **Output Summary**: 0 errors, 3 warnings:
     - `app/components/LandingPage.tsx:244:11`: warning `Using <img> could result in slower LCP and higher bandwidth` (`@next/next/no-img-element`).
     - `app/dashboard/analyze-panel.tsx:343:9`: warning `The attribute aria-expanded is not supported by the role textbox` (`jsx-a11y/role-supports-aria-props`).
     - `app/dashboard/dashboard-background.tsx:7:7`: warning `Using <img> could result in slower LCP and higher bandwidth` (`@next/next/no-img-element`).

4. **Production Build (`npm run build`)**
   - **Command**: `npm run build`
   - **Underlying Command** (`package.json:7`):
     ```bash
     node -r dotenv/config ./node_modules/prisma/build/index.js generate && next build
     ```
   - **Exit Code**: `0`
   - **Output Summary**:
     - Prisma Client generated to `.\generated\prisma` in 60ms.
     - Next.js 16.3.0 (Turbopack) compiled successfully in 6.0s.
     - TypeScript validation passed in 12.2s.
     - 26 static and dynamic routes collected and rendered cleanly:
       - Dynamic (`ƒ`): `/`, `/account/[path]`, `/api/analyze`, `/api/auth/[...path]`, `/api/decide`, `/api/derivatives/token`, `/dashboard`, `/organization/[path]`.
       - SSG (`●`): `/auth/[path]` (12 auth endpoints).
       - Static (`○`): `/_not-found`.

---

### 1.2 Backend Integration Points That MUST NOT Be Broken (Requirement R8)

The application has four strictly coupled backend integration systems:

#### A. Upstox Live WebSocket Relay & SSE Pipeline
- **Files**:
  - `relay/server.mjs`: Node HTTP SSE server on port `8787` (or `PORT`).
  - `relay/feed.mjs`: Upstox WebSocket feed client using Protobuf schema `relay/MarketDataFeedV3.proto`.
  - `relay/universe.mjs`: Automatic daily downloader & parser for NSE F&O contracts from Upstox asset repository.
  - `app/api/derivatives/token/route.ts`: Authenticated Next.js route providing HMAC-SHA256 tokens (`exp.sig`) valid for 60 seconds.
  - `app/dashboard/derivatives-board.tsx`: Client EventSource consumer.
- **Wire Protocol & Contract**:
  - Authentication: Endpoint `GET /api/derivatives/token` requires authenticated session via `auth.getSession()`, returns `{ url, token }`.
  - Connection: `EventSource(`${url}/stream?token=${encodeURIComponent(token)}`)`.
  - Inbound Events:
    1. `universe`: Emits array of company descriptors:
       `{ k: string, s: string, n: string, e: string, l: number, strikes: number[] }`
    2. `tick`: Emits tick frame every 1s:
       `{ live: boolean, status: string, now: number, rows: [ { k: string, sp: number, w: [strike, ceLtp, ceLtt, peLtp, peLtt][] } ] }`
    3. `: ping\n\n`: Heartbeat every 15s to prevent TCP dropouts.
  - Critical Requirement: The data structures (`Company`, `LiveRow`, `Feed`) and event listeners in `app/dashboard/derivatives-board.tsx` must remain verbatim. Do not alter event names, property keys (`k`, `s`, `n`, `e`, `l`, `sp`, `w`), or token handshake.

#### B. Prisma Database Schema & ORM Queries
- **Files**:
  - `prisma/schema.prisma`
  - `lib/db.ts`
  - `app/dashboard/page.tsx`
  - `app/api/analyze/route.ts`
  - `app/api/decide/route.ts`
- **Driver / Adapter**:
  - `lib/db.ts:9-12`: Uses `@prisma/adapter-neon` (`PrismaNeonHttp`) over HTTP using `process.env.DATABASE_URL`. This is required because serverless and restricted environments block direct TCP 5432.
- **Entity Model**:
  ```prisma
  model Analysis {
    id        String   @id @default(cuid())
    userId    String
    company   String
    result    Json
    decision  Json?
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([userId])
    @@index([userId, createdAt])
  }
  ```
- **Active ORM Queries**:
  1. `app/dashboard/page.tsx:24-29`:
     ```ts
     prisma.analysis.findMany({
       where: { userId: session.user.id },
       orderBy: { createdAt: "desc" },
       take: 20,
       select: { id: true, company: true, result: true, decision: true, createdAt: true },
     })
     ```
  2. `app/api/analyze/route.ts:83-90`:
     ```ts
     prisma.analysis.create({
       data: {
         id: crypto.randomUUID(),
         ...toAnalysisRow(userId, company, payload),
         result: payload as Prisma.InputJsonValue,
         updatedAt: new Date(),
       },
     })
     ```
  3. `app/api/decide/route.ts:21 & 59-65`:
     ```ts
     prisma.analysis.findFirst({ where: { id: analysisId, userId } })
     prisma.analysis.update({
       where: { id: analysis.id },
       data: {
         decision: stored as Prisma.InputJsonValue,
         updatedAt: new Date(),
       },
     })
     ```
- **Decision Storage Contract** (`lib/analysis.ts`):
  - Legacy Single: `{ view: Category, strategies: [...], best: ... }`
  - Compare Wrapper: `{ compare: true, left: Decision | null, right: Decision | null }`
  - Handled via `parseStoredDecision()` and `mergeCompareDecision()`. These contracts MUST be preserved.

#### C. Strategy Math Engines & Normalization
- **Files**:
  - `strategies/*.ts` (14 strategy calculation files covering all 12 key strategies: `BullCallSpread`, `BullPutSpread`, `BearCallSpread`, `BearPutSpread`, `LongStraddle`, `ShortStraddle`, `LongStrangle`, `ShortStrangle`, `CallButterfly`, `PutButterfly`, `CallCondor`, `PutCondor`, etc.).
  - `lib/decision.ts`:
    - `normCdf(z)`: Abramowitz-Stegun polynomial CDF formula ($|error| < 1.5 \times 10^{-7}$).
    - `payoff(legs, price)`: Terminal option payoff sum $\sum q_i (\max(price - strike, 0) - premium)$.
    - `analyzeLegs(legs, spot, vol, years)`: Lognormal numerical integration across $\pm 4\sigma$ computing Expected Value (`ev`), Probability of Profit (`pop`), breakevens, and $2\sigma$ risk for undefined trades.
    - `realizedVol(closes)`: 30-day realized volatility from daily closing log returns.
    - `scoreStrategies(...)`: Multi-factor quantitative scoring (0 to 100) combining POP, EV/risk, reward:risk, IV vs RV vol edge, and view penalty.
    - `askMercury(...)`: OpenRouter LLM decision integration (`inception/mercury-decide:free`).
    - `rankDecision(scored, llm)`: Synthesizes quant + AI ranking.
  - `lib/derivativesBoard.ts`:
    - `buildChain()`: Reconstructs synthetic option chain from SSE tick window.
    - `evaluate()`: Evaluates single company/strategy pair for maxProfit, maxLoss, investment, and stale status (>15 min without trade during open market).
    - `applyView()`: Filters, searches, performs median Low/High investment splits, and sorts.
  - `app/dashboard/types.ts`:
    - `normalizeStrategy()`: Normalizes raw strategy JSON, computes `costOrCredit`, scales profit/loss/payoff tables by lot size (`effectiveLotSize = Math.max(1, lotSize)`).

#### D. Natural Language Strategy Explainer
- **File**: `lib/explain.ts`
- **Model**: `qwen/qwen3.8-27b` via Groq Chat Completions API (`process.env.GROQ_API_KEY`).
- **Prompt Structure**: Output partitioned into markdown headers: `## Recommendation`, `## Why this strategy`, `## Risks`, `## Other strategies`, ending with `This is not financial advice.`
- **Resilience**: Features automatic HTTP 429 retry backoff and non-blocking degradation if the key is missing.

---

### 1.3 Responsiveness & Styling Setup Observations

- **CSS Engine**: Tailwind CSS v4 (`@tailwindcss/postcss: ^4`, `tailwindcss: ^4`).
- **Theme Definition** (`app/globals.css:4-7`):
  ```css
  @theme inline {
    --font-sans: var(--font-geist-sans);
    --font-serif: var(--font-instrument-serif);
  }
  ```
- **Font Setup** (`app/layout.tsx:7-17` & `28`):
  - Primary Sans: `Geist` from `next/font/google` (`--font-geist-sans`).
  - Editorial Serif: `Instrument_Serif` from `next/font/google` (`--font-instrument-serif`, weight 400, normal & italic).
  - Injected on `<html>`: `className="${geistSans.variable} ${instrumentSerif.variable} h-full antialiased"`.
- **Viewport Meta**:
  - Next.js 16 default viewport is active (`width=device-width, initial-scale=1`).
- **Layout & Overflow Bottlenecks Observed in Current Dashboard**:
  1. `app/dashboard/analyze-panel.tsx:462`:
     `className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:px-8"`
     - Uses a fixed 2-column grid on desktop where the persistent `<aside>` takes `19rem` (304px), cramping the payoff charts and strategy comparison tables.
     - On mobile (`< lg`), `<aside>` has `order-first`, causing the saved snapshot list to render above the search bar, forcing mobile users to scroll down past 20 items before they can search or analyze!
  2. `app/dashboard/header.tsx:17-46`:
     - Clock currently uses `font-mono text-[13px]`, not the elegant `Instrument Serif` requested in R4 (`NSE 15:30:24 IST` with subtle seconds opacity and live pulsing dot).
  3. `app/dashboard/dashboard-background.tsx:7`:
     - Contains `<img src="/everest.jpg" ... blur-lg />` which creates an AI trope blurry image contrary to R3.
  4. `app/dashboard/derivatives-board.tsx:213`:
     - Table has `min-w-[56rem]`. Wrapped in `overflow-x-auto` which prevents horizontal page blowouts, but filters on line 177 need flex wrapping refinements for small screens (360px-480px).

---

## 2. Logic Chain

1. **Premise 1 (Build Integrity)**: The UI overhaul must not break compilation, tests, or runtime stability.
   - *Observation*: `npm test` (26/26 tests passing), `npx tsc --noEmit` (0 errors), `npm run lint` (0 errors), and `npm run build` (26 routes generated) all currently exit with code `0`.
   - *Deduction*: Any proposed UI change can be strictly validated against this exact suite. Any failure in `npm test` or `npm run build` represents an immediate regression.

2. **Premise 2 (Backend Preservation - R8)**:
   - *Observation*: All trading strategy calculations (`strategies/*`, `lib/decision.ts`, `lib/derivativesBoard.ts`, `app/dashboard/types.ts`) are pure mathematical transforms that do not depend on DOM or CSS.
   - *Deduction*: The UI overhaul does NOT need to touch the internal logic of any strategy calculator or decision scoring function. UI components should only consume normalized data types (`NormalizedStrategy`, `Evaluation`, `Decision`, `Snapshot`).

3. **Premise 3 (Live Market vs Analyze Separation - R2)**:
   - *Observation*: In `app/dashboard/analyze-panel.tsx`, state `showBoard` (lines 434, 510, 520, 526) toggles between `<DerivativesBoard />` and `<StrategyExplorer />`.
   - *Deduction*: Preserving `showBoard` state and the toggle button `"Show all derivatives"` / `"Hide all derivatives"` guarantees 100% adherence to R2. Neither view should ever be rendered simultaneously or nested inside the other.

4. **Premise 4 (History Drawer Replacement - R6)**:
   - *Observation*: The persistent `<aside>` element (lines 553-583 in `analyze-panel.tsx`) takes up 19rem on desktop and pushes above search on mobile (`order-first`).
   - *Deduction*: Extracting this list into a fixed slide-out drawer (`fixed inset-y-0 right-0 z-50 ...`) toggled by a `"History (N)"` button in the sub-bar eliminates the desktop grid split, unlocking full 100% width for the main dashboard content, and cures the mobile order problem completely.

5. **Premise 5 (Typography & Clock Upgrade - R3 & R4)**:
   - *Observation*: `Instrument_Serif` is already loaded in `app/layout.tsx` under `--font-instrument-serif` and mapped in `app/globals.css` to `--font-serif`.
   - *Observation*: `LandingPage.tsx:46-63` already has a working `Clock` implementation displaying `NSE {hm}<span className="text-white/45">{s}</span>` in `font-serif`.
   - *Deduction*: The dashboard header clock can be upgraded to match `LandingPage.tsx`'s clock format, adding an animated pulsing emerald dot (`animate-pulse`) and explicit `IST` badge, with full responsive adaptation.

---

## 3. Caveats

1. **Real-time Live Market Feeds Require Valid External Credentials**:
   - `relay/server.mjs` and `upstoxservices/*` depend on `UPSTOX_API_KEY` and `UPSTOX_ANALYTICS_TOKEN`. In environments where external market feeds are inactive (e.g. offline dev or weekend market closure), `npm test` uses synthetic mock option chains (such as those in `lib/decision.test.ts` and `lib/derivativesBoard.test.ts`). Verification of UI components must account for offline mock state without throwing console errors.
2. **Neon Database HTTP Proxy**:
   - `lib/db.ts` uses `PrismaNeonHttp`. When running database queries, a valid `DATABASE_URL` is required. The Next.js build (`next build`) runs with mocked or build-time environment variables safely.
3. **AI Explainer APIs**:
   - Groq (`lib/explain.ts`) and OpenRouter (`lib/mercury.ts`) are optional enhancements; both modules have built-in fallbacks that gracefully degrade to quant-only recommendations if API keys are absent. Testing does not rely on active LLM API keys.

---

## 4. Conclusion

1. **System Health**: The codebase is in pristine working order. All 26 unit tests pass, TypeScript compiles with zero errors, and Next.js Turbopack generates a full production build without issues.
2. **Architecture Safety**: The separation of concerns between backend services (`relay/`, `upstoxservices/`, `lib/`), API routes (`app/api/*`), and presentation (`app/dashboard/*`) is clean. UI refactoring can be performed with zero risk of breaking backend queries or calculations as long as existing component prop interfaces (`history`, `onAnalyze`, `decision`, `data`, `company`) are maintained.
3. **Clear Implementation Roadmap**:
   - **R1**: Retain `ThinkingOrb` (size 20, `#0a1f5c`, `state="listening"`) in `analyze-panel.tsx` with landing page white button styling.
   - **R2**: Keep `showBoard` boolean toggle separating full-width `DerivativesBoard` from `StrategyExplorer`.
   - **R3**: Use `Geist Sans` (`var(--font-sans)`), `Instrument Serif` (`var(--font-serif)`), and `font-mono tabular-nums`. Remove `everest.jpg` from `dashboard-background.tsx`.
   - **R4**: Update `app/dashboard/header.tsx` clock to `Instrument Serif` with pulsing emerald dot and `NSE HH:MM:SS IST`.
   - **R5**: Refactor container to full width (`w-full px-4 sm:px-6 lg:px-8`), ensuring horizontal scroll wrappers on tables and flex-wrap on filter bars.
   - **R6**: Replace `<aside>` in `analyze-panel.tsx` with slide-out sheet (`bg-[#07245c]/95 backdrop-blur-2xl border-white/15`). Add `"History (${history.length})"` trigger button to sub-bar.
   - **R7**: Keep dual-pane compare mode in `recommendation-panel.tsx` and `strategy-explorer.tsx`.
   - **R8**: Continuously verify with `npm test`, `npx tsc --noEmit`, and `npm run build`.

---

## 5. Verification Method

To independently verify all findings and confirm zero regressions during and after the UI overhaul, execute the following commands in sequence:

### 5.1 Verification Commands
```powershell
# 1. Run full test suite (Node test runner, strip types)
npm test

# Expected Output:
# 26 tests passing, 0 failing, exit code 0.

# 2. Run TypeScript strict type-checking
npx tsc --noEmit

# Expected Output:
# Empty output, exit code 0.

# 3. Run ESLint
npm run lint

# Expected Output:
# 0 errors (warnings permissible for img tags), exit code 0.

# 4. Run Next.js production build with Prisma generation
npm run build

# Expected Output:
# Prisma client generated in <100ms.
# Compiled successfully in Turbopack.
# 26 routes generated.
# Exit code 0.
```

### 5.2 Files to Inspect for Layout & Integration Invalidation
- `app/dashboard/analyze-panel.tsx`: Verify `ThinkingOrb` is present, `showBoard` view separation is maintained, and `<aside>` is replaced with the slide-out history drawer.
- `app/dashboard/header.tsx`: Verify Clock uses `font-serif` (`Instrument Serif`) and contains the active live emerald dot.
- `app/dashboard/dashboard-background.tsx`: Verify `everest.jpg` has been removed in favor of clean sky gradient & atmospheric haze.
- `app/dashboard/derivatives-board.tsx`: Verify EventSource SSE connection to `/api/derivatives/token` remains intact.
- `app/dashboard/recommendation-panel.tsx`: Verify `compareMode` dual-pane rendering functions correctly.
- `app/dashboard/types.ts`: Verify all 12 strategies and calculation normalization functions remain intact.

### 5.3 Invalidation Conditions
- Any exit code $\ne 0$ for `npm test`, `npx tsc --noEmit`, or `npm run build`.
- Any modification to mathematical formulas in `lib/decision.ts`, `lib/derivativesBoard.ts`, or `strategies/*`.
- Conflating Live Market and Strategy Explorer into a single concurrent view instead of maintaining the `showBoard` toggle.
