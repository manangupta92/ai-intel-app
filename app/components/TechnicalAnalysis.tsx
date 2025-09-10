import { TechnicalAnalysis as TechnicalAnalysisType } from "../types/analysis";

interface Props {
  analysis: TechnicalAnalysisType;
}

export default function TechnicalAnalysis({ analysis }: Props) {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Technical Analysis</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(analysis.timeframes).map(([timeframe, data]) => (
            <div key={timeframe} className="p-4 bg-gray-900 rounded-lg">
              <h3 className="font-medium mb-2">
                {timeframe.toUpperCase()} Timeframe
              </h3>
              <div className="space-y-2 text-sm">
                <div>EMA 20: {data.ema_20.toFixed(2)}</div>
                <div>EMA 50: {data.ema_50.toFixed(2)}</div>
                <div>RSI: {data.rsi.toFixed(2)}</div>
                <div>MACD: {data.macd.toFixed(2)}</div>
                <div>MACD Signal: {data.macd_signal.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center font-medium">
          Overall Sentiment:
          <span
            className={
              analysis.overall_sentiment === "bullish"
                ? "text-green-600"
                : "text-red-600"
            }
          >
            {" " + analysis.overall_sentiment.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
