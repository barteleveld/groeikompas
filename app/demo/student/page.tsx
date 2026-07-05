"use client";

import { useState } from "react";
import { BookCheck, CheckCircle2, ChevronDown, ClipboardList, Layers3, MessageSquareText, Target } from "lucide-react";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status/status-badge";
import { useDemo } from "@/components/demo/demo-state";

function progressColor(status: string) {
  if (status === "Afgerond") return "bg-emerald-50 text-emerald-900";
  if (status === "Feedback ontvangen") return "bg-fuchsia-50 text-fuchsia-900";
  if (status === "Ingeleverd") return "bg-amber-50 text-amber-900";
  if (status === "Bezig") return "bg-blue-50 text-blue-900";
  return "bg-slate-100 text-slate-700";
}

export default function StudentDemo() {
  const { state, respond, addSubmission, markRead } = useDemo();
  const [response, setResponse] = useState(state.feedbackResponse);
  const [file, setFile] = useState("");
  const assignmentFeedback = state.assignmentFeedback.filter((item) => item.student === "Lina Bakker");
  const latestFeedback = assignmentFeedback.at(-1);
  const assignments = state.modules.flatMap((module) => module.assignments);
  const progress = state.assignmentProgress["Lina Bakker"] ?? {};
  const completedAssignments = assignments.filter((assignment) => progress[assignment] === "Afgerond").length;
  const activeAssignments = assignments.filter((assignment) => !["Nog niet gestart", "Afgerond"].includes(progress[assignment] ?? "Nog niet gestart")).length;
  const waitingForFeedback = assignments.filter((assignment) => progress[assignment] === "Ingeleverd").length;
  const totalProgress = assignments.length ? Math.round((completedAssignments / assignments.length) * 100) : 0;

  return (
    <>
      <PageHeader
        eyebrow="Mijn ontwikkeling"
        title="Hoi Lina"
        description="Waar werk je naartoe, waar sta je nu en wat wordt je volgende stap?"
        action={
          <a href="#modules" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800">
            <Layers3 className="size-4" aria-hidden />
            Mijn modules
          </a>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={BookCheck} value={`${completedAssignments} van ${assignments.length}`} label="opdrachten afgerond" hint={`${totalProgress}% van alle opdrachten is klaar.`} />
        <SummaryCard icon={ClipboardList} value={String(activeAssignments)} label="opdrachten bezig" hint="Hier kun je direct mee verder." />
        <SummaryCard icon={MessageSquareText} value={String(waitingForFeedback)} label="wacht op feedback" hint="Je docent is nu aan zet." />
        <SummaryCard icon={Target} value={state.feedbackResponse ? "0" : String(assignmentFeedback.length)} label="feedback te verwerken" hint="Laat zien wat je hebt aangepast." />
      </section>

      <section id="modules" className="mt-8 scroll-mt-6">
        <div className="mb-4">
          <p className="text-sm font-bold uppercase tracking-wider text-teal-700">Mijn opleiding</p>
          <h2 className="mt-1 text-2xl font-black">Mijn modules</h2>
          <p className="mt-1 text-sm text-slate-600">Nieuwe modules van je docent verschijnen hier automatisch.</p>
        </div>
        <details className="group overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm shadow-rose-950/5">
          <summary data-testid="modules-summary" className="flex cursor-pointer list-none flex-col gap-5 p-5 marker:content-none sm:p-6 lg:flex-row lg:items-center lg:justify-between [&::-webkit-details-marker]:hidden">
            <div className="flex min-w-0 items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-indigo-500 text-white shadow-sm"><Layers3 className="size-6" aria-hidden /></span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Totaaloverzicht</p>
                <h3 className="mt-1 text-xl font-black">{state.modules.length} modules Â· {assignments.length} opdrachten</h3>
                <p className="mt-1 text-sm text-slate-600">{completedAssignments} afgerond, {activeAssignments} bezig en {assignments.length - completedAssignments - activeAssignments} nog te starten</p>
              </div>
            </div>
            <div className="flex items-center gap-4 lg:min-w-72">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex justify-between text-xs font-bold"><span>Totale voortgang</span><span>{totalProgress}%</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-teal-600 to-indigo-500 transition-all" style={{ width: `${totalProgress}%` }} /></div>
              </div>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-50 text-teal-800 transition-transform group-open:rotate-180"><ChevronDown className="size-5" aria-hidden /></span>
            </div>
          </summary>

          <div className="border-t border-rose-100 bg-[#fffaf8] p-4 sm:p-6">
            <p className="mb-4 text-sm font-semibold text-slate-600">Open een module om de opdrachten en hun status te bekijken.</p>
            <div className="space-y-4">
              {state.modules.map((module) => {
                const moduleCompleted = module.assignments.filter((assignment) => progress[assignment] === "Afgerond").length;
                const moduleActive = module.assignments.filter((assignment) => !["Nog niet gestart", "Afgerond"].includes(progress[assignment] ?? "Nog niet gestart")).length;
                const moduleProgress = module.assignments.length ? Math.round((moduleCompleted / module.assignments.length) * 100) : 0;
                return (
                  <details className="group/module overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" key={module.id}>
                    <summary data-testid={`module-summary-${module.id}`} className="flex cursor-pointer list-none flex-col gap-4 p-5 marker:content-none md:flex-row md:items-center md:justify-between [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-teal-700">{module.period || "Doorlopend"}</p>
                        <h3 className="mt-1 text-lg font-black">{module.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{module.description || "Je docent heeft nog geen beschrijving toegevoegd."}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right"><p className="text-sm font-black">{moduleCompleted} van {module.assignments.length} klaar</p><p className="text-xs text-slate-500">{moduleActive ? `${moduleActive} bezig` : moduleCompleted === module.assignments.length && module.assignments.length ? "Module afgerond" : "Klaar om te starten"}</p></div>
                        <div className="grid size-11 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-700">{moduleProgress}%</div>
                        <ChevronDown className="size-5 text-slate-500 transition-transform group-open/module:rotate-180" aria-hidden />
                      </div>
                    </summary>

                    <div className="border-t border-slate-100 p-4 sm:p-5">
                      {module.assignments.length ? (
                        <ul className="space-y-3">
                          {module.assignments.map((assignment, index) => {
                            const status = progress[assignment] ?? "Nog niet gestart";
                            const feedback = assignmentFeedback.filter((item) => item.assignment === assignment).at(-1);
                            return (
                              <li className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={assignment}>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="flex min-w-0 items-start gap-3">
                                    <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-black ${status === "Afgerond" ? "bg-emerald-100 text-emerald-800" : "bg-white text-slate-500 shadow-sm"}`}>{status === "Afgerond" ? <CheckCircle2 className="size-4" aria-hidden /> : index + 1}</span>
                                    <div><p className="font-bold">{assignment}</p>{feedback && <p className="mt-1 text-xs font-semibold text-fuchsia-800">Feedback van je docent beschikbaar</p>}</div>
                                  </div>
                                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${progressColor(status)}`}>{status}</span>
                                </div>
                                {feedback && <div className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-700"><strong>Volgende stap:</strong> {feedback.nextStep}</div>}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">Nog geen opdrachten toegevoegd.</p>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </details>
      </section>

      <div className="mt-8 grid gap-7 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase text-fuchsia-800">{latestFeedback?.assignment ?? "DESTEP-analyse"}</p>
                <h2 className="mt-1 text-xl font-black">Feedback verwerken</h2>
              </div>
              <StatusBadge value={state.feedbackResponse ? "feedback_processed" : "feedback_received"} />
            </div>
            <p className="mt-4"><strong>Wat gaat al goed?</strong><br />{latestFeedback?.feedback ?? "Je hebt bruikbare trends gevonden en je bronnen zijn helder vermeld."}</p>
            <p className="mt-3 rounded-xl bg-fuchsia-50 p-3"><strong>Volgende stap:</strong><br />{latestFeedback?.nextStep ?? "Leg per trend uit wat deze concreet betekent voor de organisatie."}</p>
            {state.feedbackResponse ? (
              <div className="mt-4 rounded-xl bg-emerald-50 p-4"><strong>Jouw reactie:</strong><p className="mt-1">{state.feedbackResponse}</p></div>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); respond(response); }}>
                <label className="block text-sm font-bold">Wat heb je aangepast?<textarea className="field mt-1 min-h-24" value={response} onChange={(event) => setResponse(event.target.value)} required /></label>
                <button className="rounded-xl bg-fuchsia-800 px-4 py-2.5 font-bold text-white">Reactie opslaan</button>
              </form>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-xl font-black">Nieuwe versie inleveren</h2>
            <form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); if (file) { addSubmission(file); setFile(""); } }}>
              <label className="block text-sm font-bold">Kies een bestand<input className="field mt-1" type="file" onChange={(event) => setFile(event.target.files?.[0]?.name ?? "")} /></label>
              <button disabled={!file} className="rounded-xl bg-teal-700 px-4 py-2.5 font-bold text-white disabled:opacity-50">Versie inleveren</button>
            </form>
            <ul className="mt-4 space-y-2">{state.submissions.map((submission, index) => <li className="rounded-xl bg-slate-50 p-3 text-sm" key={`${submission}-${index}`}><strong>Versie {index + 1}</strong> Â· {submission}</li>)}</ul>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card p-5">
            <h2 className="font-black">Komende feedbackmomenten</h2>
            <div className="mt-3 space-y-3">{state.moments.slice(0, 3).map((moment) => <article className="rounded-xl bg-indigo-50 p-3" key={moment.id}><p className="text-xs font-bold text-indigo-800">{moment.date}</p><p className="mt-1 font-bold">{moment.title}</p></article>)}</div>
          </section>
          <section className="card p-5">
            <h2 className="font-black">Meldingen</h2>
            <div className="mt-3 space-y-2">{state.notifications.map((notification) => <button onClick={() => markRead(notification.id)} className={`block w-full rounded-xl p-3 text-left text-sm ${notification.read ? "bg-slate-50 text-slate-500" : "bg-amber-50 font-bold"}`} key={notification.id}>{notification.title}{!notification.read && <span className="ml-2 text-xs">Â· nieuw</span>}</button>)}</div>
          </section>
        </aside>
      </div>
    </>
  );
}

