"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";
import { QUERY_KEYS } from "@/lib/constants";
import { useSirketStore } from "@/stores/sirketStore";
import type { ParaBirimi } from "@/types";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function calcOdemeDurum(genel: number, odenen: number) {
  if (genel <= 0) return "odendi";
  if (odenen <= 0) return "odenmedi";
  if (odenen >= genel) return "odendi";
  return "kismi";
}

// ─────────────────────────────────────────────
// Gemi Listesi
// ─────────────────────────────────────────────
async function fetchGemiList(sirketId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gemi")
    .select(
      `id, ad, imo_no, notlar, created_at,
       firma ( id, ad ),
       belge ( genel_toplam, para_birimi,
         cari_odeme ( tutar, baz_tutar )
       )`
    )
    .eq("sirket_id", sirketId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((g: any) => {
    const ozet: Record<string, { alacak: number; odenen: number }> = {};
    for (const b of g.belge ?? []) {
      const pb: string = b.para_birimi;
      if (!ozet[pb]) ozet[pb] = { alacak: 0, odenen: 0 };
      ozet[pb].alacak += Number(b.genel_toplam ?? 0);
      // Çapraz kur varsa baz_tutar (belge PB cinsinden) kullan
      for (const o of b.cari_odeme ?? [])
        ozet[pb].odenen += Number(o.baz_tutar ?? o.tutar ?? 0);
    }
    return {
      id: g.id, ad: g.ad, imo_no: g.imo_no, notlar: g.notlar,
      firma: g.firma ?? null,
      created_at: g.created_at, ozet,
    };
  });
}

export function useGemiList() {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: QUERY_KEYS.GEMI_LIST(sirketId ?? ""),
    queryFn: () => fetchGemiList(sirketId!),
    enabled: !!sirketId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────
// Gemi Detay
// ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchGemiDetay(gemiId: string): Promise<any> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gemi")
    .select(`*, ilgili_kisi ( id, ad, iletisim, created_at )`)
    .eq("id", gemiId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export function useGemiDetay(gemiId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.GEMI_DETAY(gemiId ?? ""),
    queryFn: () => fetchGemiDetay(gemiId!),
    enabled: !!gemiId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────
// Belge Listesi (gemi bazlı — GemiDetay için)
// ─────────────────────────────────────────────
async function fetchBelgeList(gemiId: string, tur?: string) {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("belge")
    .select(
      `id, tur, belge_no, tarih, toplam, iskonto, genel_toplam,
       para_birimi, kdv_orani, notlar, pdf_url, created_at,
       ilgili_kisi ( ad ),
       cari_odeme ( tutar, baz_tutar )`
    )
    .eq("gemi_id", gemiId)
    .order("tarih", { ascending: false });

  if (tur) query = query.eq("tur", tur);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((b: any) => {
    const odenenToplam = (b.cari_odeme ?? []).reduce(
      (s: number, o: { tutar: number; baz_tutar?: number | null }) =>
        s + Number(o.baz_tutar ?? o.tutar ?? 0), 0
    );
    const genel = Number(b.genel_toplam ?? 0);
    return {
      id: b.id, tur: b.tur, belge_no: b.belge_no, tarih: b.tarih,
      toplam: Number(b.toplam), iskonto: Number(b.iskonto),
      genel_toplam: genel, para_birimi: b.para_birimi as ParaBirimi,
      kdv_orani: b.kdv_orani, notlar: b.notlar, pdf_url: b.pdf_url,
      created_at: b.created_at, ilgili_kisi_ad: b.ilgili_kisi?.ad ?? null,
      odeme_durumu: calcOdemeDurum(genel, odenenToplam),
      odenen_toplam: odenenToplam,
      kalan: Math.max(0, genel - odenenToplam),
    };
  });
}

export function useBelgeList(gemiId: string | null, tur?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.BELGE_LIST(gemiId ?? "", tur),
    queryFn: () => fetchBelgeList(gemiId!, tur),
    enabled: !!gemiId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────
// Tüm Belge Listesi (Ana Sayfa — gemi + firma)
// ─────────────────────────────────────────────
async function fetchTumBelgeList(
  sirketId: string,
  filtre?: { tur?: string; durum?: string; arama?: string }
) {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("belge")
    .select(
      `id, tur, belge_no, tarih, toplam, iskonto, genel_toplam,
       para_birimi, kdv_orani, notlar, created_at,
       tek_gemi_adi, tek_firma_adi,
       gemi ( id, ad ),
       firma ( id, ad ),
       cari_odeme ( tutar, baz_tutar )`
    )
    .eq("sirket_id", sirketId)
    .order("tarih", { ascending: false });

  if (filtre?.tur) query = query.eq("tur", filtre.tur);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sonuc = (data ?? []).map((b: any) => {
    const odenenToplam = (b.cari_odeme ?? []).reduce(
      (s: number, o: { tutar: number; baz_tutar?: number | null }) =>
        s + Number(o.baz_tutar ?? o.tutar ?? 0), 0
    );
    const genel = Number(b.genel_toplam ?? 0);
    return {
      id: b.id, tur: b.tur, belge_no: b.belge_no, tarih: b.tarih,
      toplam: Number(b.toplam), iskonto: Number(b.iskonto),
      genel_toplam: genel, para_birimi: b.para_birimi as ParaBirimi,
      kdv_orani: b.kdv_orani, notlar: b.notlar, created_at: b.created_at,
      gemi_id: b.gemi?.id ?? null,
      gemi_ad: b.gemi?.ad ?? b.tek_gemi_adi ?? null,
      firma_id: b.firma?.id ?? null,
      firma_ad: b.firma?.ad ?? b.tek_firma_adi ?? null,
      tek_gemi_adi: b.tek_gemi_adi ?? null,
      tek_firma_adi: b.tek_firma_adi ?? null,
      odeme_durumu: calcOdemeDurum(genel, odenenToplam),
      odenen_toplam: odenenToplam,
      kalan: Math.max(0, genel - odenenToplam),
    };
  });

  let result = sonuc;
  if (filtre?.durum) result = result.filter((b: any) => b.odeme_durumu === filtre.durum);
  if (filtre?.arama) {
    const q = filtre.arama.toLowerCase();
    result = result.filter(
      (b: any) =>
        b.belge_no.toLowerCase().includes(q) ||
        (b.gemi_ad ?? "").toLowerCase().includes(q) ||
        (b.firma_ad ?? "").toLowerCase().includes(q)
    );
  }
  return result;
}

export function useTumBelgeList(filtre?: { tur?: string; durum?: string; arama?: string }) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: ["belge", "tum", sirketId ?? "", filtre?.tur, filtre?.durum, filtre?.arama],
    queryFn: () => fetchTumBelgeList(sirketId!, filtre),
    enabled: !!sirketId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────
// Ödeme Listesi
// ─────────────────────────────────────────────
async function fetchOdemeList(belgeId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cari_odeme")
    .select("id, tarih, tutar, para_birimi, kur, baz_tutar, baz_para_birimi, yontem, dekont_url, aciklama, created_at")
    .eq("belge_id", belgeId)
    .order("tarih", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useOdemeList(belgeId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.ODEME_LIST(belgeId ?? ""),
    queryFn: () => fetchOdemeList(belgeId!),
    enabled: !!belgeId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────
// Cari KPI
// ─────────────────────────────────────────────
async function fetchCariKpi(sirketId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("belge")
    .select(`genel_toplam, para_birimi, cari_odeme ( tutar, baz_tutar )`)
    .eq("sirket_id", sirketId);
  if (error) throw new Error(error.message);

  const kpi: Record<string, { toplam_alacak: number; odenen: number }> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const b of data ?? [] as any[]) {
    const pb = b.para_birimi as string;
    if (!kpi[pb]) kpi[pb] = { toplam_alacak: 0, odenen: 0 };
    kpi[pb].toplam_alacak += Number(b.genel_toplam ?? 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kpi[pb].odenen += (b.cari_odeme ?? []).reduce(
      (s: number, o: any) => s + Number(o.baz_tutar ?? o.tutar ?? 0), 0
    );
  }

  return (["TRY", "EUR", "USD"] as ParaBirimi[]).map((pb) => ({
    para_birimi: pb,
    toplam_alacak: kpi[pb]?.toplam_alacak ?? 0,
    odenen: kpi[pb]?.odenen ?? 0,
    odenmemis: Math.max(0, (kpi[pb]?.toplam_alacak ?? 0) - (kpi[pb]?.odenen ?? 0)),
  }));
}

export function useCariKpi() {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: QUERY_KEYS.CARI_KPI(sirketId ?? ""),
    queryFn: () => fetchCariKpi(sirketId!),
    enabled: !!sirketId,
    staleTime: 60_000,
  });
}

// ─────────────────────────────────────────────
// Cari Genel Tablo
// ─────────────────────────────────────────────
async function fetchCariGenel(sirketId: string, paraBirimi?: string) {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("belge")
    .select(
      `id, belge_no, tarih, genel_toplam, para_birimi, tur,
       gemi ( id, ad ),
       firma ( id, ad ),
       ilgili_kisi ( ad ),
       cari_odeme ( tutar, baz_tutar )`
    )
    .eq("sirket_id", sirketId)
    .order("tarih", { ascending: false });

  if (paraBirimi) query = query.eq("para_birimi", paraBirimi);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((b: any) => {
    const odenenToplam = (b.cari_odeme ?? []).reduce(
      (s: number, o: { tutar: number; baz_tutar?: number | null }) =>
        s + Number(o.baz_tutar ?? o.tutar ?? 0), 0
    );
    const genel = Number(b.genel_toplam ?? 0);
    return {
      id: b.id, belge_no: b.belge_no, tarih: b.tarih, tur: b.tur,
      genel_toplam: genel, para_birimi: b.para_birimi as ParaBirimi,
      gemi_id: b.gemi?.id ?? null, gemi_ad: b.gemi?.ad ?? null,
      firma_id: b.firma?.id ?? null, firma_ad: b.firma?.ad ?? null,
      ilgili_kisi_ad: b.ilgili_kisi?.ad ?? null,
      odeme_durumu: calcOdemeDurum(genel, odenenToplam),
      odenen_toplam: odenenToplam,
      kalan: Math.max(0, genel - odenenToplam),
    };
  });
}

export function useCariGenel(paraBirimi?: ParaBirimi) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: QUERY_KEYS.CARI_GENEL(sirketId ?? "", paraBirimi),
    queryFn: () => fetchCariGenel(sirketId!, paraBirimi),
    enabled: !!sirketId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────
// İlgili Kişi Listesi (gemi bazlı)
// ─────────────────────────────────────────────
async function fetchIlgiliKisiList(gemiId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ilgili_kisi")
    .select("id, ad, iletisim, created_at")
    .eq("gemi_id", gemiId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useIlgiliKisiList(gemiId: string | null) {
  return useQuery({
    queryKey: ["ilgili_kisi", "list", gemiId ?? ""],
    queryFn: () => fetchIlgiliKisiList(gemiId!),
    enabled: !!gemiId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────
// Invalidation helpers
// ─────────────────────────────────────────────
export function useInvalidateCari() {
  const qc = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return {
    invalidateGemiList: () =>
      sirketId && qc.invalidateQueries({ queryKey: QUERY_KEYS.GEMI_LIST(sirketId) }),
    invalidateGemiDetay: (gemiId: string) =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.GEMI_DETAY(gemiId) }),
    invalidateBelgeList: (gemiId: string) =>
      qc.invalidateQueries({ queryKey: ["belge", "list", gemiId] }),
    invalidateTumBelgeList: () =>
      sirketId && qc.invalidateQueries({ queryKey: ["belge", "tum", sirketId] }),
    invalidateOdemeList: (belgeId: string) =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ODEME_LIST(belgeId) }),
    invalidateKpi: () =>
      sirketId && qc.invalidateQueries({ queryKey: QUERY_KEYS.CARI_KPI(sirketId) }),
    invalidateGenel: () =>
      sirketId && qc.invalidateQueries({ queryKey: ["cari", "genel", sirketId] }),
    invalidateFirmaList: () =>
      sirketId && qc.invalidateQueries({ queryKey: ["firma", "list", sirketId] }),
  };
}

// ─────────────────────────────────────────────
// Firma Listesi
// ─────────────────────────────────────────────
async function fetchFirmaList(sirketId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("firma")
    .select("id, ad, vergi_no, adres, telefon, email, notlar, created_at")
    .eq("sirket_id", sirketId)
    .order("ad", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useFirmaList() {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: ["firma", "list", sirketId ?? ""],
    queryFn: () => fetchFirmaList(sirketId!),
    enabled: !!sirketId,
    staleTime: 60_000,
  });
}
