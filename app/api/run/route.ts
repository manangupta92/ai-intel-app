import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongo";
import fs from "fs";
import Run from "@/models/Run";
import {
  fetchNewsSimple,
  fetchCandlesAll,
  analyzeReport,
  writeExcel,
} from "@/lib/agents";
import { checkRateLimit } from "@/lib/rateLimit";
import { headers } from "next/headers";

// -------- POST: Run Job --------
export async function POST(req: Request) {
  try {
    // Rate limit
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await checkRateLimit(ip);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.resetAfter),
          },
        }
      );
    }

    await connectToDatabase();
    const { company, ticker: maybeTicker } = await req.json();
    if (!company) {
      return NextResponse.json(
        { error: "company is required" },
        { status: 400 }
      );
    }

    const ticker = maybeTicker || company; // fallback

    // Check cache (no cache period for now = always fetch fresh)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const existingRun = await (Run as any)
      .findOne({ company, createdAt: { $gt: oneWeekAgo } })
      .sort({ createdAt: -1 });

    if (existingRun) {
      return NextResponse.json({
        company,
        ticker,
        news: existingRun.news,
        candles: existingRun.candles,
        analysis: existingRun.analysis,
        downloadUrl: `/api/run?company=${encodeURIComponent(company)}`,
      });
    }

    // 1) Collect data
    const news = await fetchNewsSimple(company, 15);
    const candles = await fetchCandlesAll(ticker);

    // 2) Excel export
    const excelPath = await writeExcel(company, news, candles);

    // 3) Analyze with LLM
    const analysisResult = await analyzeReport({ company, ticker, news });

    let analysis: any;
    if (analysisResult?.output) {
      analysis = analysisResult.output;
    } else if (analysisResult?.output_text) {
      analysis = analysisResult.output_text;
    } else {
      analysis = analysisResult;
    }

    // 4) Compact candles
    const compact = Object.entries(candles).map(([interval, rows]) => ({
      interval,
      rows: rows.slice(-300).map((r) => ({
        t: r.Datetime,
        o: r.Open,
        h: r.High,
        l: r.Low,
        c: r.Close,
        v: r.Volume,
      })),
    }));

    // 5) Save
    const newRun = new (Run as any)({
      company,
      ticker,
      excelPath,
      news,
      candles: compact,
      analysis,
    });
    await newRun.save();

    // 6) Cleanup old
    try {
      await (Run as any).deleteMany({
        company,
        _id: { $ne: newRun._id },
        createdAt: { $lt: oneWeekAgo },
      });

      const oldRuns = await (Run as any).find({
        company,
        _id: { $ne: newRun._id },
        excelPath: { $exists: true },
      });

      for (const oldRun of oldRuns) {
        if (oldRun.excelPath && fs.existsSync(oldRun.excelPath)) {
          fs.unlinkSync(oldRun.excelPath);
        }
      }
    } catch (cleanupError) {
      console.error("Cleanup failed:", cleanupError);
    }

    // ✅ Always return a clean, flat JSON object
    return NextResponse.json(
      {
        company,
        ticker,
        news,
        candles: compact,
        analysis,
        downloadUrl: `/api/run?company=${encodeURIComponent(company)}`,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
