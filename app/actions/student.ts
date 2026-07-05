"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: string };
const sourceSchema = z.union([z.literal(""), z.url("Gebruik een volledige link, bijvoorbeeld https://…")]);
const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];

async function uploadStudentFile(supabase: Awaited<ReturnType<typeof createClient>>, profileId: string, folder: string, file: File) {
  if (file.size > 20 * 1024 * 1024) return { error: "Het bestand is groter dan 20 MB." };
  if (!allowedTypes.includes(file.type)) return { error: "Gebruik een pdf, afbeelding, Word- of PowerPointbestand." };
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = `${profileId}/${folder}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("student-evidence").upload(storagePath, file, { contentType: file.type });
  if (error) return { error: "Het bestand kon niet worden geüpload." };
  return { storagePath, originalFilename: file.name, mimeType: file.type };
}

export async function addEvidence(_: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireRole("student");
  const parsed = z.object({ contextType: z.enum(["assignment", "goal"]), contextId: z.uuid(), title: z.string().trim().min(2, "Geef je bewijs een duidelijke titel.").max(160), description: z.string().trim().max(1000), url: sourceSchema }).safeParse({ ...Object.fromEntries(formData), url: formData.get("url") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { contextType, contextId, title, description, url } = parsed.data;
  const supabase = await createClient();
  const access = contextType === "assignment" ? await supabase.from("assignments").select("id").eq("id", contextId).maybeSingle() : await supabase.from("learning_goals").select("id").eq("id", contextId).maybeSingle();
  if (!access.data) return { error: "Dit onderdeel is niet gevonden of niet voor jou zichtbaar." };
  const file = formData.get("file"); let uploaded: any = {};
  if (file instanceof File && file.size > 0) { uploaded = await uploadStudentFile(supabase, profile.id, "evidence", file); if (uploaded.error) return { error: uploaded.error }; }
  if (!url && !uploaded.storagePath) return { error: "Voeg een link of bestand toe." };
  const { error } = await supabase.from("evidence").insert({ student_id: profile.id, assignment_id: contextType === "assignment" ? contextId : null, learning_goal_id: contextType === "goal" ? contextId : null, title, description, url: url || null, storage_path: uploaded.storagePath ?? null, original_filename: uploaded.originalFilename ?? null, mime_type: uploaded.mimeType ?? null });
  if (error) return { error: "Bewijs toevoegen is niet gelukt." };
  revalidatePath(contextType === "assignment" ? `/student/opdrachten/${contextId}` : `/student/leerdoelen/${contextId}`);
  return { success: "Je bewijsstuk is toegevoegd." };
}

export async function addReflection(_: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireRole("student");
  const parsed = z.object({ contextType: z.enum(["assignment", "goal"]), contextId: z.uuid(), reflection: z.string().trim().min(3, "Schrijf kort wat je hebt geleerd.").max(2000) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.from("reflections").insert({ student_id: profile.id, assignment_id: parsed.data.contextType === "assignment" ? parsed.data.contextId : null, learning_goal_id: parsed.data.contextType === "goal" ? parsed.data.contextId : null, reflection_text: parsed.data.reflection });
  if (error) return { error: "Reflectie opslaan is niet gelukt." };
  revalidatePath(parsed.data.contextType === "assignment" ? `/student/opdrachten/${parsed.data.contextId}` : `/student/leerdoelen/${parsed.data.contextId}`);
  return { success: "Je reflectie is opgeslagen." };
}

export async function processFeedback(_: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireRole("student");
  const parsed = z.object({ feedbackId: z.uuid(), path: z.string().startsWith("/student/"), reflection: z.string().trim().min(3, "Beschrijf kort wat je hebt aangepast.").max(2000), submissionId: z.union([z.literal(""), z.uuid()]) }).safeParse({ ...Object.fromEntries(formData), submissionId: String(formData.get("submissionId") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_feedback_processed", { feedback_id: parsed.data.feedbackId, reflection: parsed.data.reflection });
  if (error) return { error: "Feedback verwerken is niet gelukt." };
  const { error: responseError } = await supabase.from("feedback_responses").upsert({ feedback_id: parsed.data.feedbackId, student_id: profile.id, response_text: parsed.data.reflection, submission_id: parsed.data.submissionId || null }, { onConflict: "feedback_id,student_id" });
  if (responseError) return { error: "Je feedback is verwerkt, maar je reactie kon niet worden bewaard." };
  revalidatePath(parsed.data.path); revalidatePath("/student");
  return { success: "Je reactie en verwerking zijn opgeslagen." };
}

export async function submitAssignmentVersion(_: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireRole("student");
  const parsed = z.object({ assignmentId: z.uuid(), note: z.string().trim().max(2000), url: sourceSchema }).safeParse({ assignmentId: formData.get("assignmentId"), note: formData.get("note") ?? "", url: formData.get("url") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data: access } = await supabase.from("assignments").select("id").eq("id", parsed.data.assignmentId).maybeSingle();
  if (!access) return { error: "Deze opdracht is niet voor jou zichtbaar." };
  const file = formData.get("file"); let uploaded: any = {};
  if (file instanceof File && file.size > 0) { uploaded = await uploadStudentFile(supabase, profile.id, `submissions/${parsed.data.assignmentId}`, file); if (uploaded.error) return { error: uploaded.error }; }
  if (!parsed.data.url && !uploaded.storagePath) return { error: "Voeg een bestand of link naar je nieuwe versie toe." };
  const { data: latest } = await supabase.from("submissions").select("version_number").eq("student_id", profile.id).eq("assignment_id", parsed.data.assignmentId).order("version_number", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase.from("submissions").insert({ student_id: profile.id, assignment_id: parsed.data.assignmentId, version_number: (latest?.version_number ?? 0) + 1, note: parsed.data.note, url: parsed.data.url || null, storage_path: uploaded.storagePath ?? null, original_filename: uploaded.originalFilename ?? null, mime_type: uploaded.mimeType ?? null });
  if (error) return { error: "Je nieuwe versie kon niet worden ingeleverd." };
  revalidatePath(`/student/opdrachten/${parsed.data.assignmentId}`);
  return { success: "Je nieuwe versie is ingeleverd." };
}
