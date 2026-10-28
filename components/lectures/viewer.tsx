"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type SyntheticEvent,
} from "react";
import {
  ArrowLeft,
  Check,
  Clock3,
  FileVideo,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Header } from "../ui/header";

type Lecture = {
  id: string;
  title: string;
  description: string | null;
  originalName: string | null;
  createdAt: string;
  durationMs: number | null;
  sizeBytes: string | null;
  uploader: string;
  videoUrl: string;
};

type TranscriptSegment = {
  id: string;
  position: number;
  startMs: number;
  endMs: number;
  text: string;
};

type Props = {
  lecture: Lecture;
  transcript: TranscriptSegment[];
};

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatSize(bytes: string | null) {
  if (bytes === null) return "Размер неизвестен";

  const value = Number(bytes);

  if (!Number.isFinite(value) || value < 0) {
    return "Размер неизвестен";
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(0)} КБ`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} МБ`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Дата неизвестна";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getNextPlaybackRate(currentRate: number) {
  const currentIndex = PLAYBACK_RATES.indexOf(currentRate);

  return PLAYBACK_RATES[
    (currentIndex + 1) % PLAYBACK_RATES.length
  ];
}

export function LectureViewer({ lecture, transcript }: Props) {
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const transcriptPanelRef = useRef<HTMLDivElement>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(lecture.durationMs ?? 0);
  const [playing, setPlaying] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [previewTime, setPreviewTime] = useState<number | null>(null);
  const [previewPosition, setPreviewPosition] = useState(50);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [query, setQuery] = useState("");

  const activeSegment = useMemo(() => {
    return (
      transcript.find(
        (segment) =>
          currentTime >= segment.startMs && currentTime < segment.endMs,
      )?.id ?? null
    );
  }, [currentTime, transcript]);

  const visibleSegments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru");

    if (!normalizedQuery) return transcript;

    return transcript.filter((segment) =>
      segment.text.toLocaleLowerCase("ru").includes(normalizedQuery),
    );
  }, [query, transcript]);

  const progress =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  useEffect(() => {
    if (!activeSegment || query.trim()) return;

    const panel = transcriptPanelRef.current;
    const activeElement = panel?.querySelector(
      `[data-segment-id="${activeSegment}"]`,
    );

    if (panel && activeElement) {
      const panelRect = panel.getBoundingClientRect();
      const elementRect = activeElement.getBoundingClientRect();

      if (
        elementRect.top < panelRect.top ||
        elementRect.bottom > panelRect.bottom
      ) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [activeSegment, query]);

  useEffect(() => {
    function handleFullscreenChange() {
      setFullscreen(
        document.fullscreenElement === playerRef.current,
      );
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  function revealControls() {
    setControlsVisible(true);
  }

  function handleProgressPointerMove(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (event.pointerType === "touch" || duration <= 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const previewVideo = previewVideoRef.current;

    if (!previewVideo || rect.width <= 0) return;

    const position = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width),
    );
    const targetMs = Math.round(position * duration);

    setPreviewTime(targetMs);
    setPreviewPosition(position * 100);

    if (previewVideo.readyState >= 1 && !previewVideo.seeking) {
      const targetSeconds = targetMs / 1000;

      if (Math.abs(previewVideo.currentTime - targetSeconds) > 0.35) {
        setPreviewImage(null);
        try {
          previewVideo.currentTime = targetSeconds;
        } catch {
          // The preview is optional; seeking failures do not affect playback.
        }
      }
    }
  }

  function handlePreviewMetadata() {
    const previewVideo = previewVideoRef.current;

    if (!previewVideo || previewTime === null) return;

    const targetSeconds = previewTime / 1000;

    if (Math.abs(previewVideo.currentTime - targetSeconds) > 0.35) {
      try {
        previewVideo.currentTime = targetSeconds;
      } catch {
        // Ignore unsupported preview seeking.
      }
    }
  }

  function handlePreviewSeeked() {
    const previewVideo = previewVideoRef.current;
    const canvas = previewCanvasRef.current;

    if (!previewVideo || !canvas || previewVideo.readyState < 2) return;

    // If the pointer moved while the browser was seeking, request the newest frame.
    if (previewTime !== null) {
      const requestedTime = previewTime / 1000;
      if (
        !previewVideo.seeking &&
        Math.abs(previewVideo.currentTime - requestedTime) > 0.5
      ) {
        try {
          previewVideo.currentTime = requestedTime;
        } catch {
          // Keep the last available preview.
        }
        return;
      }
    }

    try {
      const context = canvas.getContext("2d");
      if (!context) return;

      const width = 160;
      const height = 90;

      canvas.width = width;
      canvas.height = height;
      context.drawImage(previewVideo, 0, 0, width, height);
      setPreviewImage(canvas.toDataURL("image/jpeg", 0.78));
    } catch (error) {
      // Storage must permit cross-origin canvas access for frame previews.
      console.warn("Could not generate video preview:", error);
      setPreviewImage(null);
    }
  }

  function handleTimeUpdate(event: SyntheticEvent<HTMLVideoElement>) {
    setCurrentTime(
      Math.round(event.currentTarget.currentTime * 1000),
    );
  }

  function handleLoadedMetadata(
    event: SyntheticEvent<HTMLVideoElement>,
  ) {
    const videoDuration = event.currentTarget.duration;

    if (Number.isFinite(videoDuration)) {
      setDuration(Math.round(videoDuration * 1000));
    }

    setVolume(event.currentTarget.volume);
    setMuted(event.currentTarget.muted);
  }

  async function togglePlayback() {
    const video = videoRef.current;

    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
      } catch (error) {
        console.error("Video playback failed:", error);
        setPlaying(false);
        setControlsVisible(true);
      }
    } else {
      video.pause();
    }
  }

  function seekTo(milliseconds: number) {
    const video = videoRef.current;

    if (!video) return;

    const limit =
      Number.isFinite(video.duration) && video.duration > 0
        ? video.duration * 1000
        : duration;

    const nextTime = Math.max(
      0,
      Math.min(milliseconds, limit || milliseconds),
    );

    video.currentTime = nextTime / 1000;
    setCurrentTime(Math.round(nextTime));
  }

  function skipBy(seconds: number) {
    const video = videoRef.current;

    if (!video) return;

    seekTo(video.currentTime * 1000 + seconds * 1000);
    revealControls();
  }

  function handlePlay() {
    setPlaying(true);
    setControlsVisible(true);
  }

  function handlePause() {
    setPlaying(false);
    setControlsVisible(true);
  }

  function handleEnded() {
    setPlaying(false);
    setControlsVisible(true);
  }

  function toggleMute() {
    const video = videoRef.current;

    if (!video) return;

    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function changeVolume(nextVolume: number) {
    const video = videoRef.current;

    if (!video) return;

    const normalizedVolume = Math.max(0, Math.min(1, nextVolume));

    video.volume = normalizedVolume;
    video.muted = normalizedVolume === 0;

    setVolume(normalizedVolume);
    setMuted(video.muted);
  }

  function changePlaybackRate() {
    const video = videoRef.current;

    if (!video) return;

    const nextRate = getNextPlaybackRate(playbackRate);

    video.playbackRate = nextRate;
    setPlaybackRate(nextRate);
    revealControls();
  }

  async function toggleFullscreen() {
    const player = playerRef.current;

    if (!player) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await player.requestFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen toggle failed:", error);
    }
  }

  function handlePlayerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      event.target instanceof HTMLElement &&
      (event.target.tagName === "INPUT" ||
        event.target.tagName === "BUTTON" ||
        event.target.tagName === "SELECT")
    ) {
      return;
    }

    switch (event.key) {
      case " ":
      case "k":
      case "K":
        event.preventDefault();
        void togglePlayback();
        break;

      case "ArrowLeft":
        event.preventDefault();
        skipBy(-5);
        break;

      case "ArrowRight":
        event.preventDefault();
        skipBy(5);
        break;

      case "ArrowUp":
        event.preventDefault();
        changeVolume(Math.min(1, volume + 0.05));
        break;

      case "ArrowDown":
        event.preventDefault();
        changeVolume(Math.max(0, volume - 0.05));
        break;

      case "m":
      case "M":
        event.preventDefault();
        toggleMute();
        break;

      case "f":
      case "F":
        event.preventDefault();
        void toggleFullscreen();
        break;
    }
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <Header />

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-7 lg:px-8 lg:py-8 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="min-w-0">
          {/* Кастомный видеоплеер Solace */}
          <div
            ref={playerRef}
            onMouseEnter={() => setControlsVisible(true)}
            onMouseMove={revealControls}
            onMouseLeave={() => {
              setControlsVisible(false);
              setPreviewTime(null);
              setPreviewImage(null);
            }}
            onTouchStart={() => setControlsVisible(true)}
            onFocusCapture={() => setControlsVisible(true)}
            onKeyDown={handlePlayerKeyDown}
            tabIndex={0}
            aria-label="Видеоплеер Solace. Пробел — воспроизведение, стрелки — перемотка, M — звук, F — полный экран."
            className={`group/player relative isolate overflow-hidden border border-white/[0.09] bg-black shadow-2xl shadow-black/30 outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${
              fullscreen
                ? "fixed inset-0 z-[100] flex flex-col rounded-none"
                : "rounded-2xl"
            }`}
          >
            <div
              className={`relative flex items-center justify-center bg-black ${
                fullscreen ? "min-h-0 flex-1" : "aspect-video"
              }`}
            >
              <video
                ref={videoRef}
                src={lecture.videoUrl}
                playsInline
                preload="metadata"
                onClick={() => void togglePlayback()}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                onVolumeChange={(event) => {
                  setVolume(event.currentTarget.volume);
                  setMuted(event.currentTarget.muted);
                }}
                className={`block bg-black ${
                  fullscreen
                    ? "h-full w-full object-contain"
                    : "aspect-video w-full object-contain"
                }`}
              />

              {/* Отдельный скрытый поток используется только для превью кадров. */}
              <video
                ref={previewVideoRef}
                src={lecture.videoUrl}
                crossOrigin="anonymous"
                preload="metadata"
                muted
                playsInline
                aria-hidden="true"
                tabIndex={-1}
                onLoadedMetadata={handlePreviewMetadata}
                onSeeked={handlePreviewSeeked}
                className="pointer-events-none absolute left-0 top-0 -z-10 size-px opacity-0"
              />
              <canvas
                ref={previewCanvasRef}
                aria-hidden="true"
                className="hidden"
              />

              {/* Центральная кнопка воспроизведения */}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void togglePlayback();
                }}
                aria-label={playing ? "Приостановить видео" : "Воспроизвести видео"}
                className={`absolute left-1/2 top-1/2 z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white shadow-xl backdrop-blur-md transition duration-300 hover:scale-105 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:size-[68px] ${
                  controlsVisible && !playing
                    ? "scale-100 opacity-100"
                    : "pointer-events-none scale-90 opacity-0"
                }`}
              >
                <Play className="ml-1 size-6 fill-current sm:size-7" />
              </button>

              {/* Затемнение для читаемости контролов поверх кадра */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-t from-black/90 via-black/45 to-transparent transition-opacity duration-300 ${
                  controlsVisible ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Бренд в верхнем углу также появляется только при наведении */}
              <div
                className={`pointer-events-none absolute left-4 top-4 z-20 transition-opacity duration-300 sm:left-5 sm:top-5 ${
                  controlsVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                <h3 className="mt-3 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
              {lecture.title}
            </h3>
              </div>

              {/* Все контролы находятся поверх видео */}
              <div
                className={`absolute inset-x-0 bottom-0 z-20 px-3 pb-3 pt-12 transition-all duration-300 sm:px-5 sm:pb-4 sm:pt-16 ${
                  controlsVisible
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0"
                }`}
              >
                {/* Прогресс-бар с превью кадров */}
                <div
                  className="group/progress relative flex h-8 items-center"
                  onPointerMove={handleProgressPointerMove}
                  onPointerLeave={() => {
                    setPreviewTime(null);
                    setPreviewImage(null);
                  }}
                >
                  {previewTime !== null && controlsVisible && (
                    <div
                      className="pointer-events-none absolute bottom-full z-30 mb-2 w-40 overflow-hidden rounded-xl border border-white/15 bg-[#111113] shadow-2xl shadow-black/50"
                      style={{
                        left: `${Math.max(12, Math.min(88, previewPosition))}%`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      <div className="relative aspect-video bg-black">
                        {previewImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewImage}
                            alt={`Кадр на отметке ${formatTime(previewTime)}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Play className="size-5 text-white/35" />
                          </div>
                        )}
                      </div>
                      <div className="px-2.5 py-1.5 text-center text-[11px] font-medium tabular-nums text-white/85">
                        {formatTime(previewTime)}
                      </div>
                    </div>
                  )}

                  <div className="pointer-events-none absolute left-0 right-0 h-1 overflow-hidden rounded-full bg-white/25 transition-[height] duration-150 group-hover/progress:h-1.5">
                    <div
                      className="h-full rounded-full bg-white/95 transition-[width] duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute z-[1] size-2.5 -translate-x-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/progress:opacity-100"
                    style={{ left: `${progress}%` }}
                  />

                  <input
                    type="range"
                    min={0}
                    max={Math.max(duration, 1)}
                    step={100}
                    value={Math.min(currentTime, Math.max(duration, 1))}
                    onChange={(event) => seekTo(Number(event.target.value))}
                    aria-label="Перемотка видео"
                    aria-valuetext={`${formatTime(currentTime)} из ${formatTime(duration)}`}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent accent-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                  />
                </div>

                <div className="-mt-0.5 mb-2 flex items-center justify-between text-[10px] font-medium tabular-nums text-white/65 sm:mb-3 sm:text-[11px]">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-3">
                  {/* Левая группа контролов */}
                  <div className="flex min-w-0 items-center justify-start gap-0.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => void togglePlayback()}
                      aria-label={playing ? "Пауза" : "Воспроизвести"}
                      title={playing ? "Пауза" : "Воспроизвести"}
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/95 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:size-10"
                    >
                      {playing ? (
                        <Pause className="size-[19px] fill-current" />
                      ) : (
                        <Play className="ml-0.5 size-[19px] fill-current" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => skipBy(-10)}
                      aria-label="Назад на 10 секунд"
                      title="Назад на 10 секунд"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:size-9"
                    >
                      <RotateCcw className="size-[17px]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => skipBy(10)}
                      aria-label="Вперёд на 10 секунд"
                      title="Вперёд на 10 секунд"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:size-9"
                    >
                      <RotateCw className="size-[17px]" />
                    </button>

                    <button
                      type="button"
                      onClick={toggleMute}
                      aria-label={muted || volume === 0 ? "Включить звук" : "Выключить звук"}
                      title={muted || volume === 0 ? "Включить звук" : "Выключить звук"}
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:ml-1 sm:size-9"
                    >
                      {muted || volume === 0 ? (
                        <VolumeX className="size-[18px]" />
                      ) : (
                        <Volume2 className="size-[18px]" />
                      )}
                    </button>

                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={muted ? 0 : volume}
                      onChange={(event) => changeVolume(Number(event.target.value))}
                      aria-label="Громкость"
                      className="hidden h-1 w-16 cursor-pointer accent-white sm:block lg:w-20"
                    />
                  </div>

                  {/* Логотип строго по центру поверх видео */}
                  <Link
                    href="/dashboard"
                    aria-label="Solace — мои лекции"
                    title="Solace"
                    className="justify-self-center rounded-md px-2 py-1 text-[11px] font-semibold tracking-[0.2em] text-white/85 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:px-4 sm:text-xs sm:tracking-[0.28em]"
                  >
                    <svg width="85" height="29" viewBox="0 0 85 29" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 10.0501H5.07001C5.63335 10.0501 6.08401 10.5008 6.08401 11.0641C6.08401 11.6274 5.63335 12.0781 5.07001 12.0781H0C0.187778 14.6319 2.32845 16.6223 4.91979 16.6223H5.10757C5.6709 16.6223 6.12157 17.073 6.12157 17.6363C6.12157 18.1997 5.6709 18.6503 5.10757 18.6503H4.91979C2.32845 18.6503 0.187778 20.6408 0 23.1946H13.4825C16.0738 23.1946 18.2145 21.2041 18.4023 18.6503H13.3323C12.7689 18.6503 12.3182 18.1997 12.3182 17.6363C12.3182 17.073 12.7689 16.6223 13.3323 16.6223H18.4023C18.2145 14.0685 16.0738 12.0781 13.4825 12.0781H13.2947C12.7314 12.0781 12.2807 11.6274 12.2807 11.0641C12.2807 10.5008 12.7314 10.0501 13.2947 10.0501H13.4825C16.0738 10.0501 18.2145 8.05964 18.4023 5.50586H4.91979C2.32845 5.50586 0.187778 7.49631 0 10.0501Z" fill="white"/>
                    <path d="M32.0022 10.1012C31.9014 9.25021 31.4927 8.5896 30.7761 8.11933C30.0595 7.64906 29.1806 7.41392 28.1392 7.41392C27.3779 7.41392 26.7116 7.53709 26.1406 7.78342C25.5752 8.02975 25.1329 8.36846 24.8138 8.79954C24.5003 9.23062 24.3435 9.72048 24.3435 10.2691C24.3435 10.7282 24.4527 11.1229 24.671 11.4532C24.8949 11.7779 25.1805 12.0494 25.5276 12.2678C25.8747 12.4805 26.2386 12.6569 26.6193 12.7968C27 12.9312 27.3499 13.0404 27.669 13.1243L29.4157 13.5946C29.8636 13.7122 30.3618 13.8745 30.9105 14.0817C31.4647 14.2888 31.9938 14.5715 32.4976 14.9298C33.0071 15.2825 33.427 15.736 33.7573 16.2903C34.0876 16.8445 34.2528 17.5247 34.2528 18.3309C34.2528 19.2602 34.0092 20.1 33.5222 20.8502C33.0407 21.6004 32.3353 22.1966 31.4059 22.6389C30.4822 23.0812 29.3597 23.3023 28.0385 23.3023C26.8068 23.3023 25.7403 23.1036 24.839 22.7061C23.9432 22.3086 23.2378 21.7543 22.7227 21.0433C22.2133 20.3323 21.925 19.5066 21.8578 18.566H24.0076C24.0636 19.2154 24.2819 19.7529 24.6626 20.1784C25.0489 20.5983 25.536 20.9118 26.1238 21.1189C26.7172 21.3205 27.3555 21.4212 28.0385 21.4212C28.8335 21.4212 29.5473 21.2925 30.1799 21.0349C30.8125 20.7718 31.3136 20.4079 31.6831 19.9432C32.0526 19.473 32.2373 18.9243 32.2373 18.2973C32.2373 17.7263 32.0778 17.2616 31.7586 16.9033C31.4395 16.545 31.0196 16.2539 30.499 16.0299C29.9783 15.806 29.4157 15.61 28.8111 15.4421L26.6948 14.8375C25.3512 14.4512 24.2875 13.8997 23.5037 13.1831C22.7199 12.4665 22.3281 11.5288 22.3281 10.3699C22.3281 9.40697 22.5884 8.5672 23.109 7.8506C23.6353 7.1284 24.3407 6.56856 25.2253 6.17107C26.1154 5.76798 27.1091 5.56643 28.2064 5.56643C29.3149 5.56643 30.3002 5.76518 31.1624 6.16267C32.0246 6.55456 32.7076 7.09201 33.2114 7.77502C33.7209 8.45803 33.9896 9.23342 34.0176 10.1012H32.0022ZM40.2835 23.2687C39.1191 23.2687 38.0973 22.9916 37.2184 22.4374C36.345 21.8831 35.662 21.1077 35.1694 20.1112C34.6823 19.1147 34.4388 17.9502 34.4388 16.6178C34.4388 15.2741 34.6823 14.1013 35.1694 13.0991C35.662 12.097 36.345 11.3188 37.2184 10.7646C38.0973 10.2103 39.1191 9.93322 40.2835 9.93322C41.448 9.93322 42.4669 10.2103 43.3403 10.7646C44.2192 11.3188 44.9023 12.097 45.3893 13.0991C45.882 14.1013 46.1283 15.2741 46.1283 16.6178C46.1283 17.9502 45.882 19.1147 45.3893 20.1112C44.9023 21.1077 44.2192 21.8831 43.3403 22.4374C42.4669 22.9916 41.448 23.2687 40.2835 23.2687ZM40.2835 21.4884C41.1681 21.4884 41.8959 21.2617 42.4669 20.8082C43.038 20.3547 43.4607 19.7585 43.735 19.0195C44.0093 18.2805 44.1465 17.4799 44.1465 16.6178C44.1465 15.7556 44.0093 14.9522 43.735 14.2076C43.4607 13.463 43.038 12.8612 42.4669 12.4021C41.8959 11.9431 41.1681 11.7135 40.2835 11.7135C39.399 11.7135 38.6712 11.9431 38.1001 12.4021C37.5291 12.8612 37.1064 13.463 36.8321 14.2076C36.5578 14.9522 36.4206 15.7556 36.4206 16.6178C36.4206 17.4799 36.5578 18.2805 36.8321 19.0195C37.1064 19.7585 37.5291 20.3547 38.1001 20.8082C38.6712 21.2617 39.399 21.4884 40.2835 21.4884ZM48.7706 5.80157V23H46.7888V5.80157H48.7706ZM53.8315 23.3023C53.0141 23.3023 52.2723 23.1484 51.6061 22.8404C50.9399 22.5269 50.4109 22.0763 50.019 21.4884C49.6271 20.895 49.4311 20.1784 49.4311 19.3386C49.4311 18.5996 49.5767 18.0006 49.8678 17.5415C50.1589 17.0768 50.548 16.7129 51.0351 16.4498C51.5221 16.1867 52.0596 15.9907 52.6474 15.862C53.2409 15.7276 53.8371 15.6212 54.4361 15.5429C55.2199 15.4421 55.8553 15.3665 56.3424 15.3161C56.8351 15.2601 57.1934 15.1678 57.4173 15.039C57.6468 14.9102 57.7616 14.6863 57.7616 14.3672V14.3C57.7616 13.4714 57.5349 12.8276 57.0814 12.3685C56.6335 11.9095 55.9533 11.6799 55.0408 11.6799C54.0946 11.6799 53.3528 11.8871 52.8154 12.3014C52.2779 12.7157 51.9 13.1579 51.6817 13.6282L49.8006 12.9564C50.1365 12.1726 50.5844 11.5624 51.1442 11.1257C51.7097 10.6834 52.3255 10.3755 52.9917 10.2019C53.6635 10.0228 54.3242 9.93322 54.9736 9.93322C55.3879 9.93322 55.8637 9.98361 56.4012 10.0844C56.9442 10.1796 57.4677 10.3783 57.9716 10.6806C58.481 10.9829 58.9037 11.4392 59.2396 12.0494C59.5755 12.6597 59.7435 13.477 59.7435 14.5016V23H57.7616V21.2533H57.6608C57.5265 21.5332 57.3025 21.8327 56.989 22.1518C56.6755 22.4709 56.2584 22.7425 55.7378 22.9664C55.2171 23.1903 54.5817 23.3023 53.8315 23.3023ZM54.1338 21.522C54.9176 21.522 55.5782 21.3681 56.1157 21.0601C56.6587 20.7522 57.0674 20.3547 57.3417 19.8677C57.6217 19.3806 57.7616 18.8683 57.7616 18.3309V16.517C57.6776 16.6178 57.4929 16.7101 57.2074 16.7941C56.9274 16.8725 56.6027 16.9425 56.2332 17.0041C55.8693 17.06 55.5138 17.1104 55.1667 17.1552C54.8252 17.1944 54.5481 17.228 54.3354 17.256C53.8203 17.3232 53.3388 17.4323 52.891 17.5835C52.4487 17.7291 52.0904 17.9502 51.8161 18.2469C51.5473 18.538 51.413 18.9355 51.413 19.4394C51.413 20.128 51.6677 20.6487 52.1772 21.0014C52.6922 21.3485 53.3444 21.522 54.1338 21.522ZM66.2361 23.2687C65.0269 23.2687 63.9855 22.9832 63.1122 22.4122C62.2388 21.8411 61.567 21.0545 61.0967 20.0524C60.6265 19.0503 60.3913 17.9054 60.3913 16.6178C60.3913 15.3077 60.6321 14.1517 61.1135 13.1495C61.6006 12.1418 62.278 11.3552 63.1458 10.7898C64.0191 10.2187 65.0381 9.93322 66.2025 9.93322C67.1095 9.93322 67.9268 10.1012 68.6546 10.4371C69.3824 10.773 69.9787 11.2433 70.4434 11.8479C70.908 12.4525 71.1963 13.1579 71.3083 13.9641H69.3265C69.1753 13.3763 68.8394 12.8556 68.3187 12.4021C67.8037 11.9431 67.1095 11.7135 66.2361 11.7135C65.4635 11.7135 64.7861 11.9151 64.2039 12.3182C63.6272 12.7157 63.1766 13.2783 62.8519 14.0061C62.5327 14.7283 62.3732 15.5765 62.3732 16.5506C62.3732 17.5471 62.5299 18.4149 62.8435 19.1539C63.1626 19.8929 63.6104 20.4667 64.1871 20.8754C64.7693 21.2841 65.4523 21.4884 66.2361 21.4884C66.7512 21.4884 67.2186 21.3988 67.6385 21.2197C68.0584 21.0405 68.4139 20.783 68.705 20.4471C68.9962 20.1112 69.2033 19.7081 69.3265 19.2378H71.3083C71.1963 19.9992 70.9192 20.685 70.4769 21.2953C70.0403 21.8999 69.4608 22.3814 68.7386 22.7397C68.022 23.0924 67.1879 23.2687 66.2361 23.2687ZM77.2488 23.2687C76.006 23.2687 74.9339 22.9944 74.0325 22.4458C73.1368 21.8915 72.4454 21.1189 71.9583 20.128C71.4768 19.1315 71.2361 17.9726 71.2361 16.6514C71.2361 15.3301 71.4768 14.1656 71.9583 13.1579C72.4454 12.1446 73.1228 11.3552 73.9905 10.7898C74.8639 10.2187 75.8828 9.93322 77.0473 9.93322C77.7191 9.93322 78.3825 10.0452 79.0375 10.2691C79.6926 10.4931 80.2888 10.857 80.8262 11.3608C81.3637 11.8591 81.792 12.5197 82.1111 13.3427C82.4302 14.1656 82.5897 15.179 82.5897 16.3826V17.2224H72.6469V15.5093H80.5743C80.5743 14.7815 80.4287 14.1321 80.1376 13.561C79.8521 12.99 79.4434 12.5393 78.9116 12.209C78.3853 11.8787 77.7639 11.7135 77.0473 11.7135C76.2579 11.7135 75.5749 11.9095 74.9982 12.3014C74.4272 12.6877 73.9877 13.1915 73.6798 13.8129C73.3719 14.4344 73.2179 15.1006 73.2179 15.8116V16.9537C73.2179 17.9278 73.3859 18.7536 73.7218 19.431C74.0633 20.1028 74.5364 20.6151 75.141 20.9678C75.7456 21.3149 76.4482 21.4884 77.2488 21.4884C77.7695 21.4884 78.2397 21.4156 78.6596 21.2701C79.0851 21.1189 79.4518 20.895 79.7597 20.5983C80.0676 20.2959 80.3056 19.9209 80.4735 19.473L82.3882 20.0104C82.1867 20.6598 81.8479 21.2309 81.3721 21.7236C80.8962 22.2106 80.3084 22.5913 79.6086 22.8656C78.9088 23.1344 78.1222 23.2687 77.2488 23.2687Z" fill="white"/>
                    </svg>

                  </Link>

                  {/* Правая группа контролов */}
                  <div className="flex min-w-0 items-center justify-end gap-0.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={changePlaybackRate}
                      aria-label={`Скорость воспроизведения ${playbackRate}x. Нажми, чтобы изменить`}
                      title={`Скорость: ${playbackRate}×`}
                      className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg px-1.5 text-[11px] font-medium tabular-nums text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:min-w-10 sm:px-2 sm:text-xs"
                    >
                      {playbackRate}×
                    </button>

                    <button
                      type="button"
                      onClick={() => void toggleFullscreen()}
                      aria-label={fullscreen ? "Выйти из полного экрана" : "Полный экран"}
                      title={fullscreen ? "Выйти из полного экрана" : "Полный экран"}
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:size-10"
                    >
                      {fullscreen ? (
                        <Minimize2 className="size-[18px]" />
                      ) : (
                        <Maximize2 className="size-[18px]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Информация о лекции */}
          <div className="mt-5">

            <h1 className="mt-3 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
              {lecture.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/[0.08] pb-5 text-xs text-white/45">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3.5" />
                Загружено {formatDate(lecture.createdAt)}
              </span>

              <span className="text-white/20">/</span>

              <span className="max-w-full truncate">
                {lecture.uploader}
              </span>
            </div>

            <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
              <h2 className="text-sm font-medium">Описание</h2>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/55">
                {lecture.description?.trim() ||
                  "Описание для этой лекции пока не добавлено."}
              </p>
            </div>
          </div>
        </section>

        {/* Панель расшифровки */}
        <aside className="flex min-h-[520px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.02] lg:sticky lg:top-20 lg:h-[calc(100vh-112px)] lg:min-h-0">
          <div className="border-b border-white/[0.08] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Расшифровка
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  {transcript.length} фрагментов · нажми на время для перехода
                </p>
              </div>

              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035]">
                <Volume2 className="size-4 text-white/65" />
              </span>
            </div>

            <label className="mt-4 flex h-10 items-center gap-2 rounded-lg border border-white/[0.09] bg-black/20 px-3 transition focus-within:border-white/20">
              <Search className="size-4 shrink-0 text-white/35" />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Найти в расшифровке…"
                aria-label="Поиск по расшифровке"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-xs text-white/45 transition hover:text-white"
                >
                  Очистить
                </button>
              )}
            </label>
          </div>

          <div
            ref={transcriptPanelRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4"
          >
            {transcript.length === 0 ? (
              <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                <FileVideo className="size-8 text-white/20" />

                <p className="mt-3 text-sm text-white/55">
                  Расшифровка пока пуста
                </p>

                <p className="mt-1 max-w-[240px] text-xs leading-5 text-white/35">
                  Для этой лекции не найдено ни одного текстового фрагмента.
                </p>
              </div>
            ) : visibleSegments.length === 0 ? (
              <div className="py-10 text-center">
                <Search className="mx-auto size-5 text-white/25" />

                <p className="mt-3 text-sm text-white/55">
                  Ничего не найдено
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Попробуй изменить поисковый запрос.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {visibleSegments.map((segment, index) => {
                  const active = segment.id === activeSegment;

                  return (
                    <div
                      key={segment.id}
                      id={`segment-${segment.id}`}
                      data-segment-id={segment.id}
                      className={`group rounded-xl p-3 transition-colors duration-300 ${
                        active
                          ? "border border-blue-400/20 bg-blue-400/[0.07]"
                          : "border border-transparent hover:bg-white/[0.035]"
                      }`}
                      style={{
                        animation: "solace-segment-enter 400ms ease both",
                        animationDelay: `${Math.min(index, 12) * 25}ms`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => seekTo(segment.startMs)}
                          title={`Перейти к ${formatTime(segment.startMs)}`}
                          className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium tabular-nums transition ${
                            active
                              ? "bg-blue-400/10 text-blue-300"
                              : "text-white/35 hover:bg-white/[0.06] hover:text-white/80"
                          }`}
                        >
                          {active && playing ? (
                            <Pause className="size-3" />
                          ) : (
                            <Play className="size-3" />
                          )}

                          {formatTime(segment.startMs)}
                        </button>

                        <p
                          className={`min-w-0 flex-1 text-[13px] leading-6 transition-colors duration-300 ${
                            active ? "text-white" : "text-white/65"
                          }`}
                        >
                          {segment.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.08] p-3 sm:px-4">
            <div className="mb-2 flex items-center justify-between text-[11px] text-white/35">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-blue-400 transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-2 text-center text-[10px] text-white/25">
              {query
                ? `${visibleSegments.length} совпадений`
                : ""}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}