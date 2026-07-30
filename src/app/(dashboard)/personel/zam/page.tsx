import type { Metadata } from "next";
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { MaasZamView } from "@/components/modules/personel/MaasZamView";

export const metadata: Metadata = { title: "Maaş Zam Yönetimi — Hilal Office" };

export default async function PersonelZamPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  return <MaasZamView />;
}
