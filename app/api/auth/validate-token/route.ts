import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body?.token;
    
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: "Valid token string is required" }, { status: 400 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    return NextResponse.json({
      userId: decoded.userId,
      email: decoded.email
    });
  } catch (error: any) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { error: "Invalid or expired token", details: error.message },
      { status: 401 }
    );
  }
}
