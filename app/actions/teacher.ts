"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { assignmentStatuses, learningGoalLevels } from "@/types/domain";

export type TeacherFormState = { error?: string; success?: string };

export async function updateAssignmentStatus(_: TeacherFormState, formData: FormData): Promise<TeacherFormState> {
  const teacher = await requireRole("teacher", "admin");
  const parsed = z.object({ studentId: z.uuid(), assignmentId: z.uuid(), status: z.enum(assignmentStatuses) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Kies een geldige opdrachtstatus." };
  const supabase = await createClient();
  const { error } = await supabase.from("student_assignment_progress").upsert({ student_id: parsed.data.studentId, assignment_id: parsed.data.assignmentId, status: parsed.data.status, updated_by: teacher.id, updated_at: new Date().toISOString() }, { onConflict: "student_id,assignment_id" });
  if (error) return { error: "De opdrachtstatus kon niet worden bijgewerkt." };
  revalidatePath(`/teacher/studenten/${parsed.data.studentId}`); revalidatePath("/teacher");
  return { success: "Opdrachtstatus bijgewerkt." };
}

export async function updateGoalLevel(_: TeacherFormState, formData: FormData): Promise<TeacherFormState> {
  const teacher = await requireRole("teacher", "admin");
  const parsed = z.object({ studentId: z.uuid(), goalId: z.uuid(), level: z.enum(learningGoalLevels) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Kies een geldig beheersingsniveau." };
  const supabase = await createClient();
  const { error } = await supabase.from("student_learning_goal_progress").upsert({ student_id: parsed.data.studentId, learning_goal_id: parsed.data.goalId, level: parsed.data.level, updated_by: teacher.id, updated_at: new Date().toISOString() }, { onConflict: "student_id,learning_goal_id" });
  if (error) return { error: "Het leerdoelniveau kon niet worden bijgewerkt." };
  revalidatePath(`/teacher/studenten/${parsed.data.studentId}`); revalidatePath("/teacher");
  return { success: "Leerdoelniveau bijgewerkt." };
}

export async function addTeacherFeedback(_: TeacherFormState, formData: FormData): Promise<TeacherFormState> {
  const teacher = await requireRole("teacher", "admin");
  const parsed = z.object({ studentId: z.uuid(), assignmentId: z.union([z.literal(""), z.uuid()]), goalId: z.union([z.literal(""), z.uuid()]), feedbackText: z.string().trim().min(3, "Beschrijf wat al goed gaat.").max(3000), feedforwardText: z.string().trim().min(3, "Geef een concrete volgende stap.").max(3000) }).refine((v)=>v.assignmentId||v.goalId,{message:"Kies een opdracht of leerdoel."}).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("feedback").insert({ student_id: parsed.data.studentId, teacher_id: teacher.id, assignment_id: parsed.data.assignmentId || null, learning_goal_id: parsed.data.goalId || null, feedback_text: parsed.data.feedbackText, feedforward_text: parsed.data.feedforwardText });
  if (error) return { error: "Feedback opslaan is niet gelukt. Controleer of deze student in jouw klas zit." };
  revalidatePath(`/teacher/studenten/${parsed.data.studentId}`); revalidatePath("/teacher");
  return { success: "Feedback en volgende stap zijn opgeslagen." };
}

export async function bulkUpdate(_: TeacherFormState, formData: FormData): Promise<TeacherFormState> {
  const teacher = await requireRole("teacher", "admin");
  const parsed = z.object({ studentIds: z.array(z.uuid()).min(1, "Selecteer minimaal één student."), assignmentId: z.uuid(), status: z.enum(assignmentStatuses), feedbackText: z.string().trim().max(1000), feedforwardText: z.string().trim().max(1000) }).refine((v)=>!v.feedbackText || v.feedforwardText.length>=3,{message:"Vul bij feedback ook een concrete volgende stap in."}).safeParse({ ...Object.fromEntries(formData), studentIds: formData.getAll("studentIds") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error: progressError } = await supabase.from("student_assignment_progress").upsert(parsed.data.studentIds.map((studentId)=>({ student_id: studentId, assignment_id: parsed.data.assignmentId, status: parsed.data.status, updated_by: teacher.id, updated_at: now })), { onConflict: "student_id,assignment_id" });
  if (progressError) return { error: "Niet alle studenten konden worden bijgewerkt. Controleer je klasselectie." };
  if (parsed.data.feedbackText) {
    const { error } = await supabase.from("feedback").insert(parsed.data.studentIds.map((studentId)=>({ student_id: studentId, teacher_id: teacher.id, assignment_id: parsed.data.assignmentId, learning_goal_id: null, feedback_text: parsed.data.feedbackText, feedforward_text: parsed.data.feedforwardText })));
    if (error) return { error: "De status is bijgewerkt, maar de klassikale feedback kon niet voor iedereen worden opgeslagen." };
  }
  revalidatePath("/teacher");
  return { success: `${parsed.data.studentIds.length} studenten zijn bijgewerkt.` };
}
