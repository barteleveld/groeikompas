import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export default async function AssignmentsPage() {
  const profile = await requireRole("student"); const supabase = await createClient();
  const { data } = await supabase.from("student_assignment_progress").select("id,status,assignment:assignments(id,title,description,deadline,period)").eq("student_id", profile.id).order("updated_at", { ascending: false });
  const rows = (data ?? []).map((r:any)=>({ ...r, assignment: Array.isArray(r.assignment) ? r.assignment[0] : r.assignment })).filter((r:any)=>r.assignment);
  return <><PageHeader eyebrow="Mijn werk" title="Opdrachten" description="Een afgeronde opdracht en een aangetoond leerdoel zijn niet hetzelfde. Bekijk per opdracht welk bewijs je levert." />{rows.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rows.map((row:any)=><Link href={`/student/opdrachten/${row.assignment.id}`} key={row.id} className="card flex flex-col p-5 hover:border-teal-300"><div className="flex flex-wrap justify-between gap-2"><StatusBadge value={row.status}/><span className="text-xs font-semibold text-slate-500">{row.assignment.period}</span></div><h2 className="mt-4 text-lg font-black">{row.assignment.title}</h2><p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{row.assignment.description}</p><p className="mt-5 text-sm font-bold text-slate-700">Deadline: {formatDate(row.assignment.deadline)}</p></Link>)}</div> : <EmptyState title="Nog geen opdrachten" description="Zodra een opdracht voor je klas klaarstaat, zie je die hier." />}</>;
}
