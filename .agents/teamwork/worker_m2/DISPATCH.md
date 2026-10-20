## 2026-10-20T15:25:04Z
You are worker_m2.
Working Directory: c:\Users\surya\OneDrive\Documents\github\OptionPilot\.agents\teamwork\worker_m2
Original Request Path: c:\Users\surya\OneDrive\Documents\github\OptionPilot\.agents\teamwork\ORIGINAL_REQUEST.md
Project Spec: c:\Users\surya\OneDrive\Documents\github\OptionPilot\.agents\teamwork\orchestrator\PROJECT.md

Exclusive Write Ownership:
- `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\analyze-panel.tsx`
- `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\derivatives-board.tsx`
DO NOT modify any other files.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Mission:
1. Read ORIGINAL_REQUEST.md and PROJECT.md. Review the blueprints in:
   - `c:\Users\surya\OneDrive\Documents\github\OptionPilot\.agents\teamwork\explorer_survey_1\handoff.md`
   - `c:\Users\surya\OneDrive\Documents\github\OptionPilot\.agents\teamwork\explorer_survey_2\handoff.md`
2. Update `app/dashboard/analyze-panel.tsx`:
   - Search form: Style matching landing page card tokens (`border-white/12 bg-white/[0.04]`). Fix accessibility on search input.
   - Analyze button: Retain authentic `ThinkingOrb` animation (`state="listening"`, `size={20}`, `theme="light"`, `color="#0a1f5c"`) during calculating/pending state (`pending ? "Calculating…" : "Analyze"`).
   - Style the button with landing page tokens: `rounded-[5px] bg-white px-5 py-2 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90 disabled:opacity-70 shadow-sm transition-all`.
   - Command sub-bar:
     - Quick ticker chips (`NIFTY`, `BANKNIFTY`, `RELIANCE`, `TCS`, `INFY`) with landing chip styling.
     - Add `"History (N)"` trigger button showing `history.length` with history icon.
     - Preserve exact toggle button `"Show all derivatives"` / `"Hide all derivatives"` with landing pill styling.
   - Layout Separation:
     - Remove the persistent 19rem `<aside>` sidebar from the grid.
     - Convert root container to clean full width (`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6`).
     - Strict mutual exclusivity: `showBoard === true` displays full-width `DerivativesBoard`; `showBoard === false` displays full-width `StrategyExplorer`.
   - Slide-Out History Glass Drawer:
     - Add slide-out drawer from the right: `fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/15 bg-[#07245c]/95 backdrop-blur-2xl shadow-2xl`.
     - Dark backdrop overlay: `fixed inset-0 z-50 bg-black/60 backdrop-blur-sm`.
     - Header: `"Analysis History"` in `Instrument Serif` (`font-serif text-xl`), close button `✕`, count indicator.
     - Body: Saved snapshot cards with company ticker (`font-mono text-base font-bold text-sky-300`), spot price (`₹...`), timestamp in IST, and verdict badges (`singleDec.view · bestName`, `Dual Compare View`, or `12 Strategies`).
     - Snapshot click: sets `setActive(item)`, resets `setShowBoard(false)`, closes drawer (`setHistoryOpen(false)`).
3. Update `app/dashboard/derivatives-board.tsx`:
   - Elevate board wrapper to full width with landing card styling (`border border-white/12 bg-white/[0.04] rounded-xl p-4 sm:p-6`).
   - Ensure derivatives table is inside an `overflow-x-auto` wrapper with smooth horizontal scrolling for full mobile responsiveness down to 360px.
   - Preserve all SSE feeds (`/api/derivatives/token`), live tick state, tick flash highlights (`@keyframes tick-flash`), sorting, and filters.
4. Run verification commands:
   - `npm test` (all 26 tests must pass)
   - `npx tsc --noEmit` (0 errors)
5. Write your complete handoff report to `c:\Users\surya\OneDrive\Documents\github\OptionPilot\.agents\teamwork\worker_m2\handoff.md`.
6. When complete, use `send_message` to report back to orchestrator (conversation ID: 1d9662cd-2a36-4b90-8f67-ed0fbe8aaea5).
