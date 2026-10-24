## 2026-10-20T14:57:40Z

You are worker_m1.
Working Directory: c:\Users\surya\OneDrive\Documents\github\OptionPilot\.agents\teamwork\worker_m1
Original Request Path: c:\Users\surya\OneDrive\Documents\github\OptionPilot\.agents\teamwork\ORIGINAL_REQUEST.md
Project Spec: c:\Users\surya\OneDrive\Documents\github\OptionPilot\.agents\teamwork\orchestrator\PROJECT.md

Exclusive Write Ownership:
- `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\dashboard-background.tsx`
- `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\header.tsx`
DO NOT modify any other files.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Mission:
1. Read ORIGINAL_REQUEST.md and PROJECT.md. Also review the blueprints in:
   - `c:\Users\surya\OneDrive\Documents\github\OptionPilot\.agents\teamwork\explorer_survey_1\handoff.md`
   - `c:\Users\surya\OneDrive\Documents\github\OptionPilot\.agents\teamwork\explorer_survey_2\handoff.md`
2. Update `app/dashboard/dashboard-background.tsx`:
   - Eliminate the AI trope `/everest.jpg` blurred image.
   - Replace with clean sky gradient layering and atmospheric cloud elements matching the landing page aesthetic.
3. Update `app/dashboard/header.tsx`:
   - Upgrade the `Clock` component:
     - 24-hour format using `new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false })`.
     - Styled with `Instrument Serif` (`font-serif text-[15px] sm:text-[16px]`).
     - Display: `NSE {hm}` + `<span className="text-white/45">{s}</span>` + `<span className="... max-sm:hidden">IST</span>`.
     - Active live pulsing emerald indicator: dual-ring with `animate-ping` and solid inner core (`bg-emerald-400`).
   - Header responsiveness:
     - Ensure the header wraps and flexes gracefully from 360px mobile up to 1440px desktop with zero horizontal clipping.
4. Run verification commands:
   - `npm test` (must pass all 26 tests)
   - `npx tsc --noEmit` (must have 0 errors)
5. Write your complete handoff report to `c:\Users\surya\OneDrive\Documents\github\OptionPilot\.agents\teamwork\worker_m1\handoff.md` including exact diffs, test commands, and output results.
6. When complete, use `send_message` to report back to orchestrator (conversation ID: 1d9662cd-2a36-4b90-8f67-ed0fbe8aaea5).
