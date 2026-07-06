"use client";

import { useState } from "react";
import { Archive, ArrowDown, ArrowUp, ArrowUpDown, Eye, EyeOff, MessageSquareText, Pencil, Save } from "lucide-react";
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
type SortKey = "student" | "className" | "module" | "assignment" | "goal" | "status";
type SortState = { key: SortKey; direction: "asc" | "desc" };
type AttentionReason = "Wacht op feedback" | "Feedback nog niet verwerkt" | "Niets ingeleverd" | "Deadline verlopen" | "Leerdoel nog niet zichtbaar";

const attentionReasons: AttentionReason[] = ["Wacht op feedback", "Feedback nog niet verwerkt", "Niets ingeleverd", "Deadline verlopen", "Leerdoel nog niet zichtbaar"];
const assignmentDeadlines: Record<string, string> = {
  "DESTEP-analyse": "2026-07-05",
  "SWOT-analyse": "2026-07-12",
  "Doelgroepanalyse": "2026-07-19",
  "Adviesposter": "2026-07-26",
  "Adviespresentatie": "2026-08-02",
};

function SortButton({ column, label, sort, onSort }: { column: SortKey; label: string; sort: SortState; onSort: (key: SortKey) => void }) {
  const active = sort.key === column;
  return <button type="button" onClick={() => onSort(column)} className="inline-flex min-h-11 items-center gap-1.5 font-black text-slate-800" aria-label={`Sorteer op ${label}${active ? sort.direction === "asc" ? ", aflopend" : ", oplopend" : ""}`}>{label}<ArrowUpDown className={`size-4 ${active ? "text-teal-700" : "text-slate-400"}`} aria-hidden /></button>;
}

function statusColor(status: DemoAssignmentStatus) {
  if (status === "Afgerond") return "bg-emerald-50 text-emerald-900";
  if (status === "Feedback ontvangen") return "bg-fuchsia-50 text-fuchsia-900";
  if (status === "Ingeleverd") return "bg-amber-50 text-amber-900";
  if (status === "Bezig") return "bg-blue-50 text-blue-900";
  return "bg-slate-100 text-slate-700";
}

export default function TeacherDemo() {
  const { state, addModule, updateModule, addMoment, saveAssignmentFeedback, setAssignmentStatus, setModulePublished, archiveModule, moveAssignment, updateAssignmentGoals, toggleAssignmentArchive } = useDemo();
  const [tab, setTab] = useState<Tab>("overzicht");
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleMessage, setModuleMessage] = useState("");
  const [feedbackModuleId, setFeedbackModuleId] = useState("m1");
  const [feedbackAssignment, setFeedbackAssignment] = useState("DESTEP-analyse");
  const [feedbackClass, setFeedbackClass] = useState(demoClasses[0]);
  const [feedbackMessages, setFeedbackMessages] = useState<Record<string, string>>({});
  const [assignmentMessages, setAssignmentMessages] = useState<Record<string, string>>({});
  const [overviewClass, setOverviewClass] = useState("Alle klassen");
  const [overviewStudent, setOverviewStudent] = useState("");
  const [overviewModuleId, setOverviewModuleId] = useState("");
  const [overviewAssignment, setOverviewAssignment] = useState("");
  const [overviewStatus, setOverviewStatus] = useState("Alle statussen");
  const [overviewGoal, setOverviewGoal] = useState("");
  const [overviewAttention, setOverviewAttention] = useState("Vandaag aandacht nodig");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<DemoAssignmentStatus>("Feedback ontvangen");
  const [bulkMessage, setBulkMessage] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "student", direction: "asc" });

  const editingModule = state.modules.find((module) => module.id === editingModuleId);
  const feedbackModule = state.modules.find((module) => module.id === feedbackModuleId) ?? state.modules[0];
  const moduleAssignments = feedbackModule?.assignments ?? [];
  const classStudents = demoStudents.filter((student) => demoStudentClasses[student] === feedbackClass);
  const activeModules = state.modules.filter((module) => !module.archived);
  const overviewModule = state.modules.find((module) => module.id === overviewModuleId);
  const allKnownAssignments = [...new Set(state.modules.flatMap((module) => module.assignments))];
  const allAssignments = [...new Set(activeModules.flatMap((module) => module.assignments))].filter((assignment) => !state.archivedAssignments.includes(assignment));
  const overviewAssignments = (overviewModule?.assignments ?? allAssignments).filter((assignment) => !overviewGoal || state.learningGoals[assignment]?.includes(overviewGoal));
  const assignmentModules = allKnownAssignments.map((assignment) => ({ assignment, module: state.modules.find((module) => module.assignments.includes(assignment)) }));
  const overviewRows = demoStudents.flatMap((student) => {
    if (overviewStudent && student !== overviewStudent) return [];
    if (overviewClass !== "Alle klassen" && demoStudentClasses[student] !== overviewClass) return [];
    return overviewAssignments.flatMap((assignment) => {
      if (overviewAssignment && assignment !== overviewAssignment) return [];
      const moduleRecord = activeModules.find((item) => item.assignments.includes(assignment));
      const status = state.assignmentProgress[student]?.[assignment] ?? "Nog niet gestart";
      if (overviewStatus !== "Alle statussen" && status !== overviewStatus) return [];
      const goals = state.learningGoals[assignment] ?? [];
      const deadline = assignmentDeadlines[assignment] ?? "2026-08-31";
      const reasons: AttentionReason[] = [];
      if (status === "Ingeleverd") reasons.push("Wacht op feedback");
      if (status === "Feedback ontvangen") reasons.push("Feedback nog niet verwerkt");
      if (status === "Nog niet gestart") reasons.push("Niets ingeleverd");
      if (deadline < "2026-07-06" && status !== "Afgerond") reasons.push("Deadline verlopen");
      if (goals.length && status === "Nog niet gestart") reasons.push("Leerdoel nog niet zichtbaar");
      if (overviewAttention === "Vandaag aandacht nodig" && !reasons.length) return [];
      if (overviewAttention !== "Vandaag aandacht nodig" && overviewAttention !== "Alle aandachtspunten" && !reasons.includes(overviewAttention as AttentionReason)) return [];
      return [{ id: `${student}-${assignment}`, student, className: demoStudentClasses[student], module: moduleRecord?.title ?? "Zonder module", moduleId: moduleRecord?.id ?? "", assignment, goal: goals.join(", ") || "Nog niet gekoppeld", status, deadline, reasons }];
    });
  }).sort((left, right) => {
    const result = String(left[sort.key]).localeCompare(String(right[sort.key]), "nl", { sensitivity: "base" });
    return sort.direction === "asc" ? result : -result;
  });
  const hasOverviewFilter = true;

  function changeSort(key: SortKey) {
    setSort((current) => current.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" });
  }

  function clearOverviewFilters() {
    setOverviewClass("Alle klassen"); setOverviewStudent(""); setOverviewModuleId(""); setOverviewAssignment(""); setOverviewGoal(""); setOverviewStatus("Alle statussen"); setOverviewAttention("Vandaag aandacht nodig"); setSelectedRows([]); setBulkMessage("");
  }

  function applyBulkStatus() {
    overviewRows.filter((row) => selectedRows.includes(row.id)).forEach((row) => setAssignmentStatus(row.student, row.assignment, bulkStatus));
    setBulkMessage(`${selectedRows.length} geselecteerde regels zijn bijgewerkt naar ${bulkStatus}.`);
    setSelectedRows([]);
  }

  function openFeedback(student: string, assignment = overviewAssignment, moduleId = overviewModuleId) {
    const currentModule = state.modules.find((module) => module.id === moduleId) ?? overviewModule ?? activeModules[0];
    setFeedbackModuleId(currentModule?.id ?? "");
    setFeedbackAssignment(assignment || currentModule?.assignments[0] || "");
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
      <nav aria-label="Docentwerkzaamheden" className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto]">
        <section className="rounded-2xl border border-rose-100 bg-white p-3"><p className="mb-2 px-1 text-xs font-black uppercase tracking-wide text-teal-700">Dagelijks werken</p><div className="flex flex-wrap gap-2">{([['overzicht','Voortgang bekijken'],['feedback','Feedback geven'],['planning','Feedback plannen']] as [Tab,string][]).map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={`min-h-11 rounded-xl px-4 py-2.5 text-sm font-bold ${tab===id?"bg-teal-700 text-white":"border border-slate-300 bg-white"}`}>{label}</button>)}</div></section>
        <section className="rounded-2xl border border-orange-100 bg-orange-50/60 p-3"><p className="mb-2 px-1 text-xs font-black uppercase tracking-wide text-orange-800">Bouwen & beheren</p><div className="flex flex-wrap gap-2">{([['assignments','Opdrachten beheren'],['modules','Modules beheren']] as [Tab,string][]).map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={`min-h-11 rounded-xl px-4 py-2.5 text-sm font-bold ${tab===id?"bg-orange-600 text-white":"border border-orange-200 bg-white text-slate-800"}`}>{label}</button>)}</div></section>
      </nav>

      {tab === "overzicht" && (
        <div className="space-y-5">
          <section className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-teal-700">Dagelijks werken</p><h2 className="mt-1 text-xl font-black">Vandaag aandacht nodig</h2><p className="mt-1 text-sm text-slate-600">Je ziet direct waar een actie van jou of de student nodig is.</p></div><button type="button" onClick={clearOverviewFilters} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold">Filters herstellen</button></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm font-bold">Aandachtspunt<select className="field mt-1" value={overviewAttention} onChange={(event) => { setOverviewAttention(event.target.value); setSelectedRows([]); }}><option>Vandaag aandacht nodig</option><option>Alle aandachtspunten</option>{attentionReasons.map((reason) => <option key={reason}>{reason}</option>)}</select></label>
              <label className="text-sm font-bold">Student<select className="field mt-1" value={overviewStudent} onChange={(event) => setOverviewStudent(event.target.value)}><option value="">Alle studenten</option>{demoStudents.filter((student) => overviewClass === "Alle klassen" || demoStudentClasses[student] === overviewClass).map((student) => <option key={student}>{student}</option>)}</select></label>
              <label className="text-sm font-bold">Klas<select className="field mt-1" value={overviewClass} onChange={(event) => { setOverviewClass(event.target.value); if (overviewStudent && event.target.value !== "Alle klassen" && demoStudentClasses[overviewStudent] !== event.target.value) setOverviewStudent(""); }}><option>Alle klassen</option>{demoClasses.map((className) => <option key={className}>{className}</option>)}</select></label>
              <label className="text-sm font-bold">Module<select className="field mt-1" value={overviewModuleId} onChange={(event) => { setOverviewModuleId(event.target.value); const selected = state.modules.find((item) => item.id === event.target.value); if (overviewAssignment && !selected?.assignments.includes(overviewAssignment)) setOverviewAssignment(""); }}><option value="">Alle modules</option>{activeModules.map((module) => <option value={module.id} key={module.id}>{module.title}</option>)}</select></label>
              <label className="text-sm font-bold">Opdracht<select className="field mt-1" value={overviewAssignment} onChange={(event) => setOverviewAssignment(event.target.value)}><option value="">Alle opdrachten</option>{overviewAssignments.map((assignment) => <option key={assignment}>{assignment}</option>)}</select></label>
              <label className="text-sm font-bold">Leerdoel<select className="field mt-1" value={overviewGoal} onChange={(event) => { const goal = event.target.value; setOverviewGoal(goal); const available = (overviewModule?.assignments ?? allAssignments).filter((assignment) => !goal || state.learningGoals[assignment]?.includes(goal)); if (overviewAssignment && !available.includes(overviewAssignment)) setOverviewAssignment(""); }}><option value="">Alle leerdoelen</option>{state.goalCatalog.filter((goal) => !goal.archived).map((goal) => <option key={goal.id} value={goal.title}>{goal.title}</option>)}</select></label>
              <label className="text-sm font-bold">Status<select className="field mt-1" value={overviewStatus} onChange={(event) => setOverviewStatus(event.target.value)}><option>Alle statussen</option>{demoAssignmentStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div><h2 className="text-xl font-black">Resultaten</h2><p className="text-sm font-semibold text-slate-600">{overviewRows.length} regels gevonden. Selecteer regels om ze samen bij te werken.</p></div>
              <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-teal-200 bg-teal-50 p-3"><label className="text-xs font-black text-teal-900">Bulkactie<select className="mt-1 block min-h-10 rounded-lg border border-teal-200 bg-white px-2 text-sm" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as DemoAssignmentStatus)}>{demoAssignmentStatuses.map((status) => <option key={status}>{status}</option>)}</select></label><button type="button" disabled={!selectedRows.length} onClick={applyBulkStatus} className="min-h-10 rounded-lg bg-teal-700 px-3 text-sm font-bold text-white disabled:opacity-40">{selectedRows.length ? `${selectedRows.length} bijwerken` : "Selecteer regels"}</button></div>
            </div>
            {bulkMessage && <p role="status" className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900">{bulkMessage}</p>}
            {overviewRows.length ? <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[1380px] text-left text-sm">
              <thead className="bg-slate-50"><tr><th className="p-4"><input type="checkbox" className="size-5 accent-teal-700" aria-label="Alle resultaten selecteren" checked={overviewRows.every((row) => selectedRows.includes(row.id))} onChange={(event) => setSelectedRows(event.target.checked ? overviewRows.map((row) => row.id) : [])} /></th><th className="px-4"><SortButton column="student" label="Student" sort={sort} onSort={changeSort} /></th><th className="px-4"><SortButton column="className" label="Klas" sort={sort} onSort={changeSort} /></th><th className="px-4"><SortButton column="module" label="Module" sort={sort} onSort={changeSort} /></th><th className="px-4"><SortButton column="assignment" label="Opdracht" sort={sort} onSort={changeSort} /></th><th className="p-4">Aandacht nodig</th><th className="p-4">Deadline</th><th className="px-4"><SortButton column="status" label="Status" sort={sort} onSort={changeSort} /></th><th className="p-4">Actie</th></tr></thead>
              <tbody className="divide-y divide-slate-200">{overviewRows.map((row) => <tr className={selectedRows.includes(row.id) ? "bg-teal-50/50" : ""} key={row.id}><td className="p-4"><input type="checkbox" className="size-5 accent-teal-700" aria-label={`Selecteer ${row.student}, ${row.assignment}`} checked={selectedRows.includes(row.id)} onChange={(event) => setSelectedRows((current) => event.target.checked ? [...new Set([...current, row.id])] : current.filter((id) => id !== row.id))} /></td><td className="p-4 font-black">{row.student}</td><td className="p-4 text-slate-600">{row.className}</td><td className="p-4 font-semibold">{row.module}</td><td className="p-4"><p className="font-semibold">{row.assignment}</p><p className="mt-1 max-w-64 text-xs text-slate-500">{row.goal}</p></td><td className="max-w-72 p-4"><div className="flex flex-wrap gap-1.5">{row.reasons.map((reason) => <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-900" key={reason}>{reason}</span>)}</div></td><td className="p-4 text-slate-600">{new Date(`${row.deadline}T12:00:00`).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</td><td className="p-4"><select aria-label={`Status van ${row.student} voor ${row.assignment}`} className={`rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold ${statusColor(row.status)}`} value={row.status} onChange={(event) => setAssignmentStatus(row.student, row.assignment, event.target.value as DemoAssignmentStatus)}>{demoAssignmentStatuses.map((item) => <option key={item}>{item}</option>)}</select></td><td className="p-4"><button onClick={() => openFeedback(row.student, row.assignment, row.moduleId)} className="min-h-11 font-bold text-teal-700 underline">Feedback geven</button></td></tr>)}</tbody>
            </table></div> : <div className="card p-6 text-center"><p className="font-black">Alles is bijgewerkt</p><p className="mt-2 text-sm text-slate-600">Er zijn voor deze selectie geen aandachtspunten.</p></div>}
          </section>
        </div>
      )}

      {false && (
        <div className="space-y-5">
          <section className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-teal-700">Dagelijks werken</p><h2 className="mt-1 text-xl font-black">Vandaag aandacht nodig</h2><p className=…723 tokens truncated…doelen</option>{state.goalCatalog.filter((goal) => !goal.archived).map((goal) => <option key={goal.id} value={goal.title}>{goal.title}</option>)}</select></label>
              <label className="text-sm font-bold">Status<select className="field mt-1" value={overviewStatus} onChange={(event) => setOverviewStatus(event.target.value)}><option>Alle statussen</option>{demoAssignmentStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            </div>
          </section>

          {!hasOverviewFilter ? <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="card grid min-h-56 place-items-center p-6 text-center"><div><p className="text-lg font-black">Nog geen selectie gemaakt</p><p className="mt-2 max-w-xl text-sm text-slate-600">Kies bijvoorbeeld een klas, module, opdracht, leerdoel of status. Pas daarna verschijnt de resultatenlijst.</p></div></section><section className="card h-fit p-5"><h2 className="font-black">Zo werkt het overzicht</h2><ol className="mt-3 space-y-3 text-sm text-slate-700"><li><strong>1.</strong> Kies minimaal één filter.</li><li><strong>2.</strong> Bekijk alle bijbehorende gegevens in één tabel.</li><li><strong>3.</strong> Sorteer via een kolomtitel of geef direct feedback.</li></ol></section></div> : <section><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-black">Geselecteerde voortgang</h2><p className="text-sm font-semibold text-slate-600">{overviewRows.length} regels gevonden. Klik op een kolomtitel om te sorteren.</p></div></div>{overviewRows.length ? <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[1180px] text-left text-sm"><thead className="bg-slate-50"><tr><th className="px-4" aria-sort={sort.key === "student" ? sort.direction === "asc" ? "ascending" : "descending" : "none"}><SortButton column="student" label="Student" sort={sort} onSort={changeSort} /></th><th className="px-4" aria-sort={sort.key === "className" ? sort.direction === "asc" ? "ascending" : "descending" : "none"}><SortButton column="className" label="Klas" sort={sort} onSort={changeSort} /></th><th className="px-4" aria-sort={sort.key === "module" ? sort.direction === "asc" ? "ascending" : "descending" : "none"}><SortButton column="module" label="Module" sort={sort} onSort={changeSort} /></th><th className="px-4" aria-sort={sort.key === "assignment" ? sort.direction === "asc" ? "ascending" : "descending" : "none"}><SortButton column="assignment" label="Opdracht" sort={sort} onSort={changeSort} /></th><th className="px-4" aria-sort={sort.key === "goal" ? sort.direction === "asc" ? "ascending" : "descending" : "none"}><SortButton column="goal" label="Leerdoel" sort={sort} onSort={changeSort} /></th><th className="px-4" aria-sort={sort.key === "status" ? sort.direction === "asc" ? "ascending" : "descending" : "none"}><SortButton column="status" label="Status" sort={sort} onSort={changeSort} /></th><th className="p-4">Actie</th></tr></thead><tbody className="divide-y divide-slate-200">{overviewRows.map((row) => <tr key={`${row.student}-${row.assignment}`}><td className="p-4 font-black">{row.student}</td><td className="p-4 text-slate-600">{row.className}</td><td className="p-4 font-semibold">{row.module}</td><td className="p-4 font-semibold">{row.assignment}</td><td className="max-w-64 p-4 text-slate-600">{row.goal}</td><td className="p-4"><select aria-label={`Status van ${row.student} voor ${row.assignment}`} className={`rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold ${statusColor(row.status)}`} value={row.status} onChange={(event) => setAssignmentStatus(row.student, row.assignment, event.target.value as DemoAssignmentStatus)}>{demoAssignmentStatuses.map((item) => <option key={item}>{item}</option>)}</select></td><td className="p-4"><button onClick={() => openFeedback(row.student, row.assignment, row.moduleId)} className="min-h-11 font-bold text-teal-700 underline">Feedback geven</button></td></tr>)}</tbody></table></div> : <div className="card p-6 text-center"><p className="font-black">Geen resultaten voor deze combinatie</p><p className="mt-2 text-sm text-slate-600">Maak één filter ruimer of wis de selectie.</p></div>}</section>}
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
              const archived = state.archivedAssignments.includes(assignment);
              return (
                <details className={`group card overflow-hidden ${archived ? "opacity-70" : ""}`} key={assignment}>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
                    <div><div className="flex flex-wrap items-center gap-2"><p className="font-black">{assignment}</p>{archived && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold">Gearchiveerd</span>}</div><p className="mt-1 text-sm text-slate-500">{module?.title ?? "Zonder module"} · {selectedGoals.length} leerdoelen gekoppeld</p></div>
                    <span className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-900 group-open:hidden">{archived ? "Bekijken" : "Aanpassen"}</span>
                  </summary>
                  <form className="border-t border-slate-200 p-5" onSubmit={(event) => { event.preventDefault(); const goals = new FormData(event.currentTarget).getAll("goals").map(String); updateAssignmentGoals(assignment, goals); setAssignmentMessages((current) => ({ ...current, [assignment]: "Leerdoelen opgeslagen. Studenten zien de wijziging direct." })); }}>
                    {!archived && <fieldset><legend className="font-black">Kies leerdoelen</legend><div className="mt-3 grid gap-3 md:grid-cols-2">{state.goalCatalog.filter((goal) => !goal.archived).map((goal) => <label className="flex min-h-11 items-start gap-3 rounded-xl border border-slate-200 p-3" key={goal.id}><input className="mt-1 size-5 accent-teal-700" type="checkbox" name="goals" value={goal.title} defaultChecked={selectedGoals.includes(goal.title)} /><span><span className="block text-sm font-bold">{goal.title}</span><span className="mt-0.5 block text-xs text-slate-500">{goal.domain} · {goal.description}</span></span></label>)}</div></fieldset>}
                    {!selectedGoals.length && <p className="mt-3 text-sm font-semibold text-amber-800">Aan deze opdracht zijn nog geen leerdoelen gekoppeld.</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-3">{!archived && <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 font-bold text-white"><Save className="size-4" aria-hidden />Leerdoelen opslaan</button>}<button type="button" onClick={() => toggleAssignmentArchive(assignment)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold">{archived ? "Opdracht herstellen" : "Opdracht archiveren"}</button>{assignmentMessages[assignment] && <p role="status" className="text-sm font-bold text-emerald-800">{assignmentMessages[assignment]}</p>}</div>
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

