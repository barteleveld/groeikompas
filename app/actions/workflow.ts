"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type WorkflowState = { error?: string; success?: string };
const optionalId = z.union([z.literal(""), z.uuid()]);

export async function saveModule(_: WorkflowState, formData: FormData): Promise<WorkflowState> {
  const teacher = await requireRole("teacher", "admin");
  const parsed = z.object({
    id: optionalId,
    title: z.string().trim().min(2, "Geef de module een titel.").max(160),
    description: z.string().trim().max(3000),
    period: z.string().trim().max(80),
    sortOrder: z.coerce.number().int().min(0).max(999),
    published: z.boolean(),
  }).safeParse({ ...Object.fromEntries(formData), published: formData.get("published") === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const payload = { title: parsed.data.title, description: parsed.data.description, period: parsed.data.period || null, sort_order: parsed.data.sortOrder, is_published: parsed.data.published };
  let moduleId = parsed.data.id;
  if (moduleId) {
    const { error } = await supabase.from("modules").update(payload).eq("id", moduleId);
    if (error) return { error: "De module kon niet worden bijgewerkt." };
  } else {
    const { data, error } = await supabase.from("modules").insert({ ...payload, created_by: teacher.id }).select("id").single();
    if (error || !data) return { error: "De module kon niet worden aangemaakt." };
    moduleId = data.id;
  }
  const cohortIds = formData.getAll("cohortIds").map(String);
  const assignmentIds = formData.getAll("assignmentIds").map(String);
  await supabase.from("cohort_modules").delete().eq("module_id", moduleId);
  await supabase.from("module_assignments").delete().eq("module_id", moduleId);
  if (cohortIds.length) {
    const { error } = await supabase.from("cohort_modules").insert(cohortIds.map((cohort_id) => ({ cohort_id, module_id: moduleId })));
    if (error) return { error: "De module is bewaard, maar niet aan alle klassen gekoppeld." };
  }
  if (assignmentIds.length) {
    const { error } = await supabase.from("module_assignments").insert(assignmentIds.map((assignment_id, index) => ({ assignment_id, module_id: moduleId, sort_order: index + 1 })));
    if (error) return { error: "De module is bewaard, maar de opdrachtvolgorde niet." };
    if (cohortIds.length) await supabase.from("cohort_assignments").upsert(cohortIds.flatMap((cohort_id) => assignmentIds.map((assignment_id) => ({ cohort_id, assignment_id }))), { onConflict: "cohort_id,assignment_id" });
  }
  revalidatePath("/teacher/modules");
  return { success: parsed.data.id ? "Module bijgewerkt." : "Module aangemaakt." };
}

export async function saveFeedbackMoment(_: WorkflowState, formData: FormData): Promise<WorkflowState> {
  const teacher = await requireRole("teacher", "admin");
  const parsed = z.object({
    id: optionalId,
    title: z.string().trim().min(2, "Geef het feedbackmoment een titel.").max(160),
    instructions: z.string().trim().max(2000),
    kind: z.enum(["quick_check", "peer_feedback", "teacher_feedback", "conversation"]),
    status: z.enum(["planned", "open", "closed"]),
    scheduledAt: z.iso.datetime({ local: true }),
    cohortId: z.uuid(),
    moduleId: optionalId,
    assignmentId: optionalId,
  }).refine((value) => value.moduleId || value.assignmentId, { message: "Kies een module of opdracht." }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const payload = { title: parsed.data.title, instructions: parsed.data.instructions, kind: parsed.data.kind, status: parsed.data.status, scheduled_at: new Date(parsed.data.scheduledAt).toISOString(), cohort_id: parsed.data.cohortId, module_id: parsed.data.moduleId || null, assignment_id: parsed.data.assignmentId || null };
  const result = parsed.data.id
    ? await supabase.from("feedback_moments").update(payload).eq("id", parsed.data.id)
    : await supabase.from("feedback_moments").insert({ ...payload, created_by: teacher.id });
  if (result.error) return { error: "Het feedbackmoment kon niet worden opgeslagen." };
  revalidatePath("/teacher/feedbackmomenten"); revalidatePath("/teacher");
  return { success: parsed.data.id ? "Feedbackmoment bijgewerkt." : "Feedbackmoment gepland en met de klas gedeeld." };
}

export async function saveFeedbackTemplate(_: WorkflowState, formData: FormData): Promise<WorkflowState> {
  const teacher = await requireRole("teacher", "admin");
  const parsed = z.object({ title: z.string().trim().min(2).max(100), feedbackText: z.string().trim().min(3).max(2000), feedforwardText: z.string().trim().min(3).max(2000) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Vul een titel, feedback en volgende stap in." };
  const supabase = await createClient();
  const { error } = await supabase.from("feedback_templates").insert({ teacher_id: teacher.id, title: parsed.data.title, feedback_text: parsed.data.feedbackText, feedforward_text: parsed.data.feedforwardText });
  if (error) return { error: "Het sjabloon kon niet worden opgeslagen." };
  revalidatePath("/teacher/feedbackmomenten");
  return { success: "Feedbacksjabloon opgeslagen." };
}

export async function markNotificationRead(formData: FormData) {
  const profile = await requireRole("student", "teacher", "admin");
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id.data).eq("user_id", profile.id);
  revalidatePath(`/${profile.role === "student" ? "student" : "teacher"}/meldingen`);
}
