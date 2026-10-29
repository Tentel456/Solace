"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  Copy,
  Search,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FriendAvatar } from "@/components/friends/friend-avatar";
import {
  mockFriends,
  mockRequests,
  mockSuggestions,
  type MockFriend,
} from "@/components/friends/mock-data";

const secondaryButton = "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-3 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50";
const primaryButton = "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 text-xs font-medium text-zinc-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

type Filter = "all" | "online" | "requests" | "discover";

function FriendCard({ friend, actions }: { friend: MockFriend; actions?: ReactNode }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-colors hover:border-white/[0.15] hover:bg-white/[0.035]">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/friends/${friend.username}`} className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white/40">
          <FriendAvatar friend={friend} />
        </Link>
        <span className={cn("mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px]", friend.online ? "bg-emerald-400/[0.07] text-emerald-300" : "bg-white/[0.04] text-zinc-500")}>
          <span className={cn("size-1 rounded-full", friend.online ? "bg-emerald-400" : "bg-zinc-600")} />
          {friend.online ? "В сети" : "Не в сети"}
        </span>
      </div>
      <Link href={`/friends/${friend.username}`} className="mt-4 w-fit rounded text-sm font-medium tracking-tight text-zinc-100 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white/40">
        {friend.name}
      </Link>
      <p className="mt-1 text-xs text-zinc-500">@{friend.username}</p>
      <p className="mt-3 truncate text-xs text-zinc-400" title={friend.university}>{friend.university}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {friend.interests.slice(0, 2).map((interest) => (
          <span key={interest} className="rounded-md border border-white/[0.05] bg-white/[0.025] px-2 py-1 text-[10px] text-zinc-400">{interest}</span>
        ))}
      </div>
      <div className="mt-5 flex flex-1 items-start gap-2 border-t border-white/[0.06] pt-3.5 text-[11px] leading-5 text-zinc-500">
        <BookOpen className="mt-1 size-3 shrink-0" aria-hidden="true" />
        <span>{friend.activity}</span>
      </div>
      <div className="mt-4">
        {actions ?? (
          <Link href={`/friends/${friend.username}`} className={cn(secondaryButton, "w-full justify-between")}>
            Открыть профиль
            <ArrowRight className="size-3.5 text-zinc-500 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}

export function Friends() {
  const [friends, setFriends] = useState(mockFriends);
  const [requests, setRequests] = useState(mockRequests);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const onlineCount = friends.filter((friend) => friend.online).length;
  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "Все друзья", count: friends.length },
    { id: "online", label: "В сети", count: onlineCount },
    { id: "requests", label: "Заявки", count: requests.length },
    { id: "discover", label: "Найти друзей", count: mockSuggestions.length },
  ];
  const people = filter === "requests" ? requests : filter === "discover" ? mockSuggestions : filter === "online" ? friends.filter((friend) => friend.online) : friends;
  const search = query.trim().toLocaleLowerCase("ru");
  const visiblePeople = people.filter((friend) => `${friend.name} ${friend.username} ${friend.university} ${friend.interests.join(" ")}`.toLocaleLowerCase("ru").includes(search));

  function sendRequest(friend: MockFriend) {
    setPending((current) => [...current, friend.username]);
    setNotice(`Заявка для ${friend.name} отправлена в демо-режиме.`);
  }

  function acceptRequest(friend: MockFriend) {
    setFriends((current) => [...current, { ...friend, activity: "Теперь вы друзья. Самое время учиться вместе!" }]);
    setRequests((current) => current.filter((request) => request.username !== friend.username));
    setNotice(`${friend.name} теперь в вашем списке друзей.`);
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/friends`);
      setCopied(true);
      setNotice("Ссылка на Solace скопирована. Отправьте её друзьям!");
    } catch {
      setNotice("Не удалось скопировать ссылку. Можно поделиться адресом этой страницы из браузера.");
    }
  }

  return (
    <>
      <div className="mb-7 flex items-center gap-2 text-[11px] text-zinc-600">
        <Link href="/dashboard" className="transition hover:text-zinc-300">Моё пространство</Link>
        <span aria-hidden="true">/</span>
        <span className="text-zinc-400">Друзья</span>
      </div>

      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-[34px]">Учиться лучше вместе<span className="text-zinc-600">.</span></h1>
          <p className="mt-2.5 max-w-md text-sm leading-6 text-zinc-500">Ваши люди, общие интересы и знания, которыми хочется делиться.</p>
        </div>
        <button type="button" className={cn(primaryButton, "h-10 w-fit shrink-0")} onClick={() => { setFilter("discover"); setQuery(""); searchRef.current?.focus(); }}>
          <UserPlus className="size-3.5" aria-hidden="true" />
          Найти друзей
        </button>
      </div>

      <div className="mt-9 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_248px]">
        <section aria-label="Список друзей" className="min-w-0">
          <div className="flex gap-5 overflow-x-auto border-b border-white/[0.08]" aria-label="Фильтр друзей">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" aria-pressed={filter === tab.id} onClick={() => { setFilter(tab.id); setQuery(""); }} className={cn("relative flex shrink-0 items-center gap-2 border-b-2 px-0.5 pt-1 pb-3.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40", filter === tab.id ? "border-zinc-100 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300")}>
                {tab.label}
                <span className={cn("rounded px-1.5 py-0.5 text-[9px] tabular-nums", filter === tab.id ? "bg-white/10 text-zinc-300" : "bg-white/[0.04] text-zinc-600")}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="relative mt-5">
            <Search className="pointer-events-none absolute top-3 left-3.5 size-4 text-zinc-600" aria-hidden="true" />
            <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по имени, интересам или вузу" aria-label="Поиск друзей" className="h-10 w-full rounded-lg border border-white/[0.08] bg-white/[0.02] pr-4 pl-10 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-white/25 focus:bg-white/[0.035]" />
          </div>
          <div className="my-4 flex items-center justify-between gap-3 text-[10px] text-zinc-600">
            <span aria-live="polite">{filter === "requests" ? "Входящие заявки" : filter === "discover" ? "Возможно, вы знакомы" : filter === "online" ? "Сейчас в Solace" : "Ваш круг общения"} · {visiblePeople.length}</span>
            <span className="flex items-center gap-1.5"><span className="size-1 rounded-full bg-emerald-400/70" />{onlineCount} в сети</span>
          </div>

          {visiblePeople.length > 0 ? (
            <div className="grid gap-3.5 sm:grid-cols-2">
              {visiblePeople.map((friend) => (
                <FriendCard key={friend.username} friend={friend} actions={filter === "requests" ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => acceptRequest(friend)} className={cn(primaryButton, "flex-1")}><Check className="size-3.5" aria-hidden="true" />Принять</button>
                    <button type="button" aria-label={`Отклонить заявку: ${friend.name}`} onClick={() => { setRequests((current) => current.filter((request) => request.username !== friend.username)); setNotice(`Заявка от ${friend.name} отклонена.`); }} className={cn(secondaryButton, "px-2.5")}><X className="size-3.5" aria-hidden="true" /></button>
                  </div>
                ) : filter === "discover" ? (
                  <button type="button" disabled={pending.includes(friend.username)} onClick={() => sendRequest(friend)} className={cn(secondaryButton, "w-full")}>
                    {pending.includes(friend.username) ? <CheckCheck className="size-3.5" aria-hidden="true" /> : <UserPlus className="size-3.5" aria-hidden="true" />}
                    {pending.includes(friend.username) ? "Заявка отправлена" : "Добавить в друзья"}
                  </button>
                ) : undefined} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
              {filter === "requests" && !query ? <ArrowDownLeft className="mx-auto size-7 text-zinc-600" aria-hidden="true" /> : <Users className="mx-auto size-7 text-zinc-600" aria-hidden="true" />}
              <h2 className="mt-4 text-sm font-medium text-zinc-300">{query ? "Никого не нашли" : filter === "requests" ? "Все заявки разобраны" : "Пока никого нет"}</h2>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{query ? "Попробуйте другое имя, интерес или название вуза." : filter === "requests" ? "Новые знакомства ещё впереди. Загляните чуть позже." : "Попробуйте другой фильтр или найдите новых друзей."}</p>
              {query && <button type="button" onClick={() => setQuery("")} className={cn(secondaryButton, "mt-5")}>Сбросить поиск</button>}
            </div>
          )}
        </section>

        <aside className="space-y-4 lg:pt-0.5">
          <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-200"><Sparkles className="size-3.5 text-zinc-500" aria-hidden="true" /><h2>Возможно, вы знакомы</h2></div>
            <div className="mt-5 space-y-5">
              {mockSuggestions.map((friend) => (
                <div key={friend.username} className="flex items-center gap-2.5">
                  <Link href={`/friends/${friend.username}`} className="shrink-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white/40"><FriendAvatar friend={friend} className="size-9 rounded-xl text-[10px]" /></Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/friends/${friend.username}`} className="block truncate text-[11px] font-medium text-zinc-300 hover:text-white">{friend.name}</Link>
                    <p className="mt-1 text-[10px] text-zinc-600">Общих друзей: {friend.mutual}</p>
                  </div>
                  <button type="button" onClick={() => sendRequest(friend)} disabled={pending.includes(friend.username)} aria-label={pending.includes(friend.username) ? `Заявка отправлена: ${friend.name}` : `Добавить в друзья: ${friend.name}`} className={cn(secondaryButton, "size-7 shrink-0 px-0")}>
                    {pending.includes(friend.username) ? <Check className="size-3" aria-hidden="true" /> : <UserPlus className="size-3" aria-hidden="true" />}
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => { setFilter("discover"); setQuery(""); }} className="mt-5 flex items-center gap-1.5 text-[10px] text-zinc-500 transition hover:text-zinc-200">Посмотреть всех<ArrowRight className="size-3" aria-hidden="true" /></button>
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.045] to-transparent p-5">
            <div className="mb-5 flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]"><Users className="size-4 text-zinc-400" aria-hidden="true" /></div>
            <h2 className="text-sm font-medium leading-6 tracking-tight">Знания сближают.</h2>
            <p className="mt-2 text-xs leading-5 text-zinc-500">Позовите свою компанию в Solace. Сложные лекции проще разбирать вместе.</p>
            <button type="button" onClick={() => void copyInvite()} className={cn(secondaryButton, "mt-5 w-full text-[11px]")}>
              {copied ? <Check className="size-3" aria-hidden="true" /> : <Copy className="size-3" aria-hidden="true" />}
              {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
            </button>
          </section>
          <p className="px-1 text-[10px] leading-5 text-zinc-600">Только хорошие люди.<br />И немного совместной продуктивности.</p>
        </aside>
      </div>

      <div role="status" aria-live="polite" className={cn("mt-6 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-zinc-300", !notice && "hidden")}>{notice}</div>
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5 text-[10px] leading-5 text-zinc-600">
        <span>Solace · Пространство для знаний</span>
      </footer>
    </>
  );
}
