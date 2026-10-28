"use client";

import { UserRound } from "lucide-react";

import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { DesktopNav } from "@/components/ui/desktop-nav";
import { MobileNav } from "@/components/ui/mobile-nav";

interface HeaderProps {
  email?: string;
}

export function Header({ email }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-zinc-950">
      <nav className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-5">
          <a
            href="/dashboard"
            aria-label="Solace — главная"
            className="rounded-lg px-3 py-2.5 transition-colors duration-200 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <Logo className="h-4" />
          </a>

          <DesktopNav />
        </div>

        {email ? (
          <div className="hidden min-w-0 items-center gap-3 md:flex">
            <span
              title={email}
              className="max-w-44 truncate text-sm text-zinc-400 lg:max-w-60"
            >
              {email}
            </span>

            <div
              aria-label={`Профиль пользователя: ${email}`}
              role="img"
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300"
            >
              <UserRound
                className="size-[18px]"
                strokeWidth={1.7}
                aria-hidden="true"
              />
            </div>
          </div>
        ) : (
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="outline" asChild>
              <a href="/auth?mode=login">Sign In</a>
            </Button>

            <Button asChild>
              <a href="/auth?mode=register">Get Started</a>
            </Button>
          </div>
        )}

        <MobileNav />
      </nav>
    </header>
  );
}