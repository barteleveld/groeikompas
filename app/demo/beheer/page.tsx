"use client";

import { useState } from "react";
import { BookOpenCheck, GraduationCap, Pencil, Save, School, Target } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { useDemo } from "@/components/demo/demo-state";

type Tab = "goals" | "users" | "modules";

export default function AdminDemo() {
  const { state, addUser, addLearningGoal, updateLearningGoal } = useDemo();
  const [tab, setTab] = useState<Tab>("goals");
  const [message, setMessage] = useState("");
  const [goalMessage, setGoalMessage] = useState("");
  const cards = [
    { n: state.users.filter((user) => user.role === "Student").length + 8, label: "studenten", icon: GraduationCap },
    { n: state.users.filter((user) => user.role === "Docent").length + 1, label: "docenten", icon: School },
    { n: new Set(state.modules.flatMap((module) => module.assignments)).size, label: "opdrachten", icon: BookOpenCheck },
    { n: state.goalCatalog.length, label: "leerdoelen", icon: Target },
  ];

  function goalFromForm(form: FormData) {
    return {
      title: String(form.get("title")),
      description: String(form.get("description")),
      domain: String(form.get("domain")),
    };
  }

  return (
    <>
      <PageHeader eyebrow="Beheer" title="Opleiding inrichten" description="Beheer gebruikers, modules en de centrale leerdoelenbibliotheek." />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ n, label, icon: Icon }) => <article className="card p-5" key={label}><div className="flex justify-between"><div><p className="text-3xl font-black">{n}</p><p className="font-bold text-slate-600">{label}</p></div><Icon className="text-teal-700" aria-hidden /></div></article>)}
      </section>

      <div className="my-6 flex flex-wrap gap-2">
        {([['goals', 'Leerdoelen'], ['users', 'Gebruikers'], ['modules', 'Modules']] as [Tab, string][]).map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${tab === id ? "bg-teal-700 text-white" : "border border-slate-300 bg-white"}`}>{label}</button>)}
      </div>

      {tab === "goals" && <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <form className="card h-fit space-y-4 p-5" onSubmit={(event) => { event.preventDefault(); const goal = goalFromForm(new FormData(event.currentTarget)); addLearningGoal(goal); setGoalMessage(`${goal.title} is toegevoegd en kan nu aan opdrachten worden gekoppeld.`); event.currentTarget.reset(); }}>
          <div><p className="text-xs font-bold uppercase tracking-wide text-teal-700">Centrale bibliotheek</p><h2 className="mt-1 text-xl font-black">Nieuw leerdoel</h2></div>
          <label className="block text-sm font-bold">Titel<input className="field mt-1" name="title" required /></label>
          <label className="block text-sm font-bold">Domein<input className="field mt-1" name="domain" placeholder="Bijvoorbeeld Onderzoek" required /></label>
          <label className="block text-sm font-bold">Beschrijving<textarea className="field mt-1 min-h-24" name="description" required /></label>
          {goalMessage && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900">{goalMessage}</p>}
          <button className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 font-bold text-white"><Save className="size-4" aria-hidden />Leerdoel toevoegen</button>
        </form>
        <section><h2 className="mb-1 text-xl font-black">Bestaande leerdoelen</h2><p className="mb-4 text-sm text-slate-600">Aanpassingen worden ook doorgevoerd bij opdrachten waaraan dit doel al gekoppeld is.</p><div className="space-y-3">{state.goalCatalog.map((goal) => <details className="group card overflow-hidden" key={goal.id}><summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden"><div><span className="text-xs font-bold uppercase tracking-wide text-teal-700">{goal.domain}</span><p className="mt-1 font-black">{goal.title}</p><p className="mt-1 text-sm text-slate-600">{goal.description}</p></div><Pencil className="mt-1 size-4 shrink-0 text-teal-700" aria-label="Aanpassen" /></summary><form className="space-y-3 border-t border-slate-200 p-4" onSubmit={(event) => { event.preventDefault(); updateLearningGoal(goal.id, goalFromForm(new FormData(event.currentTarget))); setGoalMessage(`${goal.title} is bijgewerkt.`); }}><label className="block text-sm font-bold">Titel<input className="field mt-1" name="title" defaultValue={goal.title} required /></label><label className="block text-sm font-bold">Domein<input className="field mt-1" name="domain" defaultValue={goal.domain} required /></label><label className="block text-sm font-bold">Beschrijving<textarea className="field mt-1" name="description" defaultValue={goal.description} required /></label><button className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white">Wijzigingen opslaan</button></form></details>)}</div></section>
      </div>}

      {tab === "users" && <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <form className="card h-fit space-y-4 p-5" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const name = String(form.get("name")); const role = String(form.get("role")); addUser(name, role); setMessage(`${name} is toegevoegd aan de gebruikerslijst.`); event.currentTarget.reset(); }}><h2 className="text-xl font-black">Gebruiker uitnodigen</h2><label className="block text-sm font-bold">Naam<input className="field mt-1" name="name" required /></label><label className="block text-sm font-bold">E-mailadres<input className="field mt-1" name="email" type="email" required /></label><label className="block text-sm font-bold">Rol<select className="field mt-1" name="role"><option>Student</option><option>Docent</option></select></label><label className="block text-sm font-bold">Klas<select className="field mt-1"><option>Marketing & Communicatie 4A</option><option>Marketing & Communicatie 4B</option></select></label>{message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900">{message}</p>}<button className="rounded-xl bg-teal-700 px-4 py-2.5 font-bold text-white">Uitnodiging versturen</button></form>
        <section><h2 className="mb-4 text-xl font-black">Gebruikers</h2><div className="space-y-3">{state.users.map((user) => <article className="card flex items-center justify-between p-4" key={user.id}><p className="font-black">{user.name}</p><span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-teal-900">{user.role}</span></article>)}</div></section>
      </div>}

      {tab === "modules" && <section><h2 className="mb-4 text-xl font-black">Modules</h2><div className="grid gap-3 sm:grid-cols-2">{state.modules.map((module) => <article className="card p-4" key={module.id}><p className="font-black">{module.title}</p><p className="mt-1 text-sm text-slate-600">{module.period} · {module.assignments.length} opdrachten</p><p className="mt-2 text-xs font-semibold text-slate-500">{module.assignments.reduce((total, assignment) => total + (state.learningGoals[assignment]?.length ?? 0), 0)} leerdoelkoppelingen</p></article>)}</div></section>}
    </>
  );
}
