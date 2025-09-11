import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongo";
import { SearchHistory } from "@/models/SearchHistory";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

interface CompanySearch {
  name: string;
  symbol: string;
}

// Helper function to get token from request
async function getToken(req: Request) {
  // First try Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // Then try cookie
  const cookieToken = cookies().get("token")?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

// Helper function to get authenticated user ID
async function getUserId(req: Request) {
  const token = await getToken(req);
  if (!token) {
    throw new Error("Not authenticated");
  }

  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      throw new Error("Invalid token");
    }
    return decoded.userId;
  } catch (error) {
    throw new Error("Invalid token");
  }
}

// GET: Fetch user's search history
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const userId = await getUserId(req);

    const history = await SearchHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec();

    return NextResponse.json(history.map(item => ({
      name: item.company.name,
      symbol: item.company.symbol
    })));
  } catch (err: any) {
    console.error("Error fetching search history:", err);
    
    if (err.message === "Not authenticated" || err.message === "Invalid token") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch search history" },
      { status: 500 }
    );
  }
}

// POST: Add to search history
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const userId = await getUserId(req);

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const company = await req.json() as CompanySearch;

    if (!company?.name || !company?.symbol) {
      return NextResponse.json(
        { error: "Company name and symbol are required" },
        { status: 400 }
      );
    }

    // Check if this company was already searched recently
    const existing = await SearchHistory.findOne({
      userId,
      'company.symbol': company.symbol
    }).exec();

    if (existing) {
      // Update timestamp of existing entry
      existing.createdAt = new Date();
      await existing.save();
    } else {
      // Create new entry
      const newSearch = new SearchHistory({
        userId,
        company: {
          name: company.name,
          symbol: company.symbol
        }
      });
      await newSearch.save();
    }

    // Return updated history
    const updatedHistory = await SearchHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec();

    return NextResponse.json(
      updatedHistory.map(item => ({
        name: item.company.name,
        symbol: item.company.symbol
      }))
    );
  } catch (err: any) {
    console.error("Error updating search history:", err);
    if (err.message === "Not authenticated" || err.message === "Invalid token") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update search history" },
      { status: 500 }
    );
  }
}
