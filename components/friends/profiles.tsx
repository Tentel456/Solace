import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, GraduationCap, Users } from "lucide-react";
import { FriendAvatar } from "@/components/friends/friend-avatar";
import type { MockFriend } from "@/components/friends/mock-data";

export function FriendProfile({ friend }: { friend: MockFriend }) {
  return (
    <>
      <Link href="/friends" className="inline-flex items-center gap-2 rounded text-xs text-zinc-500 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Все друзья
      </Link>

      <section className="mt-7 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <div className="relative h-28 overflow-hidden border-b border-white/[0.06] bg-[radial-gradient(ellipse_at_25%_120%,#27272a_0%,#111113_55%,#09090b_100%)] sm:h-36">
          <div aria-hidden="true" className="absolute -top-28 right-8 size-64 rounded-full border border-white/[0.04]" />
          <div aria-hidden="true" className="absolute -top-20 right-0 size-64 rounded-full border border-white/[0.04]" />
          <span className="absolute top-5 right-5 rounded-md border border-white/10 px-2 py-1 text-[9px] tracking-widest text-zinc-500">МОКОВЫЙ ПРОФИЛЬ</span>
        </div>
        <div className="px-6 pb-7 sm:px-8">
          <FriendAvatar friend={friend} className="-mt-9 size-20 rounded-3xl border-[5px] border-zinc-950 text-2xl" />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{friend.name}</h1>
            <span className={`flex items-center gap-1.5 text-[11px] ${friend.online ? "text-emerald-400" : "text-zinc-500"}`}><span className={`size-1.5 rounded-full ${friend.online ? "bg-emerald-400" : "bg-zinc-600"}`} />{friend.online ? "В сети" : "Не в сети"}</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">@{friend.username}</p>
          <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-400">{friend.bio}</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-2"><GraduationCap className="size-4" aria-hidden="true" />{friend.university}</span>
            <span className="inline-flex items-center gap-2"><Users className="size-3.5" aria-hidden="true" />Общих друзей: {friend.mutual}</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {friend.interests.map((interest) => <span key={interest} className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-[11px] text-zinc-400">{interest}</span>)}
          </div>
        </div>
      </section>

      <section className="mt-9" aria-labelledby="shared-lectures">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 id="shared-lectures" className="text-base font-medium tracking-tight">Открытые конспекты</h2>
            <p className="mt-1.5 text-xs text-zinc-500">Знания, которыми делится {friend.name}.</p>
          </div>
          <BookOpen className="size-4 text-zinc-600" aria-hidden="true" />
        </div>
        <div className="grid items-start gap-4 sm:grid-cols-2">
          {friend.lectures.map((lecture) => (
            <details key={lecture.title} className="group rounded-xl border border-white/[0.08] bg-white/[0.02] transition-colors open:bg-white/[0.035] hover:border-white/[0.15]">
              <summary className="cursor-pointer list-none rounded-xl p-5 outline-none focus-visible:ring-2 focus-visible:ring-white/40 [&::-webkit-details-marker]:hidden">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]"><BookOpen className="size-4 text-zinc-400" aria-hidden="true" /></span>
                  <ArrowUpRight className="size-4 text-zinc-600 transition-transform group-open:rotate-90" aria-hidden="true" />
                </div>
                <p className="mt-4 text-[10px] text-zinc-500">{lecture.subject} · {lecture.date}</p>
                <h3 className="mt-2 text-sm font-medium leading-6 text-zinc-200">{lecture.title}</h3>
                <span className="mt-4 block text-[11px] text-zinc-500 group-open:hidden">Прочитать конспект →</span>
                <span className="mt-4 hidden text-[11px] text-zinc-500 group-open:block">Свернуть конспект ↑</span>
              </summary>
              <p className="mx-5 border-t border-white/[0.06] pt-4 pb-5 text-xs leading-7 text-zinc-400">{lecture.summary}</p>
            </details>
          ))}
        </div>
      </section>
      <p className="mt-8 text-[10px] text-zinc-600">Демо-профиль · Все данные и конспекты на этой странице вымышлены.</p>
    </>
  );
}
