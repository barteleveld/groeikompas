import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/demo") || !hasSupabaseConfig()) {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
