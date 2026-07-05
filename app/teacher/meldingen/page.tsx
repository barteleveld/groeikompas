import { NotificationsList } from "@/components/dashboard/notifications-list";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
export default async function TeacherNotifications(){const profile=await requireRole("teacher","admin");const supabase=await createClient();const{data}=await supabase.from("notifications").select("*").eq("user_id",profile.id).order("created_at",{ascending:false});return <><PageHeader eyebrow="Aandacht" title="Meldingen" description="Reacties op feedback en nieuwe versies van studenten verschijnen hier."/><NotificationsList items={data??[]}/></>}
