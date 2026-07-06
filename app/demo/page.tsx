import Link from "next/link";
import { ArrowRight, GraduationCap, School, Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

const roles = [
  { href: "/demo/student", icon: GraduationCap, title: "Studentenomgeving", text: "Bekijk opdrachten, leerdoelen, ontvangen feedback en je volgende stap.", color: "bg-teal-700" },
  { href: "/demo/docent", icon: School, title: "Docentomgeving", text: "Volg klassen, geef opdrachtfeedback en beheer modules en planning.", color: "bg-indigo-700" },
  { href: "/demo/beheer", icon: Settings, title: "Beheeromgeving", text: "Beheer gebruikers, klassen, modules, opdrachten en leerdoelen.", color: "bg-slate-800" },
];

export default function EnvironmentHome() {
  return (
    <>
      <PageHeader eyebrow="GroeiKompas" title="Ga naar jouw omgeving" description="Kies de omgeving die past bij jouw rol binnen de opleiding." />
      <div className="grid gap-5 md:grid-cols-3">
        {roles.map(({ href, icon: Icon, title, text, color }) => (
          <Link href={href} key={href} className="card group p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <span className={`grid size-12 place-items-center rounded-2xl text-white ${color}`}><Icon aria-hidden /></span>
            <h2 className="mt-5 text-xl font-black">{title}</h2>
            <p className="mt-2 min-h-12 text-sm text-slate-600">{text}</p>
            <span className="mt-6 inline-flex items-center gap-2 font-bold text-teal-800">Open omgeving <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden /></span>
          </Link>
        ))}
      </div>
    </>
  );
}
