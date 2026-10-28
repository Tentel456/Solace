
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { Library } from "@/components/lectures/library";

import { Header } from "@/components/ui/header";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/auth");
  }

  const email =
    typeof data.claims.email === "string"
      ? data.claims.email
      : "Пользователь";

  async function signOut() {
    "use server";

    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 text-white">
        <Header />

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <p className="text-sm text-zinc-400">Вы вошли как</p>
          <p className="mt-2 break-all text-lg">{email}</p>

          <Library />
        </section>
    </main>
  );
}
