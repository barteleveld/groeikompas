import { redirect } from "next/navigation";
import { getCurrentProfile, roleHome } from "@/lib/auth/session";

export default async function EnvironmentPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  redirect(roleHome(profile.role));
}
