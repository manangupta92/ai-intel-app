import * as cheerio from "cheerio";
import ExcelJS from "exceljs";
import yf from "yahoo-finance2";
import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import fs from "node:fs";

// --- Utils ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const istNowIso = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString();

// --- News collection ---
export async function fetchNewsSimple(company, limit = 15) {
  const q = encodeURIComponent(`${company} latest news`);
  const url = `https://duckduckgo.com/html/?q=${q}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 ai-intel-app" } });
  const html = await res.text();
  const $ = cheerio.load(html);
  const out = [];
  $(".result__a").each((_, el) => {
    if (out.length >= limit) return false;
    const title = $(el).text().trim();
    const link = $(el).attr("href") || "";
    const snippet = $(el).closest(".result").find(".result__snippet").text().trim();
    out.push({ title, url: link, snippet, source: "duckduckgo", fetched_at: istNowIso() });
  });
  return out;
}

// --- Market data (Yahoo Finance) ---
async function fetchInterval(ticker, interval) {
  const intervals = { "1m": "1m", "5m": "5m", "15m": "15m" };
  const range = interval === "1m" ? "7d" : (interval === "5m" ? "30d" : "50d");
  
  // Calculate dates based on range
  const endDate = new Date();
  let startDate;
  if (range === "7d") {
    startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === "30d") {
    startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else { // 60d
    startDate = new Date(endDate.getTime() - 60 * 24 * 60 * 60 * 1000);
  }
  
  const result = await yf.chart(ticker, { 
    period1: startDate, 
    period2: endDate, 
    interval: intervals[interval] 
  });
  
  const candles = (result?.quotes || []).map(q => ({
    Datetime: new Date(q.date).toISOString(),
    Open: q.open, High: q.high, Low: q.low, Close: q.close, Volume: q.volume
  }));
  return candles;
}

function ema(values, span) {
  const k = 2 / (span + 1);
  let ema = null;
  return values.map((v) => {
    if (ema == null) { ema = v; return ema; }
    ema = v * k + ema * (1 - k);
    return ema;
  });
}

function rsi(closes, period = 14) {
  const deltas = closes.map((v, i, arr) => (i === 0 ? 0 : v - arr[i-1]));
  let gains = [], losses = [];
  for (let d of deltas) {
    gains.push(Math.max(d, 0));
    losses.push(Math.max(-d, 0));
  }
  const alpha = 1 / period;
  const avgGain = []; const avgLoss = [];
  let g = 0, l = 0;
  for (let i=0; i<closes.length; i++) {
    g = alpha * gains[i] + (1 - alpha) * (g || gains[i]);
    l = alpha * losses[i] + (1 - alpha) * (l || losses[i]);
    avgGain.push(g); avgLoss.push(l);
  }
  return avgGain.map((g, i) => {
    const rl = avgLoss[i] === 0 ? 0.000001 : avgLoss[i];
    const rs = g / rl;
    return 100 - (100 / (1 + rs));
  });
}

function enrichTA(rows) {
  if (!rows?.length) return [];
  const closes = rows.map(r => r.Close);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const rsi14 = rsi(closes, 14);
  return rows.map((r, i) => ({
    ...r,
    EMA_20: Number(ema20[i]?.toFixed(4)),
    EMA_50: Number(ema50[i]?.toFixed(4)),
    RSI_14: Number(rsi14[i]?.toFixed(2)),
    EMA_Cross: (ema20[i] || 0) > (ema50[i] || 0) ? "Bullish" : "Bearish"
  }));
}

export async function fetchCandlesAll(ticker) {
  const out = {};
  for (const iv of ["1m", "5m", "15m"]) {
    const raw = await fetchInterval(ticker, iv);
    out[iv] = enrichTA(raw);
    await sleep(300); // be gentle
  }
  return out;
}

// --- Excel writer ---
export async function writeExcel(company, news, candles) {
  const wb = new ExcelJS.Workbook();
  const newsSheet = wb.addWorksheet("News");
  newsSheet.columns = [
    { header: "title", key: "title", width: 60 },
    { header: "url", key: "url", width: 60 },
    { header: "snippet", key: "snippet", width: 80 },
    { header: "source", key: "source", width: 20 },
    { header: "published_at", key: "published_at", width: 30 },
    { header: "fetched_at", key: "fetched_at", width: 30 }
  ];
  news.forEach(n => newsSheet.addRow(n));

  for (const [iv, rows] of Object.entries(candles)) {
    const s = wb.addWorksheet(`Candles_${iv}`);
    s.columns = [
      { header: "Datetime", key: "Datetime", width: 24 },
      { header: "Open", key: "Open", width: 12 },
      { header: "High", key: "High", width: 12 },
      { header: "Low", key: "Low", width: 12 },
      { header: "Close", key: "Close", width: 12 },
      { header: "Volume", key: "Volume", width: 12 },
      { header: "EMA_20", key: "EMA_20", width: 12 },
      { header: "EMA_50", key: "EMA_50", width: 12 },
      { header: "RSI_14", key: "RSI_14", width: 12 },
      { header: "EMA_Cross", key: "EMA_Cross", width: 12 }
    ];
    rows.forEach(r => s.addRow(r));
  }

  const dir = "public/output";
  await fs.promises.mkdir(dir, { recursive: true });
  const filename = `${company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`;
  // const filename = `${encodeURIComponent(company)}.xlsx`;
  const path = `${dir}/${filename}`;
  await wb.xlsx.writeFile(path);
  return `/${path}`; // public path
}

// --- Analyst LLM ---
const ANALYST_SYSTEM = `You are a cautious, concise equity analyst.
You receive:
1) A short news digest (title + snippet + link)
2) Intraday candle summaries (1m/5m/15m) with TA (EMA(20/50), RSI)
Tasks:
- Summarize dominant NEWS sentiment with 2-4 bullets citing items.
- Summarize TECHNICALS across 1m/5m/15m (EMA cross, RSI, alignment/divergence).
- Output a final 5-line "Actionable Takeaways".
- Give a 1 line trade idea, with key support and resistance level ideally giving only  Buy level/ Sell level and Stop Loss level.
Be crisp. Include the ticker.`;

function compressRows(rows, maxRows = 80) {
  if (!rows?.length) return "No data.";
  const tail = rows.slice(-maxRows);
  const header = "Datetime,Open,High,Low,Close,Volume,EMA_20,EMA_50,RSI_14,EMA_Cross";
  const lines = tail.map(r => [r.Datetime, r.Open, r.High, r.Low, r.Close, r.Volume, r.EMA_20, r.EMA_50, r.RSI_14, r.EMA_Cross].join(","));
  return [header, ...lines].join("\n");
}

export async function analyzeReport({ company, ticker, news, candles }, { model = "gpt-5-nano-2025-08-07" } = {}) {
  const newsDigest = (news || []).slice(0, 10).map((n, i) => `${i+1}. ${n.title} [${n.source||""}]\n   ${n.snippet}\n   ${n.url}`).join("\n");
  const c1 = compressRows(candles?.["1m"]);
  const c5 = compressRows(candles?.["5m"]);
  const c15 = compressRows(candles?.["15m"]);
  const userPrompt = `Company: ${company}
Ticker: ${ticker}

News (latest 10 items):
${newsDigest}

CANDLES 1m (tail):
${c1}

CANDLES 5m (tail):
${c5}

CANDLES 15m (tail):
${c15}

Now analyze per instructions.`;

  const llm = new ChatOpenAI({ model });
  const chain = RunnableSequence.from([
    async (input) => ({ role: "system", content: ANALYST_SYSTEM, input }),
    async (ctx) => {
      const resp = await llm.invoke([{ role: "system", content: ANALYST_SYSTEM }, { role: "user", content: userPrompt }]);
      return resp.content;
    }
  ]);
  return await chain.invoke({});
}
