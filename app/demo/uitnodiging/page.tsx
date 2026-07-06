import Image from "next/image";
import { Mail } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Voorbeeld uitnodigingsmail" };

export default function InvitationPreviewPage() {
  return <>
    <PageHeader eyebrow="E-mailvoorbeeld" title="Uitnodiging voor nieuwe gebruikers" description="Zo ontvangt een nieuwe student of docent de uitnodiging voor GroeiKompas." />
    <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm sm:p-5">
      <div className="grid gap-3 sm:grid-cols-[100px_1fr]"><span className="font-bold text-slate-500">Onderwerp</span><strong>Welkom bij GroeiKompas â€“ activeer je account</strong><span className="font-bold text-slate-500">Afzender</span><span>GroeiKompas &lt;no-reply@jouwdomein.nl&gt;</span></div>
    </section>
    <div className="overflow-hidden rounded-3xl border border-rose-100 bg-[#fff8f6] px-3 py-8 shadow-xl shadow-rose-950/10 sm:px-8 sm:py-12">
      <article className="mx-auto max-w-[600px] overflow-hidden rounded-3xl border border-[#f1dce3] bg-white shadow-2xl shadow-rose-950/10">
        <div className="h-2 bg-[#db0060]" />
        <div className="px-6 pb-5 pt-8 sm:px-10"><Image src="/groeikompas-logo.png" width={230} height={90} alt="GroeiKompas" className="h-auto w-[230px] max-w-full" /></div>
        <div className="px-6 pb-3 pt-2 sm:px-10"><p className="mb-3 text-xs font-black uppercase tracking-[.12em] text-[#db0060]">Jouw ontwikkeling in beeld</p><h2 className="text-3xl font-black tracking-tight text-slate-900">Welkom bij GroeiKompas</h2></div>
        <div className="px-6 py-2 text-[17px] leading-relaxed text-slate-600 sm:px-10"><p>Er is een account voor je aangemaakt. In GroeiKompas zie je waar je staat, welke feedback voor je klaarstaat en wat jouw volgende stap is.</p><p className="mt-4">Activeer je account en kies daarna je eigen wachtwoord.</p></div>
        <div className="px-6 py-7 text-center sm:px-10"><span className="inline-flex items-center gap-2 rounded-xl bg-[#db0060] px-7 py-4 font-bold text-white shadow-lg shadow-pink-900/20"><Mail className="size-4" aria-hidden />Account activeren</span></div>
        <div className="px-6 pb-8 sm:px-10"><div className="rounded-xl border-l-4 border-[#f26922] bg-[#fff4ed] p-4 text-sm leading-relaxed text-orange-950"><strong>Lukt de knop niet?</strong><br />Kopieer dan de persoonlijke activatielink naar je browser.</div></div>
        <footer className="border-t border-rose-100 bg-[#faf7f8] px-6 py-5 text-xs leading-relaxed text-slate-500 sm:px-10">Je ontvangt deze e-mail omdat een beheerder een GroeiKompas-account voor je heeft aangemaakt. Heb je dit niet verwacht? Dan kun je deze e-mail negeren.</footer>
      </article>
      <p className="mt-5 text-center text-xs text-slate-400">GroeiKompas Â· leren, feedback en groei op Ã©Ã©n plek</p>
    </div>
  </>;
}
