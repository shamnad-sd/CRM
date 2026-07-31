import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const mongoose = await connectToDatabase();
    const readyState = mongoose.connection.readyState; // 1 = connected

    return NextResponse.json({
      ok: readyState === 1,
      readyState,
      db: mongoose.connection.name,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
