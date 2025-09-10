import yahooFinance from "yahoo-finance2";

import { NextResponse } from "next/server";

// Improve type definitions to match Yahoo Finance API response

interface YahooQuote {
  shortname?: string | null;
  longname?: string | null;
  symbol: string;
  isYahooFinance?: boolean;
  quoteType?: string;
  typeDisp?: string;
}

interface CompanyResponse {
  name: string;
  symbol: string;
}

interface YahooSearchResult {
  quotes: YahooQuote[];
  news?: any[];
  nav?: any[];
  lists?: any[];
  count?: number;
  // Add other optional fields as needed to match the actual response
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json([], { status: 200 });
    }

    const results = (await yahooFinance.search(query, {
      quotesCount: 10,

      newsCount: 0,
    })) as YahooSearchResult;

    if (!results?.quotes || !Array.isArray(results.quotes)) {
      return NextResponse.json([], { status: 200 });
    }

    const companies: CompanyResponse[] = results.quotes

      .filter((quote: YahooQuote) => {
        const validQuote =
          quote?.isYahooFinance === true &&
          typeof quote?.symbol === "string" &&
          (typeof quote?.shortname === "string" ||
            typeof quote?.longname === "string") &&
          (quote?.quoteType === "EQUITY" || quote?.typeDisp === "Equity") &&
          // Filter for Indian market symbols (NSE and BSE)

          (quote.symbol.endsWith(".NS") || quote.symbol.endsWith(".BO"));

        return validQuote;
      })

      .map((quote: YahooQuote) => ({
        name: (
          (quote.shortname || quote.longname || "")?.toString() || ""
        ).trim(),

        symbol: quote.symbol.trim(),
      }))

      .filter((company) => company.name && company.symbol)

      .slice(0, 10);

    return NextResponse.json(companies, { status: 200 });
  } catch (error) {
    console.error("Yahoo Finance API error:", error);

    return NextResponse.json(
      { error: "Failed to fetch companies" },

      { status: 500 }
    );
  }
}
