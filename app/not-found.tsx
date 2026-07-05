import Link from "next/link";
export default function NotFound() { return <main className="mx-auto max-w-lg px-5 py-20 text-center"><h1 className="text-3xl font-black">Pagina niet gevonden</h1><p className="my-4 text-slate-600">Deze pagina bestaat niet of je hebt er geen toegang toe.</p><Link className="font-bold text-teal-700 underline" href="/">Terug naar je overzicht</Link></main>; }
