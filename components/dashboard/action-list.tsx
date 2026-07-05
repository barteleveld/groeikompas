import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileUp, MessageSquareText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { NextAction } from "@/types/domain";

const icons = { start: FileUp, wait: Clock3, feedback: MessageSquareText, evidence: CheckCircle2 };
export function ActionList({ actions }: { actions: NextAction[] }) {
  if (!actions.length) return <EmptyState title="Je bent bij" description="Er zijn nu geen openstaande acties. Kijk later nog eens." />;
  return <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">{actions.map((action) => { const Icon = icons[action.kind]; return <Link href={action.href} key={action.id} className="group flex gap-3 p-4 hover:bg-slate-50 sm:p-5"><span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-800"><Icon className="size-4" aria-hidden /></span><span className="min-w-0 flex-1"><span className="font-bold text-slate-950">{action.label}</span><span className="mt-1 block text-sm text-slate-600">{action.detail}</span></span><ArrowRight className="mt-2 size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-700" aria-hidden /></Link>; })}</div>;
}
