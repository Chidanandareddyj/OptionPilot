"use client";

import { useState } from "react";

export default function Home() {
  const [company, setCompany] = useState("");
  const [options, setOptions] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchOptions = async () => {
    setLoading(true);
    setError("");
    setOptions(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });
      const data = await res.json();
      if (res.ok) {
        setOptions(data.options);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Failed to fetch");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black p-8 gap-6">
      <h1 className="text-3xl font-bold text-black dark:text-white">OptionPilot</h1>
      <div className="flex gap-3">
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Enter company name (e.g. RELIANCE)"
          className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white w-72"
        />
        <button
          onClick={fetchOptions}
          disabled={loading || !company}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Get Options"}
        </button>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {options && (
        <p className="text-green-600 font-medium">Success</p>
      )}
    </div>
  );
}
