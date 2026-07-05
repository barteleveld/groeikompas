import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import type { UserRole } from "@/types/domain";
import { BrandMark } from "@/components/layout/brand";

const nav: Record<UserRole, { href: string; label: string }[]> = {
  student: [
    { href: "/student", label: "Mijn overzicht" },
    { href: "/student/modules", label: "Modules" },
    { href: "/student/opdrachten", label: "Opdrachten" },
    { href: "/student/leerdoelen", label: "Leerdoelen" },
    { href: "/student/meldingen", label: "Meldingen" },
  ],
  teacher: [
    { href: "/teacher", label: "Voortgang" },
    { href: "/teacher/modules", label: "Modules" },
    { href: "/teacher/opdrachten", label: "Opdrachten" },
    { href: "/teacher/feedbackmomenten", label: "Feedback plannen" },
    { href: "/teacher/meldingen", label: "Meldingen" },
  ],
  admin: [
    { href: "/admin", label: "Beheer" },
    { href: "/admin/gebruikers", label: "Gebruikers" },
    { href: "/admin/leerdoelen", label: "Leerdoelen" },
    { href: "/teacher/modules", label: "Modules" },
    { href: "/teacher/opdrachten", label: "Opdrachten" },
    { href: "/teacher/feedbackmomenten", label: "Feedback plannen" },
  ],
};

export function AppShell({ role, name, children }: { role: UserRole; name: string; children: React.ReactNode }) {
  return (
    <div className="app-canvas min-h-screen text-slate-950">
      <header className="border-b border-rose-100 bg-white/95 shadow-sm shadow-rose-950/5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-7 gap-y-3 px-4 py-3 sm:px-6">
          <Link href={nav[role][0].href} className="shrink-0"><BrandMark /></Link>
          <nav aria-label="Hoofdnavigatie" className="order-3 flex w-full gap-1 overflow-x-auto sm:order-2 sm:w-auto">
            {nav[role].map((item) => <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950">{item.label}</Link>)}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm sm:order-3">
            <span className="hidden text-slate-600 md:inline">{name}</span>
            <form action={signOut}><button className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 font-semibold text-slate-700 hover:bg-slate-100" type="submit"><LogOut className="size-4" aria-hidden /><span className="sr-only sm:not-sr-only">Uitloggen</span></button></form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
