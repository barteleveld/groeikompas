import { AppShell } from "@/components/layout/app-shell";
import { requireRole } from "@/lib/auth/session";
export default async function StudentLayout({ children }: { children: React.ReactNode }) { const p = await requireRole("student"); return <AppShell role="student" name={p.full_name}>{children}</AppShell>; }
