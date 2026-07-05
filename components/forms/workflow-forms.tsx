"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { saveFeedbackMoment, saveFeedbackTemplate, saveModule } from "@/app/actions/workflow";
import { Button } from "@/components/ui/button";

type Option = { id: string; title?: string; name?: string };
function Message({ state }: { state: { error?: string; success?: string } }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{state.error}</p>;
  if (state.success) return <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900">{state.success}</p>;
  return null;
}

export function ModuleForm({ module, cohorts, assignments }: { module?: any; cohorts: Option[]; assignments: Option[] }) {
  const [state, action, pending] = useActionState(saveModule, {});
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>(module?.assignmentIds ?? []);
  function toggleAssignment(id: string) { setSelectedAssignments((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  function moveAssignment(id: string, direction: -1 | 1) { setSelectedAssignments((current) => { const index = current.indexOf(id); const next = index + direction; if (index < 0 || next < 0 || next >= current.length) return current; const result = [...current]; [result[index], result[next]] = [result[next], result[index]]; return result; }); }
  return <form action={action} className="space-y-4">
    <input type="hidden" name="id" value={module?.id ?? ""}/>
    <label className="block text-sm font-bold">Titel<input className="field mt-1" name="title" defaultValue={module?.title} required maxLength={160}/></label>
    <label className="block text-sm font-bold">Korte uitleg<textarea className="field mt-1 min-h-24" name="description" defaultValue={module?.description} maxLength={3000}/></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Periode<input className="field mt-1" name="period" defaultValue={module?.period} placeholder="Periode 1"/></label><label className="text-sm font-bold">Volgorde<input className="field mt-1" type="number" min="0" max="999" name="sortOrder" defaultValue={module?.sort_order ?? 0}/></label></div>
    <label className="flex items-center gap-2 text-sm font-bold"><input className="size-4 accent-teal-700" type="checkbox" name="published" defaultChecked={module?.is_published}/>Zichtbaar voor studenten</label>
    <fieldset><legend className="text-sm font-bold">Klassen</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{cohorts.map((cohort)=><label className="flex gap-2 text-sm" key={cohort.id}><input type="checkbox" className="size-4 accent-teal-700" name="cohortIds" value={cohort.id} defaultChecked={module?.cohortIds?.includes(cohort.id)}/>{cohort.name}</label>)}</div></fieldset>
    <fieldset>
      <legend className="text-sm font-bold">Opdrachten in deze volgorde</legend>
      {selectedAssignments.map((id)=><input type="hidden" name="assignmentIds" value={id} key={`selected-${id}`}/>)}
      <div className="mt-2 space-y-3">
        <div className="space-y-2 rounded-xl bg-slate-50 p-3">{selectedAssignments.length ? selectedAssignments.map((id,index)=>{const assignment=assignments.find((item)=>item.id===id);return <div className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm" key={id}><span className="grid size-7 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-black text-teal-800">{index+1}</span><span className="min-w-0 flex-1 font-semibold">{assignment?.title??"Onbekende opdracht"}</span><button type="button" aria-label={`${assignment?.title} omhoog`} disabled={index===0} onClick={()=>moveAssignment(id,-1)} className="rounded-md border border-slate-200 p-1 disabled:opacity-30"><ArrowUp className="size-4"/></button><button type="button" aria-label={`${assignment?.title} omlaag`} disabled={index===selectedAssignments.length-1} onClick={()=>moveAssignment(id,1)} className="rounded-md border border-slate-200 p-1 disabled:opacity-30"><ArrowDown className="size-4"/></button></div>}) : <p className="text-sm text-slate-500">Kies hieronder de opdrachten voor deze module.</p>}</div>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">{assignments.map((assignment)=><label className="flex gap-2 text-sm" key={assignment.id}><input type="checkbox" className="mt-0.5 size-4 accent-teal-700" checked={selectedAssignments.includes(assignment.id)} onChange={()=>toggleAssignment(assignment.id)}/>{assignment.title}</label>)}</div>
      </div>
    </fieldset>
    <Message state={state}/><Button disabled={pending}>{pending ? "Opslaanâ€¦" : module ? "Module bijwerken" : "Module aanmaken"}</Button>
  </form>;
}

export function FeedbackMomentForm({ moment, cohorts, modules, assignments }: { moment?: any; cohorts: Option[]; modules: Option[]; assignments: Option[] }) {
  const [state, action, pending] = useActionState(saveFeedbackMoment, {});
  return <form action={action} className="space-y-4"><input type="hidden" name="id" value={moment?.id ?? ""}/><label className="block text-sm font-bold">Titel<input className="field mt-1" name="title" required defaultValue={moment?.title}/></label><label className="block text-sm font-bold">Wat moeten studenten voorbereiden?<textarea className="field mt-1 min-h-24" name="instructions" defaultValue={moment?.instructions}/></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-bold">Soort<select className="field mt-1" name="kind" defaultValue={moment?.kind ?? "teacher_feedback"}><option value="quick_check">Snelle check</option><option value="peer_feedback">Feedback van medestudent</option><option value="teacher_feedback">Feedback van docent</option><option value="conversation">Voortgangsgesprek</option></select></label><label className="text-sm font-bold">Status<select className="field mt-1" name="status" defaultValue={moment?.status ?? "planned"}><option value="planned">Gepland</option><option value="open">Nu actief</option><option value="closed">Afgerond</option></select></label><label className="text-sm font-bold">Datum en tijd<input className="field mt-1" type="datetime-local" name="scheduledAt" required defaultValue={moment?.scheduled_at?.slice(0,16)}/></label><label className="text-sm font-bold">Klas<select className="field mt-1" name="cohortId" required defaultValue={moment?.cohort_id ?? ""}><option value="">Kies een klas</option>{cohorts.map(cohort=><option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}</select></label><label className="text-sm font-bold">Module<select className="field mt-1" name="moduleId" defaultValue={moment?.module_id ?? ""}><option value="">Geen module</option>{modules.map(module=><option key={module.id} value={module.id}>{module.title}</option>)}</select></label><label className="text-sm font-bold">Opdracht<select className="field mt-1" name="assignmentId" defaultValue={moment?.assignment_id ?? ""}><option value="">Geen opdracht</option>{assignments.map(assignment=><option key={assignment.id} value={assignment.id}>{assignment.title}</option>)}</select></label></div><Message state={state}/><Button disabled={pending}>{pending ? "Opslaanâ€¦" : moment ? "Moment bijwerken" : "Feedbackmoment plannen"}</Button></form>;
}

export function FeedbackTemplateForm() {
  const [state, action, pending] = useActionState(saveFeedbackTemplate, {});
  return <form action={action} className="space-y-3"><label className="block text-sm font-bold">Naam sjabloon<input className="field mt-1" name="title" required placeholder="Bijvoorbeeld: onderbouwing"/></label><label className="block text-sm font-bold">Wat gaat al goed?<textarea className="field mt-1 min-h-20" name="feedbackText" required/></label><label className="block text-sm font-bold">Volgende stap<textarea className="field mt-1 min-h-20" name="feedforwardText" required/></label><Message state={state}/><Button disabled={pending}>{pending ? "Opslaanâ€¦" : "Sjabloon bewaren"}</Button></form>;
}

