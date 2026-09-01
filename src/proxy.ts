import { updateSession } from "@/supabase/middleware";
import type { NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Auth gerektiren tüm rotalar.
     * Statik dosyalar, dahili Next.js rotaları ve manifest/favicon/fontlar hariç.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.json|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|ico|txt|xml|woff|woff2|ttf|eot)$).*)",
  ],
};

