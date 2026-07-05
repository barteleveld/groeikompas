"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-lg px-5 py-20 text-center"><h1 className="text-2xl font-black">Dat ging niet goed</h1><p className="my-4 text-slate-600">Probeer de pagina opnieuw. Blijft dit gebeuren, vraag dan je beheerder om hulp.</p><Button onClick={reset}>Opnieuw proberen</Button></main>;
}
