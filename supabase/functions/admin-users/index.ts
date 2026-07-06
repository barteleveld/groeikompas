import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.56.0";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Methode niet toegestaan." }, 405);

  const authorization = request.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authorization || !url || !publishableKey || !serviceKey) {
    return json({ error: "Accountbeheer is niet beschikbaar." }, 503);
  }

  const caller = createClient(url, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return json({ error: "Log opnieuw in." }, 401);

  const { data: profile } = await caller
    .from("profiles")
    .select("role,is_active")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" || !profile.is_active) {
    return json({ error: "Alleen beheerders mogen accounts beheren." }, 403);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const body = await request.json();

  if (body.action === "invite") {
    const { email, fullName, role, cohortId, redirectTo } = body;
    if (!email || !fullName || !["student", "teacher"].includes(role)) {
      return json({ error: "De uitnodiging is niet compleet." }, 400);
    }
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo,
    });
    if (error || !data.user) return json({ error: "Uitnodigen is niet gelukt." }, 400);

    const { error: profileError } = await admin
      .from("profiles")
      .update({ full_name: fullName, role })
      .eq("id", data.user.id);
    if (profileError) return json({ error: "Het account is gemaakt, maar de rol kon niet worden opgeslagen." }, 500);

    if (cohortId) {
      const table = role === "student" ? "cohort_members" : "teacher_cohorts";
      const key = role === "student" ? "student_id" : "teacher_id";
      const { error: linkError } = await admin.from(table).insert({ [key]: data.user.id, cohort_id: cohortId });
      if (linkError) return json({ error: "Het account is gemaakt, maar kon niet aan de klas worden gekoppeld." }, 500);
    }
    return json({ email });
  }

  if (body.action === "set_active") {
    const active = Boolean(body.active);
    const { error } = await admin.auth.admin.updateUserById(body.profileId, {
      ban_duration: active ? "none" : "876000h",
    });
    if (error) return json({ error: "De toegang kon niet worden aangepast." }, 400);
    const { error: profileError } = await admin.from("profiles").update({ is_active: active }).eq("id", body.profileId);
    if (profileError) return json({ error: "De toegang is aangepast, maar het profiel niet." }, 500);
    return json({ active });
  }

  if (body.action === "resend_invite") {
    const { data, error } = await admin.auth.admin.getUserById(body.profileId);
    if (error || !data.user?.email) return json({ error: "Het e-mailadres is niet gevonden." }, 404);
    if (data.user.email_confirmed_at) return json({ error: "Dit account is al geactiveerd." }, 400);
    const result = await admin.auth.resend({ type: "signup", email: data.user.email });
    if (result.error) return json({ error: "Opnieuw versturen is niet gelukt." }, 400);
    return json({ email: data.user.email });
  }

  return json({ error: "Onbekende actie." }, 400);
});
