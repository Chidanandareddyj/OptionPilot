"use client";

import { ArrowRightIcon, CheckIcon, SparkleIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/app/components/spinner";
import { signedInr, STRATEGY_DEFINITIONS, type Category, type Decision, type Pane } from "@optionpilot/shared";
import { cn } from "@/lib/utils";

export type { Decision };

function Summary({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-background p-4 text-sm leading-relaxed text-muted-foreground">
      {text.split("\n").map((line, i) => {
        const t = line.trim();
        if (!t) return null;
        if (t.startsWith("#")) {
          return (
            <h4 key={i} className="pt-2 text-sm font-medium text-foreground first:pt-0">
              {t.replace(/^#+\s*/, "")}
            </h4>
          );
        }
        if (/^[-*•]\s/.test(t)) {
          return (
            <p key={i} className="flex gap-2">
              <span aria-hidden className="text-primary">
                •
              </span>
              <span>{t.replace(/^[-*•]\s+/, "").replaceAll("**", "")}</span>
            </p>
          );
        }
        return <p key={i}>{t.replaceAll("**", "")}</p>;
      })}
    </div>
  );
}

const VIEWS: Category[] = ["bullish", "bearish", "neutral", "volatile"];
const pct = (n: number | null | undefined) => (n == null ? "—" : `${(n * 100).toFixed(1)}%`);
const nameOf = (key: string) => STRATEGY_DEFINITIONS[key]?.name ?? key;
const titleCase = (view: Category) => `${view.charAt(0).toUpperCase()}${view.slice(1)} view`;

function ViewSelect({ value, onChange }: { value: Category; onChange: (view: Category) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      View
      <Select value={value} onValueChange={(v) => onChange(v as Category)}>
        <SelectTrigger className="h-9 w-36 bg-muted capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VIEWS.map((v) => (
            <SelectItem key={v} value={v} className="capitalize">
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function MaxLossInput({ value, onChange }: { value: string; onChange?: (value: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      Max loss per trade
      <span className="relative">
        <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
          ₹
        </span>
        <Input
          type="number"
          min={1}
          required
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="num h-9 w-32 bg-muted pl-8"
        />
      </span>
    </label>
  );
}

function RecommendationPane({
  analysisId,
  decision,
  view,
  onViewChange,
  maxLoss,
  onMaxLossChange,
  showMaxLoss,
  compact,
  pane,
  pending,
  disabled,
  emptyHint,
  leading,
  trailing,
  onPending,
  onDecision,
  onSelect,
}: {
  analysisId?: string;
  decision: Decision | null;
  view: Category;
  onViewChange: (view: Category) => void;
  maxLoss: string;
  onMaxLossChange?: (value: string) => void;
  showMaxLoss: boolean;
  compact: boolean;
  pane?: Pane;
  pending: boolean;
  disabled: boolean;
  emptyHint?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPending: (pending: boolean) => void;
  onDecision: (d: Decision) => void;
  onSelect: (key: string) => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  async function decide() {
    if (!analysisId) return;
    setError(null);
    onPending(true);
    try {
      const response = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          view,
          maxLoss: Number(maxLoss),
          ...(pane ? { pane } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Recommendation failed");
      onDecision(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      onPending(false);
    }
  }

  const best = decision?.best && decision.strategies.find((s) => s.key === decision.best!.key);

  return (
    <div className={cn("flex flex-col gap-4", compact && "rounded-xl bg-background p-4")}>
      {compact && (
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold">{titleCase(view)}</h3>
          {pane && (
            <Badge variant="outline" className="h-6 rounded-md px-2 capitalize">
              {pane} pane
            </Badge>
          )}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          decide();
        }}
        className="flex flex-wrap items-center gap-4"
      >
        {leading}
        <ViewSelect value={view} onChange={onViewChange} />
        {showMaxLoss && <MaxLossInput value={maxLoss} onChange={onMaxLossChange} />}
        <Button
          type="submit"
          size="lg"
          disabled={pending || disabled || !analysisId}
          title={analysisId ? undefined : "Re-run the analysis to get a recommendation"}
          className="font-semibold"
        >
          {pending ? <Spinner /> : <SparkleIcon />}
          {pending ? "Scoring…" : decision ? "Re-score" : "Recommend"}
        </Button>
        {trailing}
      </form>

      {error && (
        <Alert variant="destructive">
          <WarningIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {decision ? (
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <div className="flex flex-wrap gap-2">
            {[
              ["ATM IV", pct(decision.atm_iv)],
              ["30d RV", pct(decision.realized_vol_30d)],
              ["IV/RV", decision.iv_rv_ratio?.toFixed(2) ?? "—"],
              ["Lot", String(decision.lot_size)],
              ["DTE", String(decision.days_to_expiry)],
              ["View", decision.view],
              ["Model", decision.llm === "ok" ? "Mercury Decide" : "unavailable (quant only)"],
            ].map(([label, value]) => (
              <Badge key={label} variant="outline" className="h-6 gap-2 rounded-md px-2 font-normal">
                <span className="text-muted-foreground">{label}</span>
                <span className="num capitalize">{value}</span>
              </Badge>
            ))}
          </div>

          {best ? (
            <button
              type="button"
              onClick={() => onSelect(best.key)}
              className="flex flex-col gap-2 rounded-lg bg-accent p-4 text-left ring-1 ring-primary/40 transition-colors outline-none hover:ring-primary focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    Recommended · {decision.best!.source === "llm" ? "model pick" : "top quant score"}
                  </span>
                  <span className={cn("font-semibold tracking-tight", compact ? "text-xl" : "text-2xl")}>{nameOf(best.key)}</span>
                </div>
                <span className="flex flex-col items-end">
                  <span className={cn("num font-medium text-primary", compact ? "text-2xl" : "text-3xl")}>{best.score.toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground">score</span>
                </span>
              </div>
              {best.metrics && (
                <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground">POP</dt>
                    <dd className="num">{pct(best.metrics.pop)}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground">Max profit</dt>
                    <dd className="num text-profit">
                      {best.metrics.max_profit_per_lot == null ? "Unlimited" : signedInr(best.metrics.max_profit_per_lot)}
                    </dd>
                  </div>
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground">Max loss</dt>
                    <dd className="num text-loss">
                      {best.metrics.max_loss_per_lot == null ? "Unlimited" : signedInr(best.metrics.max_loss_per_lot)}
                    </dd>
                  </div>
                </dl>
              )}
            </button>
          ) : (
            <div className="rounded-lg bg-accent/50 p-4 text-sm text-muted-foreground">
              No strategy scored as viable under the current criteria.
            </div>
          )}

          {decision.summary && <Summary text={decision.summary} />}

          <Accordion type="single" collapsible value={open ?? undefined} onValueChange={setOpen}>
            {decision.strategies.slice(0, 3).map((s, i) => (
              <AccordionItem key={s.key} value={s.key} className="border-border">
                <AccordionTrigger className="gap-3 py-3 text-left hover:no-underline">
                  <span className="num flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium">{nameOf(s.key)}</span>
                  <Badge variant="outline" className={cn("h-6 rounded-md px-2 font-normal", s.viable ? "text-profit" : "text-loss")}>
                    {s.viable ? <CheckIcon aria-hidden /> : <XIcon aria-hidden />}
                    <span className="max-sm:sr-only">{s.viable ? "Viable" : "Not viable"}</span>
                  </Badge>
                  <span aria-hidden className={cn("h-1 w-24 overflow-hidden rounded-full bg-accent", compact ? "hidden xl:block" : "max-sm:hidden")}>
                    <span className="block h-full bg-primary" style={{ width: `${s.score}%` }} />
                  </span>
                  <span className="num w-8 text-right">{s.score.toFixed(0)}</span>
                </AccordionTrigger>
                <AccordionContent className="flex flex-col items-start gap-2 pl-9">
                  <ul className="list-disc pl-4 text-muted-foreground">
                    {s.reasons.map((r, j) => (
                      <li key={j}>{r}</li>
                    ))}
                  </ul>
                  <Button type="button" variant="link" size="sm" className="px-0" onClick={() => onSelect(s.key)}>
                    Show payoff <ArrowRightIcon />
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ) : (
        emptyHint && <p className="text-sm text-muted-foreground">{emptyHint}</p>
      )}
    </div>
  );
}

export default function RecommendationPanel({
  analysisId,
  compareMode,
  onCompareMode,
  single,
  left,
  right,
  onSingle,
  onPane,
  onSelect,
}: {
  analysisId?: string;
  compareMode: boolean;
  onCompareMode: (on: boolean) => void;
  single: Decision | null;
  left: Decision | null;
  right: Decision | null;
  onSingle: (d: Decision) => void;
  onPane: (pane: Pane, d: Decision) => void;
  onSelect: (key: string, pane?: Pane) => void;
}) {
  const budget = single?.max_loss_budget ?? left?.max_loss_budget ?? right?.max_loss_budget ?? 20000;
  const [maxLoss, setMaxLoss] = useState(String(budget));
  const [pending, setPending] = useState<"single" | Pane | null>(null);
  const [singleView, setSingleView] = useState<Category>(single?.view ?? "neutral");
  const [leftView, setLeftView] = useState<Category>(left?.view ?? "bullish");
  const [rightView, setRightView] = useState<Category>(right?.view ?? "bearish");
  const [mobileActivePane, setMobileActivePane] = useState<Pane>("left");

  useEffect(() => {
    if (left?.view) {
      setLeftView(left.view);
    }
  }, [left?.view]);

  useEffect(() => {
    if (right?.view) {
      setRightView(right.view);
    }
  }, [right?.view]);

  useEffect(() => {
    if (single?.view) {
      setSingleView(single.view);
    }
  }, [single?.view]);

  const title = <h2 className="text-base font-semibold">Which strategy fits?</h2>;
  const compareSwitch = (
    <label className="flex items-center gap-2 text-sm text-muted-foreground lg:ml-auto">
      Compare views
      <Switch checked={compareMode} onCheckedChange={onCompareMode} />
    </label>
  );

  return (
    <Card size="sm" className="gap-4 px-4 py-3">
      {compareMode ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              {title}
              <MaxLossInput value={maxLoss} onChange={setMaxLoss} />
            </div>
            {compareSwitch}
          </div>

          {/* Mobile Phone Segmented Toggle between Left & Right Panes */}
          <div className="flex w-full rounded-lg bg-muted p-1 gap-1 md:hidden">
            <button
              type="button"
              onClick={() => setMobileActivePane("left")}
              className={cn(
                "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors",
                mobileActivePane === "left"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Left: {titleCase(leftView)}
            </button>
            <button
              type="button"
              onClick={() => setMobileActivePane("right")}
              className={cn(
                "flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors",
                mobileActivePane === "right"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Right: {titleCase(rightView)}
            </button>
          </div>

          {/* Grid: 2 columns on Tablet and Desktop; Selected tab only on Phone */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className={cn(mobileActivePane !== "left" && "max-md:hidden")}>
              <RecommendationPane
                analysisId={analysisId}
                decision={left}
                view={leftView}
                onViewChange={setLeftView}
                maxLoss={maxLoss}
                showMaxLoss={false}
                compact
                pane="left"
                pending={pending === "left"}
                disabled={pending !== null && pending !== "left"}
                emptyHint="Score this view to compare."
                onPending={(on) => setPending(on ? "left" : null)}
                onDecision={(d) => onPane("left", d)}
                onSelect={(key) => onSelect(key, "left")}
              />
            </div>
            <div className={cn(mobileActivePane !== "right" && "max-md:hidden")}>
              <RecommendationPane
                analysisId={analysisId}
                decision={right}
                view={rightView}
                onViewChange={setRightView}
                maxLoss={maxLoss}
                showMaxLoss={false}
                compact
                pane="right"
                pending={pending === "right"}
                disabled={pending !== null && pending !== "right"}
                emptyHint="Score this view to compare."
                onPending={(on) => setPending(on ? "right" : null)}
                onDecision={(d) => onPane("right", d)}
                onSelect={(key) => onSelect(key, "right")}
              />
            </div>
          </div>
        </>
      ) : (
        <RecommendationPane
          analysisId={analysisId}
          decision={single}
          view={singleView}
          onViewChange={setSingleView}
          maxLoss={maxLoss}
          onMaxLossChange={setMaxLoss}
          showMaxLoss
          compact={false}
          pending={pending === "single"}
          disabled={pending !== null && pending !== "single"}
          leading={title}
          trailing={compareSwitch}
          onPending={(on) => setPending(on ? "single" : null)}
          onDecision={onSingle}
          onSelect={(key) => onSelect(key)}
        />
      )}
    </Card>
  );
}
