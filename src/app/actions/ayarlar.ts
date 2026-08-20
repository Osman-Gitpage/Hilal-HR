"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { VARSAYILAN_AYLIK_CALISMA_SAATI, VARSAYILAN_GUNLUK_CALISMA_SAATI } from "@/lib/constants";

import { getAuthContext } from "@/lib/auth/context";

// ─────────────────────────────────────────────
// Ayarları getir (yoksa varsayılanları döndür)
// ─────────────────────────────────────────────
export async function ayarlariGetir() {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("ayarlar")
    .select("*")
    .eq("sirket_id", sirketId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  // Veritabanında kayıt yoksa varsayılan değerleri döndür
  if (!data) {
    return {
      id: null,
      sirket_id: sirketId,
      gunluk_calisma_saati: VARSAYILAN_GUNLUK_CALISMA_SAATI,
      aylik_calisma_saati: VARSAYILAN_AYLIK_CALISMA_SAATI,
      resmi_tatiller: [],
    };
  }

  return data as any;
}

// ─────────────────────────────────────────────
// Ayarları kaydet (upsert)
// ─────────────────────────────────────────────
export async function ayarlariKaydet(
  _prevState: { hata?: string; basarili?: boolean } | undefined,
  formData: FormData
) {
  const { supabase, sirketId } = await getAuthContext();

  const gunluk = parseFloat(formData.get("gunluk_calisma_saati") as string);
  const aylik = parseFloat(formData.get("aylik_calisma_saati") as string);

  if (isNaN(gunluk) || gunluk <= 0) {
    return { hata: "Günlük çalışma saati geçersiz." };
  }
  if (isNaN(aylik) || aylik <= 0) {
    return { hata: "Aylık çalışma saati geçersiz." };
  }

  // Mevcut kayıt var mı?
  const { data: mevcut } = await supabase
    .from("ayarlar")
    .select("id")
    .eq("sirket_id", sirketId)
    .maybeSingle();

  if (mevcut) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – generated types may lag behind schema
    const { error } = await supabase
      .from("ayarlar")
      .update({
        gunluk_calisma_saati: gunluk,
        aylik_calisma_saati: aylik,
        updated_at: new Date().toISOString(),
      })
      .eq("id", (mevcut as any).id);

    if (error) return { hata: error.message };
  } else {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – generated types may lag behind schema
    const { error } = await supabase
      .from("ayarlar")
      .insert({
        sirket_id: sirketId,
        gunluk_calisma_saati: gunluk,
        aylik_calisma_saati: aylik,
      });

    if (error) return { hata: error.message };
  }

  revalidatePath("/ayarlar");
  return { basarili: true };
}
