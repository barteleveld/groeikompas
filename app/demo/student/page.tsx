"use client";

import { useEffect, useState } from "react";
import { BookCheck, CheckCircle2, ChevronDown, ClipboardList, History, Layers3, MessageSquareText, Target, Upload } from "lucide-react";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { PageHeader } from "@/components/layout/page-header";
import { useDemo } from "@/components/demo/demo-state";

function progressColor(status: string) {
  if (status === "Afgerond") return "bg-emerald-50 text-emerald-900";
  if (status === "Feedback ontvangen") return "bg-fuchsia-50 text-fuchsia-900";
  if (status === "Ingeleverd") return "bg-amber-50 text-amber-900";
  if (status === "Bezig") return "bg-blue-50 text-blue-900";
  return "bg-slate-100 text-slate-700";
}

function assignmentAnchor(assignment: string) {
  return `opdracht-${assignment.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

function revealAssignmentFromHash() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  if (!target) return;
  let current: HTMLElement | null = target;
  while (current) { if (current.tagName === "DETAILS") (current as HTMLDetailsElement).open = true; current = current.parentElement; }
  requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
}

export default function StudentDemo() {
  const { state, respond, addSubmission, markRead } = useDemo();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, string>>({});
  const assignmentFeedback = state.assignmentFeedback.filter((item) => item.student === "Lina Bakker");
  const visibleModules = state.modules.filter((module) => module.published && !module.archived && module.cohorts.includes("Marketing & Communicatie 4A")).map((module) => ({ ...module, assignments: module.assignments.filter((assignment) => !state.archivedAssignments.includes(assignment)) }));
  const assignments = visibleModules.flatMap((module) => module.assignments);
  const progress = state.assignmentProgress["Lina Bakker"] ?? {};
  const completedAssignments = assignments.filter((assignment) => progress[assignment] === "Afgerond").length;
  const activeAssignments = assignments.filter((assignment) => !["Nog niet gestart", "Afgerond"].includes(progress[assignment] ?? "Nog niet gestart")).length;
  const waitingForFeedback = assignments.filter((assignment) => progress[assignment] === "Ingeleverd").length;
  const feedbackToProcess = assignmentFeedback.filter((item) => !item.response).length;
  const totalProgress = assignments.length ? Math.round((completedAssignments / assignments.length) * 100) : 0;
  const completedItems = assignments.filter((assignment) => progress[assignment] === "Afgerond").map((assignment) => ({ label: assignment, href: `#${assignmentAnchor(assignment)}`, meta: "Afgerond" }));
  const activeItems = assignments.filter((assignment) => !["Nog niet gestart", "Afgerond"].includes(progress[assignment] ?? "Nog niet gestart")).map((assignment) => ({ label: assignment, href: `#${assignmentAnchor(assignment)}`, meta: progress[assignment] }));
  const waitingItems = assignments.filter((assignment) => progress[assignment] === "Ingeleverd").map((assignment) => ({ label: assignment, href: `#${assignmentAnchor(assignment)}`, meta: "Wacht op docent" }));
  const feedbackItems = assignmentFeedback.filter((item) => !item.response).map((item) => ({ label: item.assignment, href: `#${assignmentAnchor(item.assignment)}`, meta: "Nog reageren" }));

  useEffect(() => {
    window.addEventListener("hashchange", revealAssignmentFromHash); revealAssignmentFromHash();
    return () => window.removeEventListener("hashchange", revealAssignmentFromHash);
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Mijn ontwikkeling"
        title="Hoi Lina"
        description="Waar werk je naartoe, waar sta je nu en wat wordt je volgende stap?"
        action={<a href="#modules" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800"><Layers3 className="size-4" aria-hidden />Mijn modules</a>}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onClick={(event) => { if ((event.target as HTMLElement).closest('a[href^="#opdracht-"]')) requestAnimationFrame(revealAssignmentFromHash); }}>
        <SummaryCard icon={BookCheck} value={`${completedAssignments} van ${assignments.length}`} label="opdrachten afgerond" hint="Bekijk welke opdrachten klaar zijn." items={completedItems} emptyText="Je hebt nog geen opdrachten afgerond." />
        <SummaryCard icon={ClipboardList} value={String(activeAssignments)} label="opdrachten bezig" hint="Kies direct waar je mee verdergaat." items={activeItems} emptyText="Je hebt momenteel geen opdracht in uitvoering." />
        <SummaryCard icon={MessageSquareText} value={String(waitingForFeedback)} label="wacht op feedback" hint="Bekijk waarop je docent gaat reageren." items={waitingItems} emptyText="Er wachten nu geen opdrachten op feedback." />
        <SummaryCard icon={Target} value={String(feedbackToProcess)} label="feedback te verwerken" hint="Ga direct naar de feedback waarop je moet reageren." items={feedbackItems} emptyText="Je hebt alle ontvangen feedback verwerkt." />
      </section>

      <section id="modules" className="mt-8 scroll-mt-6">
        <div className="mb-4">
          <p className="text-sm font-bold uppercase tracking-wider text-teal-700">Mijn opleiding</p>
          <h2 className="mt-1 text-2xl font-black">Mijn modules</h2>
          <p className="mt-1 text-sm text-slate-600">Open een opdracht voor leerdoelen, feedback, reacties en ingeleverde versies.</p>
        </div>

        <details className="group overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm shadow-rose-950/5">
          <summary data-testid="modules-summary" className="flex cursor-pointer list-none flex-col gap-5 p-5 marker:content-none sm:p-6 lg:flex-row lg:items-center lg:justify-between [&::-webkit-details-marker]:hidden">
            <div className="flex min-w-0 items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-indigo-500 text-white shadow-sm"><Layers3 className="size-6" aria-hidden /></span>
              <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Totaaloverzicht</p><h3 className="mt-1 text-xl font-black">{visibleModules.length} modules · {assignments.length} opdrachten</h3><p className="mt-1 text-sm text-slate-600">{completedAssignments} afgerond, {activeAssignments} bezig en {assignments.length - completedAssignments - activeAssignments} nog te starten</p></div>
            </div>
            <div className="flex items-center gap-4 lg:min-w-72">
              <div className="min-w-0 flex-1"><div className="mb-1.5 flex justify-between text-xs font-bold"><span>Totale voortgang</span><span>{totalProgress}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-teal-600 to-indigo-500 transition-all" style={{ width: `${totalProgress}%` }} /></div></div>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-50 text-teal-800 transition-transform group-open:rotate-180"><ChevronDown className="size-5" aria-hidden /></span>
            </div>
          </summary>

          <div className="border-t border-rose-100 bg-[#fffaf8] p-4 sm:p-6">
            <p className="mb-4 text-sm font-semibold text-slate-600">Open een module en daarna een opdracht voor het volledige dossier.</p>
            <div className="space-y-4">
              {visibleModules.map((module) => {
                const moduleCompleted = module.assignments.filter((assignment) => progress[assignment] === "Afgerond").length;
                const moduleActive = module.assignments.filter((assignment) => !["Nog niet gestart", "Afgerond"].includes(progress[assignment] ?? "Nog niet gestart")).length;
                const moduleProgress = module.assignments.length ? Math.round((moduleCompleted / module.assignments.length) * 100) : 0;
                return (
                  <details className="group/module overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" key={module.id}>
                    <summary data-testid={`module-summary-${module.id}`} className="flex cursor-pointer list-none flex-col gap-4 p-5 marker:content-none md:flex-row md:items-center md:justify-between [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-teal-700">{module.period || "Doorlopend"}</p><h3 className="mt-1 text-lg font-black">{module.title}</h3><p className="mt-1 text-sm text-slate-600">{module.description || "Je docent heeft nog geen beschrijving toegevoegd."}</p></div>
                      <div className="flex shrink-0 items-center gap-3"><div className="text-right"><p className="text-sm font-black">{moduleCompleted} van {module.assignments.length} klaar</p><p className="text-xs text-slate-500">{moduleActive ? `${moduleActive} bezig` : moduleCompleted === module.assignments.length && module.assignments.length ? "Module afgerond" : "Klaar om te starten"}</p></div><div className="grid size-11 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-700">{moduleProgress}%</div><ChevronDown className="size-5 text-slate-500 transition-transform group-open/module:rotate-180" aria-hidden /></div>
                    </summary>

                    <div className="border-t border-slate-100 p-4 sm:p-5">
                      {module.assignments.length ? <div className="space-y-3">{module.assignments.map((assignment, index) => {
                        const status = progress[assignment] ?? "Nog niet gestart";
                        const feedbackHistory = assignmentFeedback.filter((item) => item.assignment === assignment);
                        const latestFeedback = feedbackHistory.at(-1);
                        const submissions = state.assignmentSubmissions[assignment] ?? [];
                        const goals = state.learningGoals[assignment] ?? [];
                        return (
                          <details id={assignmentAnchor(assignment)} className="group/assignment scroll-mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50" key={assignment}>
                            <summary data-testid={`assignment-summary-${assignmentAnchor(assignment)}`} className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                              <div className="flex min-w-0 items-start gap-3"><span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-black ${status === "Afgerond" ? "bg-emerald-100 text-emerald-800" : "bg-white text-slate-500 shadow-sm"}`}>{status === "Afgerond" ? <CheckCircle2 className="size-4" aria-hidden /> : index + 1}</span><div><p className="font-bold">{assignment}</p><p className="mt-1 text-xs text-slate-500">{goals.length} leerdoelen · {submissions.length} versies · {feedbackHistory.length} feedbackrondes</p>{latestFeedback && !latestFeedback.response && <p className="mt-1 text-xs font-semibold text-fuchsia-800">Feedback vraagt om een reactie</p>}</div></div>
                              <span className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${progressColor(status)}`}>{status}</span><ChevronDown className="size-4 text-slate-500 transition-transform group-open/assignment:rotate-180" aria-hidden /></span>
                            </summary>

                            <div className="space-y-5 border-t border-slate-200 bg-white p-4 sm:p-5">
                              <section><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Leerdoelen</p><div className="mt-2 flex flex-wrap gap-2">{goals.length ? goals.map((goal) => <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-900" key={goal}>{goal}</span>) : <span className="text-sm text-slate-500">Nog geen leerdoelen gekoppeld.</span>}</div></section>

                              <section>
                                <div className="flex items-center gap-2"><History className="size-4 text-fuchsia-800" aria-hidden /><h4 className="font-black">Feedbackgeschiedenis</h4></div>
                                {feedbackHistory.length ? <div className="mt-3 space-y-3">{feedbackHistory.map((feedback, feedbackIndex) => <article className="rounded-xl bg-fuchsia-50 p-4 text-sm" key={feedback.id}><div className="flex flex-wrap justify-between gap-2"><strong>Feedbackronde {feedbackIndex + 1}</strong><span className="text-xs text-slate-500">{feedback.createdAt}</span></div><p className="mt-3"><strong>Wat gaat al goed?</strong><br />{feedback.feedback}</p><p className="mt-3"><strong>Volgende stap:</strong><br />{feedback.nextStep}</p>{feedback.response ? <p className="mt-3 rounded-lg bg-emerald-50 p-3"><strong>Jouw reactie:</strong><br />{feedback.response}</p> : <form className="mt-3 space-y-3" onSubmit={(event) => { event.preventDefault(); const text = responses[feedback.id]?.trim(); if (text) { respond(feedback.id, text); setResponses((current) => ({ ...current, [feedback.id]: "" })); } }}><label className="block font-bold">Wat heb je aangepast?<textarea className="field mt-1 min-h-20 bg-white" value={responses[feedback.id] ?? ""} onChange={(event) => setResponses((current) => ({ ...current, [feedback.id]: event.target.value }))} required /></label><button className="rounded-xl bg-fuchsia-800 px-4 py-2.5 font-bold text-white">Reactie opslaan en afronden</button></form>}</article>)}</div> : <p className="mt-2 text-sm text-slate-500">Nog geen feedback ontvangen.</p>}
                              </section>

                              <section>
                                <div className="flex items-center gap-2"><Upload className="size-4 text-teal-700" aria-hidden /><h4 className="font-black">Versies</h4></div>
                                {submissions.length ? <ol className="mt-3 space-y-2">{submissions.map((submission, submissionIndex) => <li className="rounded-xl bg-slate-50 p-3 text-sm" key={`${submission}-${submissionIndex}`}><strong>Versie {submissionIndex + 1}</strong> · {submission}</li>)}</ol> : <p className="mt-2 text-sm text-slate-500">Nog niets ingeleverd.</p>}
                                <form className="mt-3 flex flex-col gap-3 rounded-xl border border-dashed border-teal-200 bg-teal-50/50 p-3 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); const file = files[assignment]; if (file) { addSubmission(assignment, file); setFiles((current) => ({ ...current, [assignment]: "" })); event.currentTarget.reset(); } }}><label className="min-w-0 flex-1 text-sm font-bold">Nieuwe versie<input className="field mt-1 bg-white" type="file" onChange={(event) => setFiles((current) => ({ ...current, [assignment]: event.target.files?.[0]?.name ?? "" }))} /></label><button disabled={!files[assignment]} className="min-h-11 rounded-xl bg-teal-700 px-4 font-bold text-white disabled:opacity-50">Versie inleveren</button></form>
                              </section>
                            </div>
                          </details>
                        );
                      })}</div> : <p className="text-sm text-slate-500">Nog geen opdrachten toegevoegd.</p>}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </details>
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <section className="card p-5"><h2 className="font-black">Komende feedbackmomenten</h2><div className="mt-3 space-y-3">{state.moments.slice(0, 3).map((moment) => <article className="rounded-xl bg-indigo-50 p-3" key={moment.id}><p className="text-xs font-bold text-indigo-800">{moment.date}</p><p className="mt-1 font-bold">{moment.title}</p></article>)}</div></section>
        <section className="card p-5"><h2 className="font-black">Meldingen</h2><div className="mt-3 space-y-2">{state.notifications.map((notification) => <a href={notification.assignment ? `#${assignmentAnchor(notification.assignment)}` : "#modules"} onClick={() => markRead(notification.id)} className={`block w-full rounded-xl p-3 text-left text-sm ${notification.read ? "bg-slate-50 text-slate-500" : "bg-amber-50 font-bold"}`} key={notification.id}>{notification.title}{!notification.read && <span className="ml-2 text-xs"> · nieuw</span>}<span className="mt-1 block text-xs font-bold text-teal-700">Bekijk opdracht →</span></a>)}</div></section>
      </div>
    </>
  );
}
