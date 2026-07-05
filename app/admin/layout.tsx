import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";
export default async function AdminLayout({ children }: { children: React.ReactNode }) { const p = await requireRole("admin"); return <AppShell role="admin" name={p.full_name}>{children}</AppShell>; }
