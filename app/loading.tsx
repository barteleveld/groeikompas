export default function Loading() {
  return <div className="mx-auto max-w-5xl px-5 py-16" role="status"><div className="h-8 w-56 animate-pulse rounded bg-slate-200"/><div className="mt-6 grid gap-4 sm:grid-cols-3">{[1,2,3].map((n)=><div key={n} className="h-36 animate-pulse rounded-2xl bg-slate-100"/>)}</div><span className="sr-only">Pagina laden…</span></div>;
}
