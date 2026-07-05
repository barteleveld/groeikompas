import { redirect } from "next/navigation";
import { getCurrentProfile, roleHome } from "@/lib/auth/session";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export default async function Home() {
  if (!hasSupabaseConfig()) redirect("/omgeving");
  const profile = await getCurrentProfile();
  redirect(profile ? roleHome(profile.role) : "/login");
}

