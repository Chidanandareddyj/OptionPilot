# Project: OptionPilot UI/UX Overhaul

## Architecture
- **Framework**: Next.js 16 (App Router, Turbopack) + React 19 + Tailwind CSS v4.
- **Design System Parity**: Mirror `app/components/LandingPage.tsx` and `app/globals.css`.
  - Background: Pure deep navy system (`#061f52` floor, `#07245c` drawer, `#06245e` sticky header).
  - Cards: `border border-white/12 bg-white/[0.04] rounded-xl hover:bg-white/[0.07]`.
  - Primary Button: `rounded-[5px] bg-white px-5 py-2 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90 shadow-sm transition-all`.
  - Secondary Buttons / Pills: `border border-white/15 bg-white/5 hover:bg-white/10 text-white rounded-[5px]`.
- **Typography Architecture**:
  - Primary UI Sans: `Geist Sans` (`var(--font-sans)`).
  - Editorial Serif: `Instrument Serif` (`var(--font-serif)`) for spot figures, major metrics, and header clock.
  - Tabular Data: `font-mono tabular-nums` for strikes, Greeks, LTP, P&L, and ROI.
- **Layout Architecture**:
  - Mutually exclusive full-width views toggled by `showBoard`:
    - `showBoard === true`: Full-width `DerivativesBoard` (SSE ticks, F&O universe, `@keyframes tick-flash`).
    - `showBoard === false`: Full-width `StrategyExplorer` & `RecommendationPanel` deep dive.
  - Slide-Out History Drawer: Glass sheet from right (`bg-[#07245c]/95 backdrop-blur-2xl border-l border-white/15`) replacing persistent `<aside>` sidebar.
- **Backend Integrations (Immutable - R8)**:
  - Upstox WebSocket feed + SSE relay (`relay/server.mjs`, `/api/derivatives/token`).
  - Prisma ORM (`prisma/schema.prisma`, `Analysis` model, Neon HTTP adapter).
  - 12 F&O Strategy calculation engines (`strategies/*`, `lib/decision.ts`, `lib/derivativesBoard.ts`).

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Authentic Analyze Button & ThinkingOrb | Retain ThinkingOrb (state="listening", size 20, theme="light", color="#0a1f5c") in Search form with landing page button tokens | M2 | ORIGINAL_REQUEST §R1 | VERIFIED |
| 2 | Strict Layout Separation | Maintain mutually exclusive full-width views (Live Market vs. Analyze) via elevated toggle button | M2 | ORIGINAL_REQUEST §R2 | VERIFIED |
| 3 | Enterprise Typography | Geist Sans for UI, Instrument Serif for spot/clock/headings, monospace tabular-nums for market data | M1, M3 | ORIGINAL_REQUEST §R3 | VERIFIED |
| 4 | Elimination of AI Tropes | Remove /everest.jpg blurred image from dashboard background, replace with clean sky gradient | M1 | ORIGINAL_REQUEST §R3 | VERIFIED |
| 5 | Prominent NSE IST Market Clock | Instrument Serif live clock with subtle seconds opacity and pulsing emerald live status dot in header | M1 | ORIGINAL_REQUEST §R4 | VERIFIED |
| 6 | Full Responsiveness | Mobile (360px) to desktop (1440px+) layout adaptation with zero horizontal overflow | M1, M2, M3 | ORIGINAL_REQUEST §R5 | VERIFIED |
| 7 | Slide-Out History Glass Drawer | Slide-out glass drawer from right with snapshot restoration, timestamp, spot price, and verdict badges | M2 | ORIGINAL_REQUEST §R6 | VERIFIED |
| 8 | Upgraded Compare Views Mode | Dual-pane Bullish vs Bearish evaluation with synchronized styling, high-contrast borders, ₹ max loss inputs, focus pane selector | M3 | ORIGINAL_REQUEST §R7 | VERIFIED |
| 9 | Non-Destructive Code Quality & Build Verification | Pass all 26 unit tests, clean tsc --noEmit, successful npm run build with Turbopack, and zero backend regressions | M4 | ORIGINAL_REQUEST §R8 | VERIFIED |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Aesthetic Foundation, Enterprise Typography & Header Clock | `dashboard-background.tsx`, `header.tsx`: remove everest.jpg, upgrade Clock to Instrument Serif + pulsing emerald dot, header responsiveness | none | DONE |
| M2 | Command Center, Authentic Analyze Button, Slide-Out History Drawer & Full-Width Layout Separation | `analyze-panel.tsx`, `derivatives-board.tsx`: landing card styling for search form, ThinkingOrb state="listening" size 20 #0a1f5c, quick-pick chips, elevated view toggle, slide-out glass drawer, full-width Live Market vs Analyze views | M1 | DONE |
| M3 | Compare Views Mode Polish & Strategy Explorer Overhaul | `recommendation-panel.tsx`, `strategy-explorer.tsx`, `strategy-card.tsx`, `strategy-detail.tsx`, `payoff-chart.tsx`: synchronized compare panes, ₹ max loss inputs, focus pane selector, tabular monospace figures | M2 | DONE |
| M4 | Full Verification, E2E Testing & Forensic Audit | Verification suite: npm test (26/26 tests), npx tsc --noEmit (0 errors), npm run build (26 routes), E2E criteria validation, Forensic Integrity Audit | M3 | DONE |

## Code Layout
- `app/dashboard/dashboard-background.tsx`: Sky gradient container (no external blurred images). [DONE]
- `app/dashboard/header.tsx`: Top dashboard bar, Clock component with Instrument Serif & pulsing emerald indicator. [DONE]
- `app/dashboard/analyze-panel.tsx`: Search form with ThinkingOrb Analyze button, sub-bar with History & View toggles, Slide-Out History Sheet, and full-width view routing. [DONE]
- `app/dashboard/derivatives-board.tsx`: Real-time F&O universe table, SSE consumer, tick-flash animations, horizontal scroll wrapper. [DONE]
- `app/dashboard/strategy-explorer.tsx`: Dual or single strategy breakdown, payoff graph container, card focus selector. [DONE]
- `app/dashboard/recommendation-panel.tsx`: View selector, max loss input, Compare mode toggle and dual-pane scoring. [DONE]
- `app/dashboard/strategy-card.tsx`: Individual strategy cards with high-contrast borders and monospace financial metrics. [DONE]
- `app/dashboard/strategy-detail.tsx`: Legs breakdown, strikes, breakevens, Greeks, and EV/POP display. [DONE]
- `app/dashboard/payoff-chart.tsx`: Interactive SVG payoff curve with breakeven lines and current spot indicator. [DONE]
