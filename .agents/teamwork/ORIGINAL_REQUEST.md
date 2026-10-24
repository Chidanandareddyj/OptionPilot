# Original User Request

## 2026-10-20T14:43:05Z

Execute the complete UI/UX overhaul of OptionPilot's dashboard and trading terminal to mirror the polished landing page design language, strictly maintaining layout separation (Live Market vs. Analyze), retaining the original "Analyze" button with its authentic ThinkingOrb animation, delivering enterprise-level typography, full mobile/tablet responsiveness, and an elegant NSE IST clock.

Working directory: c:\Users\surya\OneDrive\Documents\github\OptionPilot
Integrity mode: development

## Requirements

### R1. Retain Original "Analyze" Button & Authentic Animation
- Keep the original "Analyze" button in the search form (`analyze-panel.tsx`) with its authentic `ThinkingOrb` animation during calculating/pending states (`state="listening"`, size 20, `#0a1f5c`).
- Ensure the button is styled with the landing page's clean, high-contrast aesthetic (`rounded-[5px] bg-white px-5 py-2 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90`).

### R2. Strict Layout Separation (Do NOT Combine)
Maintain the existing architecture of two mutually exclusive full-width views toggled by the existing button (`showBoard`):
1. **Live Market Layout (`showBoard === true`):** Dedicated full-width `DerivativesBoard` streaming live SSE ticks, displaying the F&O universe table with sorting (ROI, Max Profit, Investment), and flashing tick highlights (`@keyframes tick-flash`).
2. **Analyze Strategy Layout (`showBoard === false`):** Dedicated deep-dive view housing the asset stats, strategy cards, payoff simulation, and recommendation engine.
- Preserve the exact toggle button (`"Show all derivatives"` / `"Hide all derivatives"`) in the sub-bar, elevated with landing page button styling.

### R3. Enterprise Typography & Humanized Aesthetics
- Integrate the landing page's signature enterprise font pairings:
  - **Primary UI:** `Geist Sans` (`var(--font-sans)`) for clean, highly legible SaaS navigation and text.
  - **Editorial Figures & Headings:** `Instrument Serif` (`var(--font-serif)`) for spot prices, metrics, and section titles to give a bespoke, humanized financial character.
  - **Tabular Market Data:** High-precision monospace (`font-mono tabular-nums`) for strikes, Greeks, LTP, and implied volatility.
- Eliminate all generic AI tropes (blurry mountain photos, purple/neon glow, ungrounded glassmorphism).

### R4. Prominent & Elegant NSE IST Market Clock
- Upgrade the live NSE IST clock in the dashboard header:
  - Format cleanly using `Instrument Serif` (`NSE 15:30:24 IST` with subtle seconds opacity).
  - Include the active live status indicator (pulsing emerald dot).
  - Ensure it stays prominent and adapts smoothly across desktop, tablet, and mobile breakpoints.

### R5. Full Responsiveness Across All Breakpoints
- Ensure zero horizontal clipping, awkward wraps, or layout shifts on screens from 360px mobile to 1440px+ wide desktop.
- Header, command palette, derivatives table (horizontal scroll wrapper), and strategy cards must stack or resize gracefully.

### R6. Slide-Out History Sheet / Drawer (Exact Landing Palette)
- Replace the current persistent `<aside>` sidebar in `analyze-panel.tsx` with a high-polish **Slide-Out History Drawer**.
- Add a `"History (N)"` trigger button to the command sub-bar. Clicking it slides out a glass sheet from the right (`bg-[#07245c]/95 backdrop-blur-2xl border-white/15`) showing past analyses with timestamps, verdict badges, and one-click instant snapshot restoration.

### R7. Compare Views Mode Preservation
- Maintain and visually upgrade the dual-pane **Compare Views Mode** in `recommendation-panel.tsx` and `strategy-explorer.tsx` so side-by-side Bullish vs Bearish evaluations share synchronized styling, high-contrast borders, and clean max-loss inputs.

### R8. Non-Destructive Code Quality & Verification
- Preserve all existing Upstox WebSocket relays, Prisma database queries, and strategy calculation formulas.
- Verify TypeScript builds cleanly and that all components pass with zero runtime or console errors.

## Acceptance Criteria

### Component & Theme Parity
- [ ] Dashboard background, cards, borders, and buttons match the exact CSS tokens and colors used in `app/components/LandingPage.tsx` and `app/globals.css`.
- [ ] Original "Analyze" button with `ThinkingOrb` animation is preserved in the search form.
- [ ] Clock displays in `Instrument Serif` with live ticking seconds and emerald live dot.
- [ ] Dual-pane Compare View functions seamlessly with side-by-side panes styled in the landing page aesthetic.

### Layout Architecture & History Drawer
- [ ] Live Market and Analyze Strategy views remain 100% separate full-width views.
- [ ] Saved snapshots are accessible via a slide-out drawer from the right, freeing full width for charts and tables.
- [ ] Entire dashboard is fully responsive across mobile, tablet, and desktop without horizontal overflow.

### Functional Integrity
- [ ] Upstox WebSocket feeds, SSE streams, analysis caching, and strategy calculations pass with zero TypeScript or console errors.
