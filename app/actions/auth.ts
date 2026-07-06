"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/auth/session";

export type AuthState = { error?: string };

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Vul je e-mailadres en wachtwoord in." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Inloggen is niet gelukt. Controleer je gegevens." };

  const { data: profile } = await supabase.from("profiles").select("role,is_active").eq("id", data.user.id).single();
  if (!profile) {
    await supabase.auth.signOut();
    return { error: "Je account heeft nog geen profiel. Vraag je beheerder om hulp." };
  }
  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { error: "Dit account is gedeactiveerd. Neem contact op met de beheerder." };
  }
  redirect(roleHome(profile.role));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
