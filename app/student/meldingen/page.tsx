import { NotificationsList } from "@/components/dashboard/notifications-list";
import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
export default async function StudentNotifications(){const profile=await requireRole("student");const supabase=await createClient();const{data}=await supabase.from("notifications").select("*").eq("user_id",profile.id).order("created_at",{ascending:false});return <><PageHeader eyebrow="Blijf bij" title="Meldingen" description="Nieuwe feedback, feedbackmomenten en andere acties die aandacht vragen."/><NotificationsList items={data??[]}/></>}
