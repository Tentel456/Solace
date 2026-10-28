"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Film,
  LoaderCircle,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import * as tus from "tus-js-client";

import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const BUCKET = "lecture-videos";

const ACCEPTED_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const ACCEPTED_EXTENSIONS = /\.(mp4|webm|mov)$/i;

type Lecture = {
  id: string;
  title: string;
  originalName: string | null;
  status: "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
  createdAt: string;
  durationMs: number | null;
  sizeBytes: string | null;
};

type UploadStatus =
  | "idle"
  | "creating"
  | "uploading"
  | "finalizing"
  | "success"
  | "error";

function formatSize(bytes: number | string | null) {
  if (bytes === null) return "Размер неизвестен";

  const value = Number(bytes);

  if (!Number.isFinite(value)) return "Размер неизвестен";

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(0)} КБ`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} МБ`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatDuration(durationMs: number | null) {
  if (durationMs === null || durationMs <= 0) return null;

  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getStatusLabel(status: Lecture["status"]) {
  switch (status) {
    case "UPLOADING":
      return "Загружается";
    case "PROCESSING":
      return "Обработка";
    case "READY":
      return "Готово";
    case "FAILED":
      return "Ошибка";
  }
}

function getStatusStyles(status: Lecture["status"]) {
  switch (status) {
    case "UPLOADING":
      return "border-white/10 bg-white/[0.05] text-white/65";
    case "PROCESSING":
      return "border-blue-400/20 bg-blue-400/[0.08] text-blue-300";
    case "READY":
      return "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300";
    case "FAILED":
      return "border-red-400/20 bg-red-400/[0.08] text-red-300";
  }
}

function StatusIcon({ status }: { status: Lecture["status"] }) {
  if (status === "READY") {
    return <CheckCircle2 className="size-3.5" aria-hidden="true" />;
  }

  if (status === "FAILED") {
    return <AlertCircle className="size-3.5" aria-hidden="true" />;
  }

  if (status === "PROCESSING") {
    return (
      <LoaderCircle
        className="size-3.5 animate-spin"
        aria-hidden="true"
      />
    );
  }

  return <UploadCloud className="size-3.5" aria-hidden="true" />;
}

function VideoThumbnail({ lecture }: { lecture: Lecture }) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (lecture.status !== "READY" && lecture.status !== "PROCESSING") {
      setThumbnail(null);
      return;
    }

    let cancelled = false;
    let video: HTMLVideoElement | null = null;

    async function generateThumbnail() {
      try {
        const response = await fetch(
          `/api/lectures/${encodeURIComponent(lecture.id)}/preview`,
          { cache: "no-store" },
        );

        if (!response.ok) return;

        const result: { url?: string } = await response.json();

        if (!result.url || cancelled) return;

        video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.playsInline = true;
        video.preload = "auto";

        const currentVideo = video;

        const captureFrame = () => {
          if (
            cancelled ||
            !currentVideo.videoWidth ||
            !currentVideo.videoHeight
          ) {
            return;
          }

          try {
            const canvas = document.createElement("canvas");
            canvas.width = currentVideo.videoWidth;
            canvas.height = currentVideo.videoHeight;

            const context = canvas.getContext("2d");

            if (!context) return;

            context.drawImage(currentVideo, 0, 0);

            const image = canvas.toDataURL("image/jpeg", 0.78);

            if (!cancelled) {
              setThumbnail(image);
            }
          } catch {
            // Some videos may not allow frame extraction.
            // The fallback thumbnail will remain visible.
          }
        };

        currentVideo.addEventListener("seeked", captureFrame, {
          once: true,
        });

        currentVideo.addEventListener("loadeddata", () => {
          if (cancelled) return;

          const duration = currentVideo.duration;

          if (Number.isFinite(duration) && duration > 0.15) {
            currentVideo.currentTime = Math.min(1, duration / 2);
          } else {
            captureFrame();
          }
        }, { once: true });

        currentVideo.src = result.url;
        currentVideo.load();
      } catch (error) {
        if (!cancelled) {
          console.error("Could not generate video thumbnail:", error);
        }
      }
    }

    void generateThumbnail();

    return () => {
      cancelled = true;

      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [lecture.id, lecture.status]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/[0.07] bg-[#111113] sm:w-44 sm:shrink-0">
      {thumbnail ? (
        <div
          role="img"
          aria-label={`Превью видео: ${lecture.title}`}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${thumbnail}")` }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/[0.055] via-[#111113] to-[#080809]">
          <div className="flex size-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
            {lecture.status === "PROCESSING" ? (
              <LoaderCircle
                className="size-5 animate-spin text-white/45"
                aria-hidden="true"
              />
            ) : (
              <Film
                className="size-5 text-white/40"
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />

      {lecture.durationMs !== null && (
        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] tabular-nums text-white/90">
          {formatDuration(lecture.durationMs)}
        </span>
      )}
    </div>
  );
}

export function Library() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState("");
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loadingLectures, setLoadingLectures] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const busy =
    status === "creating" ||
    status === "uploading" ||
    status === "finalizing";

  const loadLectures = useCallback(async () => {
    setRefreshing(true);

    try {
      const response = await fetch("/api/lectures", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Не удалось получить список лекций.");
      }

      const result: { lectures: Lecture[] } = await response.json();

      setLectures(result.lectures);
    } catch (cause) {
      console.error(cause);
    } finally {
      setLoadingLectures(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadLectures();
  }, [loadLectures]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;

    setError("");
    setStatus("idle");
    setProgress(0);

    if (!selected) {
      setFile(null);
      return;
    }

    if (
      !ACCEPTED_TYPES.has(selected.type) &&
      !ACCEPTED_EXTENSIONS.test(selected.name)
    ) {
      setFile(null);
      setError("Выберите видео в формате MP4, WebM или MOV.");
      event.target.value = "";
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setError("Максимальный размер файла — 500 МБ.");
      event.target.value = "";
      return;
    }

    if (selected.size === 0) {
      setFile(null);
      setError("Выбранный файл пуст.");
      event.target.value = "";
      return;
    }

    setFile(selected);

    if (!title.trim()) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  }

  async function uploadWithTus(
    selectedFile: File,
    storagePath: string,
    accessToken: string,
    supabaseUrl: string,
    apiKey: string,
  ) {
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

    if (!projectRef) {
      throw new Error("Не удалось определить проект Supabase.");
    }

    const endpoint =
      `https://${projectRef}.storage.supabase.co` +
      "/storage/v1/upload/resumable";

    await new Promise<void>((resolve, reject) => {
      const upload = new tus.Upload(selectedFile, {
        endpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${accessToken}`,
          apikey: apiKey,
          "x-upsert": "false",
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        chunkSize: 6 * 1024 * 1024,
        metadata: {
          bucketName: BUCKET,
          objectName: storagePath,
          contentType: selectedFile.type || "application/octet-stream",
          cacheControl: "3600",
        },
        onProgress(bytesUploaded, bytesTotal) {
          setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
        },
        onError(cause) {
          reject(cause);
        },
        onSuccess() {
          resolve();
        },
      });

      void upload
        .findPreviousUploads()
        .then((previousUploads) => {
          if (previousUploads.length > 0) {
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }

          upload.start();
        })
        .catch(reject);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file || busy) return;

    setError("");
    setProgress(0);

    try {
      setStatus("creating");

      const createResponse = await fetch("/api/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          originalName: file.name,
          mimeType: ACCEPTED_TYPES.has(file.type)
            ? file.type
            : file.name.toLowerCase().endsWith(".webm")
              ? "video/webm"
              : file.name.toLowerCase().endsWith(".mov")
                ? "video/quicktime"
                : "video/mp4",
          sizeBytes: file.size,
        }),
      });

      const createResult = await createResponse.json();

      if (!createResponse.ok) {
        throw new Error(
          createResult.error ?? "Не удалось создать лекцию.",
        );
      }

      const { lecture } = createResult as {
        lecture: { id: string; storagePath: string };
      };

      const supabase = createClient();

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.access_token) {
        throw new Error("Сессия истекла. Войдите в аккаунт заново.");
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !apiKey) {
        throw new Error("Не настроены переменные Supabase.");
      }

      setStatus("uploading");

      await uploadWithTus(
        file,
        lecture.storagePath,
        sessionData.session.access_token,
        supabaseUrl,
        apiKey,
      );

      setStatus("finalizing");

      const completeResponse = await fetch(
        `/api/lectures/${lecture.id}/complete`,
        { method: "POST" },
      );

      const completeResult = await completeResponse.json();

      if (!completeResponse.ok) {
        throw new Error(
          completeResult.error ?? "Не удалось завершить загрузку.",
        );
      }

      setStatus("success");
      setProgress(100);
      setFile(null);
      setTitle("");

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      await loadLectures();
      router.refresh();
    } catch (cause) {
      console.error("Lecture upload failed:", cause);

      setStatus("error");
      setError(
        cause instanceof Error
          ? cause.message
          : "Во время загрузки произошла ошибка.",
      );
    }
  }

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Добавить лекцию
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/55">
            Загрузите видео, чтобы подготовить его к транскрибации,
            конспектированию и семантическому поиску.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="lecture-title"
              className="mb-2 block text-sm text-white/70"
            >
              Название лекции
            </label>

            <input
              id="lecture-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="Например, Основы криптографии"
              disabled={busy}
              className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none transition placeholder:text-white/30 focus:border-white/30 disabled:opacity-50"
            />
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex min-h-36 w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-7 text-center transition hover:border-white/40 hover:bg-white/[0.04] disabled:opacity-50"
          >
            <UploadCloud className="mb-3 size-5 text-white/50" />

            <span className="max-w-full truncate text-sm font-medium">
              {file ? file.name : "Выберите видео"}
            </span>

            <span className="mt-2 text-xs text-white/45">
              MP4, WebM или MOV · до 500 МБ
            </span>

            {file && (
              <span className="mt-2 text-xs text-white/60">
                {formatSize(file.size)}
              </span>
            )}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            onChange={handleFileChange}
            disabled={busy}
            className="hidden"
          />

          {busy && (
            <div aria-live="polite" className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>
                  {status === "creating" && "Подготовка лекции…"}
                  {status === "uploading" && "Загрузка видео…"}
                  {status === "finalizing" && "Завершение загрузки…"}
                </span>

                <span>
                  {status === "uploading" ? `${progress}%` : ""}
                </span>
              </div>

              <div
                className="h-1.5 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-label="Прогресс загрузки видео"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={status === "uploading" ? progress : 0}
              >
                <div
                  className="h-full rounded-full bg-white transition-[width] duration-200"
                  style={{
                    width: `${
                      status === "uploading"
                        ? progress
                        : status === "finalizing"
                          ? 100
                          : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          {status === "success" && (
            <p role="status" className="text-sm text-emerald-400">
              Видео загружено. Лекция добавлена в очередь обработки.
            </p>
          )}

          <button
            type="submit"
            disabled={!file || busy}
            className="h-12 w-full rounded-xl bg-white px-5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "uploading"
              ? "Загружаем…"
              : status === "finalizing"
                ? "Завершаем…"
                : "Загрузить лекцию"}
          </button>
        </form>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Мои лекции
            </h2>

            <p className="mt-1 text-xs text-white/40">
              {lectures.length}{" "}
              {lectures.length === 1
                ? "лекция"
                : lectures.length >= 2 &&
                    lectures.length <= 4
                  ? "лекции"
                  : "лекций"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadLectures()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Обновить
          </button>
        </div>

        {loadingLectures ? (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 p-5 text-sm text-white/45">
            <LoaderCircle className="size-4 animate-spin" />
            Загружаем лекции…
          </div>
        ) : lectures.length === 0 ? (
          <div className="rounded-xl border border-white/10 px-5 py-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
              <Film className="size-5 text-white/40" />
            </div>

            <p className="mt-4 text-sm text-white/65">
              Пока здесь пусто
            </p>

            <p className="mt-2 text-xs text-white/40">
              Первая загруженная лекция появится здесь.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lectures.map((lecture) => {
            const canOpen = lecture.status === "READY";

  return (
    <article
      key={lecture.id}
      role={canOpen ? "link" : undefined}
      tabIndex={canOpen ? 0 : undefined}
      onClick={() => {
        if (canOpen) {
          router.push(`/lectures/${lecture.id}`);
        }
      }}
      onKeyDown={(event) => {
        if (
          canOpen &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          router.push(`/lectures/${lecture.id}`);
        }
      }}
      aria-label={
        canOpen
          ? `Открыть лекцию: ${lecture.title}`
          : undefined
      }
      className={`group rounded-xl border border-white/[0.09] bg-white/[0.02] p-3 transition hover:border-white/[0.16] hover:bg-white/[0.035] sm:p-4 ${
        canOpen
          ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70"
          : "cursor-default"
      }`}
    >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <VideoThumbnail lecture={lecture} />

                  <div className="min-w-0 flex-1">
                    <h3
                      title={lecture.title}
                      className="truncate text-sm font-medium text-white/90"
                    >
                      {lecture.title}
                    </h3>

                    <p
                      title={lecture.originalName ?? "Видео"}
                      className="mt-1 truncate text-xs text-white/45"
                    >
                      {lecture.originalName ?? "Видео"}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-white/35">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="size-3" aria-hidden="true" />
                        {formatDate(lecture.createdAt)}
                      </span>

                      <span>{formatSize(lecture.sizeBytes)}</span>

                      {lecture.durationMs !== null &&
                        formatDuration(lecture.durationMs) && (
                          <span>
                            {formatDuration(lecture.durationMs)}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.07] pt-3 sm:flex-col sm:items-end sm:justify-center sm:border-0 sm:pt-0">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium ${getStatusStyles(lecture.status)}`}
                    >
                      <StatusIcon status={lecture.status} />
                      {getStatusLabel(lecture.status)}
                    </span>

                    <ChevronRight
                      className="size-4 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-white/60"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </article>
            );
})}
          </div>
        )}
      </div>
    </section>
  );
}
