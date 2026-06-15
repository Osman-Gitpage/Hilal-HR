"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Evrak Modülü Server Actions ──────────────────────────────────────────────
// Kategori CRUD, Evrak CRUD, Onay/Red, Arşiv, Özet sorguları, Log

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteB2Object } from "@/lib/storage/b2";
import type {
  EvrakKategoriTip,
  EvrakIslem,
} from "@/types/evrak";

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
  if (!ks)
    throw new Error("Bu kullanıcıya ait şirket kaydı bulunamadı.");

  return { supabase, user, sirketId: (ks as any).sirket_id as string };
}

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
 * Evrak kategorisi sil (bağlı evrak varsa engelle).
 */
export async function evrakKategoriSil(id: string) {
  const { supabase, sirketId } = await getAuthContext();

  // Bağlı evrak var mı kontrol et
  const { count } = await supabase
    .from("evrak")
    .select("id", { count: "exact", head: true })
    .eq("kategori_id", id)
    .eq("sirket_id", sirketId);

  if (count && count > 0) {
    return {
      error: `Bu kategoriye bağlı ${count} evrak var. Önce evrakları silin veya başka kategoriye taşıyın.`,
    };
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
 * Yeni evrak oluştur (yükle).
 * Versiyon yönetimi: aynı personel+kategori+dönem için max 3 versiyon.
 * 3'ü aşarsa en eski versiyon silinir.
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
}) {
  const { supabase, user, sirketId } = await getAuthContext();

  // Mevcut versiyonları bul
  let mevcutQuery = supabase
    .from("evrak")
    .select("id, versiyon, dosya_url")
    .eq("sirket_id", sirketId)
    .eq("kategori_id", params.kategori_id)
    .eq("durum", "aktif")
    .order("versiyon", { ascending: true });

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
  const yeniVersiyon = mevcutSayi + 1;

  // Max 3 versiyon — en eskiyi sil
  if (mevcutSayi >= 3 && mevcutlar) {
    const enEski = mevcutlar[0];
    // B2'den sil
    try {
      await deleteB2Object(enEski.dosya_url);
    } catch {
      // B2 silme hatası log'a yazılır ama işlemi durdurmaz
      console.error("B2 silme hatası (versiyon limit):", enEski.dosya_url);
    }
    // DB'den sil
    await supabase.from("evrak").delete().eq("id", enEski.id);
    // Log
    await logKaydet(supabase, sirketId, user.id, enEski.id, "versiyon_silindi", {
      dosya_adi: enEski.dosya_url,
      versiyon: enEski.versiyon,
      sebep: "Max 3 versiyon limiti aşıldı",
    });
  }

  // Yeni evrak oluştur
  const { data, error } = await supabase
    .from("evrak")
    .insert({
      sirket_id: sirketId,
      kategori_id: params.kategori_id,
      personel_id: params.personel_id ?? null,
      employment_period_id: params.employment_period_id ?? null,
      dosya_url: params.dosya_url,
      dosya_adi: params.dosya_adi,
      dosya_boyut: params.dosya_boyut ?? null,
      dosya_tipi: params.dosya_tipi ?? null,
      versiyon: Math.min(yeniVersiyon, 3),
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

  // B2'den sil
  try {
    await deleteB2Object(evrak.dosya_url);
  } catch {
    console.error("B2 silme hatası:", evrak.dosya_url);
  }

  // DB'den sil
  const { error } = await supabase
    .from("evrak")
    .delete()
    .eq("id", id)
    .eq("sirket_id", sirketId);

  if (error) return { error: `Evrak silme hatası: ${error.message}` };

  // Log
  await logKaydet(supabase, sirketId, user.id, id, "silindi", {
    dosya_adi: evrak.dosya_adi,
    versiyon: evrak.versiyon,
  });

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

  try {
    await deleteB2Object(evrak.dosya_url);
  } catch {
    console.error("B2 silme hatası:", evrak.dosya_url);
  }

  const { error } = await supabase
    .from("evrak")
    .delete()
    .eq("id", id)
    .eq("sirket_id", sirketId);

  if (error) return { error: `Versiyon silme hatası: ${error.message}` };

  await logKaydet(supabase, sirketId, user.id, id, "versiyon_silindi", {
    dosya_adi: evrak.dosya_adi,
    versiyon: evrak.versiyon,
  });

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
    .select("id, kategori_id, personel_id, bitis_tarihi, versiyon, dosya_url")
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
