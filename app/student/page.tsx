import Link from "next/link";
import { BookCheck, ClipboardList, MessageSquareText, Target } from "lucide-react";
import { ActionList } from "@/components/dashboard/action-list";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/session";
import { deriveNextActions } from "@/lib/progress/next-actions";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { AssignmentProgress, FeedbackItem, GoalProgress } from "@/types/domain";

type Join<T> = T | T[] | null;
function one<T>(value: Join<T>) { return Array.isArray(value) ? value[0] : value; }

export default async function StudentDashboard() {
  const profile = await requireRole("student");
  const supabase = await createClient();
  const [{ data: progress }, { data: goalRows }, { data: feedbackRows }] = await Promise.all([
    supabase.from("student_assignment_progress").select("id,status,assignment:assignments(id,title,description,deadline)").eq("student_id", profile.id),
    supabase.from("student_learning_goal_progress").select("id,level,goal:learning_goals(id,title,description)").eq("student_id", profile.id),
    supabase.from("feedback").select("id,assignment_id,learning_goal_id,feedback_text,feedforward_text,created_at,processed_by_student,assignment:assignments(title),goal:learning_goals(title),teacher:profiles!feedback_teacher_id_fkey(full_name)").eq("student_id", profile.id).order("created_at", { ascending: false }),
  ]);

  const assignments: AssignmentProgress[] = (progress ?? []).flatMap((row: any) => { const a = one(row.assignment); return a ? [{ id: row.id, assignmentId: a.id, title: a.title, description: a.description, deadline: a.deadline, status: row.status }] : []; });
  const goals: GoalProgress[] = (goalRows ?? []).flatMap((row: any) => { const g = one(row.goal); return g ? [{ id: row.id, learningGoalId: g.id, title: g.title, description: g.description, level: row.level }] : []; });
  const feedback: FeedbackItem[] = (feedbackRows ?? []).map((row: any) => ({ id: row.id, assignmentId: row.assignment_id, learningGoalId: row.learning_goal_id, subject: one(row.assignment)?.title ?? one(row.goal)?.title ?? "leerdoel", teacherName: one(row.teacher)?.full_name ?? "Docent", feedbackText: row.feedback_text, feedforwardText: row.feedforward_text, createdAt: row.created_at, processedByStudent: row.processed_by_student }));
  const actions = deriveNextActions({ assignments, goals, feedback }).slice(0, 6);
  const completed = assignments.filter((a) => a.status === "completed").length;
  const awaiting = assignments.filter((a) => a.status === "submitted").length;
  const toProcess = feedback.filter((f) => !f.processedByStudent).length;

  return <>
    <PageHeader eyebrow="Mijn ontwikkeling" title={`Hoi ${profile.full_name.split(" ")[0]}`} description="Waar werk je naartoe, waar sta je nu en wat wordt je volgende stap?" />
    <section aria-label="Samenvatting" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard icon={BookCheck} value={`${completed} van ${assignments.length}`} label="opdrachten afgerond" hint="Afgerond zegt iets over de taak, niet automatisch over je leerdoel." />
      <SummaryCard icon={ClipboardList} value={String(assignments.length - completed)} label="opdrachten open" hint="Van nog niet gestart tot feedback verwerkt." />
      <SummaryCard icon={MessageSquareText} value={String(awaiting)} label="wachten op feedback" hint="Je docent is nu aan zet." />
      <SummaryCard icon={Target} value={String(toProcess)} label="feedback te verwerken" hint="Laat zien wat je met de aanwijzingen hebt gedaan." />
    </section>
    <div className="mt-9 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <section><div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-black">Mijn volgende acties</h2><p className="mt-1 text-sm text-slate-600">Begin bovenaan; daar ligt nu de meeste winst.</p></div></div><ActionList actions={actions} /></section>
      <section><div className="mb-4 flex items-end justify-between"><h2 className="text-xl font-black">Laatste feedback</h2><Link href="/student/opdrachten" className="text-sm font-bold text-teal-700 underline">Alles bekijken</Link></div>{feedback.length ? <div className="space-y-3">{feedback.slice(0,3).map((item)=><Link key={item.id} href={item.assignmentId ? `/student/opdrachten/${item.assignmentId}` : `/student/leerdoelen/${item.learningGoalId}`} className="card block p-4 hover:border-teal-300"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">{item.subject}</p>{!item.processedByStudent && <span className="rounded-full bg-fuchsia-50 px-2 py-1 text-xs font-bold text-fuchsia-900">Nog verwerken</span>}</div><p className="mt-2 line-clamp-2 text-sm text-slate-700">{item.feedbackText}</p><p className="mt-2 text-xs text-slate-500">{item.teacherName} · {formatDate(item.createdAt)}</p></Link>)}</div> : <EmptyState title="Nog geen feedback" description="Je hebt nog geen feedback ontvangen." />}</section>
    </div>
    <section className="mt-9"><div className="mb-4 flex items-end justify-between"><h2 className="text-xl font-black">Leerdoelen in beeld</h2><Link href="/student/leerdoelen" className="text-sm font-bold text-teal-700 underline">Alle leerdoelen</Link></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{goals.slice(0,6).map((goal)=><Link href={`/student/leerdoelen/${goal.learningGoalId}`} key={goal.id} className="card p-4 hover:border-teal-300"><StatusBadge value={goal.level} /><p className="mt-3 font-bold leading-snug">{goal.title}</p></Link>)}</div></section>
  </>;
}
