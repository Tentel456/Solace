
import "dotenv/config";

import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "lecture-videos";
const SIGNED_URL_TTL = 60 * 60;

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getClaims();

    const userId = data?.claims?.sub;

    if (authError || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Необходима авторизация." },
        { status: 401 },
      );
    }

    if (!supabaseAdmin) {
      console.error("Supabase Storage credentials are not configured.");

      return NextResponse.json(
        { error: "Хранилище видео не настроено." },
        { status: 500 },
      );
    }

    const { id } = await context.params;

    const lecture = await prisma.lecture.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        storagePath: true,
      },
    });

    if (!lecture?.storagePath) {
      return NextResponse.json(
        { error: "Лекция не найдена." },
        { status: 404 },
      );
    }

    const { data: signedData, error: storageError } =
      await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(lecture.storagePath, SIGNED_URL_TTL);

    if (storageError || !signedData?.signedUrl) {
      console.error("Could not create lecture preview URL:", storageError);

      return NextResponse.json(
        { error: "Не удалось получить доступ к видео." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { url: signedData.signedUrl },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Lecture preview request failed:", error);

    return NextResponse.json(
      { error: "Не удалось загрузить превью видео." },
      { status: 500 },
    );
  }
}
