# E2E Test Infra: OptionPilot UI/UX Overhaul

## Test Philosophy
- Requirement-driven, opaque-box, and non-destructive.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial Testing + Real-World Workload Testing.
- Zero regression tolerance on backend queries, calculation formulas, and type stability.

## Feature Inventory Coverage Matrix
| # | Feature | Requirement | Tier 1 (Unit/Spec) | Tier 2 (Boundary/Edge) | Tier 3 (Cross-Feature) | Tier 4 (Scenario) |
|---|---------|-------------|:------------------:|:----------------------:|:----------------------:|:-----------------:|
| 1 | ThinkingOrb & Analyze Button | R1 | ✓ (state="listening", size 20, #0a1f5c) | ✓ (pending vs idle, disabled states) | ✓ (triggering search, resetting view) | ✓ (full analysis flow) |
| 2 | Strict Layout Separation | R2 | ✓ (showBoard state mutual exclusion) | ✓ (switching back & forth) | ✓ (restoring snapshot resets showBoard) | ✓ (live market to strategy deep dive) |
| 3 | Enterprise Typography | R3 | ✓ (font-sans, font-serif, font-mono tabular-nums) | ✓ (very large numbers, tiny decimals) | ✓ (table alignment during live ticks) | ✓ (dashboard editorial aesthetic) |
| 4 | Elimination of AI Tropes | R3 | ✓ (removal of everest.jpg) | ✓ (no missing asset 404s) | ✓ (clean sky gradient layering) | ✓ (grounded visual presentation) |
| 5 | NSE IST Market Clock | R4 | ✓ (Instrument Serif format, live tick) | ✓ (midnight transition, single-digit sec) | ✓ (responsive hide on ultra-small screens)| ✓ (live header visual parity) |
| 6 | Full Responsiveness | R5 | ✓ (360px, 768px, 1024px, 1440px) | ✓ (table horizontal scroll wrapper) | ✓ (sub-bar flex wrapping) | ✓ (mobile touch & desktop click) |
| 7 | Slide-Out History Glass Drawer | R6 | ✓ (drawer mount/unmount, z-index, blur) | ✓ (0 snapshots vs 20 snapshots) | ✓ (instant snapshot restore & close) | ✓ (history review workflow) |
| 8 | Compare Views Mode | R7 | ✓ (dual left/right panes, separate views) | ✓ (null decisions, undefined max loss) | ✓ (focusPane target selection) | ✓ (Bullish vs Bearish evaluation) |
| 9 | Non-Destructive Code Quality | R8 | ✓ (all 26 tests pass) | ✓ (0 tsc errors, 0 lint errors) | ✓ (Prisma Neon & SSE feeds intact) | ✓ (full production Turbopack build) |

## Test Architecture & Invocation Commands
1. **Unit Test Suite**:
   `npm test`
   Runs Node native test runner with `--experimental-strip-types` across:
   - `lib/analysis.test.ts`
   - `lib/decision.test.ts`
   - `app/dashboard/types.test.ts`
   - `lib/derivativesBoard.test.ts`
   - `relay/universe.test.mjs`
   Expected: 26 passed, 0 failed.

2. **TypeScript Strict Type Check**:
   `npx tsc --noEmit`
   Expected: 0 errors, exit code 0.

3. **Linter Check**:
   `npm run lint`
   Expected: 0 errors, exit code 0.

4. **Production Build Validation**:
   `npm run build`
   Generates Prisma client and runs Turbopack compiler.
   Expected: 26 routes compiled, exit code 0.

5. **Component & Integration Verification**:
   Verification Worker / Test Writer checks DOM structures, class tokens, and component contracts against `LandingPage.tsx` and `ORIGINAL_REQUEST.md`.
