export interface TimeframeAnalysis {
  ema_20: number;
  ema_50: number;
  rsi: number;
  macd: number;
  macd_signal: number;
}

export interface TechnicalAnalysis {
  timeframes: {
    "15m": TimeframeAnalysis;
    "1h": TimeframeAnalysis;
    "1d": TimeframeAnalysis;
  };
  overall_sentiment: string;
}

export interface NewsAnalysis {
  sentiment_score: number;
  key_events: string[];
  impact_assessment: string;
}

export interface TradeRecommendation {
  signal: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_reward_ratio: number;
  confidence_score: number;
}

export interface StockAnalysis {
  technical_analysis: TechnicalAnalysis;
  news_analysis: NewsAnalysis;
  trade_recommendation: TradeRecommendation;
}

export interface StockData {
  company: string;
  ticker: string;
  analysis: StockAnalysis;
}
