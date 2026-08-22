"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Evrak Modülü Server Actions ──────────────────────────────────────────────
// Kategori CRUD, Evrak CRUD, Onay/Red, Arşiv, Özet sorguları, Log

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteFromB2 } from "@/lib/storage";
import type {
  EvrakKategoriTip,
  EvrakIslem,
} from "@/types/evrak";

// ═══════════════════════════════════════════════════════════════════════════════
import { getAuthContext } from "@/lib/auth/context";
import { evrakYukleSchema } from "@/lib/validations/evrak";

// ═══════════════════════════════════════════════════════════════════════════════
// LOG YARDIMCISI (internal)
// ═══════════════════════════════════════════════════════════════════════════════

async function logKaydet(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sirketId: string,
  userId: string,
  evrakId: string | null,
  islem: EvrakIslem,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detay?: Record<string, any>
) {
  await supabase.from("evrak_log").insert({
    sirket_id: sirketId,
    evrak_id: evrakId,
    islem,
    kullanici_id: userId,
    detay: (detay ?? null) as any,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. KATEGORİ İŞLEMLERİ
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tüm evrak kategorilerini getir (opsiyonel tip filtresi).
 */
export async function evrakKategorileriGetir(tip?: EvrakKategoriTip) {
  const { supabase, sirketId } = await getAuthContext();

  let query = supabase
    .from("evrak_kategori")
    .select("*")
    .eq("sirket_id", sirketId)
    .order("sira", { ascending: true });

  if (tip) {
    query = query.eq("tip", tip);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Kategori getirme hatası: ${error.message}`);
  return data ?? [];
}

/**
 * Yeni evrak kategorisi oluştur.
 */
export async function evrakKategoriOlustur(params: {
  ad: string;
  tip: EvrakKategoriTip;
  zorunlu: boolean;
  sureli: boolean;
  varsayilan_sure: number | null;
  sira?: number;
}) {
  const { supabase, sirketId } = await getAuthContext();

  // Sıra belirlenmediyse en sona ekle
  let sira = params.sira;
  if (sira === undefined) {
    const { data: maxSira } = await supabase
      .from("evrak_kategori")
      .select("sira")
      .eq("sirket_id", sirketId)
      .eq("tip", params.tip)
      .order("sira", { ascending: false })
      .limit(1)
      .maybeSingle();

    sira = (maxSira?.sira ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("evrak_kategori")
    .insert({
      sirket_id: sirketId,
      ad: params.ad,
      tip: params.tip,
      zorunlu: params.zorunlu,
      sureli: params.sureli,
      varsayilan_sure: params.sureli ? params.varsayilan_sure : null,
      sira,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Bu isimde bir kategori zaten mevcut." };
    }
    return { error: `Kategori oluşturma hatası: ${error.message}` };
  }

  revalidatePath("/ayarlar");
  revalidatePath("/evrak");
  return { data };
}

/**
 * Evrak kategorisi güncelle.
 */
export async function evrakKategoriGuncelle(
  id: string,
  params: {
    ad?: string;
    zorunlu?: boolean;
    sureli?: boolean;
    varsayilan_sure?: number | null;
    aktif?: boolean;
  }
) {
  const { supabase, sirketId } = await getAuthContext();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {};
  if (params.ad !== undefined) updateData.ad = params.ad;
  if (params.zorunlu !== undefined) updateData.zorunlu = params.zorunlu;
  if (params.sureli !== undefined) {
    updateData.sureli = params.sureli;
    if (!params.sureli) updateData.varsayilan_sure = null;
  }
  if (params.varsayilan_sure !== undefined)
    updateData.varsayilan_sure = params.varsayilan_sure;
  if (params.aktif !== undefined) updateData.aktif = params.aktif;

  // Eğer ID veritabanında yoksa (örn: kat- ön tanımlı kategori ise) otomatik oluştur
  const { data: existing } = await supabase
    .from("evrak_kategori")
    .select("id")
    .eq("id", id)
    .eq("sirket_id", sirketId)
    .maybeSingle();

  if (!existing && id.startsWith("kat-")) {
    const { data: newData, error: createError } = await supabase
      .from("evrak_kategori")
      .insert({
        sirket_id: sirketId,
        ad: params.ad ?? "Kategori",
        tip: "personel",
        zorunlu: params.zorunlu ?? false,
        sureli: params.sureli ?? false,
        varsayilan_sure: params.varsayilan_sure ?? null,
        sira: 99,
      })
      .select()
      .single();

    if (createError) {
      return { error: `Kategori oluşturma hatası: ${createError.message}` };
    }
    revalidatePath("/ayarlar");
    revalidatePath("/evrak");
    return { data: newData };
  }

  const { data, error } = await supabase
    .from("evrak_kategori")
    .update(updateData)
    .eq("id", id)
    .eq("sirket_id", sirketId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Bu isimde bir kategori zaten mevcut." };
    }
    return { error: `Kategori güncelleme hatası: ${error.message}` };
  }

  revalidatePath("/ayarlar");
  revalidatePath("/evrak");
  return { data };
}

/**
 * Evrak kategorisi sil (bağlı evrak varsa uyar veya force=true ile temizle).
 */
export async function evrakKategoriSil(id: string, force: boolean = false) {
  const { supabase, sirketId } = await getAuthContext();

  // Bağlı evrak var mı kontrol et
  const { count } = await supabase
    .from("evrak")
    .select("id", { count: "exact", head: true })
    .eq("kategori_id", id)
    .eq("sirket_id", sirketId);

  if (count && count > 0 && !force) {
    return {
      error: `Bu kategoriye bağlı ${count} evrak kaydı bulunuyor.`,
      bagliEvrakSayisi: count,
    };
  }

  // Eğer force=true ise bağlı evrak kayıtlarını DB ve B2'den temizle
  if (count && count > 0 && force) {
    const { data: bagliEvraklar } = await supabase
      .from("evrak")
      .select("id, dosya_url")
      .eq("kategori_id", id)
      .eq("sirket_id", sirketId);

    if (bagliEvraklar && bagliEvraklar.length > 0) {
      for (const evrak of bagliEvraklar) {
        if (evrak.dosya_url) {
          try {
            await deleteFromB2({ objectKey: evrak.dosya_url });
          } catch {
            // B2 nesnesi yoksa pas geç
          }
        }
      }
      await supabase
        .from("evrak")
        .delete()
        .eq("kategori_id", id)
        .eq("sirket_id", sirketId);
    }
  }

  const { error } = await supabase
    .from("evrak_kategori")
    .delete()
    .eq("id", id)
    .eq("sirket_id", sirketId);

  if (error) return { error: `Kategori silme hatası: ${error.message}` };

  revalidatePath("/ayarlar");
  revalidatePath("/evrak");
  return { success: true };
}

/**
 * Kategori sıralamasını toplu güncelle.
 */
export async function evrakKategoriSiralamaGuncelle(
  items: { id: string; sira: number }[]
) {
  const { supabase, sirketId } = await getAuthContext();

  // Her birini ayrı güncelle (batch upsert yerine, RLS uyumu için)
  const promises = items.map(({ id, sira }) =>
    supabase
      .from("evrak_kategori")
      .update({ sira })
      .eq("id", id)
      .eq("sirket_id", sirketId)
  );

  const results = await Promise.all(promises);
  const hatalar = results.filter((r) => r.error);

  if (hatalar.length > 0) {
    return { error: "Sıralama güncellenirken hata oluştu." };
  }

  revalidatePath("/ayarlar");
  revalidatePath("/evrak");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. EVRAK CRUD
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Filtrelere göre evrak listesi getir.
 */
export async function evraklariGetir(filters?: {
  personel_id?: string;
  kategori_id?: string;
  employment_period_id?: string;
  durum?: "aktif" | "arsiv";
}) {
  const { supabase, sirketId } = await getAuthContext();

  let query = supabase
    .from("evrak")
    .select("*, evrak_kategori(*)")
    .eq("sirket_id", sirketId)
    .order("versiyon", { ascending: false });

  if (filters?.personel_id) query = query.eq("personel_id", filters.personel_id);
  if (filters?.kategori_id) query = query.eq("kategori_id", filters.kategori_id);
  if (filters?.employment_period_id)
    query = query.eq("employment_period_id", filters.employment_period_id);
  if (filters?.durum) query = query.eq("durum", filters.durum);

  const { data, error } = await query;

  if (error) throw new Error(`Evrak getirme hatası: ${error.message}`);
  return data ?? [];
}

/**
 * Bir personelin belirli dönemdeki tüm evraklarını getir.
 */
export async function personelEvraklariGetir(
  personelId: string,
  donemId?: string
) {
  const { supabase, sirketId } = await getAuthContext();

  let query = supabase
    .from("evrak")
    .select("*, evrak_kategori(*)")
    .eq("sirket_id", sirketId)
    .eq("personel_id", personelId)
    .eq("durum", "aktif")
    .order("versiyon", { ascending: false });

  if (donemId) {
    query = query.eq("employment_period_id", donemId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Personel evrakları getirme hatası: ${error.message}`);
  return data ?? [];
}

/**
 * Şirket evraklarını getir (personel_id IS NULL).
 */
export async function sirketEvraklariGetir() {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("evrak")
    .select("*, evrak_kategori(*)")
    .eq("sirket_id", sirketId)
    .is("personel_id", null)
    .eq("durum", "aktif")
    .order("versiyon", { ascending: false });

  if (error) throw new Error(`Şirket evrakları getirme hatası: ${error.message}`);
  return data ?? [];
}

/**
 * Preset kat- ID'lerini veya isimleri veritabanındaki gerçek UUID ID'ye dönüştürür.
 * Veritabanında yoksa Postgres UUID üreterek otomatik oluşturur.
 */
async function gercekKategoriIdBulVeyaOlustur(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sirketId: string,
  kategoriId: string,
  kategoriAdHint?: string
): Promise<string> {
  // 1. Eğer kategoriId geçerli bir UUID ise (kat- ile başlamıyorsa), DB'de var mı kontrol et
  if (!kategoriId.startsWith("kat-")) {
    const { data } = await supabase
      .from("evrak_kategori")
      .select("id")
      .eq("id", kategoriId)
      .eq("sirket_id", sirketId)
      .maybeSingle();

    if (data) return data.id;
  }

  // 2. Preset ID veya isim bazlı arama yap
  let arananAd = kategoriAdHint ?? "";
  if (!arananAd) {
    if (kategoriId === "kat-saglik") arananAd = "Sağlık Raporu";
    else if (kategoriId === "kat-tetenoz") arananAd = "Tetenoz";
    else if (kategoriId === "kat-adli-sicil") arananAd = "Adli Sicil";
    else if (kategoriId === "kat-sgk") arananAd = "SGK";
    else if (kategoriId === "kat-kkd") arananAd = "KKD";
    else if (kategoriId === "kat-sozlesme") arananAd = "Sözleşme";
    else if (kategoriId === "kat-kimlik") arananAd = "Kimlik";
    else if (kategoriId === "kat-sertifika") arananAd = "Sertifika";
    else if (kategoriId === "kat-ikametgah") arananAd = "İkametgah";
    else if (kategoriId === "kat-diploma") arananAd = "Diploma";
    else if (kategoriId === "kat-fotograf") arananAd = "Fotoğraf";
  }

  if (arananAd) {
    const { data: isimli } = await supabase
      .from("evrak_kategori")
      .select("id")
      .eq("sirket_id", sirketId)
      .ilike("ad", `%${arananAd}%`)
      .limit(1)
      .maybeSingle();

    if (isimli) return isimli.id;
  }

  // 3. Veritabanında yoksa, id göndermeden (Postgres UUID üretecek şekilde) yeni kategori oluştur
  const { data: yeni, error } = await supabase
    .from("evrak_kategori")
    .insert({
      sirket_id: sirketId,
      ad: arananAd || "Evrak Kategorisi",
      tip: "personel",
      zorunlu: true,
      sureli: true,
      varsayilan_sure: 365,
      sira: 99,
    })
    .select("id")
    .single();

  if (error || !yeni) {
    console.error("Kategori oluşturma hatası:", error);
    return kategoriId;
  }

  return yeni.id;
}

/**
 * Yeni evrak oluştur (yükle / değiştir).
 * Versiyon yönetimi: Max 2 dosya tutulur (1 Canlı + 1 Geçmiş).
 * 3. dosya yüklendiğinde, en eski (geçmiş) evrak DB ve B2'den otomatik silinir.
 */
export async function evrakOlustur(params: {
  kategori_id: string;
  personel_id?: string;
  employment_period_id?: string;
  dosya_url: string;
  dosya_adi: string;
  dosya_boyut?: number;
  dosya_tipi?: string;
  baslangic_tarihi?: string;
  bitis_tarihi?: string;
  tetenoz_iceriyor?: boolean;
}) {
  const parsed = evrakYukleSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Geçersiz evrak verisi.");
  }

  const { supabase, user, sirketId } = await getAuthContext();

  // Gerçek UUID Kategori ID'sini çöz
  const hedefKategoriId = await gercekKategoriIdBulVeyaOlustur(
    supabase,
    sirketId,
    params.kategori_id
  );

  // Mevcut evrakları tarih sırasıyla al (en eski -> en yeni)
  let mevcutQuery = supabase
    .from("evrak")
    .select("id, versiyon, dosya_url")
    .eq("sirket_id", sirketId)
    .eq("kategori_id", hedefKategoriId)
    .eq("durum", "aktif")
    .order("created_at", { ascending: true });

  if (params.personel_id) {
    mevcutQuery = mevcutQuery.eq("personel_id", params.personel_id);
  } else {
    mevcutQuery = mevcutQuery.is("personel_id", null);
  }

  if (params.employment_period_id) {
    mevcutQuery = mevcutQuery.eq(
      "employment_period_id",
      params.employment_period_id
    );
  }

  const { data: mevcutlar } = await mevcutQuery;
  const mevcutSayi = mevcutlar?.length ?? 0;

  // Max 2 dosya kuralı: 1 Canlı + 1 Geçmiş.
  if (mevcutSayi >= 2 && mevcutlar) {
    const silinecekler = mevcutlar.slice(0, mevcutSayi - 1);
    for (const enEski of silinecekler) {
      try {
        await logKaydet(supabase, sirketId, user.id, null, "versiyon_silindi", {
          dosya_url: enEski.dosya_url,
          versiyon: enEski.versiyon,
          sebep: "Maksimum 2 dosya (1 Canlı + 1 Geçmiş) limiti nedeniyle otomatik silindi",
        });
      } catch (logErr) {
        console.error("Log kaydetme hatası:", logErr);
      }

      try {
        await deleteFromB2({ objectKey: enEski.dosya_url });
      } catch (b2Err) {
        console.error("B2 silme hatası (2 dosya limiti):", b2Err);
      }

      await supabase.from("evrak").delete().eq("id", enEski.id);
    }
  }

  // Yeni evrak oluştur
  const { data, error } = await supabase
    .from("evrak")
    .insert({
      sirket_id: sirketId,
      kategori_id: hedefKategoriId,
      personel_id: params.personel_id ?? null,
      employment_period_id: params.employment_period_id ?? null,
      dosya_url: params.dosya_url,
      dosya_adi: params.dosya_adi,
      dosya_boyut: params.dosya_boyut ?? null,
      dosya_tipi: params.dosya_tipi ?? null,
      versiyon: Math.min(mevcutSayi + 1, 2),
      baslangic_tarihi: params.baslangic_tarihi ?? null,
      bitis_tarihi: params.bitis_tarihi ?? null,
    })
    .select()
    .single();

  if (error) return { error: `Evrak oluşturma hatası: ${error.message}` };

  // Log
  await logKaydet(supabase, sirketId, user.id, data.id, "yuklendi", {
    dosya_adi: params.dosya_adi,
    versiyon: data.versiyon,
  });

  // Eğer bu Sağlık Raporu ise ve tetenoz_iceriyor işaretlendiyse, Tetenoz evrağını da otomatik bağla
  if (params.tetenoz_iceriyor && params.personel_id) {
    try {
      const tetKatId = await gercekKategoriIdBulVeyaOlustur(
        supabase,
        sirketId,
        "kat-tetenoz",
        "Tetenoz Aşı Kartı / Belgesi"
      );

      // Tetenoz için de aynı dosyayı otomatik evrak olarak ekle
      await evrakOlustur({
        kategori_id: tetKatId,
        personel_id: params.personel_id,
        employment_period_id: params.employment_period_id,
        dosya_url: params.dosya_url,
        dosya_adi: `[Sağlık Raporu İçi] ${params.dosya_adi}`,
        dosya_boyut: params.dosya_boyut,
        dosya_tipi: params.dosya_tipi,
        baslangic_tarihi: params.baslangic_tarihi,
        bitis_tarihi: params.bitis_tarihi,
        tetenoz_iceriyor: false, // Rekürsif döngüyü engelle
      });
    } catch (tetErr) {
      console.error("Tetenoz evrağı otomatik bağlama hatası:", tetErr);
    }
  }

  revalidatePath("/evrak");
  revalidatePath("/personel");
  return { data };
}

/**
 * Evrak güncelle (tarih, onay durumu vb.).
 */
export async function evrakGuncelle(
  id: string,
  params: {
    baslangic_tarihi?: string;
    bitis_tarihi?: string;
    onay_durumu?: string;
  }
) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("evrak")
    .update(params)
    .eq("id", id)
    .eq("sirket_id", sirketId)
    .select()
    .single();

  if (error) return { error: `Evrak güncelleme hatası: ${error.message}` };

  revalidatePath("/evrak");
  revalidatePath("/personel");
  return { data };
}

/**
 * Evrak sil (DB + B2).
 */
export async function evrakSil(id: string) {
  const { supabase, user, sirketId } = await getAuthContext();

  // Evrak bilgisini al
  const { data: evrak } = await supabase
    .from("evrak")
    .select("dosya_url, dosya_adi, versiyon")
    .eq("id", id)
    .eq("sirket_id", sirketId)
    .single();

  if (!evrak) return { error: "Evrak bulunamadı." };

  // Log (Silinmeden önce safe log)
  try {
    await logKaydet(supabase, sirketId, user.id, null, "silindi", {
      dosya_adi: evrak.dosya_adi,
      versiyon: evrak.versiyon,
      silinen_evrak_id: id,
    });
  } catch (logErr) {
    console.error("Log kaydetme hatası:", logErr);
  }

  // B2'den sil
  try {
    await deleteFromB2({ objectKey: evrak.dosya_url });
  } catch (b2Err) {
    console.error("B2 silme hatası:", b2Err);
  }

  // DB'den sil
  const { error } = await supabase
    .from("evrak")
    .delete()
    .eq("id", id)
    .eq("sirket_id", sirketId);

  if (error) return { error: `Evrak silme hatası: ${error.message}` };

  revalidatePath("/evrak");
  revalidatePath("/personel");
  return { success: true };
}

/**
 * Belirli bir versiyonu sil.
 */
export async function evrakVersiyonSil(id: string) {
  const { supabase, user, sirketId } = await getAuthContext();

  const { data: evrak } = await supabase
    .from("evrak")
    .select("dosya_url, dosya_adi, versiyon")
    .eq("id", id)
    .eq("sirket_id", sirketId)
    .single();

  if (!evrak) return { error: "Evrak bulunamadı." };

  // Log (Silinmeden önce safe log)
  try {
    await logKaydet(supabase, sirketId, user.id, null, "versiyon_silindi", {
      dosya_adi: evrak.dosya_adi,
      versiyon: evrak.versiyon,
      silinen_evrak_id: id,
    });
  } catch (logErr) {
    console.error("Log kaydetme hatası:", logErr);
  }

  try {
    await deleteFromB2({ objectKey: evrak.dosya_url });
  } catch (b2Err) {
    console.error("B2 silme hatası:", b2Err);
  }

  const { error } = await supabase
    .from("evrak")
    .delete()
    .eq("id", id)
    .eq("sirket_id", sirketId);

  if (error) return { error: `Versiyon silme hatası: ${error.message}` };

  revalidatePath("/evrak");
  revalidatePath("/personel");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ONAY / RED / ARŞİV İŞLEMLERİ
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Evrak onayla.
 */
export async function evrakOnayla(id: string) {
  const { supabase, user, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("evrak")
    .update({ onay_durumu: "onaylandi" })
    .eq("id", id)
    .eq("sirket_id", sirketId)
    .select()
    .single();

  if (error) return { error: `Onay hatası: ${error.message}` };

  await logKaydet(supabase, sirketId, user.id, id, "onaylandi");

  revalidatePath("/evrak");
  revalidatePath("/personel");
  return { data };
}

/**
 * Evrak reddet.
 */
export async function evrakReddet(id: string, sebep?: string) {
  const { supabase, user, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("evrak")
    .update({ onay_durumu: "reddedildi" })
    .eq("id", id)
    .eq("sirket_id", sirketId)
    .select()
    .single();

  if (error) return { error: `Red hatası: ${error.message}` };

  await logKaydet(supabase, sirketId, user.id, id, "reddedildi", {
    sebep: sebep ?? null,
  });

  revalidatePath("/evrak");
  revalidatePath("/personel");
  return { data };
}

/**
 * Dönem geçişinde tüm evrakları arşivle.
 */
export async function donemEvraklariArsivle(donemId: string) {
  const { supabase, user, sirketId } = await getAuthContext();

  const { data: evraklar, error: getError } = await supabase
    .from("evrak")
    .select("id")
    .eq("sirket_id", sirketId)
    .eq("employment_period_id", donemId)
    .eq("durum", "aktif");

  if (getError) return { error: `Arşivleme sorgusu hatası: ${getError.message}` };

  if (!evraklar || evraklar.length === 0) {
    return { success: true, arsivlenen: 0 };
  }

  const ids = evraklar.map((e) => e.id);

  const { error: updateError } = await supabase
    .from("evrak")
    .update({ durum: "arsiv" })
    .in("id", ids)
    .eq("sirket_id", sirketId);

  if (updateError)
    return { error: `Arşivleme hatası: ${updateError.message}` };

  // Toplu log
  for (const evrakId of ids) {
    await logKaydet(supabase, sirketId, user.id, evrakId, "arsivlendi", {
      donem_id: donemId,
    });
  }

  revalidatePath("/evrak");
  revalidatePath("/personel");
  return { success: true, arsivlenen: ids.length };
}

/**
 * Arşivden aktif döneme kopyala (versiyon 1 olarak).
 */
export async function arsivdenGetir(
  evrakId: string,
  yeniDonemId: string
) {
  const { supabase, user, sirketId } = await getAuthContext();

  // Kaynak evrak bilgisini al
  const { data: kaynak, error: kaynakError } = await supabase
    .from("evrak")
    .select("*")
    .eq("id", evrakId)
    .eq("sirket_id", sirketId)
    .single();

  if (kaynakError || !kaynak)
    return { error: "Kaynak evrak bulunamadı." };

  // Yeni dönemde aynı kategoride aktif evrak var mı kontrol et
  const { count } = await supabase
    .from("evrak")
    .select("id", { count: "exact", head: true })
    .eq("sirket_id", sirketId)
    .eq("kategori_id", kaynak.kategori_id)
    .eq("personel_id", kaynak.personel_id!)
    .eq("employment_period_id", yeniDonemId)
    .eq("durum", "aktif");

  if (count && count >= 3) {
    return { error: "Bu kategori için yeni dönemde zaten 3 versiyon mevcut." };
  }

  // Kopyala
  const { data: yeni, error: insertError } = await supabase
    .from("evrak")
    .insert({
      sirket_id: sirketId,
      kategori_id: kaynak.kategori_id,
      personel_id: kaynak.personel_id,
      employment_period_id: yeniDonemId,
      dosya_url: kaynak.dosya_url, // Aynı B2 dosyasını referans et
      dosya_adi: kaynak.dosya_adi,
      dosya_boyut: kaynak.dosya_boyut,
      dosya_tipi: kaynak.dosya_tipi,
      versiyon: (count ?? 0) + 1,
      baslangic_tarihi: kaynak.baslangic_tarihi,
      bitis_tarihi: kaynak.bitis_tarihi,
      durum: "aktif",
      onay_durumu: "beklemede",
    })
    .select()
    .single();

  if (insertError)
    return { error: `Kopyalama hatası: ${insertError.message}` };

  await logKaydet(supabase, sirketId, user.id, yeni.id, "kopyalandi", {
    kaynak_evrak_id: evrakId,
    kaynak_donem_id: kaynak.employment_period_id,
    hedef_donem_id: yeniDonemId,
  });

  revalidatePath("/evrak");
  revalidatePath("/personel");
  return { data: yeni };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SORGU / ÖZET İŞLEMLERİ
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tüm personeller için evrak özet matrisi.
 * Ana sayfa tablosu için kullanılır.
 */
export async function evrakOzetiGetir() {
  const { supabase, sirketId } = await getAuthContext();

  // 1. Aktif personel kategorileri al
  const { data: kategoriler } = await supabase
    .from("evrak_kategori")
    .select("*")
    .eq("sirket_id", sirketId)
    .eq("tip", "personel")
    .eq("aktif", true)
    .order("sira");

  // 2. Aktif personelleri al (aktif dönem olan)
  const { data: personeller } = await supabase
    .from("personel")
    .select(
      `
      id, ad, soyad,
      employment_periods!inner (
        id, baslangic_tarihi, bitis_tarihi
      )
    `
    )
    .eq("sirket_id", sirketId)
    .is("employment_periods.bitis_tarihi", null)
    .order("ad");

  // 3. Aktif evrakları al
  const { data: evraklar } = await supabase
    .from("evrak")
    .select("id, kategori_id, personel_id, bitis_tarihi, versiyon, dosya_url, dosya_adi")
    .eq("sirket_id", sirketId)
    .eq("durum", "aktif")
    .not("personel_id", "is", null);

  return {
    kategoriler: kategoriler ?? [],
    personeller: (personeller ?? []).map((p: any) => ({
      id: p.id,
      ad: p.ad,
      soyad: p.soyad,
      aktif_donem_id: p.employment_periods?.[0]?.id ?? null,
    })),
    evraklar: evraklar ?? [],
  };
}

/**
 * Süresi yaklaşan evraklar (30 gün içinde sona erecek).
 */
export async function suresiYaklasanEvraklarGetir() {
  const { supabase, sirketId } = await getAuthContext();

  const bugun = new Date().toISOString().split("T")[0];
  const otuzGunSonra = new Date();
  otuzGunSonra.setDate(otuzGunSonra.getDate() + 30);
  const esik = otuzGunSonra.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("evrak")
    .select("*, evrak_kategori(ad, tip), personel:personel_id(ad, soyad)")
    .eq("sirket_id", sirketId)
    .eq("durum", "aktif")
    .gt("bitis_tarihi", bugun)
    .lte("bitis_tarihi", esik)
    .order("bitis_tarihi", { ascending: true });

  if (error) throw new Error(`Süresi yaklaşan sorgusu hatası: ${error.message}`);
  return data ?? [];
}

/**
 * Evrak loglarını getir.
 */
export async function evrakLoglarGetir(evrakId?: string) {
  const { supabase, sirketId } = await getAuthContext();

  let query = supabase
    .from("evrak_log")
    .select("*")
    .eq("sirket_id", sirketId)
    .order("tarih", { ascending: false })
    .limit(50);

  if (evrakId) {
    query = query.eq("evrak_id", evrakId);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Log getirme hatası: ${error.message}`);
  return data ?? [];
}
