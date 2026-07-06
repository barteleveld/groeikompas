import Link from "next/link";
import { BrandMark } from "@/components/layout/brand";

export function DemoShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-canvas min-h-screen text-slate-950">
      <header className="border-b border-rose-100 bg-white/95 shadow-sm shadow-rose-950/5 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/demo" className="mr-auto shrink-0"><BrandMark /></Link>
          <nav aria-label="Omgeving kiezen" className="flex gap-1 overflow-x-auto text-sm font-bold">
            <Link className="rounded-lg px-3 py-2 hover:bg-teal-50 hover:text-teal-900" href="/demo/student">Student</Link>
            <Link className="rounded-lg px-3 py-2 hover:bg-teal-50 hover:text-teal-900" href="/demo/docent">Docent</Link>
            <Link className="rounded-lg px-3 py-2 hover:bg-teal-50 hover:text-teal-900" href="/demo/beheer">Beheer</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
