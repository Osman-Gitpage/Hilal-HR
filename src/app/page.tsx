import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import { SpeedInsights } from '@vercel/speed-insights/next';



export default async function HomePage() {
  const supabase = await createClient();
  <SpeedInsights />
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  redirect("/dashboard");
}
