"use client";

/**
 * src/hooks/useMaasBordro.ts
 *
 * Bordro modülü TanStack Query hook'ları.
 * T3.1 değişiklikleri:
 *   - usePersonelBordro → bordro_ek_kalem join'li
 *   - useGecenAyAvans  → staleTime 5_000 (kritik veri)
 *   - useInvalidateBordro → gecen_ay_avans + donem_personeller invalidate
 *   - useBankaOdeme    → yeni hook (banka_odeme + maas_bordro JOIN)
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";
import { QUERY_KEYS } from "@/lib/constants";
import { useSirketStore } from "@/stores/sirketStore";
import type { MaasBordro, BordroEkKalem } from "@/supabase/app-types";
import type { EkKalemRow } from "@/types/bordro-form";

// ─────────────────────────────────────────────────────────────────────────────
// Tip Tanımları
// ─────────────────────────────────────────────────────────────────────────────

export type BordroListeItem = MaasBordro & {
  personel: {
    id: string;
    ad: string;
    soyad: string;
    gorev_unvan: string | null;
  };
};

export type DonemPersonelItem = {
  id: string;
  ad: string;
  soyad: string;
  gorev_unvan: string | null;
  banka_adi: string | null;
  iban: string | null;
  employment_periods: {
    baslangic_tarihi: string;
    bitis_tarihi: string | null;
  }[];
  maas_gecmisi: {
    maas_net: number;
    gecerlilik_baslangic: string;
    gecerlilik_bitis: string | null;
  }[];
};

/** personelDonemBordrosuGetir'in döndürdüğü tip — ek kalemler dahil */
export type PersonelBordroWithKalemler = MaasBordro & {
  bordro_ek_kalem: BordroEkKalem[];
};

/** Banka ödeme sayfası için birleşik satır tipi */
export type BankaOdemeSatiri = {
  bordro_id: string;
  personel_id: string;
  personel: { id: string; ad: string; soyad: string; gorev_unvan: string | null };
  banka: number;
  bes: number;
  tazminat: number;
  avans: number;
  elden_banka: number;
  odeme_not: string | null;
  toplam_odeme: number;
  bes_bordro: number;
  kayitli: boolean;
};

export type BordroDetayItem = MaasBordro & {
  personel: {
    id: string;
    ad: string;
    soyad: string;
    gorev_unvan: string | null;
    banka_adi: string | null;
    iban: string | null;
    telefon: string | null;
    email: string | null;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Dönem bordro listesi
// ─────────────────────────────────────────────────────────────────────────────

async function fetchDonemBordrolari(
  sirketId: string,
  yil: number,
  ay: number
): Promise<BordroListeItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("maas_bordro")
    .select(`*, personel ( id, ad, soyad, gorev_unvan )`)
    .eq("sirket_id", sirketId)
    .eq("donem_yil", yil)
    .eq("donem_ay", ay)
    .eq("is_active_version", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as BordroListeItem[];
}

export function useDonemBordrolari(yil: number, ay: number) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: QUERY_KEYS.MAAS_BORDRO(sirketId ?? "", yil, ay),
    queryFn: () => fetchDonemBordrolari(sirketId!, yil, ay),
    enabled: !!sirketId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Dönem personel listesi (veri girişi için)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchDonemPersoneller(
  sirketId: string,
  yil: number,
  ay: number
): Promise<DonemPersonelItem[]> {
  const supabase = createClient();
  const ayBaslangic = `${yil}-${String(ay).padStart(2, "0")}-01`;
  const ayBitis = new Date(yil, ay, 0).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("personel")
    .select(
      `
      id, ad, soyad, gorev_unvan, banka_adi, iban,
      employment_periods!inner ( baslangic_tarihi, bitis_tarihi ),
      maas_gecmisi ( maas_net, gecerlilik_baslangic, gecerlilik_bitis )
    `
    )
    .eq("sirket_id", sirketId)
    .lte("employment_periods.baslangic_tarihi", ayBitis)
    .or(`bitis_tarihi.is.null,bitis_tarihi.gte.${ayBaslangic}`, {
      referencedTable: "employment_periods",
    });

  if (error) throw new Error(error.message);
  return (data ?? []) as DonemPersonelItem[];
}

export function useDonemPersoneller(yil: number, ay: number) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: ["donem_personeller", sirketId ?? "", yil, ay],
    queryFn: () => fetchDonemPersoneller(sirketId!, yil, ay),
    enabled: !!sirketId,
    staleTime: 60_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Personele ait dönem bordroso + ek kalemleri (T3.1: join ile)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchPersonelBordro(
  sirketId: string,
  personelId: string,
  yil: number,
  ay: number
): Promise<PersonelBordroWithKalemler | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("maas_bordro")
    .select(`
      *,
      bordro_ek_kalem ( id, tip, ad, tutar, sira )
    `)
    .eq("personel_id", personelId)
    .eq("sirket_id", sirketId)
    .eq("donem_yil", yil)
    .eq("donem_ay", ay)
    .eq("is_active_version", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as PersonelBordroWithKalemler | null;
}

export function usePersonelBordro(
  personelId: string | null,
  yil: number,
  ay: number
) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: QUERY_KEYS.PERSONEL_BORDRO(personelId ?? "", yil, ay),
    queryFn: () => fetchPersonelBordro(sirketId!, personelId!, yil, ay),
    enabled: !!sirketId && !!personelId,
    staleTime: 10_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Geçen ay iç avans devri (T3.1: staleTime 5_000 — kritik veri)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchGecenAyAvans(
  sirketId: string,
  personelId: string,
  yil: number,
  ay: number
): Promise<number> {
  const supabase = createClient();
  const gecenAyDate = new Date(yil, ay - 2, 1);
  const gecenYil = gecenAyDate.getFullYear();
  const gecenAy = gecenAyDate.getMonth() + 1;

  const { data } = await supabase
    .from("maas_bordro")
    .select("iceri_avans_devir, iceri_avans_verilen, iceri_avans_kesinti")
    .eq("personel_id", personelId)
    .eq("sirket_id", sirketId)
    .eq("donem_yil", gecenYil)
    .eq("donem_ay", gecenAy)
    .eq("is_active_version", true)
    .maybeSingle();

  if (!data) return 0;
  const devir   = data.iceri_avans_devir ?? 0;
  const verilen = data.iceri_avans_verilen ?? 0;
  const kesinti = data.iceri_avans_kesinti ?? 0;
  return Math.max(0, devir + verilen - kesinti);
}

export function useGecenAyAvans(
  personelId: string | null,
  yil: number,
  ay: number
) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: ["gecen_ay_avans", sirketId ?? "", personelId ?? "", yil, ay],
    queryFn: () => fetchGecenAyAvans(sirketId!, personelId!, yil, ay),
    enabled: !!sirketId && !!personelId,
    staleTime: 5_000, // T3.1: Kritik veri — daha sık yenilenir
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// T3.1 (yeni) — useBankaOdeme
// banka_odeme tablosundaki mevcut kayıtları bordro ile birleştirerek getirir.
// Kayıtlı değer varsa oradan, yoksa bordrodaki ham değer kullanılır.
// ─────────────────────────────────────────────────────────────────────────────

async function fetchBankaOdeme(
  sirketId: string,
  yil: number,
  ay: number
): Promise<BankaOdemeSatiri[]> {
  const supabase = createClient();

  // Dönem aktif bordrolar
  const { data: bordrolar, error: bordroErr } = await supabase
    .from("maas_bordro")
    .select(`
      id, personel_id, banka, bes, tazminat, avans, toplam_odeme, elden,
      personel ( id, ad, soyad, gorev_unvan )
    `)
    .eq("sirket_id", sirketId)
    .eq("donem_yil", yil)
    .eq("donem_ay", ay)
    .eq("is_active_version", true);

  if (bordroErr) throw new Error(bordroErr.message);

  // Mevcut banka_odeme kayıtları
  const { data: odemelar, error: odemeErr } = await supabase
    .from("banka_odeme")
    .select("*")
    .eq("sirket_id", sirketId)
    .eq("donem_yil", yil)
    .eq("donem_ay", ay);

  if (odemeErr) throw new Error(odemeErr.message);

  const odemeMap = new Map((odemelar ?? []).map((o) => [o.bordro_id, o]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (bordrolar ?? []).map((b: any): BankaOdemeSatiri => {
    const odeme = odemeMap.get(b.id);
    return {
      bordro_id:   b.id,
      personel_id: b.personel_id,
      personel:    b.personel,
      banka:       odeme?.banka      ?? b.banka,
      bes:         odeme?.bes        ?? b.bes,
      tazminat:    odeme?.tazminat   ?? b.tazminat,
      avans:       odeme?.avans      ?? b.avans,
      elden_banka: odeme?.elden_banka ?? b.elden,
      odeme_not:   odeme?.odeme_not  ?? null,
      toplam_odeme: b.toplam_odeme,
      bes_bordro:  b.bes,
      kayitli:     !!odeme,
    };
  });
}

export function useBankaOdeme(yil: number, ay: number) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: QUERY_KEYS.BANKA_ODEME(sirketId ?? "", yil, ay),
    queryFn: () => fetchBankaOdeme(sirketId!, yil, ay),
    enabled: !!sirketId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Bordro ek kalemleri (tek bordro için)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchEkKalemler(
  bordroId: string
): Promise<EkKalemRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bordro_ek_kalem")
    .select("id, tip, ad, tutar, sira")
    .eq("bordro_id", bordroId)
    .order("sira", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((k) => ({
    id:    k.id,
    ad:    k.ad,
    tutar: k.tutar,
    sira:  k.sira ?? 0,
  }));
}

export function useEkKalemler(bordroId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.EK_KALEM(bordroId ?? ""),
    queryFn: () => fetchEkKalemler(bordroId!),
    enabled: !!bordroId,
    staleTime: 10_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tek bordro detayı (detay sayfası)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchBordroDetay(
  sirketId: string,
  bordroId: string
): Promise<BordroDetayItem | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("maas_bordro")
    .select(
      `*, personel ( id, ad, soyad, gorev_unvan, banka_adi, iban, telefon, email )`
    )
    .eq("id", bordroId)
    .eq("sirket_id", sirketId)
    .eq("is_active_version", true)   // Pasif versiyonları gösterme
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as BordroDetayItem | null;
}

export function useBordroDetay(bordroId: string | null) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: ["bordro_detay", sirketId ?? "", bordroId ?? ""],
    queryFn: () => fetchBordroDetay(sirketId!, bordroId!),
    enabled: !!sirketId && !!bordroId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// T3.1 — Invalidate yardımcısı (gecen_ay_avans + donem_personeller eklendi)
// ─────────────────────────────────────────────────────────────────────────────
export function useInvalidateBordro() {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return (yil: number, ay: number, personelId?: string | null) => {
    if (!sirketId) return;

    // Dönem bordro listesi
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.MAAS_BORDRO(sirketId, yil, ay),
    });

    // Personel bordrosu (tüm personeller için — revizyon sonrası yeni bordro)
    queryClient.invalidateQueries({ queryKey: ["personel_bordro"] });

    // Bordro detay sayfası
    queryClient.invalidateQueries({ queryKey: ["bordro_detay"] });

    // T3.1: Geçen ay avans + ek kalemler
    if (personelId) {
      queryClient.invalidateQueries({
        queryKey: ["gecen_ay_avans", sirketId, personelId],
      });
      queryClient.invalidateQueries({ queryKey: ["bordro_ek_kalem"] });
    }

    // Personel listesi (dönem değişiminde)
    queryClient.invalidateQueries({
      queryKey: ["donem_personeller", sirketId, yil, ay],
    });
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Revizyon Karşılaştırma: Eski (pasif) bordroyu getir
// is_active_version filtresi YOK — parent_bordro_id ile pasif versiyon okunur
// ─────────────────────────────────────────────────────────────────────────────

async function fetchEskiBordro(
  sirketId: string,
  bordroId: string
): Promise<BordroDetayItem | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("maas_bordro")
    .select(
      `*, personel ( id, ad, soyad, gorev_unvan, banka_adi, iban, telefon, email ),
       bordro_ek_kalem ( id, tip, ad, tutar, sira )`
    )
    .eq("id", bordroId)
    .eq("sirket_id", sirketId)
    // is_active_version filtresi YOK — pasif versiyonları da getirebilir
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as BordroDetayItem | null;
}

/** Pasif (eski revizyon) bordro — karşılaştırma ekranı için */
export function useEskiBordro(bordroId: string | null) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: ["eski_bordro", sirketId ?? "", bordroId ?? ""],
    queryFn: () => fetchEskiBordro(sirketId!, bordroId!),
    enabled: !!sirketId && !!bordroId,
    staleTime: Infinity, // Pasif versiyonlar değişmez
  });
}
