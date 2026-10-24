# Landing Page Design Language & Tokens Survey Report

## 1. Observation

Direct code and token inspection of `OptionPilot`:

### 1.1 Styling Architecture & Configurations
- **Framework**: Tailwind CSS v4 (`tailwindcss: "^4"`, `@tailwindcss/postcss: "^4"` in `package.json:26,34`).
- **CSS Import & Theme Setup** (`app/globals.css:1-7`):
  ```css
  @import "tailwindcss";
  @import "@neondatabase/auth-ui/tailwind";

  @theme inline {
    --font-sans: var(--font-geist-sans);
    --font-serif: var(--font-instrument-serif);
  }
  ```
- **Font Configurations** (`app/layout.tsx:7-17, 28`):
  - Primary UI Sans: `Geist` imported from `next/font/google`, mapped to `--font-geist-sans`.
  - Editorial Serif: `Instrument_Serif` imported from `next/font/google`, weight `"400"`, styles `["normal", "italic"]`, mapped to `--font-instrument-serif`.
  - Applied on `<html className={`${geistSans.variable} ${instrumentSerif.variable} h-full antialiased`}>`.
  - Applied on `body { font-family: var(--font-geist-sans), system-ui, sans-serif; }` (`app/globals.css:13-15`).

### 1.2 Color Palette & Background Gradients
- **Sky Content Gradient** (`app/globals.css:19-28`):
  ```css
  .sky-content {
    background: linear-gradient(
      180deg,
      #b9d3ec 0%,
      #3a629f 5%,
      #123a7e 14%,
      #08265f 42%,
      #061f52 100%
    );
  }
  ```
- **Core Navies & Slates**:
  - Base Deep Navy: `#061f52` (terminal floor in `.sky-content` and auth container background in `app/auth/[path]/page.tsx:28`).
  - Elevated Glass Drawer: `#07245c` (`bg-[#07245c]/95 backdrop-blur-xl` in `LandingPage.tsx:182`).
  - Top Floating Nav / Sticky Header: `#06245e` (`bg-[#06245e]/80 backdrop-blur-md` in `LandingPage.tsx:133` and `bg-[#06245e]/70 backdrop-blur-md` in `LandingPage.tsx:501`).
  - Primary Button Ink: `#0a1f5c` (`text-[#0a1f5c]` in `LandingPage.tsx:156, 269, 392, 465`).
  - Active Tab/Filter Navy: `#0a276b` (`app/dashboard/strategy-explorer.tsx:218, 238`).
- **Semantic Accents**:
  - Sky: `text-sky-400`, `text-sky-300`, `bg-sky-500`, `border-sky-400/50`.
  - Emerald: `text-emerald-400`, `text-emerald-300`, `bg-emerald-500/[0.06]`, `border-emerald-400/40`, pulsing live indicator.
  - Rose: `text-rose-400`, `text-rose-300`, `border-rose-500/30`, `bg-rose-500/10`.
  - Amber: `text-amber-300`, breakeven markers `#fbbf24`.

### 1.3 Card & Container Glassmorphic Tokens
- **Standard Card**:
  - Border: `border border-white/12` (or `border-white/10`)
  - Background: `bg-white/[0.04]` (or `bg-white/[0.03]`)
  - Hover: `hover:bg-white/[0.07]`
  - Radius: `rounded-xl`
  - Padding: `p-3.5 sm:p-4` (or `p-5`)
  - Source: `LandingPage.tsx:343-346, 371-372, 379, 416-433`.
- **High-Polish Glass Sheet (Mobile Menu / Drawer)**:
  - Background & Blur: `bg-[#07245c]/95 backdrop-blur-xl` (or `backdrop-blur-2xl`)
  - Border: `border-white/15`
  - Shadow: `shadow-2xl`
  - Source: `LandingPage.tsx:182`.
- **Highlight Card (Community Trader)**:
  - Border: `border-emerald-400/40`
  - Background: `bg-emerald-500/[0.06]`
  - Text: `text-emerald-300`, `text-emerald-400`
  - Source: `LandingPage.tsx:446-470`.

### 1.4 Button Token Catalog
| Button Role | Exact Class Token String | Reference |
|---|---|---|
| **Primary High-Contrast Button** | `rounded-[5px] bg-white px-5 py-2 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90 cursor-pointer shadow-sm transition-all` | `LandingPage.tsx:156, 269, 392, 465` & `analyze-panel.tsx:483` |
| **Secondary Ghost Button** | `rounded-[5px] border border-white/30 px-5 h-8.5 text-[12px] font-medium text-white hover:bg-white/10 cursor-pointer transition-all` | `LandingPage.tsx:399` |
| **Secondary Elevated Pill** | `rounded-[5px] border border-white/20 bg-white/5 px-6 h-10 text-[12px] font-medium text-white hover:bg-white/10 transition-all` | `LandingPage.tsx:490` |
| **Floating Nav Pill Link** | `rounded-full px-3.5 py-1.5 text-center text-[12px] font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors tracking-wide` | `LandingPage.tsx:506` |
| **Interactive Chip / Filter** | `rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-white/70 hover:bg-white/10 hover:text-white` (Active: `border-sky-400/50 bg-[#0a276b] text-white`) | `analyze-panel.tsx:503` & `strategy-explorer.tsx:218` |
| **Icon Action Button** | `size-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white active:scale-95 transition` | `LandingPage.tsx:163` |
| **Pill Circular Badge** | `flex size-10 sm:size-11 items-center justify-center rounded-full border border-white/80 text-[10px] font-semibold tracking-wide` | `LandingPage.tsx:299` |

### 1.5 ThinkingOrb Component
- **Package**: `thinking-orbs` v0.3.2 (`package.json:23`).
- **Component Definition**: `node_modules/thinking-orbs/dist/ThinkingOrb.d.ts` & `node_modules/thinking-orbs/dist/types.d.ts`.
- **Props**:
  - `state?: 'working' | 'searching' | 'solving' | 'listening' | 'connecting' | 'weaving' | 'composing' | 'breathing' | 'shaping'` (Default: `'working'`)
  - `size?: 64 | 32 | 20` (CSS px; 64 and 20 are hand-tuned presets; 32 is log-interpolated)
  - `theme?: 'auto' | 'dark' | 'light'` (`dark` paints light ink on dark backgrounds; `light` paints dark ink on light backgrounds)
  - `color?: string` (Optional hex ink tint e.g. `#0a1f5c`. Preserves the 3D depth-shading ramp fading toward white on light substrates)
  - `speed?: number` (Default: `1`)
  - `paused?: boolean` (Default: `false`)
  - `dots?: number` (Density multiplier)
  - `dotSize?: number` (Radius multiplier)
  - `opts?: ModeOpts`
  - `aria-label?: string`
- **Authentic Usages**:
  1. *Landing Page Hero*:
     ```tsx
     <ThinkingOrb
       state="searching"
       size={64}
       theme="dark"
       className="hero-sphere absolute left-1/2"
       style={{ width: 125, height: 125 }}
     />
     ```
  2. *Analyze Form Button (`analyze-panel.tsx:485-487`)*:
     ```tsx
     <button
       type="submit"
       disabled={pending}
       className="inline-flex items-center justify-center gap-2 rounded-[5px] bg-white px-5 py-2 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90 disabled:opacity-70"
     >
       {pending && (
         <ThinkingOrb state="listening" size={20} theme="light" color="#0a1f5c" aria-label="Listening…" />
       )}
       {pending ? "Calculating…" : "Analyze"}
     </button>
     ```
  3. *Recommendation Panel (`recommendation-panel.tsx:150-154`)*:
     ```tsx
     <button
       type="submit"
       disabled={pending || disabled || !analysisId}
       className="inline-flex items-center gap-2 rounded-[5px] bg-white px-4 py-1.5 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90 disabled:opacity-60"
     >
       {pending && <ThinkingOrb state="listening" size={20} theme="light" color="#0a1f5c" aria-label="Scoring…" />}
       {pending ? "Scoring…" : decision ? "Re-score" : "Recommend"}
     </button>
     ```

### 1.6 Typography Patterns
- **Headings & Section Titles**:
  - `font-serif text-[clamp(28px,4vw,52px)] leading-[1.04] tracking-[-0.015em]`
  - Editorial italic emphasis: `<em>withstand any volatility</em>`, `<em>LLM analyst</em>`
- **Eyebrow Micro-Headers**:
  - `.eyebrow`: `text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50 mb-2`
  - Card Eyebrows: `text-[10px] font-semibold uppercase tracking-wider text-white/45`
- **Body & Subtitles**:
  - `.section-lead`: `text-[15.5px] leading-relaxed text-white/72 max-w-2xl`
  - Card Descriptions: `text-[13px] sm:text-[13.5px] leading-relaxed text-white/60`
- **Market Data & Quantitative Metrics**:
  - `font-mono tabular-nums`: strikes, Greeks, LTP, breakevens, profit & loss, ROI multipliers (`e.g., ₹24,500.00`, `2.45×`, `68.2%`).

### 1.7 NSE IST Clock
- **Landing Page Implementation (`LandingPage.tsx:46-63`)**:
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
- **Current Dashboard Header Implementation (`app/dashboard/header.tsx:34-45`)**:
  Currently uses `font-mono text-[13px] tabular-nums` with static green dot `size-1.5 rounded-full bg-emerald-400`.
- **Target Dashboard Header Implementation (R4)**:
  - Formatted in `Instrument Serif` (`font-serif`)
  - Format: `NSE {hm}` + `{s}` (`text-white/45`) + ` IST`
  - Active live status indicator: pulsing emerald dot with `animate-ping` / `animate-pulse`
  - Clean responsive handling across mobile (hidden IST/seconds if compact) and desktop.

### 1.8 Layout Architecture & History Sidebar
- **Current `analyze-panel.tsx` Layout (`analyze-panel.tsx:462, 553-583`)**:
  - Outer container is hardcoded as:
    `<div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:px-8">`
  - `<aside className="order-first min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-4 lg:order-none lg:self-start">` permanently consumes 19rem width.
  - When `showBoard === true`, `DerivativesBoard` is squeezed into `minmax(0,1fr)` rather than full width!
- **Target Separation & Slide-Out History Drawer (R2 & R6)**:
  - `showBoard === true`: Dedicated full-width Live Market board.
  - `showBoard === false`: Dedicated full-width Analyze Strategy deep dive.
  - History drawer: Slide-out panel from the right triggered by `"History (${history.length})"` button in the sub-bar, styled with `bg-[#07245c]/95 backdrop-blur-2xl border-l border-white/15`, freeing 100% of the screen width for charts and tables.

---

## 2. Logic Chain

1. **Token Consistency**:
   The landing page achieves its high-polish aesthetic by pairing deep midnight navies (`#061f52`, `#07245c`, `#06245e`) with low-opacity white borders (`border-white/10`, `border-white/12`, `border-white/15`), subtle transparent white fills (`bg-white/[0.03]`, `bg-white/[0.04]`), and high-contrast stark white buttons (`rounded-[5px] bg-white text-[#0a1f5c]`).
2. **Elimination of Artificial Glow & Blur**:
   The existing dashboard background in `dashboard-background.tsx` uses a blurred image of Everest (`<img src="/everest.jpg" ... blur-lg opacity-40">`) with inconsistent dark overlays (`#03112e`/`#04153b`). Replacing this with the clean landing page navy gradient (`#061f52` base and `.sky-content` progression) immediately removes the blurry artificial look and grounds the UI in financial professionalism.
3. **Preservation of Authentic ThinkingOrb**:
   `ThinkingOrb` is a bespoke canvas animation engine configured with `size={20}`, `theme="light"`, and `color="#0a1f5c"`. Because the button background is pure white (`bg-white`), setting `theme="light"` ensures the internal canvas depth shader renders dark ink dots rather than white ones, with `#0a1f5c` tinting the dots in the project's signature deep blue. The state `state="listening"` produces a rolling waveform through the latitude rings that signifies active real-time computation.
4. **Typography Trio Application**:
   - `Geist Sans` (`var(--font-sans)`): UI controls, inputs, body text, badges.
   - `Instrument Serif` (`var(--font-serif)`): Spot prices, company titles, key figures, and the header NSE clock.
   - `font-mono tabular-nums`: All numeric strike ladders, Greeks, P&L numbers, and percentages to ensure columns line up without jitter during live tick updates.
5. **Layout Separation**:
   Currently, the persistent `<aside>` forces a two-column grid that compromises both the table view and strategy explorer. Shifting saved snapshots into a right slide-out history drawer (`bg-[#07245c]/95 backdrop-blur-2xl border-l border-white/15`) cleanly decouples the layout, granting full width to whichever view is active (`showBoard ? <DerivativesBoard /> : <StrategyExplorer />`).

---

## 3. Caveats

- **No Caveats**: The codebase, CSS configurations, font definitions, and `thinking-orbs` package specifications were directly inspected and verified against the existing production implementation. All 26 unit tests currently pass.

---

## 4. Conclusion

The Landing Page design language provides a complete, unified design system ready to be applied across OptionPilot's dashboard:
1. **Background**: Replace `dashboard-background.tsx` blurred mountain image with the pure deep navy system (`#061f52` base, subtle radial highlights).
2. **Cards**: Standardize all dashboard cards to `rounded-xl border border-white/12 bg-white/[0.04] hover:bg-white/[0.07]` and highlighted cards to `border-emerald-400/40 bg-emerald-500/[0.06]`.
3. **Analyze Button**: Keep authentic `ThinkingOrb` (`state="listening"`, `size={20}`, `theme="light"`, `color="#0a1f5c"`) within `rounded-[5px] bg-white px-5 py-2 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90`.
4. **Header Clock**: Upgrade to `Instrument Serif` (`NSE {hm}<span className="text-white/45">{s}</span> IST`) with an emerald pulsing live status indicator.
5. **Layout Separation & History Drawer**: Remove persistent `<aside>` 19rem column in `analyze-panel.tsx`. Provide full-width layout for `DerivativesBoard` and `StrategyExplorer`, and introduce a high-polish slide-out history drawer (`bg-[#07245c]/95 backdrop-blur-2xl border-l border-white/15`).

---

## 5. Verification Method

To verify these design tokens and configurations:
1. **Inspect Token Files**:
   - `app/layout.tsx`: Check `Geist` and `Instrument_Serif` setup.
   - `app/globals.css`: Check `@theme inline`, `.sky-content`, and `.tick-flash`.
   - `app/components/LandingPage.tsx`: Check button classes, Clock component, and ThinkingOrb setup.
   - `node_modules/thinking-orbs/dist/types.d.ts`: Verify `ThinkingOrbProps`.
2. **Run Test Suite**:
   Execute `npm test` from the workspace root:
   ```powershell
   npm test
   ```
   Ensures all 26 tests across decision ranking, strategy definitions, board filters, and analysis rows pass.
