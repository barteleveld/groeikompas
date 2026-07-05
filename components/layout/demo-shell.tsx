import Link from "next/link";
import { Eye } from "lucide-react";
import { DemoResetButton } from "@/components/demo/demo-state";
import { BrandMark } from "@/components/layout/brand";

export function DemoShell({ children }: { children: React.ReactNode }) {
  return <div className="app-canvas min-h-screen text-slate-950"><div className="bg-teal-950 px-4 py-2 text-center text-sm font-semibold text-white"><Eye className="mr-2 inline size-4" aria-hidden/>Je bekijkt een voorbeeld; wijzigingen worden op deze computer bewaard</div><header className="border-b border-rose-100 bg-white/95 shadow-sm shadow-rose-950/5 backdrop-blur"><div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6"><Link href="/demo" className="mr-auto shrink-0"><BrandMark /></Link><nav className="flex gap-1 overflow-x-auto text-sm font-bold"><Link className="rounded-lg px-3 py-2 hover:bg-teal-50 hover:text-teal-900" href="/demo/student">Student</Link><Link className="rounded-lg px-3 py-2 hover:bg-teal-50 hover:text-teal-900" href="/demo/docent">Docent</Link><Link className="rounded-lg px-3 py-2 hover:bg-teal-50 hover:text-teal-900" href="/demo/beheer">Beheerder</Link></nav><DemoResetButton/></div></header><main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">{children}</main></div>;
}
