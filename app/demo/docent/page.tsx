"use client";

import { useState } from "react";
import { MessageSquareText, Pencil, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  demoAssignmentStatuses,
  demoClasses,
  demoStudentClasses,
  demoStudents,
  type DemoAssignmentStatus,
  useDemo,
} from "@/components/demo/demo-state";

type Tab = "overzicht" | "feedback" | "modules" | "planning";

function statusColor(status: DemoAssignmentStatus) {
  if (status === "Afgerond") return "bg-emerald-50 text-emerald-900";
  if (status === "Feedback ontvangen") return "bg-fuchsia-50 text-fuchsia-900";
  if (status === "Ingeleverd") return "bg-amber-50 text-amber-900";
  if (status === "Bezig") return "bg-blue-50 text-blue-900";
  return "bg-slate-100 text-slate-700";
}

export default function TeacherDemo() {
  const { state, addModule, updateModule, addMoment, saveAssignmentFeedback } = useDemo();
  const [tab, setTab] = useState<Tab>("overzicht");
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleMessage, setModuleMessage] = useState("");
  const [feedbackModuleId, setFeedbackModuleId] = useState("m1");
  const [feedbackAssignment, setFeedbackAssignment] = useState("DESTEP-analyse");
  const [feedbackClass, setFeedbackClass] = useState(demoClasses[0]);
  const [feedbackMessages, setFeedbackMessages] = useState<Record<string, string>>({});

  const editingModule = state.modules.find((module) => module.id === editingModuleId);
  const feedbackModule = state.modules.find((module) => module.id === feedbackModuleId) ?? state.modules[0];
  const moduleAssignments = feedbackModule?.assignments ?? [];
  const classStudents = demoStudents.filter((student) => demoStudentClasses[student] === feedbackClass);

  function openFeedback(student: string) {
    const currentModule = state.modules[0];
    setFeedbackModuleId(currentModule?.id ?? "");
    setFeedbackAssignment(currentModule?.assignments[0] ?? "");
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
    };
    if (editingModule) {
      updateModule(editingModule.id, moduleData);
      setModuleMessage(`${moduleData.title} is bijgewerkt. Studenten zien de wijzigingen direct.`);
      setEditingModuleId(null);
    } else {
      addModule(moduleData);
      setModuleMessage(`${moduleData.title} is aangemaakt. Nieuwe opdrachten starten op â€˜Nog niet gestartâ€™.`);
    }
    event.currentTarget.reset();
  }

  function submitFeedback(student: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    saveAssignmentFeedback({
      student,
      assignment: feedbackAssignment,
      status: String(form.get("status")) as DemoAssignmentStatus,
      feedback: String(form.get("feedback")),
      nextStep: String(form.get("nextStep")),
    });
    setFeedbackMessages((current) => ({ ...current, [student]: `Feedback voor ${student} is opgeslagen.` }));
    event.currentTarget.reset();
  }

  return (
    <>
      <PageHeader eyebrow="Docentoverzicht" title="Wie heeft nu wat nodig?" description="Probeer alles uit. Je wijzigingen blijven bewaard op deze computer." />
      <div className="mb-6 flex flex-wrap gap-2">
        {([
          ["overzicht", "Voortgang"],
          ["feedback", "Feedback op opdracht"],
          ["modules", "Modules"],
          ["planning", "Feedback plannen"],
        ] as [Tab, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${tab === id ? "bg-teal-700 text-white" : "border border-slate-300 bg-white"}`}>{label}</button>
        ))}
      </div>

      {tab === "overzicht" && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50"><tr><th className="p-4">Student</th><th className="p-4">Signaal</th><th className="p-4">Actie</th></tr></thead>
              <tbody className="divide-y divide-slate-200">
                {demoStudents.map((name) => (
                  <tr key={name}>
                    <td className="p-4 font-black">{name}</td>
                    <td className="p-4"><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-950">{state.studentStatus[name]}</span></td>
                    <td className="p-4"><button onClick={() => openFeedback(name)} className="font-bold text-teal-700 underline">Feedback geven</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section className="card h-fit p-5">
            <h2 className="font-black">Zo werkt opdrachtfeedback</h2>
            <ol className="mt-3 space-y-3 text-sm text-slate-700">
              <li><strong>1.</strong> Kies eerst de module en opdracht.</li>
              <li><strong>2.</strong> Filter daarna op klas.</li>
              <li><strong>3.</strong> Geef de studenten onder elkaar individuele feedback.</li>
            </ol>
          </section>
        </div>
      )}

      {tab === "feedback" && (
        <section>
          <div className="card mb-6 p-5">
            <div className="flex items-center gap-2"><MessageSquareText className="size-5 text-teal-700" aria-hidden /><h2 className="text-xl font-black">Feedback op dezelfde opdracht</h2></div>
            <p className="mt-1 text-sm text-slate-600">Kies Ã©Ã©n opdracht. Daarna geef je de studenten uit de gekozen klas onder elkaar persoonlijke feedback.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="text-sm font-bold">1. Module<select className="field mt-1" value={feedbackModule?.id ?? ""} onChange={(event) => chooseModule(event.target.value)}>{state.modules.map((module) => <option value={module.id} key={module.id}>{module.title}</option>)}</select></label>
              <label className="text-sm font-bold">2. Opdracht<select className="field mt-1" value={feedbackAssignment} onChange={(event) => chooseAssignment(event.target.value)} disabled={!moduleAssignments.length}>{moduleAssignments.map((assignment) => <option key={assignment}>{assignment}</option>)}</select></label>
              <label className="text-sm font-bold">3. Klas<select className="field mt-1" value={feedbackClass} onChange={(event) => { setFeedbackClass(event.target.value); setFeedbackMessages({}); }}>{demoClasses.map((className) => <option key={className}>{className}</option>)}</select></label>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div><p className="text-sm font-bold uppercase tracking-wider text-teal-700">{feedbackModule?.title}</p><h2 className="text-2xl font-black">{feedbackAssignment || "Nog geen opdracht"}</h2></div>
            <p className="text-sm font-bold text-slate-600">{feedbackClass} Â· {classStudents.length} studenten</p>
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
                    <div className="mt-4 grid gap-4 lg:grid-cols-[.65fr_1fr_1fr]">
                      <label className="text-sm font-bold">Status<select className="field mt-1" name="status" defaultValue={currentStatus}>{demoAssignmentStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
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

      {tab === "modules" && (
        <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <form key={editingModule?.id ?? "new"} className="card h-fit space-y-4 p-5" onSubmit={saveModule}>
            <h2 className="text-xl font-black">{editingModule ? "Module aanpassen" : "Nieuwe module"}</h2>
            <label className="block text-sm font-bold">Titel<input className="field mt-1" name="title" defaultValue={editingModule?.title} required /></label>
            <label className="block text-sm font-bold">Beschrijving<textarea className="field mt-1" name="description" defaultValue={editingModule?.description} /></label>
            <label className="block text-sm font-bold">Periode<input className="field mt-1" name="period" defaultValue={editingModule?.period} placeholder="Periode 3" /></label>
            <label className="block text-sm font-bold">Opdrachten <span className="font-normal text-slate-500">(gescheiden door kommaâ€™s)</span><input className="field mt-1" name="assignments" defaultValue={editingModule?.assignments.join(", ")} /></label>
            {moduleMessage && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900">{moduleMessage}</p>}
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 font-bold text-white"><Save className="size-4" aria-hidden />{editingModule ? "Wijzigingen opslaan" : "Module aanmaken"}</button>
              {editingModule && <button type="button" onClick={() => setEditingModuleId(null)} className="rounded-xl border border-slate-300 px-4 py-2.5 font-bold">Annuleren</button>}
            </div>
          </form>
          <section>
            <h2 className="mb-4 text-xl font-black">Modules</h2>
            <div className="space-y-3">
              {state.modules.map((module) => (
                <article className="card flex flex-wrap items-start justify-between gap-4 p-5" key={module.id}>
                  <div><p className="text-xs font-bold uppercase text-teal-700">{module.period || "Doorlopend"}</p><h3 className="mt-1 font-black">{module.title}</h3><p className="mt-1 text-sm text-slate-600">{module.description}</p><p className="mt-3 text-sm font-bold">{module.assignments.length} opdrachten</p></div>
                  <button onClick={() => { setEditingModuleId(module.id); setModuleMessage(""); }} className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-900"><Pencil className="size-4" aria-hidden />Aanpassen</button>
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
          <section><h2 className="mb-4 text-xl font-black">Planning</h2><div className="space-y-3">{state.moments.map((moment) => <article className="card p-5" key={moment.id}><p className="text-xs font-bold uppercase text-indigo-700">{moment.kind} Â· {moment.cohort}</p><h3 className="mt-1 font-black">{moment.title}</h3><p className="mt-2 text-sm text-slate-600">{moment.date}</p></article>)}</div></section>
        </div>
      )}
    </>
  );
}

