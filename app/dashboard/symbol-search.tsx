"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Suggestion = {
  symbol: string;
  name: string;
  sector?: string;
};

// Quick-access symbols listed below the search bar
export const QUICK = ["NIFTY", "BANKNIFTY", "RELIANCE", "TCS", "INFY"];

// Popular / Trending companies shown in the dropdown before user types anything
// (Curated to be DIFFERENT from the QUICK symbols above)
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

export const symbolName = (symbol: string) => NSE_FO_SYMBOLS.find((s) => s.symbol === symbol)?.name;

// ---------------------------------------------------------------------------
// SymbolSearch — Interactive combobox with autocomplete & instant suggestions
// ---------------------------------------------------------------------------
export function SymbolSearch({
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

  // "/" focuses the search from anywhere outside a text field
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (e.key !== "/" || target?.closest("input, textarea, select, [contenteditable=true]")) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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
    <div ref={containerRef} className="relative">
      <label htmlFor="fo-search-input" className="sr-only">
        Search F&O symbol or company name
      </label>
      <MagnifyingGlassIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
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
        placeholder="Search F&O symbol"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="fo-symbol-suggestions"
        aria-activedescendant={activeIdx >= 0 && suggestions[activeIdx] ? `fo-suggestion-${suggestions[activeIdx].symbol}` : undefined}
        className="h-9 bg-muted pr-8 pl-8"
      />
      {value && !disabled ? (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 grid size-5 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <XIcon className="size-3" />
        </button>
      ) : (
        <kbd aria-hidden className="num absolute top-1/2 right-2 -translate-y-1/2 rounded bg-accent px-1 text-xs text-muted-foreground">
          /
        </kbd>
      )}

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full min-w-72 overflow-hidden rounded-lg bg-popover text-popover-foreground ring-1 ring-foreground/10">
          <div className="flex items-center justify-between px-3 pt-3 pb-2 text-xs text-muted-foreground">
            <span>{isQueryEmpty ? "Popular F&O stocks" : "Matching derivatives"}</span>
            <span className="num">
              {suggestions.length} {suggestions.length === 1 ? "result" : "results"}
            </span>
          </div>

          {suggestions.length > 0 ? (
            <ul id="fo-symbol-suggestions" role="listbox" className="flex max-h-72 flex-col gap-1 overflow-y-auto p-1 pt-0">
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
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent",
                    i === activeIdx && "bg-accent",
                  )}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">{s.symbol}</span>
                    <span className="truncate text-xs text-muted-foreground">{s.name}</span>
                  </span>
                  {s.sector && <span className="shrink-0 text-xs text-faint">{s.sector}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col gap-1 px-3 pb-3 text-sm text-muted-foreground">
              <p>
                No predefined match for &ldquo;<span className="text-foreground">{value}</span>&rdquo;.
              </p>
              <p className="text-xs">Press Enter or Analyze to query it directly.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
