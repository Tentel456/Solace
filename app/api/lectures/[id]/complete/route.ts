
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  try {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.getClaims();

        const { id } = await params;

        if (error || !data || typeof data.claims?.sub !== "string") {
        return NextResponse.json(
            { error: "Необходима авторизация." },
            { status: 401 },
        );
        }

        const userId = data.claims.sub;

    const lecture = await prisma.lecture.findFirst({
      where: { id, userId },
    });

    if (!lecture) {
      return NextResponse.json(
        { error: "Лекция не найдена." },
        { status: 404 },
      );
    }

    if (lecture.status !== "UPLOADING") {
      return NextResponse.json({
        success: true,
        status: lecture.status,
      });
    }

    if (!lecture.storagePath) {
      return NextResponse.json(
        { error: "У лекции отсутствует путь к файлу." },
        { status: 409 },
      );
    }

    const folder = `${userId}/${id}`;
    const expectedName = lecture.storagePath.split("/").pop();

    const { data: objects, error: storageError } =
      await supabase.storage
        .from("lecture-videos")
        .list(folder, { limit: 100 });

    if (storageError) {
      console.error("Failed to verify uploaded video:", storageError);

      return NextResponse.json(
        { error: "Не удалось проверить загруженное видео." },
        { status: 502 },
      );
    }

    const fileExists = objects.some(
      (object) => object.name === expectedName,
    );

    if (!fileExists) {
      return NextResponse.json(
        { error: "Файл не найден в хранилище." },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.lecture.update({
        where: { id },
        data: { status: "PROCESSING" },
      });

      await tx.processingJob.create({
        data: {
          lectureId: id,
          type: "TRANSCRIBE",
          status: "PENDING",
        },
      });
    });

    return NextResponse.json({
      success: true,
      status: "PROCESSING",
    });
  } catch (error) {
    console.error("Failed to finalize lecture upload:", error);

    return NextResponse.json(
      { error: "Не удалось завершить загрузку лекции." },
      { status: 500 },
    );
  }
}
