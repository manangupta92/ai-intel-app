from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import os
from ta.trend import EMAIndicator, MACD
from ta.momentum import RSIIndicator

app = FastAPI(title="Python Analysis Service")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "python-analysis"}

class AnalysisRequest(BaseModel):
    company: str
    ticker: str

# -------------------------
# Helpers
# -------------------------
def safe_float(x, default=0.0):
    try:
        return float(x)
    except Exception:
        return default

def load_and_prepare_sheet(excel_path: str, sheet: str) -> pd.DataFrame:
    df = pd.read_excel(excel_path, sheet_name=sheet)
    if df.empty:
        raise ValueError(f"Sheet {sheet} is empty")

    expected_cols = {"Datetime", "Open", "High", "Low", "Close", "Volume"}
    if not expected_cols.issubset(set(df.columns)):
        raise ValueError(f"Missing columns in {sheet}, expected {expected_cols}, got {df.columns}")

    df["Datetime"] = pd.to_datetime(df["Datetime"], utc=True, errors="coerce")
    df = df.dropna(subset=["Datetime", "Close"])
    df.set_index("Datetime", inplace=True)
    return df

def calculate_indicators(df: pd.DataFrame) -> dict:
    df["ema_20"] = EMAIndicator(close=df["Close"], window=20).ema_indicator()
    df["ema_50"] = EMAIndicator(close=df["Close"], window=50).ema_indicator()
    df["rsi"] = RSIIndicator(close=df["Close"]).rsi()

    macd = MACD(close=df["Close"])
    df["macd"] = macd.macd()
    df["macd_signal"] = macd.macd_signal()

    return {
        "ema_20": safe_float(df["ema_20"].iloc[-1]),
        "ema_50": safe_float(df["ema_50"].iloc[-1]),
        "rsi": safe_float(df["rsi"].iloc[-1]),
        "macd": safe_float(df["macd"].iloc[-1]),
        "macd_signal": safe_float(df["macd_signal"].iloc[-1]),
    }

# -------------------------
# API Endpoint
# -------------------------
@app.post("/analyze")
async def analyze_data(request: AnalysisRequest):
    try:
        OUTPUT_DIR = os.path.join("/app", "public", "output")
        request.company = request.company.lower().replace(" ", "-")
        excel_path = os.path.join(OUTPUT_DIR, f"{request.company}.xlsx")
        print(f"Received analysis request for {excel_path}")
        print(f"Directory contents: {os.listdir(os.path.dirname(excel_path))}")

        if not os.path.exists(excel_path):
            raise HTTPException(
                status_code=404,
                detail=f"Excel file not found for {request.company}: {excel_path}"
            )

        sheet_map = {
            "15m": "Candles_15m",
            "1h": "Candles_1h",
            "1d": "Candles_1d"
        }

        results = {}
        for tf, sheet in sheet_map.items():
            df = load_and_prepare_sheet(excel_path, sheet)
            results[tf] = calculate_indicators(df)

        # Determine overall sentiment (majority vote bullish/bearish)
        bullish_count = sum(1 for r in results.values() if r["ema_20"] > r["ema_50"])
        bearish_count = len(results) - bullish_count

        overall_sentiment = "bullish" if bullish_count > bearish_count else "bearish"

        final_analysis = {
            "technical_analysis": {
                "timeframes": results,
                "overall_sentiment": overall_sentiment
            }
        }

        return final_analysis

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
