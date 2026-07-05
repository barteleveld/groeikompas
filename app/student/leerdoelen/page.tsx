import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function GoalsPage() {
  const profile = await requireRole("student"); const supabase = await createClient();
  const { data } = await supabase.from("student_learning_goal_progress").select("id,level,goal:learning_goals(id,title,description,domain,kerntaak,werkproces)").eq("student_id", profile.id);
  const rows = (data ?? []).map((r:any)=>({ ...r, goal: Array.isArray(r.goal) ? r.goal[0] : r.goal })).filter((r:any)=>r.goal).sort((a:any,b:any)=>a.goal.domain.localeCompare(b.goal.domain,"nl"));
  return <><PageHeader eyebrow="Waar werk ik naartoe?" title="Leerdoelen" description="Je niveau groeit door wat je laat zien in opdrachten, bewijsstukken en gesprekken." />{rows.length ? <div className="grid gap-4 md:grid-cols-2">{rows.map((row:any)=><Link href={`/student/leerdoelen/${row.goal.id}`} key={row.id} className="card p-5 hover:border-teal-300"><div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge value={row.level}/><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{row.goal.domain}</span></div><h2 className="mt-4 text-lg font-black leading-snug">{row.goal.title}</h2><p className="mt-2 text-sm text-slate-600">{row.goal.description}</p><p className="mt-4 text-xs font-semibold text-slate-500">{row.goal.kerntaak} · {row.goal.werkproces}</p></Link>)}</div> : <EmptyState title="Nog geen leerdoelen" description="Je docent of beheerder koppelt de leerdoelen aan je opleiding." />}</>;
}
