"use client";

import { useState } from "react";
import { BookCheck, ClipboardList, Layers3, MessageSquareText, Target } from "lucide-react";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status/status-badge";
import { useDemo } from "@/components/demo/demo-state";

export default function StudentDemo() {
  const { state, respond, addSubmission, markRead } = useDemo();
  const [response, setResponse] = useState(state.feedbackResponse);
  const [file, setFile] = useState("");

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
        <SummaryCard icon={BookCheck} value="2 van 6" label="opdrachten afgerond" hint="Taken en leerdoelen blijven apart." />
        <SummaryCard icon={ClipboardList} value="4" label="opdrachten open" hint="Je ziet steeds wat hierna komt." />
        <SummaryCard icon={MessageSquareText} value="1" label="wacht op feedback" hint="Je docent is nu aan zet." />
        <SummaryCard icon={Target} value={state.feedbackResponse ? "0" : "1"} label="feedback te verwerken" hint="Laat zien wat je hebt aangepast." />
      </section>

      <section id="modules" className="mt-8 scroll-mt-6">
        <div className="mb-4">
          <p className="text-sm font-bold uppercase tracking-wider text-teal-700">Mijn opleiding</p>
          <h2 className="mt-1 text-2xl font-black">Mijn modules</h2>
          <p className="mt-1 text-sm text-slate-600">Nieuwe modules van je docent verschijnen hier automatisch.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.modules.map((module) => (
            <article className="card overflow-hidden" key={module.id}>
              <div className="h-1.5 bg-gradient-to-r from-teal-600 to-indigo-500" />
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-teal-700">{module.period || "Doorlopend"}</p>
                <h3 className="mt-1 text-lg font-black">{module.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{module.description || "Je docent heeft nog geen beschrijving toegevoegd."}</p>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Opdrachten</p>
                  {module.assignments.length ? (
                    <ul className="mt-2 space-y-2">
                      {module.assignments.map((assignment) => (
                        <li className="flex items-start gap-2 text-sm font-semibold" key={assignment}>
                          <BookCheck className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden />
                          {assignment}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">Nog geen opdrachten toegevoegd.</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-7 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase text-fuchsia-800">DESTEP-analyse</p>
                <h2 className="mt-1 text-xl font-black">Feedback verwerken</h2>
              </div>
              <StatusBadge value={state.feedbackResponse ? "feedback_processed" : "feedback_received"} />
            </div>
            <p className="mt-4"><strong>Wat gaat al goed?</strong><br />Je hebt bruikbare trends gevonden en je bronnen zijn helder vermeld.</p>
            <p className="mt-3 rounded-xl bg-fuchsia-50 p-3"><strong>Volgende stap:</strong><br />Leg per trend uit wat deze concreet betekent voor de organisatie.</p>
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

