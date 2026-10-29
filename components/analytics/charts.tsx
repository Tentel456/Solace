"use client";

import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/utils";
import { formatDuration, formatHours, type StudyDay } from "@/components/analytics/mock-data";
import styles from "@/components/analytics/analytics.module.css";

export function DataTable({ headers, rows, caption }: { headers: string[]; rows: (string | number)[][]; caption: string }) {
  return (
    <div className="max-h-80 overflow-auto rounded-xl border border-white/[0.06]">
      <table className="w-full min-w-80 text-left text-xs tabular-nums">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-[#101012] text-zinc-500"><tr>{headers.map((header) => <th key={header} scope="col" className="px-4 py-3 font-normal">{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index} className="border-t border-white/[0.05] text-zinc-300">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function StudyChart({ days, table }: { days: StudyDay[]; table: boolean }) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const width = 700;
  const height = 240;
  const ceiling = Math.max(40, Math.ceil(Math.max(...days.map((day) => day.minutes)) / 40) * 40);
  const points = days.map((day, index) => ({ x: index / (days.length - 1) * width, y: height - day.minutes / ceiling * height }));
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  const selected = active !== null ? days[active] : null;
  const labelIndexes = Array.from({ length: 5 }, (_, index) => Math.round(index / 4 * (days.length - 1)));

  function trackPointer(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setActive(Math.max(0, Math.min(days.length - 1, Math.round((event.clientX - bounds.left) / bounds.width * (days.length - 1)))));
  }

  function navigate(event: KeyboardEvent<SVGSVGElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    setActive((current) => event.key === "Home" ? 0 : event.key === "End" ? days.length - 1 : Math.max(0, Math.min(days.length - 1, (current ?? 0) + (event.key === "ArrowRight" ? 1 : -1))));
  }

  if (table) return <DataTable caption="Время обучения по дням" headers={["Дата", "Минуты", "Лекции", "Конспекты"]} rows={days.map((day) => [day.fullLabel, day.minutes, day.lectures, day.notes])} />;

  return (
    <div>
      <div className="relative h-60 pl-10 sm:h-64">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-between pb-0 text-[10px] tabular-nums text-zinc-500">
          {[4, 3, 2, 1, 0].map((tick) => <span key={tick} className="-translate-y-1/2">{ceiling * tick / 4}</span>)}
        </div>
        <div className="relative h-full">
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible rounded outline-none focus-visible:ring-1 focus-visible:ring-white/30" role="img" aria-label={`Время обучения в минутах. Используйте стрелки для выбора дня.${selected ? ` ${selected.fullLabel}: ${selected.minutes} минут.` : ""}`} tabIndex={0} onPointerMove={trackPointer} onPointerDown={trackPointer} onPointerLeave={() => setActive(null)} onFocus={() => setActive(0)} onBlur={() => setActive(null)} onKeyDown={navigate}>
            <defs>
              <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--viz-accent)" stopOpacity="0.13" /><stop offset="100%" stopColor="var(--viz-accent)" stopOpacity="0.005" /></linearGradient>
              <pattern id={`${id}-texture`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="var(--viz-accent)" strokeWidth="1" strokeOpacity="0.35" /></pattern>
            </defs>
            {[0, 1, 2, 3, 4].map((tick) => <line key={tick} x1="0" x2={width} y1={tick / 4 * height} y2={tick / 4 * height} stroke="var(--viz-grid)" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
            <path d={area} fill={`url(#${id}-fill)`} />
            <path d={area} fill={`url(#${id}-texture)`} className={styles.patternFill} />
            <path d={line} className={styles.line} vectorEffect="non-scaling-stroke" />
          </svg>
          {selected && active !== null && (
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute inset-y-0 w-px bg-white/15" style={{ left: `${active / (days.length - 1) * 100}%` }} />
              <div className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--viz-surface)] bg-[var(--viz-accent)]" style={{ left: `${active / (days.length - 1) * 100}%`, top: `${(1 - selected.minutes / ceiling) * 100}%` }} />
              <div className="absolute top-3 min-w-36 -translate-x-1/2 rounded-xl border border-white/10 bg-zinc-900/95 px-3.5 py-3 shadow-xl" style={{ left: `${Math.max(24, Math.min(76, active / (days.length - 1) * 100))}%` }}>
                <p className="text-[10px] text-zinc-400">{selected.label}</p>
                <p className="mt-1.5 text-sm font-medium text-zinc-100">{formatDuration(selected.minutes)}</p>
                <p className="mt-1 text-[10px] text-zinc-500">{selected.lectures} лекц. · {selected.notes} консп.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <div aria-hidden="true" className="mt-5 flex justify-between gap-2 pl-10 text-[10px] text-zinc-500">{labelIndexes.map((index) => <span key={index}>{days[index].label}</span>)}</div>
    </div>
  );
}

export type Topic = { id: string; title: string; minutes: number; lectures: number };

export function TopicsChart({ topics, table }: { topics: Topic[]; table: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const total = topics.reduce((sum, topic) => sum + topic.minutes, 0);

  if (table) return <DataTable caption="Время обучения по темам" headers={["Тема", "Минуты", "Лекции"]} rows={topics.map((topic) => [topic.title, topic.minutes, topic.lectures])} />;

  return (
    <div className="space-y-7">
      {topics.map((topic) => (
        <button key={topic.id} type="button" onPointerEnter={() => setActive(topic.id)} onPointerLeave={() => setActive(null)} onFocus={() => setActive(topic.id)} onBlur={() => setActive(null)} onClick={() => setActive((current) => current === topic.id ? null : topic.id)} aria-label={`${topic.title}: ${formatDuration(topic.minutes)}, ${topic.lectures} лекций`} className={cn(styles.mark, "relative block w-full text-left")}>
          <span className="flex items-center justify-between gap-3 text-[11px]"><span className="text-zinc-300">{topic.title}</span><span className="shrink-0 tabular-nums text-zinc-400">{formatHours(topic.minutes)} ч</span></span>
          <span className="mt-3 block h-1.5 w-full bg-white/[0.04]"><span className={cn(styles.bar, "block h-full rounded-r-[4px]")} style={{ width: `${total ? topic.minutes / total * 100 : 0}%` }} /></span>
          {active === topic.id && <span aria-hidden="true" className="pointer-events-none absolute -top-8 right-0 rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-200">{Math.round(topic.minutes / (total || 1) * 100)}% времени · {topic.lectures} лекц.</span>}
        </button>
      ))}
    </div>
  );
}

export type Weekday = { label: string; fullLabel: string; minutes: number };

export function WeekdayChart({ weekdays, table }: { weekdays: Weekday[]; table: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const ceiling = Math.max(40, Math.ceil(Math.max(...weekdays.map((day) => day.minutes)) / 40) * 40);

  if (table) return <DataTable caption="Среднее время обучения по дням недели" headers={["День недели", "В среднем, мин"]} rows={weekdays.map((day) => [day.fullLabel, day.minutes])} />;

  return (
    <div className="pt-6">
      <div className="relative h-44 pl-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-between text-[10px] tabular-nums text-zinc-500">{[2, 1, 0].map((tick) => <span key={tick} className="-translate-y-1/2">{ceiling * tick / 2}</span>)}</div>
        <div className="relative h-full">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between">{[0, 1, 2].map((tick) => <div key={tick} className="h-px bg-[var(--viz-grid)]" />)}</div>
          <div className="relative grid h-full grid-cols-7 gap-2">
            {weekdays.map((day, index) => (
              <button key={day.label} type="button" aria-label={`${day.fullLabel}: в среднем ${day.minutes} минут`} onPointerEnter={() => setActive(index)} onPointerLeave={() => setActive(null)} onFocus={() => setActive(index)} onBlur={() => setActive(null)} onClick={() => setActive((current) => current === index ? null : index)} className={cn(styles.mark, "relative flex h-full items-end justify-center")}>
                <span className={cn(styles.bar, "relative block w-5 rounded-t-[4px]", active !== null && active !== index && "opacity-40")} style={{ height: `${day.minutes / ceiling * 100}%` }} />
                {active === index && <span aria-hidden="true" className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-[10px] text-zinc-200">{day.label} · {formatDuration(day.minutes)}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="mt-4 grid grid-cols-7 gap-2 pl-8 text-center text-[10px] text-zinc-500">{weekdays.map((day) => <span key={day.label}>{day.label}</span>)}</div>
    </div>
  );
}
