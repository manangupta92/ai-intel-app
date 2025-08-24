import mongoose, { Schema } from "mongoose";

const NewsSchema = new Schema({
  title: String,
  url: String,
  snippet: String,
  source: String,
  published_at: String,
  fetched_at: String
}, { _id: false });

const CandleSchema = new Schema({
  interval: String,
  rows: [{ // compact rows
    t: String, // time
    o: Number, h: Number, l: Number, c: Number, v: Number,
    ema20: Number, ema50: Number, rsi14: Number, cross: String
  }]
}, { _id: false });

const RunSchema = new Schema({
  company: { type: String, index: true },
  ticker: String,
  fetchProvider: { type: String, default: "yahoo" },
  excelPath: String,
  news: [NewsSchema],
  candles: [CandleSchema],
  analysis: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Run || mongoose.model("Run", RunSchema);
