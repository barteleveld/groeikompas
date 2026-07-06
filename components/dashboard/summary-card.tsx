import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SummaryItem = { label: string; href: string; meta?: string };
type SummaryCardProps = { icon: LucideIcon; value: string; label: string; hint: string; items?: SummaryItem[]; emptyText?: string };

function CardHeading({ icon: Icon, value, label, expandable }: Pick<SummaryCardProps, "icon" | "value" | "label"> & { expandable: boolean }) {
  return <div className="flex items-start justify-between gap-3"><div><p className="text-2xl font-black text-slate-950">{value}</p><p className="mt-0.5 font-bold text-slate-800">{label}</p></div><div className="flex items-center gap-2"><span className="rounded-xl bg-teal-50 p-2.5 text-teal-800"><Icon className="size-5" aria-hidden /></span>{expandable && <ChevronDown className="size-5 text-slate-500 transition-transform group-open:rotate-180" aria-hidden />}</div></div>;
}

export function SummaryCard({ icon, value, label, hint, items, emptyText = "Hier staan nu geen opdrachten." }: SummaryCardProps) {
  if (items === undefined) return <div className="card p-5"><CardHeading icon={icon} value={value} label={label} expandable={false} /><p className="mt-3 text-sm text-slate-600">{hint}</p></div>;
  return <details className="group card overflow-hidden"><summary className="min-h-11 cursor-pointer list-none p-5 marker:content-none [&::-webkit-details-marker]:hidden"><CardHeading icon={icon} value={value} label={label} expandable /><p className="mt-3 text-sm text-slate-600">{hint}</p><p className="mt-2 text-xs font-bold text-teal-700 group-open:hidden">Bekijk opdrachten</p></summary><div className="border-t border-slate-200 bg-slate-50/70 p-3">{items.length ? <ul className="space-y-2">{items.map((item) => <li key={`${item.href}-${item.label}`}><Link href={item.href} className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-sm shadow-sm ring-1 ring-slate-200 hover:ring-teal-300"><span className="font-bold text-slate-900">{item.label}</span>{item.meta && <span className="shrink-0 text-xs font-semibold text-slate-500">{item.meta}</span>}</Link></li>)}</ul> : <p className="rounded-xl bg-white p-3 text-sm text-slate-600 ring-1 ring-slate-200">{emptyText}</p>}</div></details>;
}
