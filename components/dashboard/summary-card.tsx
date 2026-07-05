import type { LucideIcon } from "lucide-react";

export function SummaryCard({ icon: Icon, value, label, hint }: { icon: LucideIcon; value: string; label: string; hint: string }) {
  return <div className="card p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-2xl font-black text-slate-950">{value}</p><p className="mt-0.5 font-bold text-slate-800">{label}</p></div><span className="rounded-xl bg-teal-50 p-2.5 text-teal-800"><Icon className="size-5" aria-hidden /></span></div><p className="mt-3 text-sm text-slate-600">{hint}</p></div>;
}
