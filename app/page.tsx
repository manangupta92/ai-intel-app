"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import mockData from "./mock.json";
import { StockData } from "./types/analysis";
import StockInfo from "./components/StockInfo";
import TechnicalAnalysis from "./components/TechnicalAnalysis";
import TradeRecommendation from "./components/TradeRecommendation";
import NewsAnalysis from "./components/NewsAnalysis";
import LogoutButton from "./components/LogoutButton";
import { useAuth } from "@/lib/contexts/auth";

interface Company {
  name: string;
  symbol: string;
}

export default function Page() {
  const { isAuthenticated, token: authToken } = useAuth();
  const router = useRouter();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<Company[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<StockData | null>(mockData as StockData);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // Client-side authentication check - redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && authToken === null) {
      router.push('/auth/login');
      return;
    }
  }, [isAuthenticated, authToken, router]);

  const fetchSearchHistory = useCallback(async () => {
    if (!token) {
      setError("Please login to view your search history");
      setLoadingHistory(false);
      return;
    }

    try {
      const res = await fetch('/api/search-history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        setError("Session expired. Please login again");
        setToken(null);
        localStorage.removeItem('authToken');
        setLoadingHistory(false);
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch search history');

      const history = await res.json();
      setSearchHistory(history);
      setLoadingHistory(false);
    } catch (error) {
      console.error('Error fetching search history:', error);
      setError('Error fetching search history');
      setLoadingHistory(false);
    }
  }, [token, setError, setSearchHistory, setLoadingHistory, setToken]);

  // Initialize token and fetch search history when component mounts
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    setToken(storedToken);
  }, []);

  // Fetch search history whenever token changes
  useEffect(() => {
    if (token) {
      fetchSearchHistory();
    }
  }, [token]);

  const debouncedFetchCompanies = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCompanies([]);
      return;
    }

    try {
      const res = await fetch(`/api/companies?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch companies");
      const data = await res.json();
      setCompanies(data);
    } catch (e) {
      console.error("Error fetching companies:", e);
    }
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
        debouncedFetchCompanies(query);
      }, 300);
    },
    [debouncedFetchCompanies]
  );

  const handleCompanySelect = async (company: Company) => {
    setSelectedCompany(company);
    setSearchQuery("");
    setCompanies([]);

    // Update search history in backend
    if (token) {
      try {
        const res = await fetch('/api/search-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(company),
        });

        if (res.status === 401) {
          setError("Session expired. Please login again");
          setToken(null);
          localStorage.removeItem('authToken');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to update search history');
        }

        // Refresh search history after successful update
        fetchSearchHistory();
      } catch (error) {
        console.error('Error updating search history:', error);
      }
    } else {
      console.warn('Not saving to search history - user not authenticated');
    }

    // Run analysis for the selected company
    await runAnalysis(company);
  };
  
  const runAnalysis = useCallback(async (company: Company) => {
    setRunning(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.name,
          ticker: company.symbol,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
      console.error("Error:", e);
    } finally {
      setRunning(false);
    }
  }, []);

  const handleDownload = async () => {
    if (!result) return;

    try {
      const res = await fetch(
        `/api/download?company=${encodeURIComponent(result.company)}`
      );
      if (!res.ok) throw new Error("Excel file not found");

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

  // Show loading state while authentication is being verified
  if (authToken === null && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <div className="mt-4">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-gray-800 px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">AI Stock Analysis</h1>
          <LogoutButton />
        </header>
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto">          
          <div className="flex flex-col md:flex-row gap-8">{/* Left Pane - Company List */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="bg-gray-900 rounded-lg p-4 sticky top-4 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
                <div className="flex-none mb-4">
                  <input
                    type="text"
                    placeholder="Search companies..."
                    className="w-full p-2 rounded bg-gray-800"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                
                <div className="flex-1 overflow-y-auto min-h-0">
                  {/* Search Results */}
                  {companies.length > 0 ? (
                    companies.map((company) => (
                      <button
                        key={company.symbol}
                        onClick={() => handleCompanySelect(company)}
                        className={`w-full text-left p-2 rounded hover:bg-gray-800 transition-colors ${
                          selectedCompany?.symbol === company.symbol
                            ? "bg-gray-800"
                            : ""
                        }`}
                      >
                        <div className="font-medium">{company.symbol}</div>
                        <div className="text-sm text-gray-400">{company.name}</div>
                      </button>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm">
                      {searchQuery.length < 2
                        ? "Start typing to search companies"
                        : "No companies found"}
                    </div>
                  )}

                  {/* Recent Searches */}
                  {!searchQuery && (
                    <div className="mt-6">
                      <div className="text-sm text-gray-400 mb-2">Recent Searches</div>
                      {loadingHistory ? (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        </div>
                      ) : searchHistory.length > 0 ? (
                        <div className="space-y-2">
                          {searchHistory.map((company) => (
                            <button
                              key={company.symbol}
                              onClick={() => handleCompanySelect(company)}
                              className={`w-full text-left p-2 rounded hover:bg-gray-800 transition-colors ${
                                selectedCompany?.symbol === company.symbol
                                  ? "bg-gray-800"
                                  : ""
                              }`}
                            >
                              <div className="font-medium">{company.symbol}</div>
                              <div className="text-sm text-gray-400">{company.name}</div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm text-center py-2">
                          No recent searches
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
              </div>
            </div>

            {/* Right Pane - Analysis Results */}
            <div className="flex-1">
              {running && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <div className="mt-4">Analyzing...</div>
                </div>
              )}

              {error && (
                <div className="bg-red-900/50 text-red-200 p-4 rounded mb-4">
                  {error}
                </div>
              )}

              {result && !running && (
                <div className="space-y-6">
                  <StockInfo data={result} onDownload={handleDownload} />
                  <TechnicalAnalysis analysis={result.analysis.technical_analysis} />
                  <TradeRecommendation
                    recommendation={result.analysis.trade_recommendation}
                  />
                  <NewsAnalysis analysis={result.analysis.news_analysis} />
                </div>
              )}

              {!result && !running && !error && (
                <div className="text-center py-8 text-gray-400">
                  Select a company to view analysis
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}