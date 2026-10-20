# Dashboard & Terminal Components Exploration Report

## 1. Observation

### 1.1 Identified Dashboard & Terminal Files
- **Page Entry Point**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\page.tsx`
- **Dashboard Header**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\header.tsx`
- **Dashboard Background**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\dashboard-background.tsx`
- **Analyze Panel & Search**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\analyze-panel.tsx`
- **Derivatives Board**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\derivatives-board.tsx`
- **Strategy Explorer**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\strategy-explorer.tsx`
- **Recommendation Panel**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\recommendation-panel.tsx`
- **Strategy Card**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\strategy-card.tsx`
- **Strategy Detail**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\strategy-detail.tsx`
- **Payoff Chart**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\payoff-chart.tsx`
- **Types & Catalog**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\dashboard\types.ts`
- **Landing Page Reference**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\components\LandingPage.tsx`
- **Global Styles & CSS**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\globals.css`
- **Root Layout & Fonts**: `c:\Users\surya\OneDrive\Documents\github\OptionPilot\app\layout.tsx`

---

### 1.2 Layout Separation Architecture & `showBoard` State
In `app/dashboard/analyze-panel.tsx`:
- Line 434: `const [showBoard, setShowBoard] = useState(false);`
- Line 439: In `analyze(target)`: `setShowBoard(false);`
- Lines 462-463:
  ```tsx
  <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:px-8">
    <section className="min-w-0">
  ```
- Lines 510-516:
  ```tsx
  <button
    type="button"
    onClick={() => setShowBoard((v) => !v)}
    className={`ml-auto rounded border px-2.5 py-0.5 text-[11px] font-medium ${
      showBoard ? "border-sky-400/70 bg-sky-500/25 text-white" : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
    }`}
  >
    {showBoard ? "Hide all derivatives" : "Show all derivatives"}
  </button>
  ```
- Lines 520-550:
  ```tsx
  {showBoard && <DerivativesBoard onAnalyze={analyze} />}

  {error && (
    <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 font-mono text-xs text-rose-200">{error}</p>
  )}

  {showBoard ? null : pending ? (
    <div className="mt-6 animate-pulse space-y-3 rounded-xl border border-white/10 p-4 sm:p-6">
      ...
    </div>
  ) : active ? (
    <StrategyExplorer
      key={active.id ?? "latest"}
      data={active.result}
      company={active.company}
      analysisId={active.id}
      decision={active.decision}
    />
  ) : (
    <div className="mt-10 rounded-xl border border-dashed border-white/10 p-10 text-center">
      <h3 className="font-serif text-lg">No option chain loaded</h3>
      ...
    </div>
  )}
  ```
- Lines 553-582: Persistent `<aside>` sidebar rendered as a column in the CSS grid:
  ```tsx
  <aside className="order-first min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4 lg:order-none lg:self-start">
    <h2 className="flex items-center justify-between border-b border-white/10 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
      Saved snapshots
      <span className="font-mono tracking-normal text-white/60">{history.length}</span>
    </h2>
    ...
  ```
- **Finding**: While `showBoard` mutually excludes rendering between `<DerivativesBoard />` and `<StrategyExplorer />`, both views are currently constricted by the inline 19rem (`304px`) `<aside>` column, preventing the Live Market board from using the full screen width.

---

### 1.3 History Sidebar & Snapshot Restoration
In `app/dashboard/analyze-panel.tsx`:
- `history` is passed as a prop from `app/dashboard/page.tsx`, loaded via:
  ```ts
  const history = await prisma.analysis.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, company: true, result: true, decision: true, createdAt: true },
  });
  ```
- Current `<aside>` renders:
  - Header: `"Saved snapshots"` with count badge.
  - Horizontal scroll list on mobile (`flex gap-2 overflow-x-auto pb-1`).
  - Vertical list on desktop (`lg:max-h-[32rem] lg:flex-col lg:overflow-y-auto`).
  - Item button:
    ```tsx
    <button
      type="button"
      onClick={() => setActive(item)}
      className={`w-full rounded-lg border p-3 text-left transition-colors ${
        active?.id === item.id
          ? "border-sky-400/70 bg-[#082054]"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
      }`}
    >
      <div className="truncate text-sm font-semibold">{item.company}</div>
      <div className="mt-1 font-mono text-[11px] text-white/40">
        {item.createdAt?.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
      </div>
    </button>
    ```
- **Finding**: Snapshot restoration works synchronously by calling `setActive(item)`. But when a user restores a snapshot while `showBoard === true`, the current code does not reset `showBoard(false)`, so the user would stay on the derivatives board rather than viewing the restored strategy.
- Additionally, the snapshots currently lack verdict badges (e.g. strategy verdict, score, or view), spot price, and company full name.

---

### 1.4 Analyze Button & ThinkingOrb Animation
In `app/dashboard/analyze-panel.tsx` lines 480-490:
```tsx
<button
  type="submit"
  disabled={pending}
  className="inline-flex items-center justify-center gap-2 rounded-[5px] bg-white px-5 py-2 text-[12px] font-medium text-[#0a1f5c] hover:bg-white/90 disabled:opacity-70"
>
  {pending && (
    <ThinkingOrb state="listening" size={20} theme="light" color="#0a1f5c" aria-label="Listening…" />
  )}
  {pending ? "Calculating…" : "Analyze"}
</button>
```
- **Finding**: `ThinkingOrb` is imported from `"thinking-orbs"`.
- Props: `state="listening"`, `size={20}`, `theme="light"`, `color="#0a1f5c"`, `aria-label="Listening…"`.
- The button is currently styled with `font-medium`; requirement R1 specifies `font-semibold` with landing page styling `rounded-[5px] bg-white px-5 py-2 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90 shadow-sm`.

---

### 1.5 Header & NSE IST Clock
In `app/dashboard/header.tsx` lines 17-46:
```tsx
function Clock() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[13px] tabular-nums">
      <span className="size-1.5 rounded-full bg-emerald-400" />
      <span className="font-sans text-[11px] font-semibold text-white/60">NSE</span>
      <span>
        {time ? time.slice(0, -6) : "--:--"}
        <span className="text-white/40 max-sm:hidden">{time ? time.slice(-6, -3) : ":--"}</span>
      </span>
      <span className="font-sans text-[10px] font-semibold text-sky-300">{time?.slice(-2)}</span>
      <span className="font-sans text-[10px] text-white/40 max-sm:hidden">IST</span>
    </span>
  );
}
```
- Compare with `LandingPage.tsx` lines 46-63:
  ```tsx
  function Clock() {
    const [time, setTime] = useState<string | null>(null);
    useEffect(() => {
      const tick = () =>
        setTime(new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false }));
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }, []);
    const hm = time ? time.slice(0, 5) : "--:--";
    const s = time ? time.slice(5) : ":--";
    return (
      <span className="font-serif text-[17px] tracking-wide">
        NSE {hm}
        <span className="text-white/45">{s}</span>
      </span>
    );
  }
  ```
- **Finding**:
  1. The dashboard clock currently outputs 12-hour AM/PM format sliced manually instead of standard 24-hour Indian Standard Time (`en-GB`, `{ hour12: false }`).
  2. The dashboard clock uses `font-mono` instead of `Instrument Serif` (`font-serif`).
  3. The indicator dot is a static 1.5px circle (`bg-emerald-400`), missing the pulsing animated ping halo (`animate-ping`).

---

### 1.6 Dual-Pane Compare Views Mode
In `app/dashboard/recommendation-panel.tsx`:
- Lines 267-384: `RecommendationPanel` controls `compareMode` via checkbox toggle.
- When `compareMode === true`:
  - Renders two `RecommendationPane` instances: `pane="left"` (default `bullish`) and `pane="right"` (default `bearish`).
  - Shares a single `maxLoss` budget at the panel header.
  - Submits API requests to `/api/decide` with `{ analysisId, view, maxLoss, pane }`.
- In `app/dashboard/strategy-explorer.tsx`:
  - Lines 186-208: Dual `StrategyDetail` components rendered side-by-side in `grid grid-cols-1 gap-4 lg:grid-cols-2`.
  - Lines 229-245: Focus pane selector:
    `Cards apply to: [left] [right]`, which controls which pane receives strategy card selections.
- **Finding**: The logic is fully robust, supporting single and compare modes. What it needs is visual alignment with the Landing Page aesthetic (high-contrast borders, refined currency input with `₹` symbol, clear left/right pane distinction, and styled toggle).

---

### 1.7 Dashboard Background & AI Tropes
In `app/dashboard/dashboard-background.tsx` lines 1-11:
```tsx
export default function DashboardBackground() {
  return (
    <div aria-hidden="true" className="sky pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="cloud" style={{ top: "4%", right: "-5%", width: "45vw", height: "15vh", opacity: 0.6 }} />
      <div className="cloud" style={{ bottom: "10%", left: "-10%", width: "50vw", height: "30vh", opacity: 0.5 }} />
      <div className="cloud" style={{ bottom: "-5%", right: "-10%", width: "55vw", height: "35vh", opacity: 0.65 }} />
      <img src="/everest.jpg" alt="" className="absolute inset-0 h-full w-full scale-105 object-cover object-bottom opacity-40 blur-lg" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#03112e]/95 via-[#04153b]/82 to-[#03112e]/97" />
    </div>
  );
}
```
- Line 7 contains: `<img src="/everest.jpg" alt="" className="absolute inset-0 h-full w-full scale-105 object-cover object-bottom opacity-40 blur-lg" />`.
- **Finding**: Requirement R3 explicitly mandates: *"Eliminate all generic AI tropes (blurry mountain photos, purple/neon glow, ungrounded glassmorphism)"*. The `/everest.jpg` blurred image is exactly that trope and should be removed.

---

### 1.8 Build and Test Verification
- Executed `npm test`:
  `node --experimental-strip-types --test lib/analysis.test.ts lib/decision.test.ts app/dashboard/types.test.ts lib/derivativesBoard.test.ts relay/universe.test.mjs`
  **Result**: 26 passed, 0 failed, exit code 0.
- Executed `npx tsc --noEmit`:
  **Result**: Zero TypeScript errors, exit code 0.

---

## 2. Logic Chain

1. **Premise 1 (Layout Constriction)**: In `analyze-panel.tsx`, `<section className="min-w-0">` and `<aside className="... lg:grid-cols-[minmax(0,1fr)_19rem]">` are in the same grid. Removing `<aside>` from inline rendering unlocks 100% of the horizontal grid width for `<DerivativesBoard />` and `<StrategyExplorer />`.
2. **Premise 2 (Mutual Exclusivity)**: `showBoard` already toggles cleanly between `DerivativesBoard` and `StrategyExplorer`. When the 19rem sidebar is detached into a slide-out drawer, both views naturally become full-width without interfering with each other.
3. **Premise 3 (Drawer Architecture)**: An overlay sheet anchored at `fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-[#07245c]/95 backdrop-blur-2xl border-l border-white/15 shadow-2xl` triggered by `"History (${history.length})"` in the command sub-bar fulfills Requirement R6 with zero layout shift to the main content.
4. **Premise 4 (Snapshot Restoration)**: By ensuring that selecting a snapshot sets `setActive(item)`, resets `setShowBoard(false)`, and closes the drawer, users instantly transition into the restored deep-dive strategy analysis.
5. **Premise 5 (NSE IST Clock)**: Updating `header.tsx` to use `toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false })` with `Instrument Serif` (`font-serif text-[15px] sm:text-[16px]`), subtle seconds opacity (`opacity-45`), and a dual-ring pulsing emerald dot (`animate-ping` + solid core) achieves full parity with Requirement R4 and `LandingPage.tsx`.
6. **Premise 6 (Compare Views Mode)**: Upgrading the `compareMode` controls in `recommendation-panel.tsx` with high-contrast borders, explicit Bullish (emerald) vs Bearish (rose) accents, styled ₹ max-loss input, and clear focus-pane indicators preserves the existing mathematical scoring while delivering landing page aesthetics.

---

## 3. Caveats

1. **State Preservation**: When switching between `showBoard === true` (Live Market) and `showBoard === false` (Analyze Strategy), the SSE connection in `derivatives-board.tsx` connects on mount and disconnects on unmount. This is intentional to save bandwidth and Upstox rate limits when the user is deep-diving into a specific strategy.
2. **Snapshot Decision Structure**: Historical snapshots in Prisma DB may or may not have an attached `decision` object (e.g. if the user only priced the 12 strategies but did not click "Recommend"). The verdict badge logic must safely check for null/undefined decisions using `parseStoredDecision()`.
3. **Responsive Breakpoints**: On mobile displays below 380px, the header should hide the "OptionPilot" brand text while keeping the logo mark and clock to prevent any horizontal overflow.

---

## 4. Conclusion & Implementation Blueprint

### 4.1 Implementation Blueprint for `analyze-panel.tsx`
1. **Remove Inline `<aside>`**:
   Change root container from:
   `mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:px-8`
   To:
   `mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6`
2. **Elevate Command Sub-bar**:
   Add `"History (N)"` trigger button and `"Show all derivatives"` toggle button:
   ```tsx
   <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
     <div className="flex flex-wrap items-center gap-1.5">
       <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Quick</span>
       {QUICK.map((sym) => (
         <button
           key={sym}
           type="button"
           disabled={pending}
           onClick={() => analyze(sym)}
           className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
         >
           {sym}
         </button>
       ))}
     </div>
     <div className="flex items-center gap-2">
       <button
         type="button"
         onClick={() => setHistoryOpen(true)}
         className="inline-flex items-center gap-1.5 rounded-[5px] border border-white/15 bg-white/5 px-3 py-1 text-[11.5px] font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
       >
         <svg className="size-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
         </svg>
         <span>History ({history.length})</span>
       </button>
       <button
         type="button"
         onClick={() => setShowBoard((v) => !v)}
         className={`rounded-[5px] border px-3 py-1 text-[11.5px] font-medium transition-colors ${
           showBoard
             ? "border-sky-400/70 bg-sky-500/25 text-white"
             : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
         }`}
       >
         {showBoard ? "Hide all derivatives" : "Show all derivatives"}
       </button>
     </div>
   </div>
   ```
3. **Slide-Out History Drawer Component**:
   ```tsx
   {historyOpen && (
     <>
       {/* Backdrop */}
       <div
         className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
         onClick={() => setHistoryOpen(false)}
       />
       {/* Sheet */}
       <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/15 bg-[#07245c]/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right duration-200">
         <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
           <div>
             <h2 className="font-serif text-xl tracking-tight text-white">Analysis History</h2>
             <p className="text-[11px] text-white/50">{history.length} saved snapshot{history.length === 1 ? "" : "s"}</p>
           </div>
           <button
             type="button"
             onClick={() => setHistoryOpen(false)}
             className="flex size-7 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
           >
             ✕
           </button>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
           {history.length === 0 ? (
             <div className="py-12 text-center font-mono text-xs text-white/40">NO SAVED ANALYSES</div>
           ) : (
             history.map((item) => {
               const stored = parseStoredDecision(item.decision);
               const singleDec = stored.mode === "single" ? (stored.single as any) : null;
               const bestKey = singleDec?.best?.key;
               const bestName = bestKey ? (STRATEGY_DEFINITIONS[bestKey]?.name ?? bestKey) : null;
               const spot = (item.result as any)?.underlying_spot_price;

               return (
                 <button
                   key={item.id}
                   type="button"
                   onClick={() => {
                     setActive(item);
                     setShowBoard(false);
                     setHistoryOpen(false);
                   }}
                   className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                     active?.id === item.id
                       ? "border-sky-400/70 bg-[#082054] shadow-md shadow-sky-500/10"
                       : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                   }`}
                 >
                   <div className="flex items-baseline justify-between">
                     <span className="font-mono text-base font-bold text-sky-300">{item.company}</span>
                     {spot && (
                       <span className="font-mono text-xs tabular-nums text-white/80">
                         ₹{Number(spot).toLocaleString("en-IN", { minimumFractionDigits: 1 })}
                       </span>
                     )}
                   </div>
                   <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                     {bestName ? (
                       <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                         {singleDec.view} · {bestName}
                       </span>
                     ) : stored.mode === "compare" ? (
                       <span className="rounded border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                         Dual Compare View
                       </span>
                     ) : (
                       <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">
                         12 Strategies
                       </span>
                     )}
                   </div>
                   <div className="mt-2 text-[10.5px] font-mono text-white/40">
                     {item.createdAt?.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                   </div>
                 </button>
               );
             })
           )}
         </div>
       </div>
     </>
   )}
   ```
4. **Preserve Analyze Button**:
   Keep `ThinkingOrb` with `state="listening"`, `size={20}`, `theme="light"`, `color="#0a1f5c"`, and text switching from `"Analyze"` to `"Calculating…"`.
   Update class to:
   `inline-flex items-center justify-center gap-2 rounded-[5px] bg-white px-5 py-2 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90 disabled:opacity-70 shadow-sm transition-all`

---

### 4.2 Implementation Blueprint for `header.tsx`
Update `Clock`:
```tsx
function Clock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          timeZone: "Asia/Kolkata",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const hm = time ? time.slice(0, 5) : "--:--";
  const s = time ? time.slice(5) : ":--";

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 font-serif text-[15px] sm:text-[16px] tracking-wide text-white">
      <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </span>
      <span className="inline-flex items-baseline">
        <span className="font-sans text-[10.5px] font-semibold uppercase tracking-wider text-white/60 mr-1.5">NSE</span>
        <span className="tabular-nums font-serif">{hm}</span>
        <span className="tabular-nums font-serif text-white/45">{s}</span>
        <span className="font-sans text-[10px] text-white/40 ml-1.5 tracking-wider max-sm:hidden">IST</span>
      </span>
    </div>
  );
}
```

---

### 4.3 Implementation Blueprint for `dashboard-background.tsx`
Remove `<img>` tag and blurred mountain image. Replace with clean navy sky styling:
```tsx
export default function DashboardBackground() {
  return (
    <div aria-hidden="true" className="sky pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="cloud" style={{ top: "3%", right: "-5%", width: "45vw", height: "15vh", opacity: 0.55 }} />
      <div className="cloud" style={{ bottom: "10%", left: "-10%", width: "50vw", height: "25vh", opacity: 0.45 }} />
      <div className="cloud" style={{ bottom: "-5%", right: "-10%", width: "55vw", height: "30vh", opacity: 0.6 }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#03112e]/90 via-[#04153b]/80 to-[#03112e]/95" />
    </div>
  );
}
```

---

### 4.4 Implementation Blueprint for `recommendation-panel.tsx` & `strategy-explorer.tsx`
1. **Compare Mode Toggle**:
   Replace basic checkbox with a styled button/pill or labeled checkbox with clean borders.
2. **Synchronized Compare Panes**:
   - Left pane header: `Bullish view` with subtle emerald accent border `border-emerald-500/20 bg-[#041944]`.
   - Right pane header: `Bearish view` with subtle rose accent border `border-rose-500/20 bg-[#041944]`.
   - Max loss input: Format with `₹` symbol prefix inside the input field or prefix addon (`border border-white/20 bg-white/5 font-mono`).
3. **Card Selection Targeting**:
   In `strategy-explorer.tsx`, the `focusPane` indicator should clearly highlight which pane (`Left` or `Right`) will receive clicks when selecting from the 12 strategy cards below.

---

## 5. Verification Method

To independently verify these findings and confirm subsequent changes:

1. **Verify Unit Tests**:
   ```powershell
   npm test
   ```
   Must pass all 26 tests across `lib/analysis.test.ts`, `lib/decision.test.ts`, `app/dashboard/types.test.ts`, `lib/derivativesBoard.test.ts`, and `relay/universe.test.mjs`.

2. **Verify TypeScript Strict Compilation**:
   ```powershell
   npx tsc --noEmit
   ```
   Must complete with exit code 0 and zero type errors.

3. **Verify Next.js Production Build**:
   ```powershell
   npm run build
   ```
   Must successfully build pages and dynamic route handlers without syntax or build failures.

4. **Verify Responsive Behavior**:
   Inspect breakpoints:
   - 360px mobile: header clock fits without clipping, sub-bar wraps buttons cleanly, drawer spans full mobile width.
   - 768px tablet: derivatives table scrolls horizontally with sticky headers, compare panes stack cleanly.
   - 1440px desktop: full-width derivatives board, side-by-side dual compare panes.
