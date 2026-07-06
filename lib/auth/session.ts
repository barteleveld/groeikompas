import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/domain";

export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", user.id)
    .single();
  if (!profile?.is_active) return null;
  return profile as { id: string; full_name: string; role: UserRole; is_active: boolean } | null;
});

export async function requireRole(...roles: UserRole[]) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!roles.includes(profile.role)) redirect(roleHome(profile.role));
  return profile;
}

export function roleHome(role: UserRole) {
  if (role === "student") return "/student";
  if (role === "teacher") return "/teacher";
  return "/admin";
}
