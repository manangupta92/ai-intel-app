"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [company, setCompany] = useState("");
  const [ticker, setTicker] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function runPipeline() {
    setRunning(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, ticker })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">AI Intel App</h1>
      <div className="card space-y-3">
        <label className="label">Company Name</label>
        <input className="input" placeholder="Reliance Industries" value={company} onChange={e=>setCompany(e.target.value)} />
        <label className="label">Ticker (optional)</label>
        <input className="input" placeholder="RELIANCE.NS" value={ticker} onChange={e=>setTicker(e.target.value)} />
        <button className="btn" disabled={!company || running} onClick={runPipeline}>
          {running ? "Running..." : "Run Pipeline"}
        </button>
      </div>

      {error && <div className="card"><div className="text-red-600">{error}</div></div>}

      {result && (
        <div className="card space-y-3">
          <div className="text-lg font-semibold">Result</div>
          <div className="text-sm">Run ID: <span className="code">{result._id}</span></div>
          <div className="text-sm">Ticker: <span className="code">{result.ticker}</span></div>
          <a className="underline" href={result.excelPath} target="_blank">Download Excel</a>
          <pre className="whitespace-pre-wrap text-sm">{result.analysis}</pre>
        </div>
      )}
    </main>
  );
}
