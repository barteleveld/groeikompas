import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";
export default async function TeacherLayout({ children }: { children: React.ReactNode }) { const p = await requireRole("teacher", "admin"); return <AppShell role={p.role} name={p.full_name}>{children}</AppShell>; }
