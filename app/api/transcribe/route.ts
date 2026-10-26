import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { spawn } from "child_process";
export const runtime = "nodejs";
export const maxDuration = 300;

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args);
    let error = "";
    child.stderr.on("data", d => error += d.toString());
    child.on("error", reject);
    child.on("close", code => code === 0 ? resolve() : reject(new Error(error || `${command} exited ${code}`)));
  });
}
export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "Для автоматической транскрибации добавьте OPENAI_API_KEY в .env.local. Пока можно использовать демо-лекцию." }, { status: 501 });
  let tempVideo = "", tempAudio = "";
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Файл видео не найден." }, { status: 400 });
    if (!["video/mp4", "video/webm", "audio/mpeg", "audio/mp3", "audio/wav", "audio/mp4", "audio/x-wav"].includes(file.type) && !/\.(mp4|webm|mp3|wav|m4a)$/i.test(file.name)) {
      return NextResponse.json({ error: "Поддерживаются MP4, WebM, MP3, WAV и M4A." }, { status: 400 });
    }
    if (file.size > 250 * 1024 * 1024) return NextResponse.json({ error: "Максимальный размер файла — 250 МБ." }, { status: 413 });
    const id = randomUUID();
    tempVideo = path.join(os.tmpdir(), `${id}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
    tempAudio = path.join(os.tmpdir(), `${id}.mp3`);
    await writeFile(tempVideo, Buffer.from(await file.arrayBuffer()));
    // Requires ffmpeg installed on the host for video/audio conversion.
    if (file.type.startsWith("video/") || /\.(mp4|webm)$/i.test(file.name)) {
      await run("ffmpeg", ["-y", "-i", tempVideo, "-vn", "-ac", "1", "-ar", "16000", "-b:a", "64k", tempAudio]);
    } else {
      tempAudio = tempVideo;
    }
    const audioBytes = await (await import("fs/promises")).readFile(tempAudio);
    const payload = new FormData();
    payload.append("file", new Blob([Uint8Array.from(audioBytes)]), "lecture.mp3");
    payload.append("model", "whisper-1");
    payload.append("response_format", "verbose_json");
    payload.append("timestamp_granularities[]", "segment");
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: payload });
    if (!r.ok) return NextResponse.json({ error: `Сервис транскрибации вернул ошибку: ${await r.text()}` }, { status: 502 });
    const data = await r.json();
    const transcript = (data.segments ?? []).map((s: any, i: number) => ({ id: `${id}-${i}`, start: Math.round(s.start), end: Math.round(s.end), text: s.text.trim() }));
    return NextResponse.json({ id, title: file.name.replace(/\.[^.]+$/, ""), duration: Math.round(data.duration ?? 0), transcript });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message?.includes("ffmpeg") ? "Не найден ffmpeg. Установите ffmpeg и повторите загрузку." : (e?.message || "Не удалось обработать видео.") }, { status: 500 });
  } finally {
    if (tempVideo) await unlink(tempVideo).catch(() => {});
    if (tempAudio && tempAudio !== tempVideo) await unlink(tempAudio).catch(() => {});
  }
}
