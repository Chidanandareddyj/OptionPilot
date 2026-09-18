"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type HistoryItem = {
  id: string;
  company: string;
  createdAt: string;
  result: unknown;
};

export default function AnalyzePanel({ history }: { history: HistoryItem[] }) {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [latest, setLatest] = useState<unknown>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }
      setLatest(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section>
        <form onSubmit={onSubmit} className="flex flex-wrap gap-3">
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            required
            placeholder="Company or symbol"
            className="min-w-[16rem] flex-1 rounded-md bg-white/5 px-3 py-2 outline-1 outline-white/15 placeholder:text-white/40"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#0a1f5c] disabled:opacity-60"
          >
            {pending ? "Analyzing…" : "Analyze"}
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        {latest != null && (
          <pre className="mt-6 max-h-[32rem] overflow-auto rounded-xl border border-white/12 bg-black/20 p-4 text-[12px] leading-relaxed text-white/80">
            {JSON.stringify(latest, null, 2)}
          </pre>
        )}
      </section>
      <aside>
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/45">
          Saved analyses
        </h2>
        <ul className="mt-4 space-y-3">
          {history.length === 0 && (
            <li className="text-sm text-white/50">No saved analyses yet.</li>
          )}
          {history.map((item) => (
            <li key={item.id} className="rounded-xl border border-white/12 bg-white/[0.04] p-4">
              <div className="font-medium">{item.company}</div>
              <div className="mt-1 text-[12px] text-white/45">
                {new Date(item.createdAt).toLocaleString()}
              </div>
              <button
                type="button"
                className="mt-3 text-[12px] text-white/70 underline"
                onClick={() => setLatest(item.result)}
              >
                View snapshot
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
