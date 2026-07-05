import { setModuleArchived } from "@/app/actions/workflow";
import { ModuleForm } from "@/components/forms/workflow-forms";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function ModulesPage() {
  const profile = await requireRole("teacher", "admin"); const supabase = await createClient();
  const [{data:modules},{data:cohortRows},{data:assignments},{data:cohortLinks},{data:assignmentLinks}] = await Promise.all([
    supabase.from("modules").select("*").order("archived_at", { ascending: true, nullsFirst: true }).order("sort_order"),
    profile.role === "admin" ? supabase.from("cohorts").select("id,name") : supabase.from("teacher_cohorts").select("cohort:cohorts(id,name)").eq("teacher_id", profile.id),
    supabase.from("assignments").select("id,title").order("created_at"),
    supabase.from("cohort_modules").select("cohort_id,module_id"),
    supabase.from("module_assignments").select("module_id,assignment_id,sort_order").order("sort_order"),
  ]);
  const cohorts=(cohortRows??[]).map((r:any)=>r.cohort?(Array.isArray(r.cohort)?r.cohort[0]:r.cohort):r).filter(Boolean);
  return <><PageHeader eyebrow="Leerlijn" title="Modules" description="Bundel opdrachten in een herkenbare route. Studenten zien wat eerst komt en waar de module naartoe werkt."/><div className="grid gap-7 xl:grid-cols-[.8fr_1.2fr]"><section className="card h-fit p-5"><h2 className="mb-4 text-xl font-black">Nieuwe module</h2><ModuleForm cohorts={cohorts} assignments={assignments??[]}/></section><section><h2 className="mb-4 text-xl font-black">Bestaande modules</h2><div className="space-y-4">{(modules??[]).map((m:any)=>{const item={...m,cohortIds:(cohortLinks??[]).filter((x:any)=>x.module_id===m.id).map((x:any)=>x.cohort_id),assignmentIds:(assignmentLinks??[]).filter((x:any)=>x.module_id===m.id).sort((a:any,b:any)=>a.sort_order-b.sort_order).map((x:any)=>x.assignment_id)};return <details className={`card p-5 ${m.archived_at?"opacity-65":""}`} key={m.id}><summary className="cursor-pointer list-none"><div className="flex justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-teal-700">{m.period||"Doorlopend"}</p><h3 className="mt-1 text-lg font-black">{m.title}</h3><p className="mt-1 text-sm text-slate-600">{item.assignmentIds.length} opdrachten</p></div><span className={`h-fit rounded-full px-2 py-1 text-xs font-bold ${m.archived_at?"bg-slate-100 text-slate-600":m.is_published?"bg-emerald-50 text-emerald-900":"bg-amber-50 text-amber-900"}`}>{m.archived_at?"Gearchiveerd":m.is_published?"Zichtbaar":"Concept"}</span></div></summary><div className="mt-5 border-t border-slate-200 pt-5">{!m.archived_at&&<ModuleForm module={item} cohorts={cohorts} assignments={assignments??[]}/>}<form action={setModuleArchived} className={m.archived_at?"":"mt-5 border-t border-slate-100 pt-4"}><input type="hidden" name="id" value={m.id}/><input type="hidden" name="archived" value={m.archived_at?"false":"true"}/><button className="text-sm font-bold text-slate-600 underline">{m.archived_at?"Module herstellen":"Module archiveren"}</button></form></div></details>})}</div></section></div></>;
}

