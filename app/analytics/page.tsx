import type { Metadata } from "next";
import { Analytics } from "@/components/analytics/analytics";
import { Header } from "@/components/ui/header";

export const metadata: Metadata = {
  title: "Аналитика — Solace",
  description: "Ваш ритм обучения: время за лекциями, новые знания и маленькие шаги к большим целям.",
};

export default function AnalyticsPage() {
  return (
    <div className="dark min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-violet-300/20">
      <Header email="alex@solace.study" />
      <main className="mx-auto w-full max-w-6xl px-5 pt-10 pb-10 sm:px-8 sm:pt-16 lg:px-10">
        <Analytics />
      </main>
    </div>
  );
}
