
import "dotenv/config";

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import ffmpegPath from "ffmpeg-static";

import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import { access, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import { prisma } from "@/lib/prisma";

const BUCKET = "lecture-videos";
const CHUNK_SECONDS = 600;
const POLL_INTERVAL_MS = 2_000;

const openAIKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

const pythonPath = join(process.cwd(), ".venv", "bin", "python");
const pythonScript = join(
  process.cwd(),
  "scripts",
  "transcribe-local.py",
);

const modelName = process.env.WHISPER_MODEL || "small";
const language = process.env.WHISPER_LANGUAGE?.trim() || undefined;

const provider = process.env.TRANSCRIPTION_PROVIDER || "local";

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.",
  );
}

if (!ffmpegPath) {
  throw new Error("FFmpeg binary was not found.");
}

if (provider !== "local" && provider !== "openai") {
  throw new Error(
    'TRANSCRIPTION_PROVIDER must be "local" or "openai".',
  );
}

if (provider === "openai" && !openAIKey) {
  throw new Error(
    "OPENAI_API_KEY is required when TRANSCRIPTION_PROVIDER=openai.",
  );
}

const openai = openAIKey ? new OpenAI({ apiKey: openAIKey }) : null;

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

type TranscriptRow = {
  lectureId: string;
  position: number;
  startMs: number;
  endMs: number;
  text: string;
};

type LocalSegment = {
  position: number;
  startMs: number;
  endMs: number;
  text: string;
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function downloadVideo(
  storagePath: string,
  destination: string,
) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error || !data?.signedUrl) {
    throw new Error("Could not create a signed video URL.");
  }

  const response = await fetch(data.signedUrl);

  if (!response.ok || !response.body) {
    throw new Error(
      `Video download failed with HTTP ${response.status}.`,
    );
  }

  await pipeline(
    Readable.fromWeb(
      response.body as import("node:stream/web").ReadableStream,
    ),
    createWriteStream(destination),
  );
}

function runFFmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath!, args, {
      stdio: ["ignore", "ignore", "pipe"],
    });

    let stderr = "";

    child.stderr?.on("data", (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-4000);
    });

    child.once("error", reject);

    child.once("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      if (
        stderr.includes("Output file does not contain any stream") ||
        stderr.includes("does not contain any stream")
      ) {
        reject(
          new Error(
            "В видео не обнаружена аудиодорожка. Загрузите видео со звуком.",
          ),
        );
        return;
      }

      reject(
        new Error(`FFmpeg failed with exit code ${code}: ${stderr}`),
      );
    });
  });
}

async function extractAudioChunks(
  videoPath: string,
  outputPattern: string,
) {
  await runFFmpeg([
    "-nostdin",
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    videoPath,
    "-map",
    "0:a:0",
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-c:a",
    "libmp3lame",
    "-b:a",
    "64k",
    "-f",
    "segment",
    "-segment_time",
    String(CHUNK_SECONDS),
    "-reset_timestamps",
    "1",
    "-segment_format",
    "mp3",
    outputPattern,
  ]);
}

function runLocalTranscription(
  files: string[],
): Promise<LocalSegment[]> {
  return new Promise((resolve, reject) => {
    const args = [
      pythonScript,
      "--model",
      modelName,
      "--chunk-seconds",
      String(CHUNK_SECONDS),
    ];

    if (language) {
      args.push("--language", language);
    }

    args.push(...files);

    const child = spawn(pythonPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      const message = chunk.toString();
      stderr = (stderr + message).slice(-6000);
      process.stderr.write(`[Whisper] ${message}`);
    });

    child.once("error", reject);

    child.once("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `Local transcription failed (${code}): ${stderr}`,
          ),
        );
        return;
      }

      try {
        const segments = JSON.parse(stdout) as LocalSegment[];

        if (!Array.isArray(segments)) {
          throw new Error("Unexpected local transcription response.");
        }

        resolve(segments);
      } catch (error) {
        reject(
          new Error(
            `Could not parse local transcription output: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ),
        );
      }
    });
  });
}

async function transcribeWithOpenAI(
  files: string[],
  lectureId: string,
  jobId: string,
): Promise<TranscriptRow[]> {
  if (!openai) {
    throw new Error(
      "Local transcription failed and OPENAI_API_KEY is not configured.",
    );
  }

  const rows: TranscriptRow[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const offsetMs = index * CHUNK_SECONDS * 1000;

    console.log(
      `[Solace] OpenAI fallback: chunk ${index + 1}/${files.length}`,
    );

    const result = await openai.audio.transcriptions.create({
      file: createReadStream(files[index]),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    for (const segment of result.segments ?? []) {
      const text = segment.text.trim();

      if (!text) continue;

      const startMs = offsetMs + Math.round(segment.start * 1000);
      const endMs = Math.max(
        startMs + 1,
        offsetMs + Math.round(segment.end * 1000),
      );

      rows.push({
        lectureId,
        position: rows.length,
        startMs,
        endMs,
        text,
      });
    }

    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        progress: Math.min(
          95,
          Math.round(((index + 1) / files.length) * 95),
        ),
      },
    });
  }

  return rows;
}

async function saveSegments(
  lectureId: string,
  segments: Array<{
    startMs: number;
    endMs: number;
    text: string;
  }>,
) {
  const rows: TranscriptRow[] = segments.map((segment, position) => ({
    lectureId,
    position,
    startMs: segment.startMs,
    endMs: segment.endMs,
    text: segment.text,
  }));

  if (rows.length === 0) {
    throw new Error(
      "Речь не обнаружена. Проверьте, что видео содержит разборчивую речь.",
    );
  }

  await prisma.transcriptSegment.deleteMany({
    where: { lectureId },
  });

  for (let index = 0; index < rows.length; index += 500) {
    await prisma.transcriptSegment.createMany({
      data: rows.slice(index, index + 500),
    });
  }

  return rows.length;
}

async function processJob(jobId: string) {
  const job = await prisma.processingJob.findUnique({
    where: { id: jobId },
    include: { lecture: true },
  });

  if (!job) {
    throw new Error("Processing job was not found.");
  }

  const lecture = job.lecture;

  if (!lecture.storagePath) {
    throw new Error("Lecture has no storage path.");
  }

  const expectedPrefix = `${lecture.userId}/${lecture.id}/`;

  if (!lecture.storagePath.startsWith(expectedPrefix)) {
    throw new Error("Lecture storage path failed ownership validation.");
  }

  if (lecture.status !== "PROCESSING") {
    throw new Error("Lecture is not in a processing state.");
  }

  const tempDir = await mkdtemp(join(tmpdir(), "solace-"));

  try {
    const videoPath = join(tempDir, "source-video");
    const audioPattern = join(tempDir, "audio_%03d.mp3");

    await downloadVideo(lecture.storagePath, videoPath);
    await extractAudioChunks(videoPath, audioPattern);

    const files = (await readdir(tempDir))
      .filter((name) => /^audio_\d+\.mp3$/.test(name))
      .sort()
      .map((name) => join(tempDir, name));

    if (files.length === 0) {
      throw new Error("FFmpeg did not produce any audio chunks.");
    }

    let rows: TranscriptRow[] = [];

    if (provider === "openai") {
      rows = await transcribeWithOpenAI(
        files,
        lecture.id,
        job.id,
      );
    } else {
      try {
        await access(pythonPath);
        await access(pythonScript);

        await prisma.processingJob.update({
          where: { id: job.id },
          data: { progress: 5 },
        });

        console.log(
          `[Solace] Using local faster-whisper (${modelName}).`,
        );

        const segments = await runLocalTranscription(files);

        rows = segments.map((segment, position) => ({
          lectureId: lecture.id,
          position,
          startMs: segment.startMs,
          endMs: segment.endMs,
          text: segment.text.trim(),
        })).filter((row) => row.text.length > 0);

        if (rows.length === 0) {
          throw new Error("Local model did not detect any speech.");
        }
      } catch (error) {
        console.error("[Solace] Local transcription error:", error);

        if (!openai) {
          throw error;
        }

        console.log("[Solace] Falling back to OpenAI API.");

        rows = await transcribeWithOpenAI(
          files,
          lecture.id,
          job.id,
        );
      }
    }

    const insertedSegments = await saveSegments(
      lecture.id,
      rows,
    );

    await prisma.$transaction([
      prisma.lecture.update({
        where: { id: lecture.id },
        data: {
          status: "READY",
          errorMessage: null,
        },
      }),
      prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          progress: 100,
          finishedAt: new Date(),
          errorMessage: null,
        },
      }),
    ]);

    console.log(
      `[Solace] Lecture ${lecture.id} is ready. Saved ${insertedSegments} transcript segments.`,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function claimNextJob() {
  const candidate = await prisma.processingJob.findFirst({
    where: {
      type: "TRANSCRIBE",
      status: "PENDING",
    },
    orderBy: { createdAt: "asc" },
  });

  if (!candidate) return null;

  const claimed = await prisma.processingJob.updateMany({
    where: {
      id: candidate.id,
      status: "PENDING",
    },
    data: {
      status: "RUNNING",
      attempts: { increment: 1 },
      progress: 0,
      startedAt: new Date(),
      finishedAt: null,
      errorMessage: null,
    },
  });

  return claimed.count === 1 ? candidate : null;
}

async function runWorker() {
  console.log(
    `[Solace] Transcription worker started. Provider: ${provider}.`,
  );

  while (true) {
    let job: Awaited<ReturnType<typeof claimNextJob>> = null;

    try {
      job = await claimNextJob();

      if (!job) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }

      console.log(`[Solace] Processing job ${job.id}`);

      await processJob(job.id);
    } catch (error) {
      console.error("[Solace] Worker error:", error);

      if (job) {
        const message =
          error instanceof Error
            ? error.message.slice(0, 1000)
            : "Unknown processing error.";

        try {
          await prisma.$transaction([
            prisma.processingJob.update({
              where: { id: job.id },
              data: {
                status: "FAILED",
                progress: 0,
                finishedAt: new Date(),
                errorMessage: message,
              },
            }),
            prisma.lecture.update({
              where: { id: job.lectureId },
              data: {
                status: "FAILED",
                errorMessage: message,
              },
            }),
          ]);
        } catch (updateError) {
          console.error(
            "[Solace] Failed to persist job error:",
            updateError,
          );
        }
      }

      await sleep(POLL_INTERVAL_MS);
    }
  }
}

runWorker().catch((error) => {
  console.error("[Solace] Fatal worker error:", error);
  process.exitCode = 1;
});
