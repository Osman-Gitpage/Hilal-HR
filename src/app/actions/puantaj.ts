"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Database } from "@/supabase/types";
type PuantajGenelInsert = Database["public"]["Tables"]["puantaj_genel"]["Insert"];
type PuantajProjeInsert = Database["public"]["Tables"]["puantaj_proje"]["Insert"];
type ProjeInsert = Database["public"]["Tables"]["proje"]["Insert"];
type ProjeUpdate = Database["public"]["Tables"]["proje"]["Update"];
import type { OzelDurum, PuantajGunVerisi, FaturaKodu } from "@/types";

// ─────────────────────────────────────────────
// Yardımcı: Aktif kullanıcı + aktif şirket
// ─────────────────────────────────────────────
async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/giris");

  const { data: ks, error: ksError } = await supabase
    .from("kullanici_sirket")
    .select("sirket_id, rol")
    .eq("kullanici_id", user.id)
    .limit(1)
    .maybeSingle();

  if (ksError) throw new Error(`Şirket sorgusu başarısız: ${ksError.message}`);
  if (!ks) throw new Error("Bu kullanıcıya ait şirket kaydı bulunamadı.");

  return {
    supabase,
    user,
    sirketId: (ks as any).sirket_id as string,
    rol: (ks as any).rol as string,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GENEL PUANTAJ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verilen yıl-ay için o dönemdeki tüm aktif personeli ve
 * puantaj_genel kayıtlarını birleştirerek döndürür.
 */
export async function ayPuantajGetir(yil: number, ay: number) {
  const { supabase, sirketId, rol } = await getAuthContext();

  const ayBaslangic = `${yil}-${String(ay).padStart(2, "0")}-01`;
  const ayBitis = `${yil}-${String(ay).padStart(2, "0")}-${new Date(yil, ay, 0).getDate()}`; // son gün

  // O dönemde aktif olan personeller (employment_periods filtrelemesi)
  const { data: personelList, error: pErr } = await supabase
    .from("personel")
    .select(
      `
      id, ad, soyad, gorev_unvan,
      employment_periods!inner (
        baslangic_tarihi, bitis_tarihi
      )
    `
    )
    .eq("sirket_id", sirketId)
    .lte("employment_periods.baslangic_tarihi", ayBitis)
    .or(
      `bitis_tarihi.is.null,bitis_tarihi.gte.${ayBaslangic}`,
      { referencedTable: "employment_periods" }
    );

  if (pErr) throw new Error(pErr.message);

  // O aya ait puantaj kayıtları
  const { data: puantajlar, error: puErr } = await supabase
    .from("puantaj_genel")
    .select("*")
    .eq("sirket_id", sirketId)
    .gte("tarih", ayBaslangic)
    .lte("tarih", ayBitis);

  if (puErr) throw new Error(puErr.message);

  // O aya ait proje saatleri (proje adı ile birlikte — tooltip için)
  const { data: projeSaatleri } = await supabase
    .from("puantaj_proje")
    .select("personel_id, tarih, saat, proje:proje_id(ad)")
    .eq("sirket_id", sirketId)
    .gte("tarih", ayBaslangic)
    .lte("tarih", ayBitis)
    .or("saat.gt.0,ozel_durum.not.is.null");

  // Ay kapalı mı? (en az bir kayıt kapali=true ise ay kapalıdır)
  const ayKapali = (puantajlar ?? []).some((p: any) => p.kapali === true);

  return {
    personeller: (personelList ?? []) as any[],
    puantajlar: (puantajlar ?? []) as any[],
    projeSaatleri: (projeSaatleri ?? []) as any[],
    ayKapali,
    kullaniciRol: rol,
  };
}

/**
 * Bir personelin belirli gününe giriş/çıkış veya özel durum upsert eder.
 * Kapalı ay ise işlem reddedilir.
 */
export async function gunVeriGir(
  personelId: string,
  tarih: string, // "YYYY-MM-DD"
  veri: PuantajGunVerisi
) {
  const { supabase, sirketId } = await getAuthContext();

  // Kapalı ay kontrolü
  const { data: mevcutKayit } = await supabase
    .from("puantaj_genel")
    .select("kapali")
    .eq("personel_id", personelId)
    .eq("tarih", tarih)
    .maybeSingle();

  if ((mevcutKayit as any)?.kapali) {
    return { hata: "Bu ay kilitli. Düzenleme yapılamaz." };
  }

  // Çalışma saati otomatik hesapla (giriş-çıkış varsa)
  let calisma_saati: number | null = veri.calisma_saati ?? null;
  if (veri.giris_saati && veri.cikis_saati && !calisma_saati) {
    const [gh, gm] = veri.giris_saati.split(":").map(Number);
    const [ch, cm] = veri.cikis_saati.split(":").map(Number);
    const dakika = (ch * 60 + cm) - (gh * 60 + gm);
    calisma_saati = dakika > 0 ? Math.round((dakika / 60) * 100) / 100 : null;
  }

  const kayit: PuantajGenelInsert = {
    sirket_id: sirketId,
    personel_id: personelId,
    tarih,
    giris_saati: veri.ozel_durum ? null : (veri.giris_saati ?? null),
    cikis_saati: veri.ozel_durum ? null : (veri.cikis_saati ?? null),
    calisma_saati: veri.ozel_durum ? null : calisma_saati,
    ozel_durum: (veri.ozel_durum as OzelDurum) ?? null,
    aciklama: veri.aciklama ?? null,
    kapali: false,
    // PM (Pazar Mesaisi) özel durumunda mesai_saati korunur, diğerleri null
    mesai_saati: veri.ozel_durum === "PM" ? (veri.mesai_saati ?? null) : (veri.ozel_durum ? null : (veri.mesai_saati ?? null)),
  };

  const { error } = await supabase
    .from("puantaj_genel")
    .upsert(kayit as any, { onConflict: "personel_id,tarih" });

  if (error) return { hata: error.message };

  revalidatePath("/puantaj");
  return { basarili: true };
}

/**
 * Belirli personel+tarih kaydını siler (boş hücreye döndürür).
 */
export async function gunVeriSil(personelId: string, tarih: string) {
  const { supabase, sirketId } = await getAuthContext();

  // Kapalı ay kontrolü
  const { data: kayit } = await supabase
    .from("puantaj_genel")
    .select("kapali")
    .eq("personel_id", personelId)
    .eq("tarih", tarih)
    .eq("sirket_id", sirketId)
    .maybeSingle();

  if ((kayit as any)?.kapali) {
    return { hata: "Bu ay kilitli. Silme yapılamaz." };
  }

  const { error } = await supabase
    .from("puantaj_genel")
    .delete()
    .eq("personel_id", personelId)
    .eq("tarih", tarih)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/puantaj");
  return { basarili: true };
}

/**
 * Belirli yıl-ay'ın tüm puantaj kayıtlarını kapali=true yapar.
 * Bu işlem geri alınamaz.
 */
export async function ayKapat(yil: number, ay: number) {
  const { supabase, sirketId } = await getAuthContext();

  const ayBaslangic = `${yil}-${String(ay).padStart(2, "0")}-01`;
  const ayBitis = `${yil}-${String(ay).padStart(2, "0")}-${new Date(yil, ay, 0).getDate()}`;

  const { error } = await supabase
    .from("puantaj_genel")
    .update({ kapali: true, updated_at: new Date().toISOString() } as any)
    .eq("sirket_id", sirketId)
    .gte("tarih", ayBaslangic)
    .lte("tarih", ayBitis);

  if (error) return { hata: error.message };

  revalidatePath("/puantaj");
  return { basarili: true };
}

/**
 * Kilitli ayı geri açar. Sadece admin rolü yapabilir.
 */
export async function ayAc(yil: number, ay: number) {
  const { supabase, sirketId, rol } = await getAuthContext();

  if (rol !== "admin") {
    return { hata: "Bu işlem için yönetici yetkisi gereklidir." };
  }

  const ayBaslangic = `${yil}-${String(ay).padStart(2, "0")}-01`;
  const ayBitis = `${yil}-${String(ay).padStart(2, "0")}-${new Date(yil, ay, 0).getDate()}`;

  const { error } = await supabase
    .from("puantaj_genel")
    .update({ kapali: false, updated_at: new Date().toISOString() } as any)
    .eq("sirket_id", sirketId)
    .gte("tarih", ayBaslangic)
    .lte("tarih", ayBitis);

  if (error) return { hata: error.message };

  revalidatePath("/puantaj");
  return { basarili: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJE PUANTAJ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bir projenin belirli ay-yıl için personel × gün matrisini döndürür.
 * Her (personel_id, tarih) için saat toplamı hesaplanır.
 */
export async function projePuantajGetir(
  projeId: string,
  yil: number,
  ay: number
) {
  const { supabase, sirketId } = await getAuthContext();

  const ayBaslangic = `${yil}-${String(ay).padStart(2, "0")}-01`;
  const ayBitis = `${yil}-${String(ay).padStart(2, "0")}-${new Date(yil, ay, 0).getDate()}`;

  const { data, error } = await supabase
    .from("puantaj_proje")
    .select(
      `
      id, personel_id, tarih, saat, mesai_saati, ozel_durum, aciklama,
      personel ( id, ad, soyad )
    `
    )
    .eq("sirket_id", sirketId)
    .eq("proje_id", projeId)
    .gte("tarih", ayBaslangic)
    .lte("tarih", ayBitis)
    .order("tarih", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}

/**
 * Bir personelin belirli proje+tarih için saat girişi upsert eder.
 * (Aynı personel+proje+tarih için birden fazla satır olabilir;
 *  bu fonksiyon sum'ı yeni değerle değiştirir — mevcut tüm satırları siler, yeni ekler.)
 */
export async function projeSaatGir(
  personelId: string,
  projeId: string,
  tarih: string,
  saat: number,
  aciklama?: string | null
) {
  const { supabase, sirketId } = await getAuthContext();

  if (saat <= 0 || saat > 24) {
    return { hata: "Saat değeri 0 ile 24 arasında olmalıdır." };
  }

  // Mevcut satırları sil (sum-replace stratejisi)
  await supabase
    .from("puantaj_proje")
    .delete()
    .eq("sirket_id", sirketId)
    .eq("personel_id", personelId)
    .eq("proje_id", projeId)
    .eq("tarih", tarih);

  const kayit: PuantajProjeInsert = {
    sirket_id: sirketId,
    personel_id: personelId,
    proje_id: projeId,
    tarih,
    saat,
    aciklama: aciklama ?? null,
  };

  const { error } = await supabase
    .from("puantaj_proje")
    .insert(kayit as any);

  if (error) return { hata: error.message };

  revalidatePath("/puantaj/proje");
  return { basarili: true };
}

/**
 * Belirli bir puantaj_proje kaydını id ile siler.
 */
export async function projeSaatSil(id: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { error } = await supabase
    .from("puantaj_proje")
    .delete()
    .eq("id", id)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/puantaj/proje");
  return { basarili: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJE YÖNETİMİ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Şirkete ait tüm projeleri (aktif + arşiv) döndürür.
 */
export async function projeleriGetir() {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("proje")
    .select("*")
    .eq("sirket_id", sirketId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}

/**
 * Belirli bir ay için o dönemde aktif olan projeleri döndürür.
 *
 * Mantık (öncelik sırasıyla):
 *  1. Projenin proje_donem_log kaydı VARSA → o ayı kapsayan en az bir dönem logu
 *     olan projeler döndürülür (durum=arsiv olsa da dahil edilir).
 *  2. Projenin proje_donem_log kaydı YOKSA → eski mantık:
 *     durum=aktif VE baslangic_tarihi ≤ ayBitis VE (bitis_tarihi NULL VEYA ≥ ayBaslangic)
 */
export async function donemAktifProjeleriGetir(yil: number, ay: number) {
  const { supabase, sirketId } = await getAuthContext();

  const ayBaslangic = `${yil}-${String(ay).padStart(2, "0")}-01`;
  const ayBitis = `${yil}-${String(ay).padStart(2, "0")}-${new Date(yil, ay, 0).getDate()}`;

  // 1. Tüm projeleri ve dönem loglarını birlikte çek
  const { data: projeler, error } = await supabase
    .from("proje")
    .select(`
      *,
      proje_donem_log ( id, baslangic, bitis )
    `)
    .eq("sirket_id", sirketId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const sonuc = (projeler ?? []).filter((proje: any) => {
    const loglar: { id: string; baslangic: string; bitis: string | null }[] =
      proje.proje_donem_log ?? [];

    if (loglar.length > 0) {
      // Dönem logu varsa: o ayı kapsayan en az bir log olmalı
      // Kesişme: log.baslangic ≤ ayBitis VE (log.bitis NULL VEYA log.bitis ≥ ayBaslangic)
      return loglar.some(
        (log) =>
          log.baslangic <= ayBitis &&
          (log.bitis === null || log.bitis >= ayBaslangic)
      );
    } else {
      // Dönem logu yoksa: eski mantık — sadece aktif projeler
      return (
        proje.durum === "aktif" &&
        proje.baslangic_tarihi <= ayBitis &&
        (proje.bitis_tarihi === null || proje.bitis_tarihi >= ayBaslangic)
      );
    }
  });

  // proje_donem_log alanını UI'ya taşımadan temizle
  return sonuc.map(({ proje_donem_log: _logs, ...rest }: any) => rest) as any[];
}

/**
 * Yeni proje ekler.
 * Not: bitis_tarihi burada set edilmez — arşive alırken belirlenir.
 */
export async function projeEkle(veri: {
  ad: string;
  baslangic_tarihi: string;
  firma_adi?: string | null;
  adres_1?: string | null;
  adres_2?: string | null;
  bolge?: string | null;
  tersane_adi?: string | null;
  aciklama?: string | null;
  fatura_kodlari?: FaturaKodu[];
}) {
  const { supabase, sirketId } = await getAuthContext();

  if (!veri.ad?.trim()) return { hata: "Proje adı zorunludur." };
  if (!veri.baslangic_tarihi) return { hata: "Başlangıç tarihi zorunludur." };

  const kayit: ProjeInsert = {
    sirket_id: sirketId,
    ad: veri.ad.trim(),
    baslangic_tarihi: veri.baslangic_tarihi,
    bitis_tarihi: null,
    firma_adi: veri.firma_adi ?? null,
    adres_1: veri.adres_1 ?? null,
    adres_2: veri.adres_2 ?? null,
    bolge: veri.bolge ?? null,
    tersane_adi: veri.tersane_adi ?? null,
    aciklama: veri.aciklama ?? null,
    fatura_kodlari: (veri.fatura_kodlari ?? []) as any,
    durum: "aktif",
  };

  const { data, error } = await supabase
    .from("proje")
    .insert(kayit as any)
    .select("id")
    .single();

  if (error) return { hata: error.message };

  revalidatePath("/puantaj/projeler");
  return { basarili: true, projeId: (data as any).id };
}

/**
 * Mevcut projeyi günceller.
 */
export async function projeGuncelle(
  id: string,
  veri: {
    ad?: string;
    baslangic_tarihi?: string;
    firma_adi?: string | null;
    adres_1?: string | null;
    adres_2?: string | null;
    bolge?: string | null;
    tersane_adi?: string | null;
    aciklama?: string | null;
    fatura_kodlari?: FaturaKodu[];
  }
) {
  const { supabase, sirketId } = await getAuthContext();

  if (veri.ad !== undefined && !veri.ad.trim()) {
    return { hata: "Proje adı boş olamaz." };
  }

  const guncelleme: ProjeUpdate = {
    ...(veri.ad && { ad: veri.ad.trim() }),
    ...(veri.baslangic_tarihi && { baslangic_tarihi: veri.baslangic_tarihi }),
    firma_adi: veri.firma_adi ?? null,
    adres_1: veri.adres_1 ?? null,
    adres_2: veri.adres_2 ?? null,
    bolge: veri.bolge ?? null,
    tersane_adi: veri.tersane_adi ?? null,
    aciklama: veri.aciklama ?? null,
    ...(veri.fatura_kodlari !== undefined && {
      fatura_kodlari: veri.fatura_kodlari as any,
    }),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("proje")
    .update(guncelleme as any)
    .eq("id", id)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/puantaj/projeler");
  return { basarili: true };
}

/**
 * Projeyi arşive alır (durum = 'arsiv').
 * bitis_tarihi kullanıcıdan alınır — zorunlu.
 */
export async function projeArsivle(id: string, bitis_tarihi: string) {
  const { supabase, sirketId } = await getAuthContext();

  if (!bitis_tarihi) return { hata: "Bitiş tarihi zorunludur." };

  const { error } = await supabase
    .from("proje")
    .update({
      durum: "arsiv",
      bitis_tarihi,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", id)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/puantaj/projeler");
  return { basarili: true };
}

/**
 * Arşivdeki projeyi yeniden aktive eder.
 * durum = 'aktif', bitis_tarihi = null yapılır.
 */
export async function projeAktivasyonu(id: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { error } = await supabase
    .from("proje")
    .update({
      durum: "aktif",
      bitis_tarihi: null,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", id)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/puantaj/projeler");
  return { basarili: true };
}

/**
 * Projeyi ve ilişkili tüm kayıtları kalıcı olarak siler.
 * Silme sırası: puantaj_proje → proje_donem_log → proje
 */
export async function projeSil(id: string) {
  const { supabase, sirketId } = await getAuthContext();

  // 1. Proje puantaj kayıtları
  const { error: ppErr } = await supabase
    .from("puantaj_proje")
    .delete()
    .eq("proje_id", id)
    .eq("sirket_id", sirketId);

  if (ppErr) return { hata: `Puantaj kayıtları silinemedi: ${ppErr.message}` };

  // 2. Dönem logları
  const { error: dlErr } = await supabase
    .from("proje_donem_log")
    .delete()
    .eq("proje_id", id)
    .eq("sirket_id", sirketId);

  if (dlErr) return { hata: `Dönem logları silinemedi: ${dlErr.message}` };

  // 3. Projenin kendisi
  const { error } = await supabase
    .from("proje")
    .delete()
    .eq("id", id)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/puantaj/projeler");
  return { basarili: true };
}

/**
 * Proje detay sayfası için tüm verileri döndürür:
 * - Proje bilgileri
 * - Dönem logları
 * - Aylık çalışma özeti (saat + personel sayısı)
 * - Projede çalışan personeller
 */
export async function projeDetayGetir(projeId: string) {
  const { supabase, sirketId } = await getAuthContext();

  // Proje bilgileri
  const { data: proje, error: pErr } = await supabase
    .from("proje")
    .select("*")
    .eq("id", projeId)
    .eq("sirket_id", sirketId)
    .single();

  if (pErr || !proje) throw new Error("Proje bulunamadı veya erişim yetkiniz yok.");

  // Dönem logları
  const { data: donemLoglar } = await supabase
    .from("proje_donem_log")
    .select("id, baslangic, bitis, aciklama, created_at")
    .eq("proje_id", projeId)
    .eq("sirket_id", sirketId)
    .order("baslangic", { ascending: true });

  // Tüm puantaj_proje kayıtları (tarih + saat + personel_id)
  const { data: puantajlar } = await supabase
    .from("puantaj_proje")
    .select("tarih, saat, personel_id")
    .eq("proje_id", projeId)
    .eq("sirket_id", sirketId)
    .not("saat", "is", null)
    .order("tarih", { ascending: true });

  // Aylık özet hesapla
  const aylikMap = new Map<string, { toplamSaat: number; personelSet: Set<string> }>();
  for (const p of (puantajlar ?? []) as any[]) {
    const ayKey = (p.tarih as string).substring(0, 7);
    if (!aylikMap.has(ayKey)) aylikMap.set(ayKey, { toplamSaat: 0, personelSet: new Set() });
    const ozet = aylikMap.get(ayKey)!;
    ozet.toplamSaat += Number(p.saat ?? 0);
    ozet.personelSet.add(p.personel_id as string);
  }
  const aylikOzet = Array.from(aylikMap.entries()).map(([ay, v]) => ({
    ay,
    toplamSaat: Math.round(v.toplamSaat * 100) / 100,
    personelSayisi: v.personelSet.size,
  }));

  // Bağlı personeller
  const personelIds = [...new Set((puantajlar ?? []).map((p: any) => p.personel_id as string))];
  let personeller: any[] = [];
  if (personelIds.length > 0) {
    const { data: pList } = await supabase
      .from("personel")
      .select("id, ad, soyad, gorev_unvan")
      .in("id", personelIds)
      .eq("sirket_id", sirketId);
    personeller = pList ?? [];
  }

  return {
    proje: proje as any,
    donemLoglar: (donemLoglar ?? []) as any[],
    aylikOzet,
    personeller: personeller as any[],
    toplamSaat: aylikOzet.reduce((s, a) => s + a.toplamSaat, 0),
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toplu gün girişi — birden fazla personel × gün kombinasyonu için aynı veriyi upsert eder.
 * Kilitli günler atlanır ve hata listesine eklenir.
 */
export async function topluGunGirisi(
  kayitlar: { personelId: string; tarih: string; veri: PuantajGunVerisi }[]
) {
  const { supabase, sirketId } = await getAuthContext();

  if (!kayitlar.length) return { basarili: true, atlananSayisi: 0 };

  // Kilitli günleri kontrol et
  const tarihler = [...new Set(kayitlar.map((k) => k.tarih))];
  const { data: kapalilar } = await supabase
    .from("puantaj_genel")
    .select("tarih")
    .eq("sirket_id", sirketId)
    .eq("kapali", true)
    .in("tarih", tarihler);

  const kapaliTarihSet = new Set((kapalilar ?? []).map((k: any) => k.tarih as string));
  const aktifKayitlar = kayitlar.filter((k) => !kapaliTarihSet.has(k.tarih));

  if (!aktifKayitlar.length) {
    return { hata: "Seçilen tüm günler kilitli. Giriş yapılamadı." };
  }

  // Her kayıt için çalışma saati hesapla
  const upsertData: PuantajGenelInsert[] = aktifKayitlar.map((k) => {
    let calisma_saati: number | null = k.veri.calisma_saati ?? null;
    if (k.veri.giris_saati && k.veri.cikis_saati && !calisma_saati) {
      const [gh, gm] = k.veri.giris_saati.split(":").map(Number);
      const [ch, cm] = k.veri.cikis_saati.split(":").map(Number);
      const dakika = ch * 60 + cm - (gh * 60 + gm);
      calisma_saati = dakika > 0 ? Math.round((dakika / 60) * 100) / 100 : null;
    }
    return {
      sirket_id: sirketId,
      personel_id: k.personelId,
      tarih: k.tarih,
      giris_saati: k.veri.ozel_durum ? null : (k.veri.giris_saati ?? null),
      cikis_saati: k.veri.ozel_durum ? null : (k.veri.cikis_saati ?? null),
      calisma_saati: k.veri.ozel_durum ? null : calisma_saati,
      ozel_durum: (k.veri.ozel_durum as OzelDurum) ?? null,
      aciklama: k.veri.aciklama ?? null,
      kapali: false,
      // PM (Pazar Mesaisi) özel durumunda mesai_saati korunur, diğerleri null
      mesai_saati: k.veri.ozel_durum === "PM" ? (k.veri.mesai_saati ?? null) : (k.veri.ozel_durum ? null : (k.veri.mesai_saati ?? null)),
    };
  });

  const { error } = await supabase
    .from("puantaj_genel")
    .upsert(upsertData as any[], { onConflict: "personel_id,tarih" });

  if (error) return { hata: error.message };

  revalidatePath("/puantaj");
  return {
    basarili: true,
    eklenenSayisi: aktifKayitlar.length,
    atlananSayisi: kayitlar.length - aktifKayitlar.length,
  };
}

/**
 * Belirli projeye ait tüm dönem loglarını döndürür (eskiden yeniye).
 */
export async function projeDonemLogListele(projeId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("proje_donem_log")
    .select("id, proje_id, baslangic, bitis, aciklama, created_at")
    .eq("proje_id", projeId)
    .eq("sirket_id", sirketId)
    .order("baslangic", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as {
    id: string;
    proje_id: string;
    baslangic: string;
    bitis: string | null;
    aciklama: string | null;
    created_at: string;
  }[];
}

/**
 * Projeye yeni bir dönem logu ekler.
 */
export async function projeDonemLogEkle(
  projeId: string,
  baslangic: string,
  bitis?: string | null,
  aciklama?: string | null
) {
  const { supabase, sirketId, user } = await getAuthContext();

  if (!baslangic) return { hata: "Başlangıç tarihi zorunludur." };
  if (bitis && bitis < baslangic) return { hata: "Bitiş tarihi başlangıçtan önce olamaz." };

  const { error } = await supabase.from("proje_donem_log").insert({
    proje_id: projeId,
    sirket_id: sirketId,
    baslangic,
    bitis: bitis ?? null,
    aciklama: aciklama ?? null,
    created_by: user.id,
  } as any);

  if (error) return { hata: error.message };

  revalidatePath("/puantaj/projeler");
  return { basarili: true };
}

/**
 * Mevcut bir dönem logunu günceller (bitiş tarihi veya açıklama).
 */
export async function projeDonemLogGuncelle(
  logId: string,
  bitis: string | null,
  aciklama?: string | null
) {
  const { supabase, sirketId } = await getAuthContext();

  const { error } = await supabase
    .from("proje_donem_log")
    .update({ bitis, aciklama: aciklama ?? null } as any)
    .eq("id", logId)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/puantaj/projeler");
  return { basarili: true };
}

/**
 * Bir dönem logunu siler.
 */
export async function projeDonemLogSil(logId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { error } = await supabase
    .from("proje_donem_log")
    .delete()
    .eq("id", logId)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/puantaj/projeler");
  return { basarili: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJE PUANTAJ + GENEL PUANTAJ ÇİFT YAZMA
// ─────────────────────────────────────────────────────────────────────────────


/**
 * Proje puantajına girilen veriyi hem `puantaj_proje`'ye hem `puantaj_genel`'e yazar.
 */
export async function projePuantajVeGenelGir(
  personelId: string,
  projeId: string,
  tarih: string,
  gunVerisi: PuantajGunVerisi
) {
  const { supabase, sirketId } = await getAuthContext();

  // Kapalı ay kontrolü
  const { data: genelKayit } = await supabase
    .from("puantaj_genel")
    .select("kapali")
    .eq("personel_id", personelId)
    .eq("tarih", tarih)
    .eq("sirket_id", sirketId)
    .maybeSingle();

  if ((genelKayit as any)?.kapali) {
    return { hata: "Bu ay kilitli. Düzenleme yapılamaz." };
  }

  // Çalışma saatini hesapla
  let calisma_saati: number | null = gunVerisi.calisma_saati ?? null;
  if (gunVerisi.giris_saati && gunVerisi.cikis_saati && !calisma_saati) {
    const [gh, gm] = gunVerisi.giris_saati.split(":").map(Number);
    const [ch, cm] = gunVerisi.cikis_saati.split(":").map(Number);
    const dakika = ch * 60 + cm - (gh * 60 + gm);
    calisma_saati = dakika > 0 ? Math.round((dakika / 60) * 100) / 100 : null;
  }

  // puantaj_proje'ye yaz (sil + ekle)
  await supabase
    .from("puantaj_proje")
    .delete()
    .eq("sirket_id", sirketId)
    .eq("personel_id", personelId)
    .eq("proje_id", projeId)
    .eq("tarih", tarih);

  // Özel durum varsa saat null olabilir (saat kolonu artık nullable)
  const projeSaat = gunVerisi.ozel_durum ? null : (calisma_saati ?? null);
  // PM için mesai korunur, diğer özel durumlarda null
  const projeMesai = gunVerisi.ozel_durum === "PM" ? (gunVerisi.mesai_saati ?? null) : (gunVerisi.ozel_durum ? null : (gunVerisi.mesai_saati ?? null));

  const projeKayit = {
    sirket_id: sirketId,
    personel_id: personelId,
    proje_id: projeId,
    tarih,
    saat: projeSaat,                                          // null ise DB'ye NULL yazılır
    mesai_saati: projeMesai,                                  // mesai saati de kaydediliyor
    ozel_durum: (gunVerisi.ozel_durum as OzelDurum) ?? null, // özel durum saklanıyor
    aciklama: gunVerisi.aciklama ?? null,
  };

  const { error: projeErr } = await supabase
    .from("puantaj_proje")
    .insert(projeKayit as any);

  if (projeErr) return { hata: projeErr.message };

  // O günkü TÜM proje saatlerini topla (yeni eklenen dahil)
  // Bu sayede aynı günde birden fazla gemide çalışılırsa toplam doğru hesaplanır
  const { data: gunlukProjeSaatleri } = await supabase
    .from("puantaj_proje")
    .select("saat, mesai_saati")
    .eq("sirket_id", sirketId)
    .eq("personel_id", personelId)
    .eq("tarih", tarih);

  const toplamProjeSaati = gunVerisi.ozel_durum
    ? null
    : (gunlukProjeSaatleri ?? []).reduce(
        (sum: number, row: any) => sum + (row.saat ?? 0),
        0
      ) || null;

  // Mesai toplamı: PM dahil proje mesailerini topla; sadece diğer özel durumlarda null
  const toplamMesaiSaati = (gunVerisi.ozel_durum && gunVerisi.ozel_durum !== "PM")
    ? null
    : ((gunlukProjeSaatleri ?? []).reduce(
        (sum: number, row: any) => sum + (row.mesai_saati ?? 0),
        0
      ) || null);

  // puantaj_genel'e de upsert — calisma_saati artık tüm projelerin toplamı
  const genelKayitInsert: PuantajGenelInsert = {
    sirket_id: sirketId,
    personel_id: personelId,
    tarih,
    giris_saati: gunVerisi.ozel_durum ? null : (gunVerisi.giris_saati ?? null),
    cikis_saati: gunVerisi.ozel_durum ? null : (gunVerisi.cikis_saati ?? null),
    calisma_saati: gunVerisi.ozel_durum ? null : toplamProjeSaati,
    ozel_durum: (gunVerisi.ozel_durum as OzelDurum) ?? null,
    aciklama: gunVerisi.aciklama ?? null,
    kapali: false,
    // PM (Pazar Mesaisi) için mesai korunur; diğer özel durumlarda null
    mesai_saati: (gunVerisi.ozel_durum && gunVerisi.ozel_durum !== "PM") ? null : toplamMesaiSaati,
  };

  const { error: genelErr } = await supabase
    .from("puantaj_genel")
    .upsert(genelKayitInsert as any, { onConflict: "personel_id,tarih" });

  if (genelErr) return { hata: genelErr.message };

  revalidatePath("/puantaj");
  revalidatePath("/puantaj/proje");
  return { basarili: true };
}

/**
 * Proje puantaj kaydını hem puantaj_proje'den hem puantaj_genel'den siler.
 */
export async function projePuantajVeGenelSil(
  personelId: string,
  projeId: string,
  tarih: string
) {
  const { supabase, sirketId } = await getAuthContext();

  // Kapalı ay kontrolü
  const { data: genelKayit } = await supabase
    .from("puantaj_genel")
    .select("kapali")
    .eq("personel_id", personelId)
    .eq("tarih", tarih)
    .eq("sirket_id", sirketId)
    .maybeSingle();

  if ((genelKayit as any)?.kapali) {
    return { hata: "Bu ay kilitli. Silme yapılamaz." };
  }

  // puantaj_proje'den sil
  const { error: projeErr } = await supabase
    .from("puantaj_proje")
    .delete()
    .eq("sirket_id", sirketId)
    .eq("personel_id", personelId)
    .eq("proje_id", projeId)
    .eq("tarih", tarih);

  if (projeErr) return { hata: projeErr.message };

  // puantaj_genel'den sil
  const { error: genelErr } = await supabase
    .from("puantaj_genel")
    .delete()
    .eq("sirket_id", sirketId)
    .eq("personel_id", personelId)
    .eq("tarih", tarih);

  if (genelErr) return { hata: genelErr.message };

  revalidatePath("/puantaj");
  revalidatePath("/puantaj/proje");
  return { basarili: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// AY ÖZET (SGK Gün + Maaş Saat override)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Belirli yıl-ay için tüm personel SGK/Maaş override kayıtlarını döndürür.
 */
export async function ayOzetGetir(yil: number, ay: number) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("puantaj_ay_ozet")
    .select("personel_id, sgk_gun_override, maas_saati_override")
    .eq("sirket_id", sirketId)
    .eq("yil", yil)
    .eq("ay", ay);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as {
    personel_id: string;
    sgk_gun_override: number | null;
    maas_saati_override: number | null;
  }[];
}

/**
 * Bir personelin yıl-ay için SGK Gün ve/veya Maaş Saat override'ını upsert eder.
 */
export async function ayOzetKaydet(
  personelId: string,
  yil: number,
  ay: number,
  sgkGun: number | null,
  maasSaati: number | null
) {
  const { supabase, sirketId } = await getAuthContext();

  const { error } = await supabase
    .from("puantaj_ay_ozet")
    .upsert(
      {
        sirket_id: sirketId,
        personel_id: personelId,
        yil,
        ay,
        sgk_gun_override: sgkGun,
        maas_saati_override: maasSaati,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "sirket_id,personel_id,yil,ay" }
    );

  if (error) return { hata: error.message };

  revalidatePath("/puantaj");
  return { basarili: true };
}
