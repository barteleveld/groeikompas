"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/layout/brand";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    async function finishSignIn() {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const fragment = new URLSearchParams(url.hash.slice(1));
      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");
      const authError = fragment.get("error_description") ?? url.searchParams.get("error_description");

      if (authError) {
        setError("Deze link is verlopen of al gebruikt. Vraag een nieuwe link aan.");
        return;
      }

      const result = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : accessToken && refreshToken
          ? await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          : { error: new Error("Geen geldige aanmeldgegevens ontvangen.") };

      if (result.error) {
        setError("Deze link kon niet worden verwerkt. Vraag een nieuwe link aan.");
        return;
      }
      router.replace("/wachtwoord-instellen");
      router.refresh();
    }
    void finishSignIn();
  }, [router]);

  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#ffe4ef,transparent_42%),radial-gradient(circle_at_bottom_right,#ffedd5,transparent_38%),#fffaf8] px-4 py-10"><section className="w-full max-w-md rounded-3xl border border-rose-100 bg-white p-7 text-center shadow-xl shadow-rose-950/10 sm:p-9"><div className="flex justify-center"><BrandLogo /></div>{error ? <><h1 className="mt-5 text-2xl font-black">Link niet meer geldig</h1><p className="mt-3 text-slate-600">{error}</p></> : <><div className="mx-auto mt-6 size-10 animate-spin rounded-full border-4 border-rose-100 border-t-[#db0060]" aria-hidden /><h1 className="mt-5 text-2xl font-black">Je account wordt geopend</h1><p className="mt-3 text-slate-600">Een ogenblik, we controleren je beveiligde link.</p></>}</section></main>;
}