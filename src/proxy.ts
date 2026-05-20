import { updateSession } from "@/supabase/middleware";
import type { NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Auth gerektiren tüm rotalar.
     * Statik dosyalar ve dahili Next.js rotaları hariç.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

