"use client";

import { useState } from "react";
import { Archive, ArrowDown, ArrowUp, Eye, EyeOff, MessageSquareText, Pencil, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  demoAssignmentStatuses,
  demoClasses,
  demoStudentClasses,
  demoStudents,
  type DemoAssignmentStatus,
  useDemo,
} from "@/components/demo/demo-state";

type Tab = "overzicht" | "feedback" | "assignments" | "modules" | "planning";

function statusColor(status: DemoAssignmentStatus) {
  if (status === "Afgerond") return "bg-emerald-50 text-emerald-900";
  if (status === "Feedback ontvangen") return "bg-fuchsia-50 text-fuchsia-900";
  if (status === "Ingeleverd") return "bg-amber-50 text-amber-900";
  if (status === "Bezig") return "bg-blue-50 text-blue-900";
  return "bg-slate-100 text-slate-700";
}

export default function TeacherDemo() {
  const { state, addModule, updateModule, addMoment, saveAssignmentFeedback, setAssignmentStatus, setModulePublished, archiveModule, moveAssignment, updateAssignmentGoals } = useDemo();
  const [tab, setTab] = useState<Tab>("overzicht");
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleMessage, setModuleMessage] = useState("");
  const [feedbackModuleId, setFeedbackModuleId] = useState("m1");
  const [feedbackAssignment, setFeedbackAssignment] = useState("DESTEP-analyse");
  const [feedbackClass, setFeedbackClass] = useState(demoClasses[0]);
  const [feedbackMessages, setFeedbackMessages] = useState<Record<string, string>>({});
  const [assignmentMessages, setAssignmentMessages] = useState<Record<string, string>>({});
  const [overviewClass, setOverviewClass] = useState("Alle klassen");
  const [overviewModuleId, setOverviewModuleId] = useState("");
  const [overviewAssignment, setOverviewAssignment] = useState("");
  const [overviewStatus, setOverviewStatus] = useState("Alle statussen");
  const [overviewGoal, setOverviewGoal] = useState("");

  const editingModule = state.modules.find((module) => module.id === editingModuleId);
  const feedbackModule = state.modules.find((module) => module.id === feedbackModuleId) ?? state.modules[0];
  const moduleAssignments = feedbackModule?.assignments ?? [];
  const classStudents = demoStudents.filter((student) => demoStudentClasses[student] === feedbackClass);
  const activeModules = state.modules.filter((module) => !module.archived);
  const overviewModule = state.modules.find((module) => module.id === overviewModuleId);
  const allAssignments = [...new Set(activeModules.flatMap((module) => module.assignments))];
  const overviewAssignments = (overviewModule?.assignments ?? allAssignments).filter((assignment) => !overviewGoal || state.learningGoals[assignment]?.includes(overviewGoal));
  const assignmentModules = allAssignments.map((assignment) => ({ assignment, module: activeModules.find((module) => module.assignments.includes(assignment)) }));
  const overviewStudents = demoStudents.filter((student) => {
    if (overviewClass !== "Alle klassen" && demoStudentClasses[student] !== overviewClass) return false;
    const status = overviewAssignment ? state.assignmentProgress[student]?.[overviewAssignment] ?? "Nog niet gestart" : state.studentStatus[student];
    return overviewStatus === "Alle statussen" || status === overviewStatus;
  });

  function openFeedback(student: string) {
    const currentModule = overviewModule ?? activeModules[0];
    setFeedbackModuleId(currentModule?.id ?? "");
    setFeedbackAssignment(overviewAssignment || currentModule?.assignments[0] || "");
    setFeedbackClass(demoStudentClasses[student] ?? demoClasses[0]);
    setTab("feedback");
    setFeedbackMessages({});
  }

  function chooseModule(moduleId: string) {
    const currentModule = state.modules.find((item) => item.id === moduleId);
    setFeedbackModuleId(moduleId);
    setFeedbackAssignment(currentModule?.assignments[0] ?? "");
    setFeedbackMessages({});
  }

  function chooseAssignment(assignment: string) {
    setFeedbackAssignment(assignment);
    setFeedbackMessages({});
  }

  function saveModule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const moduleData = {
      title: String(form.get("title")),
      description: String(form.get("description")),
      period: String(form.get("period")),
      assignments: String(form.get("assignments")).split(",").map((item) => item.trim()).filter(Boolean),
      published: form.get("published") === "on",
      archived: editingModule?.archived ?? false,
      cohorts: form.getAll("cohorts").map(String),
    };
    if (editingModule) {
      updateModule(editingModule.id, moduleData);
      setModuleMessage(`${moduleData.title} is bijgewerkt. Studenten zien de wijzigingen direct.`);
      setEditingModuleId(null);
    } else {
      addModule(moduleData);
      setModuleMessage(`${moduleData.title} is aangemaakt. Nieuwe opdrachten starten op ‘Nog niet gestart’.`);
    }
    event.currentTarget.reset();
  }

  function submitFeedback(student: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveAssignmentFeedback({
      student,
      assignment: feedbackAssignment,
      status: "Feedback ontvangen",
      feedback: String(form.get("feedback")),
      nextStep: String(form.get("nextStep")),
    });
    setFeedbackMessages((current) => ({ ...current, [student]: `Feedback voor ${student} is opgeslagen.` }));
    event.currentTarget.reset();
  }

  return (
    <>
      <PageHeader eyebrow="Docentoverzicht" title="Wie heeft nu wat nodig?" description="Volg de voortgang per klas, geef gerichte feedback en plan de volgende stap." />
      <div className="mb-6 flex flex-wrap gap-2">
        {([
          ["overzicht", "Voortgang"],
          ["feedback", "Feedback op opdracht"],
          ["assignments", "Opdrachten"],
          ["modules", "Modules"],
          ["planning", "Feedback plannen"],
        ] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${tab === id ? "bg-teal-700 text-white" : "border border-slate-300 bg-white"}`}>{label}</button>
        ))}
      </div>

      {tab === "overzicht" && (
        <div className="space-y-5">
          <section className="card p-5">
            <div><p className="text-xs font-bold uppercase tracking-wide text-teal-700">Gericht overzicht</p><h2 className="mt-1 text-xl font-black">Filter studenten die aandacht nodig hebben</h2></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <label className="text-sm font-bold">Klas<select className="field mt-1" value={overviewClass} onChange={(event) => setOverviewClass(event.target.value)}><option>Alle klassen</option>{demoClasses.map((className) => <option key={className}>{className}</option>)}</select></label>
              <label className="text-sm font-bold">Module<select className="field mt-1" value={overviewModuleId} onChange={(event) => { const selected = state.modules.find((item) => item.id === event.target.value); setOverviewModuleId(event.target.value); setOverviewAssignment(selected?.assignments[0] ?? ""); }}><option value="">Alle modules</option>{activeModules.map((module) => <option value={module.id} key={module.id}>{module.title}</option>)}</select></label>
              <label className="text-sm font-bold">Opdracht<select className="field mt-1" value={overviewAssignment} onChange={(event) => setOverviewAssignment(event.target.value)}><option value="">Alle opdrachten</option>{overviewAssignments.map((assignment) => <option key={assignment}>{assignment}</option>)}</select></label>
              <label className="text-sm font-bold">Leerdoel<select className="field mt-1" value={overviewGoal} onChange={(event) => { const goal = event.target.value; setOverviewGoal(goal); const available = (overviewModule?.assignments ?? allAssignments).filter((assignment) => !goal || state.learningGoals[assignment]?.includes(goal)); if (overviewAssignment && !available.includes(overviewAssignment)) setOverviewAssignment(available[0] ?? ""); }}><option value="">Alle leerdoelen</option>{state.goalCatalog.map((goal) => <option key={goal.id} value={goal.title}>{goal.title}</option>)}</select></label>
              <label className="text-sm font-bold">Status<select className="field mt-1" value={overviewStatus} onChange={(event) => setOverviewStatus(event.target.value)}><option>Alle statussen</option>{overviewAssignment ? demoAssignmentStatuses.map((status) => <option key={status}>{status}</option>) : [...new Set(Object.values(state.studentStatus))].map((status) => <option key={status}>{status}</option>)}</select></label>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-600">{overviewStudents.length} studenten gevonden{overviewAssignment ? ` voor ${overviewAssignment}` : ""}.</p>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50"><tr><th className="p-4">Student</th><th className="p-4">Klas</th><th className="p-4">{overviewAssignment ? "Opdrachtstatus" : "Signaal"}</th><th className="p-4">Actie</th></tr></thead>
              <tbody className="divide-y divide-slate-200">
                {overviewStudents.map((name) => {
                  const status = overviewAssignment ? state.assignmentProgress[name]?.[overviewAssignment] ?? "Nog niet gestart" : state.studentStatus[name];
                  return (
                  <tr key={name}>
                    <td className="p-4 font-black">{name}</td>
                    <td className="p-4 text-slate-600">{demoStudentClasses[name]}</td>
                    <td className="p-4">{overviewAssignment ? <select aria-label={`Status van ${name}`} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold" value={status} onChange={(event) => setAssignmentStatus(name, overviewAssignment, event.target.value as DemoAssignmentStatus)}>{demoAssignmentStatuses.map((item) => <option key={item}>{item}</option>)}</select> : <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-950">{status}</span>}</td>
                    <td className="p-4"><button onClick={() => openFeedback(name)} className="font-bold text-teal-700 underline">Feedback geven</button></td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            <section className="card h-fit p-5"><h2 className="font-black">Zo werkt opdrachtfeedback</h2><ol className="mt-3 space-y-3 text-sm text-slate-700"><li><strong>1.</strong> Kies eerst de module en opdracht.</li><li><strong>2.</strong> Filter daarna op klas of status.</li><li><strong>3.</strong> Pas een status direct aan of geef persoonlijke feedback.</li></ol></section>
          </div>
        </div>
      )}

      {tab === "feedback" && (
        <section>
          <div className="card mb-6 p-5">
            <div className="flex items-center gap-2"><MessageSquareText className="size-5 text-teal-700" aria-hidden /><h2 className="text-xl font-black">Feedback op dezelfde opdracht</h2></div>
            <p className="mt-1 text-sm text-slate-600">Kies één opdracht. Daarna geef je de studenten uit de gekozen klas onder elkaar persoonlijke feedback.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="text-sm font-bold">1. Module<select className="field mt-1" value={feedbackModule?.id ?? ""} onChange={(event) => chooseModule(event.target.value)}>{state.modules.map((module) => <option value={module.id} key={module.id}>{module.title}</option>)}</select></label>
              <label className="text-sm font-bold">2. Opdracht<select className="field mt-1" value={feedbackAssignment} onChange={(event) => chooseAssignment(event.target.value)} disabled={!moduleAssignments.length}>{moduleAssignments.map((assignment) => <option key={assignment}>{assignment}</option>)}</select></label>
              <label className="text-sm font-bold">3. Klas<select className="field mt-1" value={feedbackClass} onChange={(event) => { setFeedbackClass(event.target.value); setFeedbackMessages({}); }}>{demoClasses.map((className) => <option key={className}>{className}</option>)}</select></label>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div><p className="text-sm font-bold uppercase tracking-wider text-teal-700">{feedbackModule?.title}</p><h2 className="text-2xl font-black">{feedbackAssignment || "Nog geen opdracht"}</h2>{feedbackAssignment && <div className="mt-2 flex flex-wrap gap-2">{(state.learningGoals[feedbackAssignment] ?? []).map((goal) => <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-900" key={goal}>{goal}</span>)}</div>}</div>
            <p className="text-sm font-bold text-slate-600">{feedbackClass} · {classStudents.length} studenten</p>
          </div>

          {feedbackAssignment ? (
            <div className="space-y-4">
              {classStudents.map((student, index) => {
                const currentStatus = state.assignmentProgress[student]?.[feedbackAssignment] ?? "Nog niet gestart";
                return (
                  <form key={`${student}-${feedbackAssignment}`} className="card p-5" onSubmit={(event) => submitFeedback(student, event)}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Student {index + 1} van {classStudents.length}</p><h3 className="mt-1 text-lg font-black">{student}</h3></div>
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${statusColor(currentStatus)}`}>{currentStatus}</span>
                    </div>
                    <div className="mt-3 rounded-xl bg-fuchsia-50 px-3 py-2 text-sm font-semibold text-fuchsia-900">Na opslaan wordt de status automatisch <strong>Feedback ontvangen</strong>.</div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <label className="text-sm font-bold">Wat gaat al goed?<textarea className="field mt-1 min-h-24" name="feedback" required /></label>
                      <label className="text-sm font-bold">Volgende stap<textarea className="field mt-1 min-h-24" name="nextStep" required /></label>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 font-bold text-white"><Save className="size-4" aria-hidden />Opslaan voor {student.split(" ")[0]}</button>
                      {feedbackMessages[student] && <p role="status" className="text-sm font-bold text-emerald-800">{feedbackMessages[student]}</p>}
                    </div>
                  </form>
                );
              })}
            </div>
          ) : (
            <p className="card p-5 text-slate-600">Deze module bevat nog geen opdrachten. Voeg eerst een opdracht toe via Modules.</p>
          )}
        </section>
      )}

      {tab === "assignments" && (
        <section className="space-y-5">
          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Opdrachten beheren</p>
            <h2 className="mt-1 text-xl font-black">Leerdoelen aan opdrachten koppelen</h2>
            <p className="mt-1 text-sm text-slate-600">Open een opdracht, vink de passende leerdoelen aan en sla de koppeling op. Studenten zien deze doelen direct bij de opdracht.</p>
          </div>
          <div className="space-y-3">
            {assignmentModules.map(({ assignment, module }) => {
              const selectedGoals = state.learningGoals[assignment] ?? [];
              return (
                <details className="group card overflow-hidden" key={assignment}>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
                    <div><p className="font-black">{assignment}</p><p className="mt-1 text-sm text-slate-500">{module?.title ?? "Zonder module"} · {selectedGoals.length} leerdoelen gekoppeld</p></div>
                    <span className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-900 group-open:hidden">Aanpassen</span>
                  </summary>
                  <form className="border-t border-slate-200 p-5" onSubmit={(event) => { event.preventDefault(); const goals = new FormData(event.currentTarget).getAll("goals").map(String); updateAssignmentGoals(assignment, goals); setAssignmentMessages((current) => ({ ...current, [assignment]: "Leerdoelen opgeslagen. Studenten zien de wijziging direct." })); }}>
                    <fieldset><legend className="font-black">Kies leerdoelen</legend><div className="mt-3 grid gap-3 md:grid-cols-2">{state.goalCatalog.map((goal) => <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3" key={goal.id}><input className="mt-1 size-4 accent-teal-700" type="checkbox" name="goals" value={goal.title} defaultChecked={selectedGoals.includes(goal.title)} /><span><span className="block text-sm font-bold">{goal.title}</span><span className="mt-0.5 block text-xs text-slate-500">{goal.domain} · {goal.description}</span></span></label>)}</div></fieldset>
                    {!selectedGoals.length && <p className="mt-3 text-sm font-semibold text-amber-800">Aan deze opdracht zijn nog geen leerdoelen gekoppeld.</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-3"><button className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 font-bold text-white"><Save className="size-4" aria-hidden />Leerdoelen opslaan</button>{assignmentMessages[assignment] && <p role="status" className="text-sm font-bold text-emerald-800">{assignmentMessages[assignment]}</p>}</div>
                  </form>
                </details>
              );
            })}
          </div>
        </section>
      )}

      {tab === "modules" && (
        <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <form key={editingModule?.id ?? "new"} className="card h-fit space-y-4 p-5" onSubmit={saveModule}>
            <h2 className="text-xl font-black">{editingModule ? "Module aanpassen" : "Nieuwe module"}</h2>
            <label className="block text-sm font-bold">Titel<input className="field mt-1" name="title" defaultValue={editingModule?.title} required /></label>
            <label className="block text-sm font-bold">Beschrijving<textarea className="field mt-1" name="description" defaultValue={editingModule?.description} /></label>
            <label className="block text-sm font-bold">Periode<input className="field mt-1" name="period" defaultValue={editingModule?.period} placeholder="Periode 3" /></label>
            <label className="flex items-center gap-2 text-sm font-bold"><input className="size-4 accent-teal-700" type="checkbox" name="published" defaultChecked={editingModule?.published ?? true} />Direct zichtbaar voor studenten</label>
            <fieldset><legend className="text-sm font-bold">Beschikbaar voor klassen</legend><div className="mt-2 space-y-2 rounded-xl bg-slate-50 p-3">{demoClasses.map((className) => <label className="flex items-center gap-2 text-sm" key={className}><input type="checkbox" className="size-4 accent-teal-700" name="cohorts" value={className} defaultChecked={editingModule ? editingModule.cohorts.includes(className) : true} />{className}</label>)}</div></fieldset>
            <label className="block text-sm font-bold">Opdrachten <span className="font-normal text-slate-500">(gescheiden door komma’s)</span><input className="field mt-1" name="assignments" defaultValue={editingModule?.assignments.join(", ")} /></label>
            {moduleMessage && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900">{moduleMessage}</p>}
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 font-bold text-white"><Save className="size-4" aria-hidden />{editingModule ? "Wijzigingen opslaan" : "Module aanmaken"}</button>
              {editingModule && <button type="button" onClick={() => setEditingModuleId(null)} className="rounded-xl border border-slate-300 px-4 py-2.5 font-bold">Annuleren</button>}
            </div>
          </form>
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-black">Modules</h2><p className="text-sm text-slate-600">Beheer zichtbaarheid, volgorde en klassen.</p></div><span className="text-sm font-bold text-slate-500">{state.modules.filter((module) => module.archived).length} gearchiveerd</span></div>
            <div className="space-y-3">
              {state.modules.map((module) => (
                <article className={`card p-5 ${module.archived ? "opacity-65" : ""}`} key={module.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><span className="text-xs font-bold uppercase text-teal-700">{module.period || "Doorlopend"}</span><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${module.archived ? "bg-slate-100 text-slate-600" : module.published ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>{module.archived ? "Gearchiveerd" : module.published ? "Zichtbaar" : "Concept"}</span></div><h3 className="mt-1 font-black">{module.title}</h3><p className="mt-1 text-sm text-slate-600">{module.description}</p><p className="mt-2 text-xs font-semibold text-slate-500">{module.cohorts.length ? module.cohorts.join(" · ") : "Nog niet aan een klas gekoppeld"}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setModulePublished(module.id, !module.published)} disabled={module.archived} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-40">{module.published ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}{module.published ? "Verbergen" : "Publiceren"}</button><button onClick={() => { setEditingModuleId(module.id); setModuleMessage(""); }} disabled={module.archived} className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-900 disabled:opacity-40"><Pencil className="size-4" aria-hidden />Aanpassen</button><button onClick={() => archiveModule(module.id)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"><Archive className="size-4" aria-hidden />{module.archived ? "Herstellen" : "Archiveren"}</button></div></div>
                  {!module.archived && <div className="mt-4 border-t border-slate-100 pt-4"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Opdrachten in volgorde</p>{module.assignments.length ? <ol className="space-y-2">{module.assignments.map((assignment, index) => <li className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 text-sm" key={assignment}><span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-teal-800">{index + 1}</span><span className="min-w-0 flex-1 font-semibold">{assignment}</span><button aria-label={`${assignment} omhoog`} disabled={index === 0} onClick={() => moveAssignment(module.id, assignment, -1)} className="rounded-lg border border-slate-200 bg-white p-1.5 disabled:opacity-30"><ArrowUp className="size-4" aria-hidden /></button><button aria-label={`${assignment} omlaag`} disabled={index === module.assignments.length - 1} onClick={() => moveAssignment(module.id, assignment, 1)} className="rounded-lg border border-slate-200 bg-white p-1.5 disabled:opacity-30"><ArrowDown className="size-4" aria-hidden /></button></li>)}</ol> : <p className="text-sm text-slate-500">Nog geen opdrachten toegevoegd.</p>}</div>}
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "planning" && (
        <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <form className="card h-fit space-y-4 p-5" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); addMoment({ title: String(form.get("title")), date: String(form.get("date")), kind: String(form.get("kind")), cohort: "Marketing 4A" }); event.currentTarget.reset(); }}>
            <h2 className="text-xl font-black">Feedbackmoment plannen</h2>
            <label className="block text-sm font-bold">Titel<input className="field mt-1" name="title" required /></label>
            <label className="block text-sm font-bold">Datum en tijd<input className="field mt-1" type="datetime-local" name="date" required /></label>
            <label className="block text-sm font-bold">Soort<select className="field mt-1" name="kind"><option>Snelle check</option><option>Feedback van docent</option><option>Feedback van medestudent</option><option>Voortgangsgesprek</option></select></label>
            <button className="rounded-xl bg-teal-700 px-4 py-2.5 font-bold text-white">Moment plannen</button>
          </form>
          <section><h2 className="mb-4 text-xl font-black">Planning</h2><div className="space-y-3">{state.moments.map((moment) => <article className="card p-5" key={moment.id}><p className="text-xs font-bold uppercase text-indigo-700">{moment.kind} · {moment.cohort}</p><h3 className="mt-1 font-black">{moment.title}</h3><p className="mt-2 text-sm text-slate-600">{moment.date}</p></article>)}</div></section>
        </div>
      )}
    </>
  );
}
