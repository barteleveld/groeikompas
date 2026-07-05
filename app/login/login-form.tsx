"use client";

import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {});
  return <form action={action} className="mt-7 space-y-5">
    <div><label className="mb-1.5 block text-sm font-bold" htmlFor="email">E-mailadres</label><input className="field" id="email" name="email" type="email" autoComplete="email" required /></div>
    <div><label className="mb-1.5 block text-sm font-bold" htmlFor="password">Wachtwoord</label><input className="field" id="password" name="password" type="password" autoComplete="current-password" required /></div>
    {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{state.error}</p>}
    <Button className="w-full" disabled={pending}>{pending ? "Inloggen…" : "Inloggen"}</Button>
  </form>;
}
