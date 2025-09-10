"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import mockData from "./mock.json";
import { StockData } from "./types/analysis";
import StockInfo from "./components/StockInfo";
import TechnicalAnalysis from "./components/TechnicalAnalysis";
import TradeRecommendation from "./components/TradeRecommendation";
import NewsAnalysis from "./components/NewsAnalysis";

interface Company {
  name: string;
  symbol: string;
}

export default function Page() {
  const [company, setCompany] = useState(mockData.company || "");
  const [ticker, setTicker] = useState(mockData.ticker || "");
  const [suggestions, setSuggestions] = useState<Company[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<StockData | null>(mockData as StockData);
  const [error, setError] = useState("");
  const suggestionRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const debouncedFetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/companies?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      const data = await res.json();
      setSuggestions(data);
    } catch (e) {
      console.error("Error fetching suggestions:", e);
    }
  }, []);

  const fetchSuggestions = useCallback(
    (query: string) => {
      // Clear any existing timeout
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      // Set a new timeout
      debounceTimeout.current = setTimeout(() => {
        debouncedFetchSuggestions(query);
      }, 300); // 300ms delay
    },
    [debouncedFetchSuggestions]
  );

  const handleCompanySelect = (company: Company) => {
    setCompany(company.name);
    setTicker(company.symbol);
    setShowSuggestions(false);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCompany(value);
    setShowSuggestions(true);
    fetchSuggestions(value);
  };

  async function runPipeline() {
    if (!ticker) {
      setError("Please select a valid company from the suggestions");
      return;
    }

    setRunning(true);
    setError("");
    setResult(null);

    try {
      //Use mockdata for testing
      // const res = await fetch("/mock.json");
      // if (!res.ok) throw new Error("Failed to fetch mock data");
      // const data = await res.json();
      // console.log("Mock data:", data);
      // setResult(data);
      // return;

      // Actual API call
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, ticker }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      console.log("Pipeline result:", data);

      setResult(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  }

  const downloadExcel = async () => {
    if (!result) return;

    try {
      const res = await fetch(
        `/api/download?company=${encodeURIComponent(result.company)}`
      );
      if (!res.ok) {
        throw new Error("Excel file not found");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${result.company}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError("Failed to download Excel file");
      console.error("Download error:", error);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">AI Stock Trading Assistant</h1>
      <div className="card space-y-3">
        <label className="label">Company Name</label>
        <div className="relative">
          <input
            className="input w-full"
            placeholder="Start typing company name..."
            value={company}
            onChange={handleCompanyChange}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionRef}
              className="absolute z-10 w-full bg-white mt-1 border rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {suggestions.map((item, index) => (
                <div
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleCompanySelect(item)}
                >
                  <div>{item.name}</div>
                  <div className="text-sm text-gray-500">{item.symbol}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <label className="label">Ticker</label>
        <input
          className="input"
          placeholder="Will be automatically filled"
          value={ticker}
          readOnly
        />
        <button
          className="btn"
          disabled={!ticker || running}
          onClick={runPipeline}
        >
          {running ? "Running..." : "Run Pipeline"}
        </button>
      </div>

      {error && (
        <div className="card">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <StockInfo data={result} onDownload={downloadExcel} />
          <TechnicalAnalysis analysis={result.analysis.technical_analysis} />
          <TradeRecommendation
            recommendation={result.analysis.trade_recommendation}
          />
          <NewsAnalysis analysis={result.analysis.news_analysis} />
        </div>
      )}
    </main>
  );
}
