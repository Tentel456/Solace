import { NextResponse } from "next/server";
import { demoLecture } from "@/lib/demo";
export const runtime = "nodejs";
export async function GET() {
  // Prototype keeps the demo lecture available without a database.
  return NextResponse.json({ lectures: [demoLecture] });
}
