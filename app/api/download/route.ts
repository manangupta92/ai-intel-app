// app/api/download/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(req: Request) {
  console.log("Download route called");
  const { searchParams } = new URL(req.url);
  const company = searchParams.get("company");
  if (!company) {
    return NextResponse.json({ error: "company is required" }, { status: 400 });
  }
  console.log(process.cwd());
  const companyName = `${company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`;
  console.log(path.join(process.cwd(), "public", "output", `${companyName}`));
  console.log(`${company}.xlsx`);
  const filePath = path.join(process.cwd(), "public", "output", `${companyName}`);
  if (!fs.existsSync(filePath)) {
    return new NextResponse("File not found", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename="${company}.xlsx"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
