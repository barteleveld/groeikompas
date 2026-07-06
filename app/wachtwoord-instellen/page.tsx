import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { BrandLogo } from "@/components/layout/brand";
import { PasswordForm } from "./password-form";

export const metadata = { title: "Wachtwoord instellen" };

export default async function PasswordPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#ffe4ef,transparent_42%),radial-gradient(circle_at_bottom_right,#ffedd5,transparent_38%),#fffaf8] px-4 py-10"><section className="w-full max-w-md rounded-3xl border border-rose-100 bg-white p-7 shadow-xl shadow-rose-950/10 sm:p-9"><BrandLogo/><h1 className="mt-3 text-3xl font-black tracking-tight">Maak je wachtwoord</h1><p className="mt-2 text-slate-600">Daarna ga je vanzelf naar jouw GroeiKompas-omgeving.</p><PasswordForm /></section></main>;
}
