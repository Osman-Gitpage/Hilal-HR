"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hesaplaToplam, hesaplaGenelToplam } from "@/lib/cari";
import type { BelgeKalem, ParaBirimi } from "@/types";

// ─────────────────────────────────────────────
// Yardımcı: Auth + Şirket
// ─────────────────────────────────────────────
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

// ══════════════════════════════════════════════
// T-2.1 · GEMİ CRUD
// ══════════════════════════════════════════════

/** Şirkete ait gemi listesi (özet ödeme verileriyle) */
export async function gemiListesiGetir() {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("gemi")
    .select(
      `
      id, ad, imo_no, notlar, created_at,
      firma ( id, ad ),
      belge (
        genel_toplam, para_birimi,
        cari_odeme ( tutar, baz_tutar, para_birimi )
      )
    `
    )
    .eq("sirket_id", sirketId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // Para birimi bazlı toplam/ödenen/kalan hesapla
  return (data ?? []).map((gemi: any) => {
    const ozet: Record<string, { alacak: number; odenen: number }> = {};

    for (const belge of gemi.belge ?? []) {
      const pb: string = belge.para_birimi;
      if (!ozet[pb]) ozet[pb] = { alacak: 0, odenen: 0 };
      ozet[pb].alacak += Number(belge.genel_toplam ?? 0);
      for (const odeme of belge.cari_odeme ?? []) {
      // Çapraz kur varsa baz_tutar (belge PB cinsinden) kullan
        ozet[pb].odenen += Number(odeme.baz_tutar ?? odeme.tutar ?? 0);
      }
    }

    return {
      id: gemi.id,
      ad: gemi.ad,
      imo_no: gemi.imo_no,
      notlar: gemi.notlar,
      firma: gemi.firma ?? null,
      created_at: gemi.created_at,
      ozet,
    };
  });
}

/** Gemi detayı (ilgili kişilerle birlikte) */
export async function gemiDetayGetir(gemiId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("gemi")
    .select(`*, firma ( id, ad, vergi_no, telefon, email ), ilgili_kisi ( id, ad, iletisim, created_at )`)
    .eq("id", gemiId)
    .eq("sirket_id", sirketId)
    .single();

  if (error) throw new Error(error.message);
  return data as any;
}

/** Yeni gemi ekle */
export async function gemiEkle(payload: {
  ad: string;
  imo_no?: string | null;
  notlar?: string | null;
  firma_id?: string | null;
}) {
  const { supabase, sirketId } = await getAuthContext();

  if (!payload.ad?.trim()) return { hata: "Gemi adı zorunludur." };

  const { error } = await supabase.from("gemi").insert({
    sirket_id: sirketId,
    ad: payload.ad.trim(),
    imo_no: payload.imo_no?.trim() || null,
    notlar: payload.notlar?.trim() || null,
    firma_id: payload.firma_id ?? null,
  } as any);

  if (error) return { hata: error.message };

  revalidatePath("/cari");
  return { basarili: true };
}

/** Gemi güncelle */
export async function gemiGuncelle(
  gemiId: string,
  payload: { ad?: string; imo_no?: string | null; notlar?: string | null; firma_id?: string | null }
) {
  const { supabase, sirketId } = await getAuthContext();

  const { error } = await supabase
    .from("gemi")
    .update({
      ad: payload.ad?.trim(),
      imo_no: payload.imo_no?.trim() || null,
      notlar: payload.notlar?.trim() || null,
      firma_id: payload.firma_id ?? null,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", gemiId)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/cari");
  revalidatePath(`/cari/${gemiId}`);
  return { basarili: true };
}

/** Gemi sil (cascade: ilgili kişi, belge, ödeme) */
export async function gemiSil(gemiId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { error } = await supabase
    .from("gemi")
    .delete()
    .eq("id", gemiId)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/cari");
  return { basarili: true };
}

// ══════════════════════════════════════════════
// T-2.2 · İLGİLİ KİŞİ CRUD
// ══════════════════════════════════════════════

export async function ilgiliKisiListesiGetir(gemiId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("ilgili_kisi")
    .select("id, ad, iletisim, created_at")
    .eq("gemi_id", gemiId)
    .eq("sirket_id", sirketId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}

export async function ilgiliKisiEkle(payload: {
  gemi_id: string;
  ad: string;
  iletisim?: string | null;
}) {
  const { supabase, sirketId } = await getAuthContext();

  if (!payload.ad?.trim()) return { hata: "Kişi adı zorunludur." };

  const { error } = await supabase.from("ilgili_kisi").insert({
    sirket_id: sirketId,
    gemi_id: payload.gemi_id,
    ad: payload.ad.trim(),
    iletisim: payload.iletisim?.trim() || null,
  } as any);

  if (error) return { hata: error.message };

  revalidatePath(`/cari/${payload.gemi_id}`);
  return { basarili: true };
}

export async function ilgiliKisiSil(kisiId: string, gemiId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { error } = await supabase
    .from("ilgili_kisi")
    .delete()
    .eq("id", kisiId)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath(`/cari/${gemiId}`);
  return { basarili: true };
}

// ══════════════════════════════════════════════
// T-2.3 · BELGE CRUD
// ══════════════════════════════════════════════

/** Belge listesi (gemi bazlı, ödeme durumu hesaplamalı) */
export async function belgeListesiGetir(
  gemiId: string,
  tur?: "proforma" | "fatura"
) {
  const { supabase, sirketId } = await getAuthContext();

  let query = supabase
    .from("belge")
    .select(
      `
      id, tur, belge_no, tarih, toplam, iskonto, genel_toplam,
      para_birimi, kdv_orani, notlar, pdf_url, created_at,
      ilgili_kisi ( ad ),
      cari_odeme ( tutar, baz_tutar )
    `
    )
    .eq("gemi_id", gemiId)
    .eq("sirket_id", sirketId)
    .order("tarih", { ascending: false });

  if (tur) query = query.eq("tur", tur);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((belge: any) => {
    const odemeToplami = (belge.cari_odeme ?? []).reduce(
      (s: number, o: any) => s + Number(o.baz_tutar ?? o.tutar ?? 0),
      0
    );
    const genel = Number(belge.genel_toplam ?? 0);
    const kalan = Math.max(0, genel - odemeToplami);
    const durum =
      genel <= 0
        ? "odendi"
        : odemeToplami <= 0
        ? "odenmedi"
        : odemeToplami >= genel
        ? "odendi"
        : "kismi";

    return {
      id: belge.id,
      tur: belge.tur,
      belge_no: belge.belge_no,
      tarih: belge.tarih,
      toplam: Number(belge.toplam),
      iskonto: Number(belge.iskonto),
      genel_toplam: genel,
      para_birimi: belge.para_birimi as ParaBirimi,
      kdv_orani: belge.kdv_orani,
      notlar: belge.notlar,
      pdf_url: belge.pdf_url,
      created_at: belge.created_at,
      ilgili_kisi_ad: belge.ilgili_kisi?.ad ?? null,
      odeme_durumu: durum,
      odenen_toplam: odemeToplami,
      kalan,
    };
  });
}

/** Tüm belge listesi (ana sayfa — gemi veya firma bağlantılı) */
export async function tumBelgeListesiGetir(filtre?: {
  tur?: "proforma" | "fatura";
  durum?: "odendi" | "kismi" | "odenmedi";
  arama?: string;
}) {
  const { supabase, sirketId } = await getAuthContext();

  let query = supabase
    .from("belge")
    .select(
      `
      id, tur, belge_no, tarih, toplam, iskonto, genel_toplam,
      para_birimi, kdv_orani, notlar, created_at,
      tek_gemi_adi, tek_firma_adi,
      gemi ( id, ad ),
      firma ( id, ad ),
      cari_odeme ( tutar, baz_tutar )
    `
    )
    .eq("sirket_id", sirketId)
    .order("tarih", { ascending: false });

  if (filtre?.tur) query = query.eq("tur", filtre.tur);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const sonuc = (data ?? []).map((belge: any) => {
    const odemeToplami = (belge.cari_odeme ?? []).reduce(
      (s: number, o: any) => s + Number(o.baz_tutar ?? o.tutar ?? 0),
      0
    );
    const genel = Number(belge.genel_toplam ?? 0);
    const kalan = Math.max(0, genel - odemeToplami);
    const durum =
      genel <= 0
        ? "odendi"
        : odemeToplami <= 0
        ? "odenmedi"
        : odemeToplami >= genel
        ? "odendi"
        : "kismi";

    return {
      id: belge.id,
      tur: belge.tur,
      belge_no: belge.belge_no,
      tarih: belge.tarih,
      toplam: Number(belge.toplam),
      iskonto: Number(belge.iskonto),
      genel_toplam: genel,
      para_birimi: belge.para_birimi as ParaBirimi,
      kdv_orani: belge.kdv_orani,
      notlar: belge.notlar,
      created_at: belge.created_at,
      // Bağlantı: gemi, firma veya tek seferlik isim
      gemi_id: belge.gemi?.id ?? null,
      gemi_ad: belge.gemi?.ad ?? belge.tek_gemi_adi ?? null,
      firma_id: belge.firma?.id ?? null,
      firma_ad: belge.firma?.ad ?? belge.tek_firma_adi ?? null,
      tek_gemi_adi: belge.tek_gemi_adi ?? null,
      tek_firma_adi: belge.tek_firma_adi ?? null,
      odeme_durumu: durum,
      odenen_toplam: odemeToplami,
      kalan,
    };
  });

  // Durum filtresi (DB'de hesaplanamaz, client'ta filtrele)
  if (filtre?.durum) {
    return sonuc.filter((b) => b.odeme_durumu === filtre.durum);
  }
  // Arama filtresi
  if (filtre?.arama) {
    const q = filtre.arama.toLowerCase();
    return sonuc.filter(
      (b) =>
        b.belge_no.toLowerCase().includes(q) ||
        (b.gemi_ad ?? "").toLowerCase().includes(q) ||
        (b.firma_ad ?? "").toLowerCase().includes(q)
    );
  }
  return sonuc;
}

/** Belge detayı (kalemler dahil) */
export async function belgeDetayGetir(belgeId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("belge")
    .select(
      `
      *,
      ilgili_kisi ( id, ad, iletisim ),
      gemi ( id, ad, imo_no ),
      cari_odeme ( id, tutar, para_birimi, tarih, yontem, dekont_url, aciklama )
    `
    )
    .eq("id", belgeId)
    .eq("sirket_id", sirketId)
    .single();

  if (error) throw new Error(error.message);
  return data as any;
}

/** Belge ekle */
export async function belgeEkle(payload: {
  gemi_id?: string | null;
  firma_id?: string | null;
  tek_gemi_adi?: string | null;
  tek_firma_adi?: string | null;
  tur: "proforma" | "fatura";
  belge_no: string;
  tarih: string;
  para_birimi: ParaBirimi;
  kalemler: BelgeKalem[];
  iskonto?: number;
  kdv_orani?: number | null;
  ilgili_kisi_id?: string | null;
  notlar?: string | null;
  pdf_url?: string | null;
}) {
  const { supabase, sirketId } = await getAuthContext();

  const baglantıVar =
    payload.gemi_id || payload.firma_id ||
    payload.tek_gemi_adi?.trim() || payload.tek_firma_adi?.trim();
  if (!baglantıVar)
    return { hata: "Gemi, firma veya tek seferlik isim zorunludur." };
  if (!payload.belge_no?.trim()) return { hata: "Belge numarası zorunludur." };
  if (!payload.tarih) return { hata: "Tarih zorunludur." };
  if (!payload.kalemler?.length) return { hata: "En az bir kalem giriniz." };

  const toplam = hesaplaToplam(payload.kalemler);
  const iskonto = payload.iskonto ?? 0;
  const genel_toplam = hesaplaGenelToplam(toplam, iskonto, payload.kdv_orani ?? null);
  const kalemlerTemiz = payload.kalemler.map(({ id: _id, ...rest }) => rest);

  const { data, error } = await supabase
    .from("belge")
    .insert({
      sirket_id: sirketId,
      gemi_id: payload.gemi_id ?? null,
      firma_id: payload.firma_id ?? null,
      tek_gemi_adi: payload.tek_gemi_adi?.trim() || null,
      tek_firma_adi: payload.tek_firma_adi?.trim() || null,
      tur: payload.tur,
      belge_no: payload.belge_no.trim(),
      tarih: payload.tarih,
      para_birimi: payload.para_birimi,
      kalemler: kalemlerTemiz as any,
      toplam,
      iskonto,
      genel_toplam,
      kdv_orani: payload.kdv_orani ?? null,
      ilgili_kisi_id: payload.ilgili_kisi_id ?? null,
      notlar: payload.notlar?.trim() || null,
      pdf_url: payload.pdf_url ?? null,
    } as any)
    .select("id")
    .single();

  if (error) return { hata: error.message };

  revalidatePath("/cari");
  if (payload.gemi_id) revalidatePath(`/cari/gemiler/${payload.gemi_id}`);
  return { basarili: true, belgeId: data.id };
}

/** Belge güncelle */
export async function belgeGuncelle(
  belgeId: string,
  payload: {
    gemi_id?: string | null;
    firma_id?: string | null;
    tek_gemi_adi?: string | null;
    tek_firma_adi?: string | null;
    belge_no?: string;
    tarih?: string;
    para_birimi?: ParaBirimi;
    kalemler?: BelgeKalem[];
    iskonto?: number;
    kdv_orani?: number | null;
    ilgili_kisi_id?: string | null;
    notlar?: string | null;
    pdf_url?: string | null;
  }
) {
  const { supabase, sirketId } = await getAuthContext();

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.gemi_id !== undefined) updateData.gemi_id = payload.gemi_id ?? null;
  if (payload.firma_id !== undefined) updateData.firma_id = payload.firma_id ?? null;
  if (payload.tek_gemi_adi !== undefined) updateData.tek_gemi_adi = payload.tek_gemi_adi?.trim() || null;
  if (payload.tek_firma_adi !== undefined) updateData.tek_firma_adi = payload.tek_firma_adi?.trim() || null;

  if (payload.belge_no) updateData.belge_no = payload.belge_no.trim();
  if (payload.tarih) updateData.tarih = payload.tarih;
  if (payload.para_birimi) updateData.para_birimi = payload.para_birimi;
  if (payload.kdv_orani !== undefined) updateData.kdv_orani = payload.kdv_orani;
  if (payload.ilgili_kisi_id !== undefined)
    updateData.ilgili_kisi_id = payload.ilgili_kisi_id;
  if (payload.notlar !== undefined)
    updateData.notlar = payload.notlar?.trim() || null;
  if (payload.pdf_url !== undefined) updateData.pdf_url = payload.pdf_url;

  if (payload.kalemler) {
    const kalemlerTemiz = payload.kalemler.map(({ id: _id, ...rest }) => rest);
    const toplam = hesaplaToplam(payload.kalemler);
    const iskonto = payload.iskonto ?? 0;
    const kdv = payload.kdv_orani !== undefined ? payload.kdv_orani : updateData.kdv_orani;
    updateData.kalemler = kalemlerTemiz;
    updateData.toplam = toplam;
    updateData.iskonto = iskonto;
    updateData.genel_toplam = hesaplaGenelToplam(toplam, iskonto, kdv);
  } else if (payload.iskonto !== undefined || payload.kdv_orani !== undefined) {
    // Sadece iskonto veya KDV değişmişse, mevcut toplam üzerinden hesapla
    const { data: mevcut } = await supabase
      .from("belge")
      .select("toplam, kdv_orani")
      .eq("id", belgeId)
      .single();
    if (mevcut) {
      const mevcutKdv = payload.kdv_orani !== undefined
        ? payload.kdv_orani
        : Number((mevcut as any).kdv_orani ?? 0);
      if (payload.iskonto !== undefined) updateData.iskonto = payload.iskonto;
      updateData.genel_toplam = hesaplaGenelToplam(
        Number((mevcut as any).toplam),
        payload.iskonto ?? 0,
        mevcutKdv
      );
    }
  }

  const { error } = await supabase
    .from("belge")
    .update(updateData as any)
    .eq("id", belgeId)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/cari");
  return { basarili: true };
}

/** Belge sil */
export async function belgeSil(belgeId: string, gemiId?: string | null) {
  const { supabase, sirketId } = await getAuthContext();

  const { error } = await supabase
    .from("belge")
    .delete()
    .eq("id", belgeId)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/cari");
  if (gemiId) revalidatePath(`/cari/gemiler/${gemiId}`);
  return { basarili: true };
}

// ══════════════════════════════════════════════
// T-2.4 · ÖDEME CRUD
// ══════════════════════════════════════════════

export async function odemeListesiGetir(belgeId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("cari_odeme")
    .select("id, tarih, tutar, para_birimi, kur, baz_tutar, baz_para_birimi, yontem, dekont_url, aciklama, created_at")
    .eq("belge_id", belgeId)
    .eq("sirket_id", sirketId)
    .order("tarih", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}

export async function odemeEkle(payload: {
  belge_id: string;
  gemi_id?: string | null;
  tarih: string;
  tutar: number;
  para_birimi: ParaBirimi;
  yontem: "banka" | "elden";
  /** Kur (opsiyonel) — farklı para biriminde ödemede manuel kur girilir */
  kur?: number | null;
  /** Kur × tutar = baz_tutar (belge para birimindeki karşılık) */
  baz_tutar?: number | null;
  /** Belgenin para birimi */
  baz_para_birimi?: ParaBirimi | null;
  dekont_url?: string | null;
  aciklama?: string | null;
}) {
  const { supabase, sirketId } = await getAuthContext();

  if (!payload.tarih) return { hata: "Tarih zorunludur." };
  if (!payload.tutar || payload.tutar <= 0)
    return { hata: "Tutar sıfırdan büyük olmalıdır." };
  if (payload.kur !== undefined && payload.kur !== null && payload.kur <= 0)
    return { hata: "Kur sıfırdan büyük olmalıdır." };

  const { error } = await supabase.from("cari_odeme").insert({
    sirket_id: sirketId,
    belge_id: payload.belge_id,
    tarih: payload.tarih,
    tutar: payload.tutar,
    para_birimi: payload.para_birimi,
    kur: payload.kur ?? null,
    baz_tutar: payload.baz_tutar ?? null,
    baz_para_birimi: payload.baz_para_birimi ?? null,
    yontem: payload.yontem,
    dekont_url: payload.dekont_url ?? null,
    aciklama: payload.aciklama?.trim() || null,
  } as any);

  if (error) return { hata: error.message };

  revalidatePath("/cari");
  if (payload.gemi_id) revalidatePath(`/cari/gemiler/${payload.gemi_id}`);
  return { basarili: true };
}

export async function odemeSil(odemeId: string, gemiId?: string | null) {
  const { supabase, sirketId } = await getAuthContext();

  const { error } = await supabase
    .from("cari_odeme")
    .delete()
    .eq("id", odemeId)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/cari");
  if (gemiId) revalidatePath(`/cari/gemiler/${gemiId}`);
  return { basarili: true };
}

// ══════════════════════════════════════════════
// T-2.5 · ÖZET & KPI QUERIES
// ══════════════════════════════════════════════

/** Para birimi bazlı KPI: toplam alacak / ödenen / kalan */
export async function cariKpiGetir() {
  const { supabase, sirketId } = await getAuthContext();

  const { data: belgeler, error } = await supabase
    .from("belge")
    .select(`genel_toplam, para_birimi, cari_odeme ( tutar, baz_tutar )`)
    .eq("sirket_id", sirketId);

  if (error) throw new Error(error.message);

  const kpi: Record<string, { toplam_alacak: number; odenen: number }> = {};

  for (const b of belgeler ?? []) {
    const pb = (b as any).para_birimi as string;
    if (!kpi[pb]) kpi[pb] = { toplam_alacak: 0, odenen: 0 };
    kpi[pb].toplam_alacak += Number((b as any).genel_toplam ?? 0);
    // Çapraz kur: baz_tutar varsa belge PB cinsinden karşılığı kullan
    kpi[pb].odenen += ((b as any).cari_odeme ?? []).reduce(
      (s: number, o: any) => s + Number(o.baz_tutar ?? o.tutar ?? 0),
      0
    );
  }

  return (["TRY", "EUR", "USD"] as ParaBirimi[]).map((pb) => ({
    para_birimi: pb,
    toplam_alacak: kpi[pb]?.toplam_alacak ?? 0,
    odenen: kpi[pb]?.odenen ?? 0,
    odenmemis: Math.max(
      0,
      (kpi[pb]?.toplam_alacak ?? 0) - (kpi[pb]?.odenen ?? 0)
    ),
  }));
}

/** Cari genel tablo verisi (tüm belgeler, gemi + ödeme durumuyla) */
export async function cariGenelGetir(paraBirimi?: ParaBirimi) {
  const { supabase, sirketId } = await getAuthContext();

  let query = supabase
    .from("belge")
    .select(
      `
      id, belge_no, tarih, genel_toplam, para_birimi, tur,
      gemi ( id, ad ),
      ilgili_kisi ( ad ),
      cari_odeme ( tutar, baz_tutar )
    `
    )
    .eq("sirket_id", sirketId)
    .order("tarih", { ascending: false });

  if (paraBirimi) query = query.eq("para_birimi", paraBirimi);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((b: any) => {
    // Çapraz kur: baz_tutar varsa belge PB cinsinden karşılığı kullan
    const odemeToplami = (b.cari_odeme ?? []).reduce(
      (s: number, o: any) => s + Number(o.baz_tutar ?? o.tutar ?? 0),
      0
    );
    const genel = Number(b.genel_toplam ?? 0);
    const kalan = Math.max(0, genel - odemeToplami);
    const durum =
      genel <= 0
        ? "odendi"
        : odemeToplami <= 0
        ? "odenmedi"
        : odemeToplami >= genel
        ? "odendi"
        : "kismi";

    return {
      id: b.id,
      belge_no: b.belge_no,
      tarih: b.tarih,
      tur: b.tur,
      genel_toplam: genel,
      para_birimi: b.para_birimi as ParaBirimi,
      gemi_id: b.gemi?.id,
      gemi_ad: b.gemi?.ad,
      ilgili_kisi_ad: b.ilgili_kisi?.ad ?? null,
      odeme_durumu: durum,
      odenen_toplam: odemeToplami,
      kalan,
    };
  });
}

/** Firma (ilgili kişi) bazlı özet */
export async function firmaBazliGetir(ilgiliKisiId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("belge")
    .select(
      `
      id, belge_no, tarih, genel_toplam, para_birimi, tur,
      gemi ( id, ad ),
      cari_odeme ( tutar, baz_tutar )
    `
    )
    .eq("sirket_id", sirketId)
    .eq("ilgili_kisi_id", ilgiliKisiId)
    .order("tarih", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((b: any) => {
    // Çapraz kur: baz_tutar varsa belge PB cinsinden karşılığı kullan
    const odemeToplami = (b.cari_odeme ?? []).reduce(
      (s: number, o: any) => s + Number(o.baz_tutar ?? o.tutar ?? 0),
      0
    );
    const genel = Number(b.genel_toplam ?? 0);
    return {
      id: b.id,
      belge_no: b.belge_no,
      tarih: b.tarih,
      tur: b.tur,
      genel_toplam: genel,
      para_birimi: b.para_birimi as ParaBirimi,
      gemi_id: b.gemi?.id,
      gemi_ad: b.gemi?.ad,
      odenen_toplam: odemeToplami,
      kalan: Math.max(0, genel - odemeToplami),
    };
  });
}

/** Sonraki belge numarası için sıra sayısını öner */
export async function sonrakiBelgeNoGetir(tur: "proforma" | "fatura") {
  const { supabase, sirketId } = await getAuthContext();

  const { count } = await supabase
    .from("belge")
    .select("id", { count: "exact", head: true })
    .eq("sirket_id", sirketId)
    .eq("tur", tur);

  return (count ?? 0) + 1;
}

// ══════════════════════════════════════════════
// FİRMA CRUD
// ══════════════════════════════════════════════

export async function firmaListesiGetir() {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("firma")
    .select("id, ad, vergi_no, adres, telefon, email, notlar, created_at")
    .eq("sirket_id", sirketId)
    .order("ad", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}

export async function firmaDetayGetir(firmaId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("firma")
    .select("*, gemi ( id, ad, imo_no )")
    .eq("id", firmaId)
    .eq("sirket_id", sirketId)
    .single();

  if (error) throw new Error(error.message);
  return data as any;
}

export async function firmaEkle(payload: {
  ad: string;
  vergi_no?: string | null;
  adres?: string | null;
  telefon?: string | null;
  email?: string | null;
  notlar?: string | null;
}) {
  const { supabase, sirketId } = await getAuthContext();

  if (!payload.ad?.trim()) return { hata: "Firma adı zorunludur." };

  const { data, error } = await supabase
    .from("firma")
    .insert({
      sirket_id: sirketId,
      ad: payload.ad.trim(),
      vergi_no: payload.vergi_no?.trim() || null,
      adres: payload.adres?.trim() || null,
      telefon: payload.telefon?.trim() || null,
      email: payload.email?.trim() || null,
      notlar: payload.notlar?.trim() || null,
    } as any)
    .select("id")
    .single();

  if (error) return { hata: error.message };

  revalidatePath("/cari");
  return { basarili: true, firmaId: data.id };
}

export async function firmaGuncelle(
  firmaId: string,
  payload: {
    ad?: string;
    vergi_no?: string | null;
    adres?: string | null;
    telefon?: string | null;
    email?: string | null;
    notlar?: string | null;
  }
) {
  const { supabase, sirketId } = await getAuthContext();

  const { error } = await supabase
    .from("firma")
    .update({
      ...(payload.ad !== undefined && { ad: payload.ad.trim() }),
      vergi_no: payload.vergi_no?.trim() || null,
      adres: payload.adres?.trim() || null,
      telefon: payload.telefon?.trim() || null,
      email: payload.email?.trim() || null,
      notlar: payload.notlar?.trim() || null,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", firmaId)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/cari");
  return { basarili: true };
}

export async function firmaSil(firmaId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { error } = await supabase
    .from("firma")
    .delete()
    .eq("id", firmaId)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/cari");
  return { basarili: true };
}
