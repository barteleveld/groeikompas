import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { markNotificationRead } from "@/app/actions/workflow";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export function NotificationsList({ items }: { items: any[] }) {
  if (!items.length) return <EmptyState title="Geen meldingen" description="Nieuwe feedback en geplande momenten verschijnen hier."/>;
  return <div className="space-y-3">{items.map((item)=><article className={`card flex gap-4 p-4 ${item.read_at?"opacity-70":"border-teal-300"}`} key={item.id}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.read_at?"bg-slate-100 text-slate-500":"bg-teal-50 text-teal-800"}`}><Bell className="size-5"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-black">{item.title}</h2><span className="text-xs text-slate-500">{formatDate(item.created_at)}</span></div><p className="mt-1 text-sm text-slate-600">{item.body}</p><div className="mt-3 flex gap-3"><Link href={item.href} className="text-sm font-bold text-teal-700 underline">Bekijken</Link>{!item.read_at&&<form action={markNotificationRead}><input type="hidden" name="id" value={item.id}/><button className="inline-flex items-center gap-1 text-sm font-bold text-slate-600"><Check className="size-4"/>Gelezen</button></form>}</div></div></article>)}</div>;
}
