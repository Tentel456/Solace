import type { Metadata } from "next";
import { Header } from "@/components/ui/header";

export const metadata: Metadata = {
  title: "Друзья — Solace",
  description: "Учитесь вместе, находите единомышленников и делитесь конспектами в Solace.",
};

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-white/20">
      <Header email="alex@solace.study" />
      <main className="mx-auto w-full max-w-5xl px-5 pt-9 pb-12 sm:px-7 sm:pt-12">
        {children}
      </main>
    </div>
  );
}
