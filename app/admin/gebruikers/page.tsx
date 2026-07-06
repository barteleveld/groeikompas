import { InviteUserForm, UserManagementForm } from "@/components/forms/management-forms";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function UsersPage() {
  await requireRole("admin"); const supabase = await createClient(); const adminClient = createAdminClient();
  const [{ data: profiles }, { data: cohorts }, { data: studentLinks }, { data: teacherLinks }, authResult] = await Promise.all([
    supabase.from("profiles").select("id,full_name,role,is_active").order("is_active", { ascending: false }).order("full_name"),
    supabase.from("cohorts").select("id,name").is("archived_at", null).order("name"),
    supabase.from("cohort_members").select("cohort_id,student_id"), supabase.from("teacher_cohorts").select("cohort_id,teacher_id"),
    adminClient ? adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 }) : Promise.resolve({ data: { users: [] } }),
  ]);
  const authUsers = authResult.data?.users ?? [];
  const cards = (profiles ?? []).filter((profile: any) => profile.role !== "admin").map((profile: any) => { const currentCohortId = profile.role === "student" ? (studentLinks ?? []).find((link: any) => link.student_id === profile.id)?.cohort_id : (teacherLinks ?? []).find((link: any) => link.teacher_id === profile.id)?.cohort_id; const email = authUsers.find((user: any) => user.id === profile.id)?.email; return <details className={`card p-4 sm:p-5 ${profile.is_active ? "" : "border-slate-300 bg-slate-50"}`} key={profile.id}><summary className="min-h-11 cursor-pointer list-none py-1"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{profile.full_name}</h3><p className="mt-1 break-all text-sm text-slate-500">{email || "E-mailadres niet beschikbaar"}</p></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${profile.is_active ? "bg-emerald-50 text-emerald-900" : "bg-slate-200 text-slate-700"}`}>{profile.is_active ? "Actief" : "Gedeactiveerd"}</span></div></summary><div className="mt-4 border-t border-slate-200 pt-4"><UserManagementForm profile={profile} cohorts={cohorts ?? []} currentCohortId={currentCohortId} /></div></details>; });
  return <><PageHeader eyebrow="Mensen en klassen" title="Gebruikers" description="Nodig mensen uit, pas hun rol of klas aan en beheer veilig wie toegang heeft." /><div className="grid gap-7 xl:grid-cols-[.75fr_1.25fr]"><section className="card h-fit p-4 sm:p-5"><h2 className="mb-4 text-xl font-black">Nieuwe gebruiker uitnodigen</h2><InviteUserForm cohorts={cohorts ?? []} /></section><section><h2 className="mb-1 text-xl font-black">Bestaande gebruikers</h2><p className="mb-4 text-sm text-slate-600">Open een gebruiker om rol, klas of toegang te wijzigen.</p><div className="space-y-3">{cards}</div></section></div></>;
}
