"use server";

import { getAuthContext } from "@/lib/auth/context";
import { revalidatePath } from "next/cache";
import type { Tables, TablesInsert } from "@/supabase/types";

// ─── Tipler ───────────────────────────────────────────────────────────────────

export interface TevziSatir {
  no: number;
  adSoyad: string;
  gorev: string;
  calismaAlani: string;
}

type TevziRow = Tables<"hilal_tevzi_kayitlari">;

export interface TevziKayit {
  id: string;
  sirket_id: string;
  tarih: string;
  satirlar: TevziSatir[];
  olusturan_id: string;
  created_at: string;
  guncellendi_at: string;
}

function rowToKayit(row: TevziRow): TevziKayit {
  return {
    id: row.id,
    sirket_id: row.sirket_id,
    tarih: row.tarih,
    satirlar: (row.satirlar as unknown as TevziSatir[]) ?? [],
    olusturan_id: row.olusturan_id,
    created_at: row.created_at,
    guncellendi_at: row.guncellendi_at,
  };
}

// ─── Tevzi Kayıt Oluştur / Güncelle (Upsert) ─────────────────────────────────

export async function tevziKaydet(
  tarih: string,
  satirlar: TevziSatir[]
): Promise<TevziKayit> {
  const { supabase, sirketId, user } = await getAuthContext();

  const payload: TablesInsert<"hilal_tevzi_kayitlari"> = {
    sirket_id: sirketId,
    tarih,
    satirlar: satirlar as unknown as import("@/supabase/types").Json,
    olusturan_id: user.id,
    guncellendi_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("hilal_tevzi_kayitlari")
    .upsert(payload, { onConflict: "sirket_id,tarih" })
    .select()
    .single();

  if (error) throw new Error(`Tevzi kaydedilemedi: ${error.message}`);

  revalidatePath("/hilal-tevzi");
  return rowToKayit(data);
}

// ─── Belirli Tarihte Kayıt Getir ─────────────────────────────────────────────

export async function tevziGetir(tarih: string): Promise<TevziKayit | null> {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("hilal_tevzi_kayitlari")
    .select("*")
    .eq("sirket_id", sirketId)
    .eq("tarih", tarih)
    .maybeSingle();

  if (error) throw new Error(`Tevzi getirilemedi: ${error.message}`);
  return data ? rowToKayit(data) : null;
}

// ─── Önceki Gün Kaydını Getir ────────────────────────────────────────────────

export async function oncekiGunTevziGetir(): Promise<TevziKayit | null> {
  const { supabase, sirketId } = await getAuthContext();

  const bugunIso = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("hilal_tevzi_kayitlari")
    .select("*")
    .eq("sirket_id", sirketId)
    .lt("tarih", bugunIso)
    .order("tarih", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Önceki gün kaydı getirilemedi: ${error.message}`);
  return data ? rowToKayit(data) : null;
}

// ─── Son 30 Gün Kayıt Listesi ─────────────────────────────────────────────────

export async function tevziListesiGetir(): Promise<TevziKayit[]> {
  const { supabase, sirketId } = await getAuthContext();

  const otuzGunOnce = new Date();
  otuzGunOnce.setDate(otuzGunOnce.getDate() - 30);
  const sinirTarih = otuzGunOnce.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("hilal_tevzi_kayitlari")
    .select("*")
    .eq("sirket_id", sirketId)
    .gte("tarih", sinirTarih)
    .order("tarih", { ascending: false });

  if (error) throw new Error(`Tevzi listesi getirilemedi: ${error.message}`);
  return (data ?? []).map(rowToKayit);
}
