# OptionPilot UI/UX Overhaul Master Plan

## Objective
Execute the complete UI/UX overhaul of OptionPilot's dashboard and trading terminal to mirror the polished landing page design language (`LandingPage.tsx`, `globals.css`), strictly maintaining layout separation (Live Market vs. Analyze), retaining the original "Analyze" button with authentic ThinkingOrb animation, delivering enterprise-level typography (Geist Sans, Instrument Serif, tabular monospace), full responsiveness, NSE IST clock, slide-out history drawer, upgraded compare view mode, and clean TypeScript builds with zero regressions.

## Phases

### Phase 0: Survey & Discovery (Exploration)
- Explorer 1: Inspect Landing page design system (`app/components/LandingPage.tsx`, `app/globals.css`, color tokens, border styles, typography classes, button styles, ThinkingOrb component).
- Explorer 2: Inspect Dashboard & Terminal components (`app/dashboard/`, `analyze-panel.tsx`, `recommendation-panel.tsx`, `strategy-explorer.tsx`, `DerivativesBoard`, layout toggling, persistent `<aside>` sidebar, compare views mode).
- Explorer 3: Inspect Project build, tests, TypeScript configuration, package.json scripts, Upstox/SSE/WebSocket integration to identify verification gates and test commands.

### Phase 1: Architecture & Decomposition (PROJECT.md & TEST_INFRA.md)
- Synthesize explorer reports into `PROJECT.md` (Feature Inventory, Milestones, Interface Contracts, Code Layout).
- Create `TEST_INFRA.md` outlining testing strategy and verification harnesses.

### Phase 2: Milestone Iterations
- Milestone 1: Global Theme & Enterprise Typography Integration (Font configuration, CSS tokens, backgrounds, borders, card styles matching landing page).
- Milestone 2: Header & NSE IST Market Clock (Instrument Serif format, pulsing emerald live dot, responsive layout).
- Milestone 3: Search Form & Authentic "Analyze" Button with ThinkingOrb (Styling matching landing page, preserving ThinkingOrb state="listening" size 20 #0a1f5c, no regressions).
- Milestone 4: Slide-Out History Drawer (Replacing persistent `<aside>` in `analyze-panel.tsx` with high-polish slide-out sheet, `History (N)` trigger button, instant snapshot restoration).
- Milestone 5: Layout Separation & Derivatives Board (Dedicated full-width Live Market vs Analyze views, toggle button styling, table sorting, tick flashing, horizontal scroll wrapper).
- Milestone 6: Compare Views Mode Enhancement (Synchronized dual-pane styling, clean max-loss inputs, high-contrast borders).

### Phase 3: Verification & Auditing
- Full TypeScript build check (`npm run build` or `npx tsc`).
- Component rendering, unit/e2e tests, responsive checks.
- Independent Forensic Audit (`teamwork_preview_auditor`) to ensure authentic implementation and zero cheating/facades.

### Phase 4: Victory Report
- Synthesize all verification evidence, build logs, and visual confirmations.
- Send comprehensive report back to parent.
