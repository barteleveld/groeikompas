import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

export default async function TeacherEnvironmentPage() {
  await requireRole("teacher");
  redirect("/teacher");
}
