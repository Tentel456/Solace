import { NextRequest, NextResponse } from "next/server";
import { demoLecture } from "@/lib/demo";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transcript = typeof body.transcript === "string" ? body.transcript : demoLecture.transcript.map(s => s.text).join(" ");
    const key = process.env.OPENAI_API_KEY;
    if (key) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [
          { role: "system", content: "Ты помощник студента. На русском языке сделай краткий точный конспект лекции: главная мысль, 4-6 тезисов, определения и вывод. Не выдумывай факты." },
          { role: "user", content: transcript.slice(0, 50000) }
        ], temperature: 0.2 })
      });
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ summary: data.choices?.[0]?.message?.content ?? "" });
      }
    }
    const sentences = transcript.match(/[^.!?]+[.!?]?/g)?.map((s: string) => s.trim()).filter(Boolean) ?? [];
    return NextResponse.json({ summary: sentences.slice(0, 5).join(" ") || demoLecture.summary, mode: "extractive" });
  } catch {
    return NextResponse.json({ error: "Не удалось создать конспект." }, { status: 500 });
  }
}
