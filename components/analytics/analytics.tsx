"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  Clock3,
  Contrast,
  Download,
  FileText,
  Flame,
  Sparkles,
  Table2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StudyChart, TopicsChart, WeekdayChart } from "@/components/analytics/charts";
import { formatDuration, formatHours, studyDays, subjects, sumDays } from "@/components/analytics/mock-data";
import styles from "@/components/analytics/analytics.module.css";

const buttonClass = "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.025] px-3 text-[11px] text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30";
const cardClass = "rounded-2xl border border-white/[0.07] p-6 sm:p-8";
const weekdayNames = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
const weekdayShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function Delta({ value, previous }: { value: number; previous: number }) {
  const delta = previous === 0 ? null : Math.round((value - previous) / previous * 100);
  if (delta === null) return <span className="text-[10px] text-zinc-500">Новый старт</span>;
  const Icon = delta >= 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={cn("inline-flex items-center gap-1 text-[10px]", delta > 0 ? "text-emerald-400/90" : "text-zinc-400")}><Icon className="size-3" aria-hidden="true" />{delta > 0 ? "+" : ""}{delta}%<span className="ml-1 text-zinc-500">к прошлому периоду</span></span>;
}

export function Analytics() {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [table, setTable] = useState(false);
  const [textured, setTextured] = useState(false);
  const [exported, setExported] = useState(false);
  const days = studyDays.slice(-range);
  const previous = sumDays(studyDays.slice(-range * 2, -range));
  const totals = sumDays(days);
  const topics = subjects.map((subject) => {
    const selected = days.filter((day) => day.subject === subject.id);
    return { ...subject, ...sumDays(selected) };
  }).sort((a, b) => b.minutes - a.minutes);
  const weekdays = weekdayNames.map((fullLabel, index) => {
    const selected = days.filter((day) => (new Date(`${day.date}T00:00:00Z`).getUTCDay() + 6) % 7 === index);
    return { label: weekdayShort[index], fullLabel, minutes: selected.length ? Math.round(sumDays(selected).minutes / selected.length) : 0 };
  });
  const bestDay = weekdays.reduce((best, day) => day.minutes > best.minutes ? day : best, weekdays[0]);
  const recentNotes = days.filter((day) => day.notes > 0).slice(-3).reverse();
  const average = Math.round(totals.minutes / range);
  const metrics = [
    { label: "Время обучения", value: formatHours(totals.minutes), unit: "ч", icon: Clock3, current: totals.minutes, previous: previous.minutes },
    { label: "Изучено лекций", value: String(totals.lectures), unit: "", icon: BookOpen, current: totals.lectures, previous: previous.lectures },
    { label: "Новых конспектов", value: String(totals.notes), unit: "", icon: FileText, current: totals.notes, previous: previous.notes },
    { label: "Дней с Solace", value: String(totals.active), unit: `из ${range}`, icon: Flame, current: totals.active, previous: previous.active },
  ];

  function exportCsv() {
    const rows = [
      ["Дата", "Время, мин", "Лекции", "Конспекты", "Тема"],
      ...days.map((day) => [day.date, day.minutes, day.lectures, day.notes, subjects.find((subject) => subject.id === day.subject)?.title ?? day.subject]),
    ];
    const csv = "﻿" + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `solace-analytics-${range}-days.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExported(true);
  }

  return (
    <div className={cn(styles.root, textured && styles.textured)}>
      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
        <Link href="/dashboard" className="transition hover:text-zinc-200">Моё пространство</Link>
        <span className="mx-1 text-zinc-700" aria-hidden="true">/</span>
        <span className="text-zinc-300">Аналитика</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-zinc-500"><span className="size-1 rounded-full bg-zinc-500" />Демо-данные</span>
      </div>

      <header className="mt-9 flex items-end justify-between gap-6 sm:mt-12">
        <div>
          <p className="mb-3 text-[10px] tracking-[0.22em] text-zinc-500 uppercase">Маленькие шаги. Большой прогресс.</p>
          <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-[44px] sm:leading-tight">Всё начинается<span className="text-zinc-500"> с интереса.</span></h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-zinc-400">Посмотрите, как любопытство превращается в знания.<br className="hidden sm:block" />Ваш ритм, любимые темы и время, потраченное на себя.</p>
        </div>
        <div aria-hidden="true" className="mb-1 hidden size-14 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.02] text-zinc-500 sm:flex"><ChartNoAxesCombined className="size-6" strokeWidth={1.3} /></div>
      </header>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] pb-6 sm:mt-12">
        <div className="flex flex-wrap items-center gap-4">
          <div className="inline-flex rounded-lg border border-white/[0.08] bg-white/[0.02] p-1" aria-label="Период аналитики">
            {([7, 30, 90] as const).map((period) => <button key={period} type="button" aria-pressed={range === period} onClick={() => { setRange(period); setExported(false); }} className={cn("rounded-md px-3 py-1.5 text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:px-4", range === period ? "bg-white/[0.09] text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-200")}>{period} дней</button>)}
          </div>
          <span className="inline-flex items-center gap-2 text-[11px] text-zinc-500"><CalendarDays className="size-3.5" aria-hidden="true" />{days[0].label} — {days[days.length - 1].label} 2026</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className={cn(buttonClass, textured && "border-white/20 text-zinc-100")} aria-pressed={textured} aria-label="Штриховка графиков для повышения различимости" title="Штриховка графиков" onClick={() => setTextured((current) => !current)}><Contrast className="size-3.5" aria-hidden="true" /></button>
          <button type="button" className={cn(buttonClass, table && "border-white/20 text-zinc-100")} aria-pressed={table} onClick={() => setTable((current) => !current)}><Table2 className="size-3.5" aria-hidden="true" /><span>{table ? "Графики" : "Таблица"}</span></button>
          <button type="button" className={buttonClass} onClick={exportCsv}>{exported ? <Check className="size-3.5" aria-hidden="true" /> : <Download className="size-3.5" aria-hidden="true" />}<span>{exported ? "Скачано" : "Экспорт"}</span></button>
        </div>
      </div>

      <section aria-label="Показатели обучения" className="mt-8 grid grid-cols-2 gap-x-5 gap-y-7 sm:mt-10 lg:grid-cols-4 lg:gap-6">
        {metrics.map((metric, index) => (
          <article key={metric.label} className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.015] px-5 py-6 sm:px-6 sm:py-7">
            <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400"><h2>{metric.label}</h2><metric.icon className="size-3.5 shrink-0 text-zinc-600" strokeWidth={1.6} aria-hidden="true" /></div>
            <p className={cn("mt-6 flex flex-wrap items-baseline gap-2 font-medium leading-none tracking-[-0.045em]", index === 0 ? "text-5xl" : "text-[38px]")}>{metric.value}<span className="text-sm font-normal tracking-normal text-zinc-500">{metric.unit}</span></p>
            <div className="mt-5"><Delta value={metric.current} previous={metric.previous} /></div>
          </article>
        ))}
      </section>

      <div className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-[minmax(0,1.9fr)_minmax(280px,1fr)]">
        <section className={cn(cardClass, styles.surface, "min-w-0")} aria-labelledby="study-chart-title">
          <div className="mb-10 flex items-start justify-between gap-4">
            <div><h2 id="study-chart-title" className="text-sm font-medium tracking-tight sm:text-base">Ваш ритм обучения</h2><p className="mt-2 text-[11px] leading-5 text-zinc-500">Время за лекциями, в минутах</p></div>
            <span className="mt-0.5 rounded-md border border-white/[0.06] px-2 py-1 text-[9px] text-zinc-500">Каждый день</span>
          </div>
          <StudyChart key={range} days={days} table={table} />
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5 text-[10px] text-zinc-500"><span>В среднем <span className="text-zinc-300">{formatDuration(average)}</span> в день</span><span>{totals.active} дней с новыми знаниями</span></div>
        </section>

        <section className={cn(cardClass, styles.surface, "min-w-0")} aria-labelledby="topics-chart-title">
          <h2 id="topics-chart-title" className="text-sm font-medium tracking-tight sm:text-base">В фокусе внимания</h2>
          <p className="mt-2 text-[11px] leading-5 text-zinc-500">Как распределилось время по темам</p>
          <div className="mt-9"><TopicsChart topics={topics} table={table} /></div>
          <div className="mt-8 flex items-start gap-2 border-t border-white/[0.06] pt-5 text-[10px] leading-5 text-zinc-500"><Sparkles className="mt-0.5 size-3.5 shrink-0 text-zinc-500" aria-hidden="true" /><p><span className="text-zinc-300">{topics[0].title}</span> — ваша самая популярная тема в этом периоде.</p></div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className={cn(cardClass, styles.surface, "min-w-0")} aria-labelledby="weekday-chart-title">
          <div className="flex items-start justify-between gap-4"><div><h2 id="weekday-chart-title" className="text-sm font-medium tracking-tight sm:text-base">У каждого дня свой ритм</h2><p className="mt-2 text-[11px] leading-5 text-zinc-500">Среднее время обучения по дням недели, мин</p></div><AudioLines className="mt-1 size-4 shrink-0 text-zinc-600" strokeWidth={1.5} aria-hidden="true" /></div>
          <div className="mt-7"><WeekdayChart weekdays={weekdays} table={table} /></div>
          <p className="mt-7 border-t border-white/[0.06] pt-5 text-[10px] leading-5 text-zinc-500">Самый продуктивный день: <span className="text-zinc-300">{bestDay.fullLabel.toLocaleLowerCase("ru")}</span> · {formatDuration(bestDay.minutes)} в среднем</p>
        </section>

        <section className={cn(cardClass, styles.surface)} aria-labelledby="recent-notes-title">
          <div className="flex items-start justify-between gap-4"><div><h2 id="recent-notes-title" className="text-sm font-medium tracking-tight sm:text-base">Не просто посмотрели. Сохранили.</h2><p className="mt-2 text-[11px] leading-5 text-zinc-500">Последние конспекты за выбранный период</p></div><FileText className="mt-1 size-4 shrink-0 text-zinc-600" strokeWidth={1.5} aria-hidden="true" /></div>
          <div className="mt-7 divide-y divide-white/[0.06]">
            {recentNotes.map((day) => {
              const subject = subjects.find((item) => item.id === day.subject)!;
              return (
                <details key={day.date} className="group py-5 first:pt-1">
                  <summary className="flex cursor-pointer list-none items-center gap-3.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/30 [&::-webkit-details-marker]:hidden">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-[9px] font-medium tracking-wide text-zinc-400">{subject.short}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-xs text-zinc-200">{subject.lecture}</span><span className="mt-2 block text-[10px] text-zinc-500">{day.label} · {formatDuration(day.minutes)}</span></span>
                    <ChevronDown className="size-3.5 shrink-0 text-zinc-600 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="mt-4 pl-[54px] text-xs leading-6 text-zinc-400">Демо-конспект по теме «{subject.title}»: основные понятия, примеры из лекции и вопросы для самостоятельной проверки. На обучение в этот день ушло {formatDuration(day.minutes)}.</p>
                </details>
              );
            })}
          </div>
          <Link href="/dashboard" className="mt-3 inline-flex items-center gap-2 rounded text-[11px] text-zinc-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30">К моим лекциям<ArrowRight className="size-3" aria-hidden="true" /></Link>
        </section>
      </div>

      <section className="relative mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-r from-violet-300/[0.045] via-white/[0.02] to-transparent px-6 py-7 sm:mt-10 sm:px-9 sm:py-9">
        <div className="flex items-start gap-5 sm:items-center sm:gap-7">
          <div className="hidden size-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] sm:flex"><Sparkles className="size-5 text-zinc-400" strokeWidth={1.4} aria-hidden="true" /></div>
          <div><p className="text-sm font-medium tracking-tight">Прогресс — это привычка возвращаться.</p><p className="mt-2 max-w-2xl text-xs leading-6 text-zinc-400">В этом периоде вы находили время для знаний {totals.active} из {range} дней. Не обязательно учиться больше всех. Главное — продолжать в своём ритме.</p></div>
        </div>
      </section>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-6 text-[10px] leading-5 text-zinc-500">
        <span>Solace · Знания остаются с вами.</span>
        <span>Демо за 28 октября 2026 · Данные вымышлены</span>
      </footer>
      <span className="sr-only" role="status">{exported ? "CSV-файл с аналитикой скачан." : ""}</span>
    </div>
  );
}
