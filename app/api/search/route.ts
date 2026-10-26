import { NextRequest, NextResponse } from "next/server";
import { demoLecture } from "@/lib/demo";
import { searchLecture } from "@/lib/search";
export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (typeof query !== "string" || !query.trim()) return NextResponse.json({ error: "Введите запрос для поиска." }, { status: 400 });
    return NextResponse.json({ results: searchLecture(demoLecture, query) });
  } catch {
    return NextResponse.json({ error: "Не удалось выполнить поиск." }, { status: 400 });
  }
}
