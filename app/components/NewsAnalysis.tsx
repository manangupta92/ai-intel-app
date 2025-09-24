import { NewsAnalysis as NewsAnalysisType } from "../types/analysis";

interface Props {
  analysis: NewsAnalysisType;
}

export default function NewsAnalysis({ analysis }: Props) {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">News Analysis</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-lg">Sentiment Score:</span>
          <span className="font-medium text-lg">
            {(analysis.sentiment_score * 100).toFixed(0)}%
          </span>
        </div>
        <div>
          <h3 className="font-medium mb-2">Key Events:</h3>
          <ul className="list-disc list-inside space-y-1">
            {analysis.key_events.map((event: any, index) => (
              <li key={index} className="text-sm text-blue-700">
                {event.title} ({new Date(event.date).toLocaleDateString()})
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium mb-2">Impact Assessment:</h3>
          <p className="text-sm text-blue-700">{analysis.impact_assessment}</p>
        </div>
      </div>
    </div>
  );
}
