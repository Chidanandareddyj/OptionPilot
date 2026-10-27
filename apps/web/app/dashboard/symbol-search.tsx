"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  filterSymbols,
  POPULAR_COMPANIES,
  type Suggestion,
} from "@optionpilot/shared";

export {
  filterSymbols,
  NSE_FO_SYMBOLS,
  POPULAR_COMPANIES,
  QUICK,
  symbolName,
  type Suggestion,
} from "@optionpilot/shared";

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
