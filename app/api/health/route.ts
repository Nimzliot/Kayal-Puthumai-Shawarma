import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "Kayal Puthumai Shawarma",
    timestamp: new Date().toISOString()
  });
}
