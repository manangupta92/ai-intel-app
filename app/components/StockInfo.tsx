import { StockData } from "../types/analysis";

interface Props {
  data: StockData;
  onDownload: () => void;
}

export default function StockInfo({ data, onDownload }: Props) {
  return (
    <div className="card space-y-3">
      <div className="text-lg font-semibold">{data.company}</div>
      <div className="text-sm">
        Ticker: <span className="code">{data.ticker}</span>
      </div>
      <button className="btn" onClick={onDownload}>
        Download Excel
      </button>
    </div>
  );
}
