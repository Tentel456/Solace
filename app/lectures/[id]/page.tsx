
import { notFound, redirect } from "next/navigation";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

import { LectureViewer } from "@/components/lectures/viewer";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

import { Header } from "@/components/ui/header";

const BUCKET = "lecture-videos";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

const supabaseAdmin =
  supabaseUrl && supabaseSecretKey
    ? createSupabaseAdmin(supabaseUrl, supabaseSecretKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })
    : null;

export default async function LecturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;
  const emailClaim = data?.claims?.email;

  if (error || typeof userId !== "string") {
    redirect("/auth");
  }

  const email =
    typeof emailClaim === "string" ? emailClaim : "Пользователь";

  const { id } = await params;

  const lecture = await prisma.lecture.findFirst({
    where: {
      id,
      userId,
      status: "READY",
    },
    select: {
      id: true,
      title: true,
      description: true,
      originalName: true,
      storagePath: true,
      createdAt: true,
      durationMs: true,
      sizeBytes: true,
    },
  });

  if (!lecture || !lecture.storagePath) {
    notFound();
  }

  if (!supabaseAdmin) {
    throw new Error("Supabase Storage credentials are not configured.");
  }

  const { data: signedData, error: storageError } =
    await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(lecture.storagePath, 3600);

  if (storageError || !signedData?.signedUrl) {
    console.error("Could not create lecture video URL:", storageError);
    throw new Error("Не удалось получить доступ к видео.");
  }

  const transcript = await prisma.transcriptSegment.findMany({
    where: {
      lectureId: lecture.id,
    },
    orderBy: {
      position: "asc",
    },
    select: {
      id: true,
      position: true,
      startMs: true,
      endMs: true,
      text: true,
    },
  });

  return (
    <LectureViewer
      lecture={{
        id: lecture.id,
        title: lecture.title,
        description: lecture.description,
        originalName: lecture.originalName,
        createdAt: lecture.createdAt.toISOString(),
        durationMs: lecture.durationMs,
        sizeBytes: lecture.sizeBytes?.toString() ?? null,
        uploader: email,
        videoUrl: signedData.signedUrl,
      }}
      transcript={transcript}
    />
  );
}
