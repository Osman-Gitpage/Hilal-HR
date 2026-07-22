"use server";

// ─── Cari Modülü — Server Actions ────────────────────────────────────────────
// docs/cari-modul.md spesifikasyonuna göre sıfırdan yazıldı.

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import {
  calcOdemeDurumu,
  kalanHesapla,
  odemeTlKarsiligi,
  isGecikmiş,
} from "@/lib/cari";
import type {
  BelgeListItem,
  BelgeDetay,
  FirmaListItem,
  CariKpi,
  BelgePayload,
  OdemePayload,
  TopluOdemePayload,
  DosyaPayload,
  BelgeListFiltre,
  ParaBirimi,
  Odeme,
} from "@/types/cari";

// ── Yardımcılar ───────────────────────────────────────────────────────────────

/** Aktif şirket ID'sini getirir. */
async function getSirketId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error("Oturum açık değil.");

  const { data: ks, error: ksErr } = await supabase
    .from("kullanici_sirket")
    .select("sirket_id")
    .eq("kullanici_id", user.id)
    .maybeSingle();

  if (ksErr || !ks) throw new Error("Şirket bulunamadı.");
  return ks.sirket_id;
}

type ActionResult<T = undefined> =
  | (T extends undefined ? { basarili: true } : { basarili: true; veri: T })
  | { basarili: false; hata: string };

// ═══════════════════════════════════════════════════════════════════════════════
// FIRMA
// ═══════════════════════════════════════════════════════════════════════════════

/** Firma listesini para birimi bazlı bakiye özetiyle döndürür. */
export async function firmaListesiGetir(): Promise<FirmaListItem[]> {
  const sirketId = await getSirketId();
  const supabase = await createClient();

  const { data: firmalar, error: firmaErr } = await supabase
    .from("firma")
    .select("id, ad, notlar")
    .eq("sirket_id", sirketId)
    .order("ad", { ascending: true });

  if (firmaErr) throw new Error(firmaErr.message);

  if (!firmalar || firmalar.length === 0) return [];

  // Her firma için belge + ödeme verisi çek
  const { data: belgeler, error: belgeErr } = await supabase
    .from("belge")
    .select(`
      id, firma_id, tutar, kur, para_birimi,
      odeme ( tutar, kur )
    `)
    .eq("sirket_id", sirketId)
    .in("firma_id", firmalar.map((f) => f.id));

  if (belgeErr) throw new Error(belgeErr.message);

  const PB_LIST: ParaBirimi[] = ["TRY", "EUR", "USD"];

  return firmalar.map((firma) => {
    const firmaBelgeleri = (belgeler ?? []).filter(
      (b) => b.firma_id === firma.id
    );

    const ozet: Record<ParaBirimi, { alacak: number; odenen: number }> = {
      TRY: { alacak: 0, odenen: 0 },
      EUR: { alacak: 0, odenen: 0 },
      USD: { alacak: 0, odenen: 0 },
    };

    for (const b of firmaBelgeleri) {
      const pb = b.para_birimi as ParaBirimi;
      if (!ozet[pb]) continue;
      const belgeTlTutar = Number(b.tutar) * Number(b.kur);
      ozet[pb].alacak += belgeTlTutar;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const odemeler = (b as any).odeme ?? [];
      for (const o of odemeler) {
        ozet[pb].odenen += Number(o.tutar) * Number(o.kur);
      }
    }

    const bakiye = PB_LIST.map((pb) => ({
      para_birimi: pb,
      alacak: ozet[pb].alacak,
      odenen: ozet[pb].odenen,
      kalan: Math.max(0, ozet[pb].alacak - ozet[pb].odenen),
    })).filter((b) => b.alacak > 0); // Sadece hareket olan PB'leri göster

    return {
      id: firma.id,
      ad: firma.ad,
      notlar: firma.notlar,
      bakiye,
    };
  });
}

/** Yeni firma ekler. */
export async function firmaEkle(
  payload: { ad: string; notlar?: string | null }
): Promise<ActionResult<{ id: string }>> {
  try {
    const sirketId = await getSirketId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("firma")
      .insert({ sirket_id: sirketId, ad: payload.ad.trim(), notlar: payload.notlar ?? null })
      .select("id")
      .single();

    if (error) return { basarili: false, hata: error.message };

    revalidatePath("/cari/firma");
    return { basarili: true, veri: { id: data.id } };
  } catch (e) {
    return { basarili: false, hata: String(e) };
  }
}

/** Firma günceller. */
export async function firmaGuncelle(
  id: string,
  payload: { ad: string; notlar?: string | null }
): Promise<ActionResult> {
  try {
    const sirketId = await getSirketId();
    const supabase = await createClient();

    const { error } = await supabase
      .from("firma")
      .update({ ad: payload.ad.trim(), notlar: payload.notlar ?? null })
      .eq("id", id)
      .eq("sirket_id", sirketId);

    if (error) return { basarili: false, hata: error.message };

    revalidatePath("/cari/firma");
    return { basarili: true };
  } catch (e) {
    return { basarili: false, hata: String(e) };
  }
}

/** Firma siler. Cascade: belge → odeme + belge_dosya otomatik silinir. */
export async function firmaSil(id: string): Promise<ActionResult> {
  try {
    const sirketId = await getSirketId();
    const supabase = await createClient();

    const { error } = await supabase
      .from("firma")
      .delete()
      .eq("id", id)
      .eq("sirket_id", sirketId);

    if (error) return { basarili: false, hata: error.message };

    revalidatePath("/cari/firma");
    revalidatePath("/cari");
    return { basarili: true };
  } catch (e) {
    return { basarili: false, hata: String(e) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BELGE
// ═══════════════════════════════════════════════════════════════════════════════

/** Tüm belge listesini hesaplanmış ödeme durumu ve gecikme bilgisiyle döndürür. */
export async function belgeListesiGetir(
  filtre?: BelgeListFiltre
): Promise<BelgeListItem[]> {
  const sirketId = await getSirketId();
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("belge")
    .select(`
      id, tur, belge_no, tarih, aciklama, gemi_adi, tutar, para_birimi, kur, notlar,
      firma_id, created_at, updated_at,
      firma ( id, ad ),
      odeme ( tutar, kur )
    `)
    .eq("sirket_id", sirketId)
    .order("tarih", { ascending: false });

  // Yıl filtresi: 01.01.YYYY – 31.12.YYYY
  if (filtre?.yil) {
    query = query
      .gte("tarih", `${filtre.yil}-01-01`)
      .lte("tarih", `${filtre.yil}-12-31`);
  }

  if (filtre?.tur) query = query.eq("tur", filtre.tur);
  if (filtre?.firma_id === "__yok") {
    query = query.is("firma_id", null);
  } else if (filtre?.firma_id) {
    query = query.eq("firma_id", filtre.firma_id);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sonuc: BelgeListItem[] = (data ?? []).map((b: any) => {
    const odemeler: Odeme[] = (b.odeme ?? []).map((o: { tutar: number; kur: number }) => ({
      id: "",
      sirket_id: sirketId,
      belge_id: b.id,
      tarih: "",
      tutar: Number(o.tutar),
      para_birimi: "TRY" as ParaBirimi,
      kur: Number(o.kur),
      yontem: "banka" as const,
      aciklama: null,
      created_at: "",
    }));

    const odenenTl = odemeler.reduce(
      (sum, o) => sum + odemeTlKarsiligi(o),
      0
    );
    const belgeTlTutar = Number(b.tutar) * Number(b.kur);
    const kalan = kalanHesapla(belgeTlTutar, odenenTl);
    const durum = calcOdemeDurumu(belgeTlTutar, odenenTl);

    return {
      id: b.id,
      sirket_id: sirketId,
      firma_id: b.firma_id ?? null,
      tur: b.tur,
      belge_no: b.belge_no,
      tarih: b.tarih,
      aciklama: b.aciklama,
      gemi_adi: b.gemi_adi ?? null,
      tutar: Number(b.tutar),
      para_birimi: b.para_birimi as ParaBirimi,
      kur: Number(b.kur),
      notlar: b.notlar ?? null,
      created_at: b.created_at,
      updated_at: b.updated_at,
      firma_ad: b.firma?.ad ?? null,
      odenen_toplam_tl: odenenTl,
      kalan,
      odeme_durumu: durum,
      gecikmiş: isGecikmiş(b.tarih, durum),
    };
  });

  // İstemci tarafı filtreler (arama & durum)
  if (filtre?.durum) {
    sonuc = sonuc.filter((b) => b.odeme_durumu === filtre.durum);
  }
  if (filtre?.arama) {
    const q = filtre.arama.toLowerCase();
    sonuc = sonuc.filter(
      (b) =>
        b.belge_no.toLowerCase().includes(q) ||
        b.aciklama.toLowerCase().includes(q) ||
        (b.firma_ad ?? "").toLowerCase().includes(q) ||
        (b.gemi_adi ?? "").toLowerCase().includes(q)
    );
  }

  return sonuc;
}

/** Belge detayını ödemeler ve dosyalarla birlikte döndürür. */
export async function belgeDetayGetir(belgeId: string): Promise<BelgeDetay> {
  const sirketId = await getSirketId();
  const supabase = await createClient();

  const { data: b, error } = await supabase
    .from("belge")
    .select(`
      id, tur, belge_no, tarih, aciklama, gemi_adi, tutar, para_birimi, kur, notlar,
      firma_id, created_at, updated_at,
      firma ( id, ad, notlar ),
      odeme ( id, belge_id, sirket_id, tarih, tutar, para_birimi, kur, yontem, aciklama, created_at ),
      belge_dosya ( id, belge_id, sirket_id, dosya_url, dosya_adi, dosya_tipi, boyut_byte, kategori, cift_no, created_at )
    `)
    .eq("id", belgeId)
    .eq("sirket_id", sirketId)
    .single();

  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const odemeler: Odeme[] = (b as any).odeme ?? [];
  const odenenTl = odemeler.reduce(
    (sum: number, o: Odeme) => sum + odemeTlKarsiligi(o),
    0
  );
  const belgeTlTutar = Number(b.tutar) * Number(b.kur);
  const kalan = kalanHesapla(belgeTlTutar, odenenTl);
  const durum = calcOdemeDurumu(belgeTlTutar, odenenTl);

  return {
    id: b.id,
    sirket_id: sirketId,
    firma_id: b.firma_id ?? null,
    tur: b.tur as BelgeDetay["tur"],
    belge_no: b.belge_no,
    tarih: b.tarih,
    aciklama: b.aciklama,
    gemi_adi: (b as any).gemi_adi ?? null, // eslint-disable-line @typescript-eslint/no-explicit-any
    tutar: Number(b.tutar),
    para_birimi: b.para_birimi as ParaBirimi,
    kur: Number(b.kur),
    notlar: b.notlar ?? null,
    created_at: b.created_at,
    updated_at: b.updated_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    firma: (b as any).firma ?? null,
    odenen_toplam_tl: odenenTl,
    kalan,
    odeme_durumu: durum,
    gecikmiş: isGecikmiş(b.tarih, durum),
    firma_ad: (b as any).firma?.ad ?? null, // eslint-disable-line @typescript-eslint/no-explicit-any
    odemeler,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dosyalar: (b as any).belge_dosya ?? [],
  };
}

/** Sıradaki belge numarasını döndürür (şirketteki toplam belge sayısı + 1). */
export async function sonrakiBelgeNoGetir(
  tur: "fatura" | "proforma" | "hesap_bilgisi"
): Promise<number> {
  const sirketId = await getSirketId();
  const supabase = await createClient();

  const { count } = await supabase
    .from("belge")
    .select("id", { count: "exact", head: true })
    .eq("sirket_id", sirketId)
    .eq("tur", tur);

  return (count ?? 0) + 1;
}

/** Yeni belge ekler. */
export async function belgeEkle(
  payload: BelgePayload
): Promise<ActionResult<{ id: string }>> {
  try {
    const sirketId = await getSirketId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("belge")
      .insert({
        sirket_id: sirketId,
        firma_id: payload.firma_id ?? null,
        tur: payload.tur,
        belge_no: payload.belge_no.trim(),
        tarih: payload.tarih,
        aciklama: payload.aciklama.trim(),
        gemi_adi: payload.gemi_adi?.trim() || null,
        tutar: payload.tutar,
        para_birimi: payload.para_birimi,
        kur: payload.kur,
        notlar: payload.notlar ?? null,
      })
      .select("id")
      .single();

    if (error) return { basarili: false, hata: error.message };

    revalidatePath("/cari");
    return { basarili: true, veri: { id: data.id } };
  } catch (e) {
    return { basarili: false, hata: String(e) };
  }
}

/** Belgeyi günceller. */
export async function belgeGuncelle(
  id: string,
  payload: Partial<BelgePayload>
): Promise<ActionResult> {
  try {
    const sirketId = await getSirketId();
    const supabase = await createClient();

    const { error } = await supabase
      .from("belge")
      .update({
        ...payload,
        belge_no: payload.belge_no?.trim(),
        aciklama: payload.aciklama?.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("sirket_id", sirketId);

    if (error) return { basarili: false, hata: error.message };

    revalidatePath("/cari");
    revalidatePath(`/cari/belge/${id}`);
    return { basarili: true };
  } catch (e) {
    return { basarili: false, hata: String(e) };
  }
}

/** Belgenin sadece notlar alanını günceller (detay tab'ından inline güncelleme). */
export async function belgeNotlarGuncelle(
  id: string,
  notlar: string | null
): Promise<ActionResult> {
  try {
    const sirketId = await getSirketId();
    const supabase = await createClient();

    const { error } = await supabase
      .from("belge")
      .update({ notlar, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("sirket_id", sirketId);

    if (error) return { basarili: false, hata: error.message };

    revalidatePath(`/cari/belge/${id}`);
    return { basarili: true };
  } catch (e) {
    return { basarili: false, hata: String(e) };
  }
}

/** Belgeyi siler. Cascade: odeme + belge_dosya otomatik silinir. */
export async function belgeSil(id: string): Promise<ActionResult> {
  try {
    const sirketId = await getSirketId();
    const supabase = await createClient();

    const { error } = await supabase
      .from("belge")
      .delete()
      .eq("id", id)
      .eq("sirket_id", sirketId);

    if (error) return { basarili: false, hata: error.message };

    revalidatePath("/cari");
    return { basarili: true };
  } catch (e) {
    return { basarili: false, hata: String(e) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÖDEME
// ═══════════════════════════════════════════════════════════════════════════════

/** Belgeye ödeme ekler. */
export async function odemeEkle(
  payload: OdemePayload
): Promise<ActionResult<{ id: string }>> {
  try {
    const sirketId = await getSirketId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("odeme")
      .insert({
        sirket_id: sirketId,
        belge_id: payload.belge_id,
        tarih: payload.tarih,
        tutar: payload.tutar,
        para_birimi: payload.para_birimi,
        kur: payload.kur,
        yontem: payload.yontem,
        aciklama: payload.aciklama ?? null,
      })
      .select("id")
      .single();

    if (error) return { basarili: false, hata: error.message };

    revalidatePath(`/cari/belge/${payload.belge_id}`);
    revalidatePath("/cari");
    return { basarili: true, veri: { id: data.id } };
  } catch (e) {
    return { basarili: false, hata: String(e) };
  }
}

/** Ödemeyi siler. */
export async function odemeSil(
  odemeId: string,
  belgeId: string
): Promise<ActionResult> {
  try {
    const sirketId = await getSirketId();
    const supabase = await createClient();

    const { error } = await supabase
      .from("odeme")
      .delete()
      .eq("id", odemeId)
      .eq("sirket_id", sirketId);

    if (error) return { basarili: false, hata: error.message };

    revalidatePath(`/cari/belge/${belgeId}`);
    revalidatePath("/cari");
    return { basarili: true };
  } catch (e) {
    return { basarili: false, hata: String(e) };
  }
}

/**
 * Toplu ödeme: Seçili birden fazla belgeye ayrı ayrı ödeme kaydeder.
 * Her belge için ayrı tutar belirtilebilir; ortak tarih/yöntem kullanılır.
 */
export async function topluOdemeEkle(
  payload: TopluOdemePayload
): Promise<ActionResult<{ count: number }>> {
  try {
    const sirketId = await getSirketId();
    const supabase = await createClient();

    const rows = payload.kalemler.map((k) => ({
      sirket_id: sirketId,
      belge_id: k.belge_id,
      tarih: payload.tarih,
      tutar: k.tutar,
      para_birimi: payload.para_birimi,
      kur: payload.kur,
      yontem: payload.yontem,
      aciklama: payload.aciklama ?? null,
    }));

    const { error } = await supabase.from("odeme").insert(rows);
    if (error) return { basarili: false, hata: error.message };

    revalidatePath("/cari");
    return { basarili: true, veri: { count: rows.length } };
  } catch (e) {
    return { basarili: false, hata: String(e) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA
// ═══════════════════════════════════════════════════════════════════════════════

/** Belgeye dosya kaydı ekler (URL zaten yüklenmiş olmalı). */
export async function belgeDosyaEkle(
  payload: DosyaPayload
): Promise<ActionResult<{ id: string }>> {
  try {
    const sirketId = await getSirketId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("belge_dosya")
      .insert({
        sirket_id: sirketId,
        belge_id: payload.belge_id,
        dosya_url: payload.dosya_url,
        dosya_adi: payload.dosya_adi,
        dosya_tipi: payload.dosya_tipi,
        boyut_byte: payload.boyut_byte ?? null,
        kategori: payload.kategori ?? "diger",
        cift_no: payload.cift_no ?? null,
      })
      .select("id")
      .single();

    if (error) return { basarili: false, hata: error.message };

    revalidatePath(`/cari/belge/${payload.belge_id}`);
    return { basarili: true, veri: { id: data.id } };
  } catch (e) {
    return { basarili: false, hata: String(e) };
  }
}

/** Dosya kaydını siler. */
export async function belgeDosyaSil(
  dosyaId: string,
  belgeId: string
): Promise<ActionResult> {
  try {
    const sirketId = await getSirketId();
    const supabase = await createClient();

    const { error } = await supabase
      .from("belge_dosya")
      .delete()
      .eq("id", dosyaId)
      .eq("sirket_id", sirketId);

    if (error) return { basarili: false, hata: error.message };

    revalidatePath(`/cari/belge/${belgeId}`);
    return { basarili: true };
  } catch (e) {
    return { basarili: false, hata: String(e) };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// KPI
// ═══════════════════════════════════════════════════════════════════════════════

/** KPI verisi: Her para birimi için toplam alacak, ödenen, ödenmeyen. */
export async function cariKpiGetir(yil?: number): Promise<CariKpi[]> {
  const sirketId = await getSirketId();
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("belge")
    .select(`
      tutar, kur, para_birimi,
      odeme ( tutar, kur )
    `)
    .eq("sirket_id", sirketId);

  // Yıl filtresi
  if (yil) {
    query = query
      .gte("tarih", `${yil}-01-01`)
      .lte("tarih", `${yil}-12-31`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const PB_LIST: ParaBirimi[] = ["TRY", "EUR", "USD"];
  const kpi: Record<ParaBirimi, { alacak: number; odenen: number }> = {
    TRY: { alacak: 0, odenen: 0 },
    EUR: { alacak: 0, odenen: 0 },
    USD: { alacak: 0, odenen: 0 },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const b of (data ?? []) as any[]) {
    const pb = b.para_birimi as ParaBirimi;
    const belgeKur = Math.max(Number(b.kur), 0.0001); // sıfıra bölmeyi önle

    // Alacak: belgenin kendi para biriminde (örn. EUR belgede EUR tutar)
    kpi[pb].alacak += Number(b.tutar);

    // Ödenen: ödemelerin TL karşılığını belge kuruna bölerek orijinal PB'ye çevir
    for (const o of b.odeme ?? []) {
      const odemeTl = Number(o.tutar) * Number(o.kur);
      kpi[pb].odenen += odemeTl / belgeKur;
    }
  }

  return PB_LIST.map((pb) => ({
    para_birimi: pb,
    toplam_alacak: kpi[pb].alacak,
    odenen: kpi[pb].odenen,
    odenmemis: Math.max(0, kpi[pb].alacak - kpi[pb].odenen),
  }));
}

// ─── Toplu Import ─────────────────────────────────────────────────────────────

export interface ImportSatir {
  belge_no: string;
  tarih: string;           // YYYY-MM-DD
  vade_tarihi?: string;    // YYYY-MM-DD (opsiyonel, notlara yazılır)
  tur: string;             // fatura | proforma | hesap_bilgisi
  firma_adi?: string;
  gemi_adi?: string;       // Opsiyonel gemi adı
  tutar: number;
  para_birimi: string;     // TRY | EUR | USD
  kur: number;
  aciklama?: string;
}

export interface ImportSonuc {
  basarili: number;
  hatali: number;
  hatalar: { satir: number; mesaj: string }[];
}

export async function belgeBulkImport(
  satirlar: ImportSatir[]
): Promise<ActionResult<ImportSonuc>> {
  try {
    const sirketId = await getSirketId();
    const supabase = await createClient();

    // Tüm firmaları çek — adı ID'ye map et
    const { data: firmalar } = await supabase
      .from("firma")
      .select("id, ad")
      .eq("sirket_id", sirketId);

    const firmaMap = new Map<string, string>(
      (firmalar ?? []).map((f) => [f.ad.trim().toLowerCase(), f.id])
    );

    const gecerliTurler = ["fatura", "proforma", "hesap_bilgisi"] as const;
    const gecerliPB = ["TRY", "EUR", "USD"] as const;

    let basarili = 0;
    const hatalar: { satir: number; mesaj: string }[] = [];

    for (let i = 0; i < satirlar.length; i++) {
      const s = satirlar[i];
      const satirNo = i + 2; // Excel'de 1. satır başlık, 2'den başlar

      // Validasyon
      if (!s.belge_no?.trim()) {
        hatalar.push({ satir: satirNo, mesaj: "Belge No boş olamaz" });
        continue;
      }
      if (!s.tarih || !/^\d{4}-\d{2}-\d{2}$/.test(s.tarih)) {
        hatalar.push({ satir: satirNo, mesaj: `Geçersiz tarih: ${s.tarih}` });
        continue;
      }
      if (!gecerliTurler.includes(s.tur as (typeof gecerliTurler)[number])) {
        hatalar.push({ satir: satirNo, mesaj: `Geçersiz tür: ${s.tur}` });
        continue;
      }
      if (typeof s.tutar !== "number" || s.tutar <= 0) {
        hatalar.push({ satir: satirNo, mesaj: `Geçersiz tutar: ${s.tutar}` });
        continue;
      }
      if (!gecerliPB.includes(s.para_birimi as (typeof gecerliPB)[number])) {
        hatalar.push({ satir: satirNo, mesaj: `Geçersiz para birimi: ${s.para_birimi}` });
        continue;
      }
      if (typeof s.kur !== "number" || s.kur <= 0) {
        hatalar.push({ satir: satirNo, mesaj: `Geçersiz kur: ${s.kur}` });
        continue;
      }

      // Firma eşleştirme
      const firmaId = s.firma_adi
        ? (firmaMap.get(s.firma_adi.trim().toLowerCase()) ?? null)
        : null;

      // Vade tarihi varsa notlara ekle
      const notlar = s.vade_tarihi
        ? `Vade: ${s.vade_tarihi}`
        : null;

      const { error } = await supabase.from("belge").insert({
        sirket_id: sirketId,
        firma_id: firmaId,
        tur: s.tur,
        belge_no: s.belge_no.trim(),
        tarih: s.tarih,
        aciklama: s.aciklama?.trim() ?? "",
        gemi_adi: s.gemi_adi?.trim() || null,
        tutar: s.tutar,
        para_birimi: s.para_birimi,
        kur: s.kur,
        notlar,
      });

      if (error) {
        hatalar.push({ satir: satirNo, mesaj: error.message });
      } else {
        basarili++;
      }
    }

    revalidatePath("/cari");
    return {
      basarili: true,
      veri: { basarili, hatali: hatalar.length, hatalar },
    };
  } catch (e) {
    return { basarili: false, hata: String(e) };
  }
}

