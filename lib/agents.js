// agent.js
import * as cheerio from "cheerio";
import ExcelJS from "exceljs";
import yf from "yahoo-finance2";
import fs from "node:fs";

import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { PythonAnalysisTool } from "./tools.js";
import { createOpenAIToolsAgent, AgentExecutor } from "langchain/agents";

// -----------------------------
// UTILS
// -----------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const istNowIso = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString();
const PYTHON_ANALYSIS_URL =
  process.env.PYTHON_ANALYSIS_URL || "http://localhost:8000/analyze";

// -----------------------------
// NEWS FETCH
// -----------------------------
async function getNews(company, limit) {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) throw new Error("NEWSAPI_KEY not set in env");
  const q = encodeURIComponent(`"${company}"`);
  const date = new Date(Date.now() - 30 * 24 * 3600 * 1000)
    .toISOString()
    .split("T")[0];
  const url = `https://newsapi.org/v2/everything?q=${q}&from=${date}&language=en&sortBy=popularity&pageSize=${limit}&apiKey=${apiKey}`;
  const res = await fetch(url).then((r) => r.json());
  if (res.status !== "ok") throw new Error(`NewsAPI error: ${res.message}`);
  return res;
}

export async function fetchNewsSimple(company, limit = 15) {
  const output = [];
  const news = await getNews(company, limit);
  if (news?.articles?.length) {
    news.articles.forEach((a) =>
      output.push({
        title: a.title,
        url: a.url,
        snippet: a.description || "",
        source: a.source?.name || "newsapi",
        published_at: a.publishedAt,
        fetched_at: istNowIso(),
      })
    );
  }
  return output;
}

// -----------------------------
// MARKET DATA
// -----------------------------
async function fetchInterval(ticker, interval) {
  const intervals = { "15m": "15m", "1h": "1h", "1d": "1d" };
  const range = interval === "15m" ? "30d" : interval === "1h" ? "60d" : "255d";

  const endDate = new Date();
  let startDate =
    range === "30d"
      ? new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      : range === "60d"
      ? new Date(endDate.getTime() - 60 * 24 * 60 * 60 * 1000)
      : new Date(endDate.getTime() - 255 * 24 * 60 * 60 * 1000);

  const result = await yf.chart(ticker, {
    period1: startDate,
    period2: endDate,
    interval: intervals[interval],
  });

  return (result?.quotes || []).map((q) => ({
    Datetime: new Date(q.date).toISOString(),
    Open: q.open,
    High: q.high,
    Low: q.low,
    Close: q.close,
    Volume: q.volume,
  }));
}

export async function fetchCandlesAll(ticker) {
  const out = {};
  for (const iv of ["15m", "1h", "1d"]) {
    out[iv] = await fetchInterval(ticker, iv);
    await sleep(300);
  }
  return out;
}

// -----------------------------
// EXCEL HANDLING
// -----------------------------
export async function writeExcel(company, news, candles) {
  const wb = new ExcelJS.Workbook();
  const newsSheet = wb.addWorksheet("News");
  newsSheet.columns = [
    { header: "title", key: "title", width: 60 },
    { header: "url", key: "url", width: 60 },
    { header: "snippet", key: "snippet", width: 80 },
    { header: "source", key: "source", width: 20 },
    { header: "published_at", key: "published_at", width: 30 },
    { header: "fetched_at", key: "fetched_at", width: 30 },
  ];
  news.forEach((n) => newsSheet.addRow(n));

  for (const [iv, rows] of Object.entries(candles)) {
    const s = wb.addWorksheet(`Candles_${iv}`);
    s.columns = [
      { header: "Datetime", key: "Datetime", width: 24 },
      { header: "Open", key: "Open", width: 12 },
      { header: "High", key: "High", width: 12 },
      { header: "Low", key: "Low", width: 12 },
      { header: "Close", key: "Close", width: 12 },
      { header: "Volume", key: "Volume", width: 12 },
    ];
    rows.forEach((r) => s.addRow(r));
  }

  const dir = "public/output";
  await fs.promises.mkdir(dir, { recursive: true });
  const filename = `${company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`;
  const path = `${dir}/${filename}`;
  await wb.xlsx.writeFile(path);
  return `/${path}`;
}

// -----------------------------
// PYTHON TOOL
// -----------------------------
function convertToCSV(rows) {
  if (!rows?.length) return "Datetime,Open,High,Low,Close,Volume\n";
  const header = "Datetime,Open,High,Low,Close,Volume";
  const lines = rows.map((r) =>
    [r.Datetime, r.Open, r.High, r.Low, r.Close, r.Volume].join(",")
  );
  return [header, ...lines].join("\n");
}

// -----------------------------
// LLM AGENT
// -----------------------------
const ANALYST_SYSTEM = `
You are a quantitative trading analyst with expertise in technical analysis and combining news sentiment.
You will be given a technical_analysis JSON (from a trusted Python service) and a short news digest.
Your job is to produce a single JSON object containing:
- technical_analysis (as provided)
- news_analysis { sentiment_score (float), key_events (array), impact_assessment (string) }
- trade_recommendation { signal, entry_price, stop_loss, take_profit, risk_reward_ratio, confidence_score }

Return ONLY valid JSON (no explanation, no markdown, no code fences).
`;

export async function analyzeReport(
  { company, ticker, news },
  { model = "gpt-5-nano" } = {}
) {
  // 1) Call Python analysis service directly (no agent/tools)
  let techAnalysis;
  try {
    const resp = await fetch(PYTHON_ANALYSIS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, ticker }),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      throw new Error(
        `Python analysis service error: ${resp.status} ${resp.statusText} ${txt}`
      );
    }

    techAnalysis = await resp.json();
  } catch (err) {
    console.error("Error calling python-analysis:", err);
    return {
      error: "python_analysis_failed",
      details: String(err),
    };
  }

  // 2) Build news digest
  const newsDigest = (news || [])
    .slice(0, 10)
    .map(
      (n, i) =>
        `${i + 1}. ${n.title} [${n.source || ""}]\n   ${
          n.snippet
        }\n   Published: ${n.published_at || "N/A"}`
    )
    .join("\n");

  // 3) Call LLM exactly once, passing the technical_analysis as assistant content
  const llm = new ChatOpenAI({ model });

  const messages = [
    { role: "system", content: ANALYST_SYSTEM },
    // Put the trusted technical analysis as assistant content so LLM treats it as given facts
    { role: "assistant", content: JSON.stringify(techAnalysis) },
    {
      role: "user",
      content: `Company: ${company} (${ticker})
News:
${newsDigest}

Using the technical_analysis above, produce the JSON described in the system message. Return only valid JSON.`,
    },
  ];

  let llmRaw;
  try {
    const llmResp = await llm.invoke(messages);

    // Robust extraction of textual output from different LangChain/OpenAI shapes
    if (!llmResp) throw new Error("Empty LLM response");

    if (typeof llmResp === "string") {
      llmRaw = llmResp;
    } else if (Array.isArray(llmResp) && llmResp.length > 0) {
      llmRaw =
        llmResp[0]?.content || llmResp[0]?.text || JSON.stringify(llmResp);
    } else if (typeof llmResp === "object") {
      llmRaw =
        llmResp.content ??
        llmResp.output ??
        llmResp.output_text ??
        JSON.stringify(llmResp);
    } else {
      llmRaw = String(llmResp);
    }
  } catch (err) {
    console.error("LLM invocation failed:", err);
    return {
      error: "llm_invoke_failed",
      details: String(err),
      technical_analysis: techAnalysis,
    };
  }

  // 4) Extract JSON substring and parse
  const jsonMatch = (llmRaw || "").match(/\{[\s\S]*\}[\s]*$/m);
  const jsonString = jsonMatch ? jsonMatch[0] : llmRaw;

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    console.error("Failed to parse LLM JSON. Raw output:", llmRaw);
    return {
      error: "llm_output_not_json",
      raw: llmRaw,
      technical_analysis: techAnalysis,
    };
  }

  // 5) Ensure technical_analysis field exists in final output (prefer LLM result but fallback to python)
  if (!parsed.technical_analysis) {
    parsed.technical_analysis = techAnalysis.technical_analysis ?? techAnalysis;
  }
  console.log("Final analysis:", parsed);
  // IMPORTANT: return a plain JS object (not nested strings)
  return parsed;
}
