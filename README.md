# AI Intel App (Next.js + Node.js + MongoDB + Tailwind + LangChain)

One-click pipeline: **News + 1m/5m/15m candles** → **Excel** → **AI Analysis**.

## Quickstart

```bash
pnpm i   # or npm i / yarn
cp .env.example .env
# fill MONGODB_URI and OPENAI_API_KEY
pnpm dev
```

Open http://localhost:3000

## Notes
- Uses Yahoo Finance (via `yahoo-finance2`) for intraday data. Availability varies.
- The "TradingView" scraping is intentionally not included to avoid ToS violations.
- News comes from a simple search (DuckDuckGo HTML parsing). For production, use licensed APIs.
- Excel is written to `public/output/*.xlsx` and downloadable from the UI.
- LangChain (JS) orchestrates a concise analyst prompt with OpenAI.
