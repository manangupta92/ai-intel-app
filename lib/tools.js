import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import fs from "node:fs";

const PYTHON_ANALYSIS_URL =
  process.env.PYTHON_ANALYSIS_URL || "http://localhost:8000/analyze";

export const PythonAnalysisTool = new DynamicStructuredTool({
  name: "python_analysis",
  description:
    "Compute technical indicators for 15m/1h/1d by reading the Excel in public/output for the given company. Returns JSON string.",
  schema: z.object({
    company: z
      .string()
      .describe("Exact company name as used in the Excel filename."),
    ticker: z.string().describe("Ticker symbol for reference/logging."),
  }),
  func: async ({ company, ticker }) => {
    console.log("Calling python_analysis tool...");

    const payload = { company, ticker };

    const resp = await fetch(PYTHON_ANALYSIS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(
        `Python analysis failed: ${resp.status} ${resp.statusText} ${text}`
      );
    }

    // IMPORTANT: return a STRING (not an object)
    const data = await resp.json();
    return JSON.stringify(data);
  },
});
