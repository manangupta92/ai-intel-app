import { TradeRecommendation as TradeRecommendationType } from "../types/analysis";

interface Props {
  recommendation: TradeRecommendationType;
}

export default function TradeRecommendation({ recommendation }: Props) {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Trade Recommendation</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Signal:</span>
            <span
              className={`font-medium ${
                recommendation.signal === "long"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {recommendation.signal.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Entry Price:</span>
            <span className="font-medium">{recommendation.entry_price}</span>
          </div>
          <div className="flex justify-between">
            <span>Stop Loss:</span>
            <span className="font-medium text-red-600">
              {recommendation.stop_loss}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Take Profit:</span>
            <span className="font-medium text-green-600">
              {recommendation.take_profit}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Risk/Reward Ratio:</span>
            <span className="font-medium">
              {recommendation.risk_reward_ratio}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Confidence Score:</span>
            <span className="font-medium">
              {(recommendation.confidence_score * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
