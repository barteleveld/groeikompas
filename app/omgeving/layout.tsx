import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";

export default async function EnvironmentLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return children;
}
