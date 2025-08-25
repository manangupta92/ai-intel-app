import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongo";
import fs from "fs";
import path from "path";
import Run from "@/models/Run";
import { fetchNewsSimple, fetchCandlesAll, analyzeReport, writeExcel } from "@/lib/agents";

// -------- POST: Run Job --------
export async function POST(req: Request) {
  try {
    await dbConnect();
    const { company, ticker: maybeTicker } = await req.json();
    if (!company) {
      return NextResponse.json({ error: "company is required" }, { status: 400 });
    }

    const ticker = maybeTicker || company; // fallback

    // 1) Collect
    const news = await fetchNewsSimple(company, 15);
    const candles = await fetchCandlesAll(ticker);

    // 2) Excel
    const excelPath = await writeExcel(company, news, candles);

    // 3) Analyze
    const analysis = await analyzeReport({ company, ticker, news, candles });
    console.log("Analysis: ", analysis);
    // 4) Save in Mongo
    const compact = Object.entries(candles).map(([interval, rows]) => ({
      interval,
      rows: rows.slice(-300).map(r => ({
        t: r.Datetime,
        o: r.Open,
        h: r.High,
        l: r.Low,
        c: r.Close,
        v: r.Volume,
        ema20: r.EMA_20,
        ema50: r.EMA_50,
        rsi14: r.RSI_14,
        cross: r.EMA_Cross,
      })),
    }));

    const doc = await (Run as any).create({
      company,
      ticker,
      fetchProvider: "yahoo",
      excelPath,
      news,
      candles: compact,
      analysis,
    });
    console.log("Download URL: ", `/api/run?company=${encodeURIComponent(company)}`);
    // 👇 return JSON with link to GET route
    return NextResponse.json(
      {
        ...doc.toObject(),
        downloadUrl: `/api/run?company=${encodeURIComponent(company)}`,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

