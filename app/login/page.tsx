import { redirect } from "next/navigation";
import { getCurrentProfile, roleHome } from "@/lib/auth/session";
import { LoginForm } from "./login-form";
import Link from "next/link";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { BrandLogo } from "@/components/layout/brand";

export const metadata = { title: "Inloggen" };

export default async function LoginPage() {
  const configured = hasSupabaseConfig();
  const profile = configured ? await getCurrentProfile() : null;
  if (profile) redirect(roleHome(profile.role));
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#ffe4ef,transparent_42%),radial-gradient(circle_at_bottom_right,#ffedd5,transparent_38%),#fffaf8] px-4 py-10"><section className="w-full max-w-md rounded-3xl border border-rose-100 bg-white p-7 shadow-xl shadow-rose-950/10 sm:p-9"><BrandLogo/><h1 className="mt-3 text-3xl font-black tracking-tight">Welkom bij GroeiKompas</h1><p className="mt-2 text-slate-600">Zie waar je staat en kies je volgende stap.</p>{configured?<LoginForm/>:<div className="mt-7"><Link href="/omgeving" className="flex min-h-12 items-center justify-center rounded-xl bg-teal-700 px-4 font-bold text-white shadow-sm shadow-teal-950/20 hover:bg-teal-800">Naar GroeiKompas</Link><p className="mt-3 text-center text-sm text-slate-500">Kies daarna jouw omgeving</p></div>}<p className="mt-6 text-center text-xs text-slate-500">Je ziet alleen informatie die bij jouw rol en klas hoort.</p></section></main>;
}

