import type { Metadata } from "next";
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { PersonelFormView } from "@/components/modules/personel/PersonelFormView";

export const metadata: Metadata = { title: "Personel Düzenle — Hilal HR" };

export default async function PersonelDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  // Personel verisi
  const { data: personel } = await supabase
    .from("personel")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!personel) redirect("/personel");

  // Aktif maaş
  const { data: aktifMaas } = await supabase
    .from("maas_gecmisi")
    .select("*")
    .eq("personel_id", id)
    .is("gecerlilik_bitis", null)
    .maybeSingle();

  // Aktif istihdam dönemi
  const { data: aktifPeriod } = await supabase
    .from("employment_periods")
    .select("*")
    .eq("personel_id", id)
    .is("bitis_tarihi", null)
    .maybeSingle();

  return (
    <PersonelFormView
      mod="duzenle"
      personel={personel}
      aktifMaas={aktifMaas ?? null}
      aktifPeriod={aktifPeriod ?? null}
    />
  );
}
