"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Upload, Play, Clock3, Sparkles, BookOpen, ChevronRight, FileVideo, CircleHelp, ArrowUpRight, ListVideo, Captions, X, Check, LoaderCircle, Command, Menu } from "lucide-react";
import { demoLecture } from "@/lib/demo";
import type { Lecture, Segment } from "@/lib/types";

const fmt = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;

export default function Home() {
  const [lecture, setLecture] = useState<Lecture>(demoLecture);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(Segment & { score: number })[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);
  const [tab, setTab] = useState<"search" | "summary" | "transcript">("search");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [customTranscript, setCustomTranscript] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const currentSegment = useMemo(() => lecture.transcript.find(s => active >= s.start && active < s.end) ?? lecture.transcript[0], [lecture, active]);
  const videoSource = lecture.source.startsWith("blob:") ? lecture.source : "";
  const doSearch = async (text = query) => {
    if (!text.trim()) { setResults([]); return; }
    setSearching(true); setTab("search");
    try {
      if (lecture.id !== demoLecture.id) {
        const terms = text.toLocaleLowerCase("ru").split(/[^\p{L}\p{N}²]+/u).filter(t => t.length > 1);
        const ranked = lecture.transcript.map(s => {
          const content = s.text.toLocaleLowerCase("ru");
          const score = terms.reduce((sum, term) => sum + (content.includes(term) ? 1 + Math.min(term.length / 10, 1) : 0), 0);
          return { ...s, score: Number((score / Math.max(terms.length, 1)).toFixed(3)) };
        }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
        setResults(ranked);
      } else {
        const res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: text }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResults(data.results ?? []);
      }
    } catch (e: any) {
      setNotice(e.message || "Поиск не выполнен.");
      setResults([]);
    } finally { setSearching(false); }
  };
  const jumpTo = (time: number) => {
    setActive(time);
    if (videoRef.current) { videoRef.current.currentTime = time; videoRef.current.play().catch(() => {}); }
  };
  const uploadFile = async (file?: File) => {
    if (!file) return;
    setNotice("");
    const url = URL.createObjectURL(file);
    setLecture({ ...demoLecture, id: `upload-${Date.now()}`, title: file.name.replace(/\.[^.]+$/, ""), source: url });
    setActive(0); setResults([]);
    if (!process.env.NEXT_PUBLIC_DEMO_ONLY) {
      setBusy(true);
      const form = new FormData(); form.append("file", file);
      try {
        const r = await fetch("/api/transcribe", { method: "POST", body: form });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Не удалось расшифровать файл.");
        setLecture(prev => ({ ...prev, id: data.id, title: data.title, duration: data.duration, transcript: data.transcript, summary: "", outline: [], keywords: [], source: url }));
        setNotice("Видео загружено и транскрибировано. Теперь можно искать по содержанию.");
      } catch (e: any) {
        setNotice(`${e.message} Видео доступно в плеере; можно вставить текст расшифровки ниже.`);
      } finally { setBusy(false); }
    }
    setShowUpload(false);
  };
  const applyTranscript = () => {
    const chunks = customTranscript.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
    const transcript = chunks.map((text, i) => ({ id: `manual-${i}`, start: i * 12, end: i * 12 + 12, text }));
    setLecture(prev => ({ ...prev, transcript, duration: transcript.length * 12, summary: "", outline: [] }));
    setNotice("Текст добавлен. Поиск и переходы по таймкодам доступны для созданных фрагментов.");
    setCustomTranscript("");
  };
  const generateSummary = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transcript: lecture.transcript.map(s => s.text).join(" ") }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setLecture(prev => ({ ...prev, summary: data.summary }));
      setTab("summary");
    } catch (e: any) { setNotice(e.message || "Не удалось создать конспект."); }
    finally { setBusy(false); }
  };
  const urlEmbed = (url: string) => {
    const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)?.[1];
    if (id) { setNotice("YouTube-видео открыто в отдельном плеере. Для синхронизации таймкодов загрузите файл или добавьте расшифровку."); setLecture(prev => ({ ...prev, title: "YouTube-лекция", source: `https://www.youtube-nocookie.com/embed/${id}`, id: `youtube-${id}` })); setShowUpload(false); }
    else setNotice("Пока поддерживаются ссылки YouTube формата youtube.com/watch?v=… и youtu.be/…");
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles size={19}/></div><span>lecture<span className="brand-light">mind</span></span><span className="beta">BETA</span></div>
        <div className="side-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
        <button className="nav-item active"><BookOpen size={17}/> Мои лекции <span className="nav-count">1</span></button>
        <button className="nav-item" onClick={() => setTab("summary")}><ListVideo size={17}/> Конспекты</button>
        <button className="nav-item" onClick={() => setTab("transcript")}><Captions size={17}/> Расшифровки</button>
        <div className="sidebar-bottom"><div className="mini-avatar">LM</div><div><strong>Личный кабинет</strong><span>Демо-режим</span></div><button className="icon-button" title="Информация" onClick={() => setNotice("LectureMind — прототип семантического поиска по видеолекциям.")}><CircleHelp size={17}/></button></div>
      </aside>

      <section className="main-area">
        <header className="topbar"><div className="breadcrumb">Рабочее пространство <ChevronRight size={14}/> <strong>Мои лекции</strong></div><div className="top-actions"><span className="status-dot"/> Все изменения сохранены <button className="avatar">П</button></div></header>
        <div className="content">
          <div className="page-heading"><div><div className="eyebrow">ВАША БИБЛИОТЕКА ЗНАНИЙ</div><h1>Находите смысл.<br/><span>Не пересматривайте часы.</span></h1><p className="lead">Семантический поиск по лекциям, таймкоды и конспекты — в одном месте.</p></div><button className="primary-button" onClick={() => setShowUpload(true)}><Upload size={17}/> Добавить лекцию</button></div>
          {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice("")}><X size={15}/></button></div>}
          <div className="search-panel"><div className="search-icon"><Search size={21}/></div><form onSubmit={e => { e.preventDefault(); doSearch(); }}><label htmlFor="search">Что хотите найти в лекции?</label><div className="search-line"><input id="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Например: как доказать теорему Пифагора…" /><kbd>↵</kbd></div></form><button className="search-button" onClick={() => doSearch()} disabled={searching}>{searching ? <LoaderCircle className="spin" size={17}/> : <Search size={17}/>} Найти</button><div className="search-hint">Ищите по смыслу, как если бы задавали вопрос преподавателю</div><div className="suggestions"><span>Попробуйте:</span>{["Формула Пифагора","Практические применения","Типичные ошибки"].map(s => <button key={s} onClick={() => {setQuery(s); doSearch(s)}}>{s}</button>)}</div></div>
          <div className="workspace-grid">
            <div className="left-column">
              <div className="section-title"><div><h2>{results.length ? "Результаты поиска" : "Продолжить изучение"}</h2><p>{results.length ? `Найдено фрагментов: ${results.length}` : "Ваша последняя лекция"}</p></div><button className="text-button" onClick={() => {setResults([]); setQuery("")}}>Сбросить <X size={14}/></button></div>
              {!results.length ? <div className="lecture-card">
                <div className="lecture-cover"><div className="cover-orbit orbit-one"/><div className="cover-orbit orbit-two"/><div className="cover-equation">a² + b² = c²</div><div className="cover-caption">МАТЕМАТИКА · 01</div></div>
                <div className="lecture-info"><div className="lecture-topline"><span className="pill"><span className="tiny-dot"/> ДЕМО-ЛЕКЦИЯ</span><span className="duration"><Clock3 size={13}/> {fmt(lecture.duration)}</span></div><h3>{lecture.title}</h3><p>Теорема Пифагора, формулы и применение в задачах</p><div className="lecture-footer"><div className="progress"><span style={{width: `${Math.min(100, active / Math.max(lecture.duration,1) * 100)}%`}}/></div><span>{Math.round(active / Math.max(lecture.duration,1) * 100)}%</span><button className="round-play" onClick={() => jumpTo(active)}><Play size={15} fill="currentColor"/></button></div></div>
              </div> : <div className="results-list">{results.map((r, i) => <button className="result-card" key={r.id} onClick={() => jumpTo(r.start)}><span className="result-time">{fmt(r.start)} <ArrowUpRight size={13}/></span><span className="result-body"><strong>{r.text.slice(0, 125)}{r.text.length > 125 ? "…" : ""}</strong><span>Математика: теорема Пифагора</span></span><span className="result-score">{Math.round(Math.min(1, r.score / 4) * 100)}%<small>совпадение</small></span></button>)}</div>}
              <div className="video-panel"><div className="section-title compact"><div><h2>Видеоплеер</h2><p>Нажмите на любой фрагмент, чтобы перейти к таймкоду</p></div><span className="live-pill"><span/> СИНХРОНИЗАЦИЯ</span></div>
                <div className="video-frame">
                  {videoSource ? <video ref={videoRef} src={videoSource} controls onTimeUpdate={e => setActive(e.currentTarget.currentTime)} /> : lecture.source.startsWith("https://www.youtube-nocookie.com") ? <iframe src={lecture.source} title="YouTube lecture" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen/> : <div className="video-placeholder"><div className="video-glow"/><div className="play-emblem"><Play size={25} fill="currentColor"/></div><div className="video-title">{lecture.title}</div><span>ДЕМО-РЕЖИМ · ИНТЕРАКТИВНЫЕ ТАЙМКОДЫ</span><button onClick={() => jumpTo(lecture.transcript[0]?.start ?? 0)}>Начать просмотр <ArrowUpRight size={14}/></button></div>}
                </div>
                <div className="now-playing"><div className="playing-icon"><Captions size={16}/></div><div><span>ТЕКУЩИЙ ФРАГМЕНТ · {fmt(currentSegment?.start ?? 0)}</span><p>{currentSegment?.text ?? "Выберите фрагмент из расшифровки"}</p></div></div>
              </div>
            </div>
            <div className="right-column">
              <div className="tab-bar"><button className={tab === "search" ? "selected" : ""} onClick={() => setTab("search")}><Search size={15}/> Фрагменты</button><button className={tab === "summary" ? "selected" : ""} onClick={() => setTab("summary")}><Sparkles size={15}/> Конспект</button><button className={tab === "transcript" ? "selected" : ""} onClick={() => setTab("transcript")}><Captions size={15}/> Текст</button></div>
              {tab === "search" && <div className="transcript-panel"><div className="panel-heading"><div><h3>Транскрипт лекции</h3><span>{lecture.transcript.length} фрагментов с таймкодами</span></div><button className="icon-button" title="Добавить текст" onClick={() => setShowUpload(true)}><Upload size={16}/></button></div><div className="transcript-list">{lecture.transcript.map(s => <button key={s.id} className={`transcript-row ${currentSegment?.id === s.id ? "current" : ""}`} onClick={() => jumpTo(s.start)}><span className="time">{fmt(s.start)}</span><span>{s.text}</span></button>)}</div></div>}
              {tab === "transcript" && <div className="transcript-panel"><div className="panel-heading"><div><h3>Полная расшифровка</h3><span>Нажмите на строку для перехода</span></div></div><div className="transcript-list">{lecture.transcript.map(s => <button key={s.id} className="transcript-row" onClick={() => jumpTo(s.start)}><span className="time">{fmt(s.start)}</span><span>{s.text}</span></button>)}</div></div>}
              {tab === "summary" && <div className="summary-panel"><div className="summary-head"><div className="summary-icon"><Sparkles size={18}/></div><div><h3>Умный конспект</h3><span>Ключевые мысли лекции</span></div></div>{lecture.summary ? <div className="summary-content">{lecture.summary.split(/\n+/).map((p,i) => <p key={i}>{p}</p>)}</div> : <div className="summary-empty"><div className="empty-art"><BookOpen size={30}/><Sparkles size={16}/></div><h4>Вся лекция — в нескольких абзацах</h4><p>Соберите главные идеи, определения и выводы без повторного просмотра.</p></div>}<button className="primary-button full" onClick={generateSummary} disabled={busy}><Sparkles size={16}/>{busy ? "Создаём конспект…" : "Сгенерировать конспект"}</button><div className="outline-title">СТРУКТУРА ЛЕКЦИИ</div>{lecture.outline.map(o => <button className="outline-row" key={o.title} onClick={() => jumpTo(o.time)}><span>{fmt(o.time)}</span><div><strong>{o.title}</strong><small>{o.description}</small></div><ChevronRight size={15}/></button>)}</div>}
              <div className="feature-card"><div className="feature-icon"><Command size={17}/></div><div><strong>Ищите не слова — идеи</strong><p>Поиск учитывает контекст и связанные понятия, чтобы находить нужный момент быстрее.</p></div></div>
            </div>
          </div>
          <footer className="footer"><span>© 2026 LectureMind</span><span>Создано для учёбы, а не для бесконечного пересмотра <Sparkles size={12}/></span><button onClick={() => setNotice("Прототип хакатона «Киберрывок 2026». Семантический поиск, таймкоды и конспект.")}>О проекте</button></footer>
        </div>
      </section>

      {showUpload && <div className="modal-backdrop" onClick={() => setShowUpload(false)}><div className="modal" onClick={e => e.stopPropagation()}><div className="modal-top"><div><div className="eyebrow">НОВАЯ ЛЕКЦИЯ</div><h2>Добавить материал</h2></div><button className="icon-button" onClick={() => setShowUpload(false)}><X size={19}/></button></div><p className="modal-lead">Загрузите видео, добавьте ссылку или вставьте готовую расшифровку.</p><button className="upload-drop" onClick={() => uploadRef.current?.click()}><div className="upload-icon"><FileVideo size={22}/></div><strong>Выберите видео или аудио</strong><span>MP4, WebM, MP3, WAV, M4A · до 250 МБ</span><div className="secondary-button"><Upload size={15}/> Выбрать файл</div><input ref={uploadRef} type="file" accept="video/mp4,video/webm,audio/*,.m4a" hidden onChange={e => uploadFile(e.target.files?.[0])}/></button>
          <div className="or-divider"><span>ИЛИ ДОБАВЬТЕ ССЫЛКУ</span></div><div className="url-row"><input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…"/><button onClick={() => urlEmbed(videoUrl)} className="secondary-button">Добавить</button></div>
          <div className="or-divider"><span>ИЛИ ВСТАВЬТЕ РАСШИФРОВКУ</span></div><textarea value={customTranscript} onChange={e => setCustomTranscript(e.target.value)} placeholder="Вставьте текст лекции. Предложения будут разбиты на фрагменты…" rows={4}/><button className="primary-button full" disabled={!customTranscript.trim()} onClick={() => {applyTranscript(); setShowUpload(false)}}><Check size={16}/> Использовать текст</button>
          {busy && <div className="processing"><LoaderCircle className="spin" size={16}/> Обрабатываем лекцию…</div>}<p className="privacy-note">Файлы обрабатываются на вашем сервере. Для автоматической транскрибации нужен API-ключ OpenAI и установленный ffmpeg.</p></div></div>}
    </main>
  );
}
