
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 500 * 1024 * 1024;

const acceptedTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

const createLectureSchema = z.object({
  title: z.string().trim().max(120).optional(),
  originalName: z.string().trim().min(1).max(255),
  mimeType: z.enum(acceptedTypes),
  sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE),
});


async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data || typeof data.claims?.sub !== "string") {
    return null;
  }

  return data.claims.sub;
}


export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Необходима авторизация." },
        { status: 401 },
      );
    }

    const lectures = await prisma.lecture.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        originalName: true,
        status: true,
        createdAt: true,
        durationMs: true,
        sizeBytes: true,
      },
    });

    return NextResponse.json({
      lectures: lectures.map((lecture) => ({
        ...lecture,
        sizeBytes: lecture.sizeBytes?.toString() ?? null,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch lectures:", error);

    return NextResponse.json(
      { error: "Не удалось загрузить список лекций." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Необходима авторизация." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();
    const parsed = createLectureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные или неподдерживаемый файл." },
        { status: 400 },
      );
    }

    const { originalName, mimeType, sizeBytes } = parsed.data;

    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Профиль не найден. Повторно войдите в аккаунт." },
        { status: 409 },
      );
    }

    const safeName =
      originalName
        .split(/[\\/]/)
        .pop()
        ?.replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 180) || "lecture.mp4";

    const title =
      parsed.data.title ||
      originalName.replace(/\.[^/.]+$/, "").slice(0, 120) ||
      "Новая лекция";

    const id = crypto.randomUUID();
    const storagePath = `${userId}/${id}/${safeName}`;

    const lecture = await prisma.lecture.create({
      data: {
        id,
        userId,
        title,
        originalName,
        mimeType,
        sizeBytes: BigInt(sizeBytes),
        storagePath,
        status: "UPLOADING",
      },
      select: {
        id: true,
        title: true,
        storagePath: true,
      },
    });

    return NextResponse.json({ lecture }, { status: 201 });
  } catch (error) {
    console.error("Failed to create lecture:", error);

    return NextResponse.json(
      { error: "Не удалось создать лекцию." },
      { status: 500 },
    );
  }
}
