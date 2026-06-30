"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark, Mark } from "@/components/ui/brand";
import { useI18n } from "@/components/i18n/language-provider";
import { LanguageToggle } from "@/components/i18n/language-toggle";
import LogoutButton from "./logout-button";

// `key` indexes the dictionary's nav labels; href/icon stay here.
const NAV = [
  { href: "#overview", key: "overview", icon: <IconGrid /> },
  { href: "#schedule", key: "schedule", icon: <IconCalendar /> },
  { href: "#ramadan", key: "ramadan", icon: <IconMoon /> },
  { href: "#players", key: "players", icon: <IconUsers /> },
  { href: "#add-player", key: "addPlayer", icon: <IconPlus /> },
] as const;

export default function DashboardShell({
  email,
  children,
}: {
  email: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-midnight text-white">
      {/* ── Sidebar (desktop) ──────────────────────────────────────────── */}
      <aside
        className={`relative hidden shrink-0 flex-col border-e border-pitch-line bg-midnight-2/50 transition-[width] duration-300 lg:flex ${
          open ? "w-60" : "w-[72px]"
        }`}
      >
        <div className="flex h-16 items-center px-4">
          <Link href="/" className="overflow-hidden">
            {open ? <Wordmark withArabic={false} /> : <Mark className="h-7 w-7" />}
          </Link>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              title={t.nav[item.key]}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-mist transition-colors hover:bg-white/5 hover:text-white"
            >
              <span className="shrink-0 text-mist transition-colors group-hover:text-charge">
                {item.icon}
              </span>
              {open && <span className="truncate">{t.nav[item.key]}</span>}
            </a>
          ))}
        </nav>

        <div className="border-t border-pitch-line p-3">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-mist transition-colors hover:bg-white/5 hover:text-white"
            aria-label={open ? t.nav.collapseSidebar : t.nav.expandSidebar}
          >
            <span className={`transition-transform ${open ? "" : "rotate-180"}`}>
              <IconChevron />
            </span>
            {open && <span>{t.nav.collapse}</span>}
          </button>
        </div>
      </aside>

      {/* ── Main column ────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-pitch-line bg-midnight/80 px-5 backdrop-blur">
          <div className="lg:hidden">
            <Link href="/">
              <Wordmark withArabic={false} markClassName="h-6 w-6" />
            </Link>
          </div>
          <p className="hidden font-display text-lg font-semibold lg:block">
            {t.nav.dashboard}
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[180px] truncate text-sm text-mist sm:inline">
              {email}
            </span>
            <LanguageToggle />
            <LogoutButton />
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────
function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 9.5h16M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 19c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 5.2A3 3 0 0118 11M17.5 14.3c2.3.4 4 2.3 4 4.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 1010.5 10.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconChevron() {
  return (
    // Mirror the chevron in RTL so it always points toward the collapse edge.
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="rtl:-scale-x-100"
    >
      <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
