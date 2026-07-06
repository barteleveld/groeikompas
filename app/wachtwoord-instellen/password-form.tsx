"use client";

import { useActionState } from "react";
import { setPassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function PasswordForm() {
  const [state, action, pending] = useActionState(setPassword, {});
  return <form action={action} className="mt-7 space-y-5"><div><label className="mb-1.5 block text-sm font-bold" htmlFor="password">Nieuw wachtwoord</label><input className="field" id="password" name="password" type="password" minLength={10} autoComplete="new-password" required /></div><div><label className="mb-1.5 block text-sm font-bold" htmlFor="confirmation">Herhaal wachtwoord</label><input className="field" id="confirmation" name="confirmation" type="password" minLength={10} autoComplete="new-password" required /></div>{state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{state.error}</p>}<Button className="w-full" disabled={pending}>{pending ? "Opslaanâ€¦" : "Wachtwoord opslaan"}</Button></form>;
}
