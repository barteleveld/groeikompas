import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

export default async function AdminEnvironmentPage() {
  await requireRole("admin");
  redirect("/admin");
}
