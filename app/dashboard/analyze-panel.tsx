"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThinkingOrb } from "thinking-orbs";
import { parseStoredDecision } from "@/lib/analysis";
import DerivativesBoard from "./derivatives-board";
import StrategyExplorer from "./strategy-explorer";
import { STRATEGY_DEFINITIONS } from "./types";

type Snapshot = {
  id?: string;
  company: string;
  createdAt?: Date;
  result: unknown;
  decision?: unknown;
};

type Suggestion = {
  symbol: string;
  name: string;
  sector?: string;
};

// Quick-access chips displayed directly below the search bar
const QUICK = ["NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "INFY"];

// Popular / Trending companies shown in the dropdown before user types anything
// (Curated to be DIFFERENT from the QUICK chips above)
const POPULAR_COMPANIES: Suggestion[] = [
  { symbol: "ICICIBANK",  name: "ICICI Bank",                   sector: "Banking" },
  { symbol: "SBIN",       name: "State Bank of India",          sector: "Banking" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel",                sector: "Telecom" },
  { symbol: "LT",         name: "Larsen & Toubro",              sector: "Capital Goods" },
  { symbol: "TATAMOTORS", name: "Tata Motors",                  sector: "Automobile" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance",                sector: "Financial" },
  { symbol: "MARUTI",     name: "Maruti Suzuki",                sector: "Automobile" },
  { symbol: "SUNPHARMA",  name: "Sun Pharmaceutical",           sector: "Pharma" },
  { symbol: "ITC",        name: "ITC Limited",                  sector: "FMCG" },
  { symbol: "TATASTEEL",  name: "Tata Steel",                   sector: "Metals" },
  { symbol: "AXISBANK",   name: "Axis Bank",                    sector: "Banking" },
  { symbol: "KOTAKBANK",  name: "Kotak Mahindra Bank",          sector: "Banking" },
];

// Comprehensive NSE F&O symbol catalog
const NSE_FO_SYMBOLS: Suggestion[] = [
  // Major Indices
  { symbol: "NIFTY",        name: "Nifty 50 Index",                  sector: "Index" },
  { symbol: "BANKNIFTY",    name: "Bank Nifty Index",                sector: "Index" },
  { symbol: "FINNIFTY",     name: "Nifty Financial Services",        sector: "Index" },
  { symbol: "MIDCPNIFTY",   name: "Nifty Midcap Select",             sector: "Index" },
  { symbol: "SENSEX",       name: "BSE Sensex Index",                sector: "Index" },

  // Banking & Financial Services
  { symbol: "HDFCBANK",     name: "HDFC Bank",                       sector: "Banking" },
  { symbol: "ICICIBANK",    name: "ICICI Bank",                      sector: "Banking" },
  { symbol: "SBIN",         name: "State Bank of India",             sector: "Banking" },
  { symbol: "AXISBANK",     name: "Axis Bank",                       sector: "Banking" },
  { symbol: "KOTAKBANK",    name: "Kotak Mahindra Bank",             sector: "Banking" },
  { symbol: "INDUSINDBK",   name: "IndusInd Bank",                   sector: "Banking" },
  { symbol: "BANKBARODA",   name: "Bank of Baroda",                  sector: "Banking" },
  { symbol: "PNB",          name: "Punjab National Bank",            sector: "Banking" },
  { symbol: "CANBK",        name: "Canara Bank",                     sector: "Banking" },
  { symbol: "FEDERALBNK",   name: "Federal Bank",                    sector: "Banking" },
  { symbol: "IDFCFIRSTB",   name: "IDFC First Bank",                 sector: "Banking" },
  { symbol: "BANDHANBNK",   name: "Bandhan Bank",                    sector: "Banking" },
  { symbol: "AUBANK",       name: "AU Small Finance Bank",           sector: "Banking" },
  { symbol: "RBLBANK",      name: "RBL Bank",                        sector: "Banking" },
  { symbol: "BAJFINANCE",   name: "Bajaj Finance",                   sector: "Financial" },
  { symbol: "BAJAJFINSV",   name: "Bajaj Finserv",                   sector: "Financial" },
  { symbol: "CHOLAFIN",     name: "Cholamandalam Investment",        sector: "Financial" },
  { symbol: "SHRIRAMFIN",   name: "Shriram Finance",                 sector: "Financial" },
  { symbol: "MUTHOOTFIN",   name: "Muthoot Finance",                 sector: "Financial" },
  { symbol: "PFC",          name: "Power Finance Corporation",       sector: "Financial" },
  { symbol: "RECLTD",       name: "REC Limited",                     sector: "Financial" },
  { symbol: "IRFC",         name: "Indian Railway Finance Corp",     sector: "Financial" },
  { symbol: "HDFCLIFE",     name: "HDFC Life Insurance",             sector: "Insurance" },
  { symbol: "SBILIFE",      name: "SBI Life Insurance",              sector: "Insurance" },
  { symbol: "LICHSGFIN",    name: "LIC Housing Finance",             sector: "Financial" },
  { symbol: "JIOFIN",       name: "Jio Financial Services",          sector: "Financial" },

  // Information Technology
  { symbol: "TCS",          name: "Tata Consultancy Services",       sector: "IT" },
  { symbol: "INFY",         name: "Infosys",                         sector: "IT" },
  { symbol: "HCLTECH",      name: "HCL Technologies",                sector: "IT" },
  { symbol: "WIPRO",        name: "Wipro",                           sector: "IT" },
  { symbol: "TECHM",        name: "Tech Mahindra",                   sector: "IT" },
  { symbol: "LTIM",         name: "LTIMindtree",                     sector: "IT" },
  { symbol: "PERSISTENT",   name: "Persistent Systems",              sector: "IT" },
  { symbol: "COFORGE",      name: "Coforge",                         sector: "IT" },
  { symbol: "MPHASIS",      name: "Mphasis",                         sector: "IT" },
  { symbol: "OFSS",         name: "Oracle Financial Services",       sector: "IT" },

  // Energy, Oil, Gas & Utilities
  { symbol: "RELIANCE",     name: "Reliance Industries",             sector: "Energy" },
  { symbol: "ONGC",         name: "Oil & Natural Gas Corp",          sector: "Energy" },
  { symbol: "NTPC",         name: "NTPC Limited",                    sector: "Power" },
  { symbol: "POWERGRID",    name: "Power Grid Corp of India",        sector: "Power" },
  { symbol: "COALINDIA",    name: "Coal India",                      sector: "Mining" },
  { symbol: "BPCL",         name: "Bharat Petroleum",                sector: "Energy" },
  { symbol: "IOC",          name: "Indian Oil Corporation",          sector: "Energy" },
  { symbol: "HINDPETRO",    name: "Hindustan Petroleum",             sector: "Energy" },
  { symbol: "GAIL",         name: "GAIL India",                      sector: "Gas" },
  { symbol: "IGL",          name: "Indraprastha Gas",                sector: "Gas" },
  { symbol: "MGL",          name: "Mahanagar Gas",                   sector: "Gas" },
  { symbol: "TATAPOWER",    name: "Tata Power",                      sector: "Power" },
  { symbol: "ADANIENT",     name: "Adani Enterprises",               sector: "Conglomerate" },
  { symbol: "ADANIPORTS",   name: "Adani Ports & SEZ",               sector: "Infrastructure" },

  // Automobiles & Auto Ancillaries
  { symbol: "TATAMOTORS",   name: "Tata Motors",                     sector: "Automobile" },
  { symbol: "MARUTI",       name: "Maruti Suzuki India",             sector: "Automobile" },
  { symbol: "M&M",          name: "Mahindra & Mahindra",             sector: "Automobile" },
  { symbol: "BAJAJ-AUTO",   name: "Bajaj Auto",                      sector: "Automobile" },
  { symbol: "EICHERMOT",    name: "Eicher Motors",                   sector: "Automobile" },
  { symbol: "HEROMOTOCO",   name: "Hero MotoCorp",                   sector: "Automobile" },
  { symbol: "TVSMOTOR",     name: "TVS Motor Company",               sector: "Automobile" },
  { symbol: "BHARATFORG",   name: "Bharat Forge",                    sector: "Auto Ancillary" },
  { symbol: "BALKRISIND",   name: "Balkrishna Industries",           sector: "Auto Ancillary" },
  { symbol: "APOLLOTYRE",   name: "Apollo Tyres",                    sector: "Auto Ancillary" },
  { symbol: "MRF",          name: "MRF Limited",                     sector: "Auto Ancillary" },
  { symbol: "MOTHERSON",    name: "Samvardhana Motherson",           sector: "Auto Ancillary" },

  // Metals & Mining
  { symbol: "TATASTEEL",    name: "Tata Steel",                      sector: "Metals" },
  { symbol: "JSWSTEEL",     name: "JSW Steel",                       sector: "Metals" },
  { symbol: "HINDALCO",     name: "Hindalco Industries",             sector: "Metals" },
  { symbol: "VEDL",         name: "Vedanta Limited",                 sector: "Metals" },
  { symbol: "SAIL",         name: "Steel Authority of India",        sector: "Metals" },
  { symbol: "NMDC",         name: "NMDC Limited",                    sector: "Mining" },
  { symbol: "JINDALSTEL",   name: "Jindal Steel & Power",            sector: "Metals" },
  { symbol: "NATIONALUM",   name: "National Aluminium",              sector: "Metals" },

  // Healthcare & Pharmaceuticals
  { symbol: "SUNPHARMA",    name: "Sun Pharmaceutical",              sector: "Pharma" },
  { symbol: "CIPLA",        name: "Cipla",                           sector: "Pharma" },
  { symbol: "DRREDDY",      name: "Dr Reddy's Laboratories",         sector: "Pharma" },
  { symbol: "DIVISLAB",     name: "Divi's Laboratories",             sector: "Pharma" },
  { symbol: "APOLLOHOSP",   name: "Apollo Hospitals",                sector: "Healthcare" },
  { symbol: "AUROPHARMA",   name: "Aurobindo Pharma",                sector: "Pharma" },
  { symbol: "LUPIN",        name: "Lupin Limited",                   sector: "Pharma" },
  { symbol: "TORNTPHARM",   name: "Torrent Pharmaceuticals",         sector: "Pharma" },
  { symbol: "BIOCON",       name: "Biocon Limited",                  sector: "Biotech" },

  // FMCG, Retail & Consumer
  { symbol: "HINDUNILVR",   name: "Hindustan Unilever",              sector: "FMCG" },
  { symbol: "ITC",          name: "ITC Limited",                     sector: "FMCG" },
  { symbol: "NESTLEIND",    name: "Nestle India",                    sector: "FMCG" },
  { symbol: "BRITANNIA",    name: "Britannia Industries",            sector: "FMCG" },
  { symbol: "TATACONSUM",   name: "Tata Consumer Products",          sector: "FMCG" },
  { symbol: "DABUR",        name: "Dabur India",                     sector: "FMCG" },
  { symbol: "MARICO",       name: "Marico Limited",                  sector: "FMCG" },
  { symbol: "COLPAL",       name: "Colgate-Palmolive India",         sector: "FMCG" },
  { symbol: "GODREJCP",     name: "Godrej Consumer Products",        sector: "FMCG" },
  { symbol: "TITAN",        name: "Titan Company",                   sector: "Consumer" },
  { symbol: "TRENT",        name: "Trent Limited (Westside/Zudio)",  sector: "Retail" },
  { symbol: "DMART",        name: "Avenue Supermarts (DMart)",       sector: "Retail" },
  { symbol: "PAGEIND",      name: "Page Industries (Jockey)",        sector: "Apparel" },
  { symbol: "ASIANPAINT",   name: "Asian Paints",                    sector: "Paints" },
  { symbol: "BERGEPAINT",   name: "Berger Paints",                   sector: "Paints" },
  { symbol: "PIDILITIND",   name: "Pidilite Industries (Fevicol)",   sector: "Chemicals" },
  { symbol: "HAVELLS",      name: "Havells India",                   sector: "Electricals" },
  { symbol: "POLYCAB",      name: "Polycab India",                   sector: "Cables" },
  { symbol: "VOLTAS",       name: "Voltas",                          sector: "Appliances" },
  { symbol: "DIXON",        name: "Dixon Technologies",              sector: "Electronics" },

  // Capital Goods, Defense & Infrastructure
  { symbol: "LT",           name: "Larsen & Toubro",                 sector: "Capital Goods" },
  { symbol: "HAL",          name: "Hindustan Aeronautics",           sector: "Defense" },
  { symbol: "BEL",          name: "Bharat Electronics",              sector: "Defense" },
  { symbol: "SIEMENS",      name: "Siemens India",                   sector: "Capital Goods" },
  { symbol: "ABB",          name: "ABB India",                       sector: "Capital Goods" },
  { symbol: "BHEL",         name: "Bharat Heavy Electricals",        sector: "Capital Goods" },
  { symbol: "ULTRACEMCO",   name: "UltraTech Cement",                sector: "Cement" },
  { symbol: "GRASIM",       name: "Grasim Industries",               sector: "Cement" },
  { symbol: "DLF",          name: "DLF Limited",                     sector: "Realty" },
  { symbol: "GODREJPROP",   name: "Godrej Properties",               sector: "Realty" },
  { symbol: "OBEROIRLTY",   name: "Oberoi Realty",                   sector: "Realty" },
  { symbol: "PRESTIGE",     name: "Prestige Estates",                sector: "Realty" },
  { symbol: "GMRINFRA",     name: "GMR Airports Infrastructure",     sector: "Infrastructure" },
  { symbol: "CONCOR",       name: "Container Corp of India",         sector: "Logistics" },
  { symbol: "IRCTC",        name: "Indian Railway Catering (IRCTC)", sector: "Services" },
  { symbol: "INDIGO",       name: "InterGlobe Aviation (IndiGo)",    sector: "Aviation" },

  // Telecom & Tech Internet
  { symbol: "BHARTIARTL",   name: "Bharti Airtel",                   sector: "Telecom" },
  { symbol: "ZOMATO",       name: "Zomato Limited",                  sector: "Internet" },
  { symbol: "NAUKRI",       name: "Info Edge (Naukri)",              sector: "Internet" },
  { symbol: "INDIAMART",    name: "IndiaMART InterMESH",             sector: "Internet" },
  { symbol: "PAYTM",        name: "One97 Communications (Paytm)",    sector: "Fintech" },
  { symbol: "NYKAA",        name: "FSN E-Commerce (Nykaa)",          sector: "E-Commerce" },
];

// Ranked local search across the symbol catalog
function filterSymbols(query: string): Suggestion[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return POPULAR_COMPANIES;
  }

  const q = trimmed.toUpperCase();
  const exact: Suggestion[] = [];
  const symbolStarts: Suggestion[] = [];
  const symbolContains: Suggestion[] = [];
  const nameStarts: Suggestion[] = [];
  const nameContains: Suggestion[] = [];

  const seen = new Set<string>();

  for (const item of NSE_FO_SYMBOLS) {
    const sym = item.symbol.toUpperCase();
    const name = item.name.toUpperCase();

    if (sym === q || name === q) {
      exact.push(item);
      seen.add(item.symbol);
    } else if (sym.startsWith(q)) {
      symbolStarts.push(item);
      seen.add(item.symbol);
    } else if (sym.includes(q)) {
      symbolContains.push(item);
      seen.add(item.symbol);
    } else if (name.startsWith(q)) {
      nameStarts.push(item);
      seen.add(item.symbol);
    } else if (name.includes(q)) {
      nameContains.push(item);
      seen.add(item.symbol);
    }
  }

  const combined = [
    ...exact,
    ...symbolStarts,
    ...symbolContains,
    ...nameStarts,
    ...nameContains,
  ];

  return combined.slice(0, 10);
}

// ---------------------------------------------------------------------------
// SymbolSearch — Interactive combobox with autocomplete & instant suggestions
// ---------------------------------------------------------------------------
function SymbolSearch({
  value,
  onChange,
  onSelect,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (v: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(POPULAR_COMPANIES);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    onChange(v);
    setActiveIdx(-1);
    setSuggestions(filterSymbols(v));
    setOpen(true);
  }

  function handleInputFocus() {
    setSuggestions(filterSymbols(value));
    setOpen(true);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setSuggestions(filterSymbols(value));
        setOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        e.preventDefault();
        const selected = suggestions[activeIdx];
        onSelect(selected.symbol);
        setOpen(false);
        setActiveIdx(-1);
      } else {
        // If no suggestion highlighted, let form submit with the current input value
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  function handleSelectSuggestion(s: Suggestion) {
    onSelect(s.symbol);
    setOpen(false);
    setActiveIdx(-1);
  }

  function handleClear() {
    onChange("");
    setSuggestions(POPULAR_COMPANIES);
    setActiveIdx(-1);
    inputRef.current?.focus();
  }

  const isQueryEmpty = !value.trim();

  return (
    <div ref={containerRef} className="relative flex-1">
      <label htmlFor="fo-search-input" className="sr-only">
        Search F&O symbol or company name
      </label>
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="pointer-events-none absolute left-3.5 text-white/40">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <input
          id="fo-search-input"
          name="symbol"
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          required
          autoComplete="off"
          placeholder="Search F&O symbol or company name (e.g. SBIN, TATAMOTORS, LT)..."
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls="fo-symbol-suggestions"
          aria-label="Search F&O symbol or company name"
          className="w-full rounded-md border border-white/15 bg-white/5 py-2 pl-9 pr-8 text-sm text-white placeholder:text-white/40 focus:border-sky-400 focus:bg-white/[0.08] focus:outline-none disabled:opacity-60"
        />

        {/* Clear Button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
            title="Clear search"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-white/15 bg-[#06183d] shadow-2xl shadow-black/60 backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            <span>{isQueryEmpty ? "Popular F&O Stocks (Click to Analyze)" : "Matching Derivatives"}</span>
            <span className="font-mono text-[9px] text-sky-400/80">
              {suggestions.length} {suggestions.length === 1 ? "result" : "results"}
            </span>
          </div>

          {suggestions.length > 0 ? (
            <ul id="fo-symbol-suggestions" role="listbox" className="max-h-72 overflow-y-auto divide-y divide-white/5 py-1">
              {suggestions.map((s, i) => (
                <li
                  key={s.symbol}
                  id={`fo-suggestion-${s.symbol}`}
                  role="option"
                  aria-selected={i === activeIdx}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleSelectSuggestion(s);
                  }}
                  className={`flex cursor-pointer items-center justify-between px-3.5 py-2 text-sm transition-colors ${
                    i === activeIdx
                      ? "bg-sky-500/25 text-white"
                      : "text-white/85 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <div className="flex items-baseline gap-2.5 min-w-0">
                    <span className="shrink-0 font-mono text-[13px] font-bold text-sky-300">
                      {s.symbol}
                    </span>
                    <span className="truncate text-xs text-white/60">{s.name}</span>
                  </div>
                  {s.sector && (
                    <span className="ml-2 shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-white/40">
                      {s.sector}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-xs text-white/50">
              <p>No predefined match for &ldquo;<span className="text-sky-300">{value}</span>&rdquo;</p>
              <p className="mt-1 text-[11px] text-white/35">Press <span className="font-mono text-white/60">Enter</span> or click <span className="text-white/60">Analyze</span> to query directly</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AnalyzePanel
// ---------------------------------------------------------------------------
export default function AnalyzePanel({ history }: { history: Snapshot[] }) {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [active, setActive] = useState<Snapshot | null>(history[0] ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!historyOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setHistoryOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [historyOpen]);

  async function analyze(target: string) {
    target = target.trim();
    if (!target) return;
    setShowBoard(false);
    setHistoryOpen(false);
    setCompany(target);
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: target }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Analysis failed");
      const { id, ...result } = data;
      setActive({ id, company: target, result });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Search & Command Card */}
      <div className="rounded-xl border border-white/12 bg-white/[0.04] p-4 sm:p-5 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            analyze(company);
          }}
          className="flex flex-col gap-2.5 sm:flex-row"
        >
          <SymbolSearch
            value={company}
            onChange={setCompany}
            onSelect={(symbol) => {
              analyze(symbol);
            }}
            disabled={pending}
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-[5px] bg-white px-5 py-2 text-[12px] font-semibold text-[#0a1f5c] hover:bg-white/90 disabled:opacity-70 shadow-sm transition-all cursor-pointer"
          >
            {pending && (
              <ThinkingOrb state="listening" size={20} theme="light" color="#0a1f5c" aria-label="Listening…" />
            )}
            {pending ? "Calculating…" : "Analyze"}
          </button>
        </form>

        {/* Command Sub-Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
          {/* Quick Tickers */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Quick</span>
            {QUICK.map((sym) => (
              <button
                key={sym}
                type="button"
                disabled={pending}
                onClick={() => {
                  analyze(sym);
                }}
                className="rounded border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-[5px] border border-white/15 bg-white/5 px-3 py-1 text-[11.5px] font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="size-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>History ({history.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBoard((v) => !v)}
              className={`rounded-[5px] border px-3 py-1 text-[11.5px] font-medium transition-colors cursor-pointer ${
                showBoard
                  ? "border-sky-400/70 bg-sky-500/25 text-white"
                  : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {showBoard ? "Hide all derivatives" : "Show all derivatives"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 font-mono text-xs text-rose-200">
          {error}
        </p>
      )}

      {/* Strict Mutual Exclusivity: Live Market vs Analyze */}
      {showBoard ? (
        <DerivativesBoard onAnalyze={analyze} />
      ) : pending ? (
        <div className="animate-pulse space-y-3 rounded-xl border border-white/12 bg-white/[0.04] p-4 sm:p-6">
          <div className="h-16 rounded bg-white/5" />
          <div className="h-56 rounded bg-white/5" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-40 rounded bg-white/5" />
            <div className="h-40 rounded bg-white/5" />
          </div>
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
        <div className="rounded-xl border border-dashed border-white/12 bg-white/[0.02] p-10 text-center">
          <h3 className="font-serif text-lg text-white">No option chain loaded</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-white/50">
            Enter an index or stock symbol above to price all 12 strategies and their payoffs.
          </p>
        </div>
      )}

      {/* Slide-Out History Glass Drawer */}
      {historyOpen && (
        <>
          {/* Dark backdrop overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setHistoryOpen(false)}
            aria-hidden="true"
          />
          {/* Sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Analysis History"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/15 bg-[#07245c]/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right duration-200"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="font-serif text-xl tracking-tight text-white">Analysis History</h2>
                <p className="text-[11px] text-white/50">
                  {history.length} saved snapshot{history.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Close history drawer"
                className="flex size-7 items-center justify-center rounded-lg border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {history.length === 0 ? (
                <div className="py-16 text-center font-mono text-xs text-white/40">
                  NO SAVED ANALYSES
                </div>
              ) : (
                history.map((item) => {
                  const stored = parseStoredDecision(item.decision);
                  const singleDec =
                    stored.mode === "single" && stored.single && typeof stored.single === "object"
                      ? (stored.single as { view?: string; best?: { key?: string } | null })
                      : null;
                  const bestKey = singleDec?.best?.key;
                  const bestName = bestKey ? (STRATEGY_DEFINITIONS[bestKey]?.name ?? bestKey) : null;
                  const resObj = item.result && typeof item.result === "object" ? (item.result as Record<string, unknown>) : null;
                  const spot =
                    typeof resObj?.underlying_spot_price === "number"
                      ? resObj.underlying_spot_price
                      : typeof resObj?.spot_price === "number"
                        ? resObj.spot_price
                        : null;

                  const createdAtDate = item.createdAt ? new Date(item.createdAt) : null;
                  const formattedTime =
                    createdAtDate && !isNaN(createdAtDate.getTime())
                      ? createdAtDate.toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : null;

                  const isSelected = active?.id && item.id ? active.id === item.id : false;

                  return (
                    <button
                      key={item.id ?? `${item.company}-${item.createdAt}`}
                      type="button"
                      onClick={() => {
                        setActive(item);
                        setShowBoard(false);
                        setHistoryOpen(false);
                      }}
                      className={`w-full rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-sky-400/70 bg-[#082054] shadow-md shadow-sky-500/10"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-base font-bold text-sky-300">{item.company}</span>
                        {spot != null && (
                          <span className="font-mono text-xs tabular-nums text-white/80">
                            ₹{Number(spot).toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {bestName && singleDec?.view ? (
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
                      {formattedTime && (
                        <div className="mt-2 text-[10.5px] font-mono text-white/40">
                          {formattedTime} IST
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
