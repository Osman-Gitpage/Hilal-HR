"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Tersane Şablon Server Actions ────────────────────────────────────────────
// Tersane şablon CRUD, özel belge CRUD, eksik kontrolü, özlük paketi oluşturma

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteFromB2, getPresignedDownloadUrl } from "@/lib/storage";
import { ozlukPaketiOlustur } from "@/lib/templates/ozluk-generator";
import type { OzlukGirdisi } from "@/lib/templates/ozluk-generator";

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/giris");

  const { data: ks, error: ksError } = await supabase
    .from("kullanici_sirket")
    .select("sirket_id")
    .eq("kullanici_id", user.id)
    .limit(1)
    .maybeSingle();

  if (ksError) throw new Error(`Şirket sorgusu başarısız: ${ksError.message}`);
  if (!ks) throw new Error("Bu kullanıcıya ait şirket kaydı bulunamadı.");

  return { supabase, user, sirketId: (ks as any).sirket_id as string };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TERSANE ŞABLON CRUD
// ═══════════════════════════════════════════════════════════════════════════════

/** Tüm tersane şablonlarını getir */
export async function tersaneSablonlariGetir() {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("tersane_sablon")
    .select("*, tersane_ozel_belge(*)")
    .eq("sirket_id", sirketId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Şablon getirme hatası: ${error.message}`);
  return data ?? [];
}

/** Yeni tersane şablonu oluştur */
export async function tersaneSablonOlustur(params: {
  ad: string;
  standart_kategoriler: string[]; // kategori ID'leri
}) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("tersane_sablon")
    .insert({
      sirket_id: sirketId,
      ad: params.ad,
      standart_kategoriler: params.standart_kategoriler,
    })
    .select()
    .single();

  if (error) return { error: `Şablon oluşturma hatası: ${error.message}` };

  revalidatePath("/evrak/tersane");
  return { data };
}

/** Tersane şablonu güncelle */
export async function tersaneSablonGuncelle(
  id: string,
  params: {
    ad?: string;
    standart_kategoriler?: string[];
    aktif?: boolean;
  }
) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("tersane_sablon")
    .update(params as any)
    .eq("id", id)
    .eq("sirket_id", sirketId)
    .select()
    .single();

  if (error) return { error: `Şablon güncelleme hatası: ${error.message}` };

  revalidatePath("/evrak/tersane");
  return { data };
}

/** Tersane şablonu sil (bağlı özel belgeler de silinir) */
export async function tersaneSablonSil(id: string) {
  const { supabase, sirketId } = await getAuthContext();

  // Önce özel belgeleri sil (B2 dosyaları dahil)
  const { data: belgeler } = await supabase
    .from("tersane_ozel_belge")
    .select("id, sablon_dosya_url")
    .eq("tersane_sablon_id", id)
    .eq("sirket_id", sirketId);

  if (belgeler) {
    for (const belge of belgeler) {
      if (belge.sablon_dosya_url) {
        try { await deleteFromB2({ objectKey: belge.sablon_dosya_url }); } catch { /* ignore */ }
      }
    }
    await supabase
      .from("tersane_ozel_belge")
      .delete()
      .eq("tersane_sablon_id", id)
      .eq("sirket_id", sirketId);
  }

  const { error } = await supabase
    .from("tersane_sablon")
    .delete()
    .eq("id", id)
    .eq("sirket_id", sirketId);

  if (error) return { error: `Şablon silme hatası: ${error.message}` };

  revalidatePath("/evrak/tersane");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÖZEL BELGE CRUD
// ═══════════════════════════════════════════════════════════════════════════════

/** Özel belge ekle */
export async function ozelBelgeEkle(params: {
  tersane_sablon_id: string;
  ad: string;
  sablon_dosya_url?: string;
  sablon_tipi?: string;
}) {
  const { supabase, sirketId } = await getAuthContext();

  // Sıra al
  const { data: maxSira } = await supabase
    .from("tersane_ozel_belge")
    .select("sira")
    .eq("tersane_sablon_id", params.tersane_sablon_id)
    .eq("sirket_id", sirketId)
    .order("sira", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("tersane_ozel_belge")
    .insert({
      sirket_id: sirketId,
      tersane_sablon_id: params.tersane_sablon_id,
      ad: params.ad,
      sablon_dosya_url: params.sablon_dosya_url ?? null,
      sablon_tipi: params.sablon_tipi ?? null,
      sira: (maxSira?.sira ?? 0) + 1,
    })
    .select()
    .single();

  if (error) return { error: `Belge ekleme hatası: ${error.message}` };

  revalidatePath("/evrak/tersane");
  return { data };
}

/** Özel belge sil */
export async function ozelBelgeSil(id: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { data: belge } = await supabase
    .from("tersane_ozel_belge")
    .select("sablon_dosya_url")
    .eq("id", id)
    .eq("sirket_id", sirketId)
    .single();

  if (belge?.sablon_dosya_url) {
    try { await deleteFromB2({ objectKey: belge.sablon_dosya_url }); } catch { /* ignore */ }
  }

  const { error } = await supabase
    .from("tersane_ozel_belge")
    .delete()
    .eq("id", id)
    .eq("sirket_id", sirketId);

  if (error) return { error: `Belge silme hatası: ${error.message}` };

  revalidatePath("/evrak/tersane");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EKSİK KONTROL
// ═══════════════════════════════════════════════════════════════════════════════

/** Personelin seçili şablona göre eksik evraklarını kontrol et */
export async function eksikKontrol(
  personelId: string,
  sablonId: string
) {
  const { supabase, sirketId } = await getAuthContext();

  // Şablonu al
  const { data: sablon } = await supabase
    .from("tersane_sablon")
    .select("*, tersane_ozel_belge(*)")
    .eq("id", sablonId)
    .eq("sirket_id", sirketId)
    .single();

  if (!sablon) return { error: "Şablon bulunamadı." };

  // Gerekli kategori ID'leri
  const gerekliKategoriler = (sablon.standart_kategoriler as string[]) ?? [];

  // Personelin aktif evraklarını al
  const { data: evraklar } = await supabase
    .from("evrak")
    .select("kategori_id")
    .eq("sirket_id", sirketId)
    .eq("personel_id", personelId)
    .eq("durum", "aktif");

  const mevcutKategoriler = new Set((evraklar ?? []).map((e) => e.kategori_id));

  // Eksik kategorileri bul
  const eksikler = gerekliKategoriler.filter((id) => !mevcutKategoriler.has(id));

  // Kategori adlarını al
  let eksikKategoriAdlari: string[] = [];
  if (eksikler.length > 0) {
    const { data: katlar } = await supabase
      .from("evrak_kategori")
      .select("id, ad")
      .in("id", eksikler);
    eksikKategoriAdlari = (katlar ?? []).map((k) => k.ad);
  }

  return {
    tamam: eksikler.length === 0,
    eksikSayisi: eksikler.length,
    eksikKategoriler: eksikKategoriAdlari,
    toplamGerekli: gerekliKategoriler.length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÖZLÜK PAKETİ OLUŞTURMA
// ═══════════════════════════════════════════════════════════════════════════════

/** Personel için özlük paketi oluştur ve ZIP olarak döndür */
export async function ozlukOlustur(
  personelId: string,
  sablonId: string
): Promise<{ zipBase64: string; dosyaAdi: string; hatalar: string[] } | { error: string }> {
  const { supabase, sirketId } = await getAuthContext();

  // Personel bilgileri
  const { data: personel } = await supabase
    .from("personel")
    .select("*")
    .eq("id", personelId)
    .eq("sirket_id", sirketId)
    .single();

  if (!personel) return { error: "Personel bulunamadı." };

  // Şirket bilgileri
  const { data: sirket } = await supabase
    .from("sirketler")
    .select("*")
    .eq("id", sirketId)
    .single();

  if (!sirket) return { error: "Şirket bulunamadı." };

  // Aktif dönem
  const { data: donem } = await supabase
    .from("employment_periods")
    .select("*")
    .eq("personel_id", personelId)
    .eq("sirket_id", sirketId)
    .is("bitis_tarihi", null)
    .maybeSingle();

  // Şablon
  const { data: sablon } = await supabase
    .from("tersane_sablon")
    .select("*, tersane_ozel_belge(*)")
    .eq("id", sablonId)
    .eq("sirket_id", sirketId)
    .single();

  if (!sablon) return { error: "Şablon bulunamadı." };

  // Personel evrakları
  const gerekliKategoriler = (sablon.standart_kategoriler as string[]) ?? [];
  const { data: evraklar } = await supabase
    .from("evrak")
    .select("*, evrak_kategori(ad)")
    .eq("sirket_id", sirketId)
    .eq("personel_id", personelId)
    .eq("durum", "aktif")
    .in("kategori_id", gerekliKategoriler.length > 0 ? gerekliKategoriler : ["__none__"]);

  // İmza ve kaşe bul (şirket evraklarından)
  const { data: imzaEvrak } = await supabase
    .from("evrak")
    .select("dosya_url")
    .eq("sirket_id", sirketId)
    .eq("personel_id", personelId)
    .eq("durum", "aktif")
    .limit(1)
    .maybeSingle();

  // Özel belgeleri şablon listesine ekle
  const sablonDosyalar = ((sablon as any).tersane_ozel_belge ?? []).map((b: any) => ({
    ad: b.ad + (b.sablon_tipi === "docx" ? ".docx" : b.sablon_tipi === "pdf" ? ".pdf" : ""),
    objectKey: b.sablon_dosya_url ?? undefined,
    tip: (b.sablon_tipi ?? "diger") as "docx" | "pdf" | "diger",
  }));

  // Evrak dosyaları
  const evrakDosyalar = (evraklar ?? []).map((e: any) => ({
    kategoriAd: e.evrak_kategori?.ad ?? "Diger",
    dosyaAdi: e.dosya_adi,
    objectKey: e.dosya_url,
    dosyaTipi: e.dosya_tipi ?? "",
  }));

  const girdi: OzlukGirdisi = {
    personel: personel as any,
    sirket: sirket as any,
    donem: donem as any,
    sablonlar: sablonDosyalar,
    evraklar: evrakDosyalar,
  };

  try {
    const sonuc = await ozlukPaketiOlustur(girdi);

    // Uint8Array → Base64 (server'da oluşturuluyor, client'a transfer)
    const base64 = Buffer.from(sonuc.zipBuffer).toString("base64");

    return {
      zipBase64: base64,
      dosyaAdi: sonuc.dosyaAdi,
      hatalar: sonuc.hatalar,
    };
  } catch (err) {
    return { error: `Özlük paketi oluşturma hatası: ${err instanceof Error ? err.message : "Bilinmeyen hata"}` };
  }
}
