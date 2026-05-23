"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSirketStore } from "@/stores/sirketStore";
import { QUERY_KEYS } from "@/lib/constants";
import { ayPuantajGetir, gunVeriGir, gunVeriSil, ayKapat, ayAc, projePuantajGetir, projeSaatGir, projeSaatSil, projeleriGetir, donemAktifProjeleriGetir, projeEkle, projeGuncelle, projeArsivle, projeAktivasyonu, projeSil, projePuantajVeGenelGir, projePuantajVeGenelSil, ayOzetGetir, ayOzetKaydet, projeDonemLogListele, projeDonemLogEkle, projeDonemLogGuncelle, projeDonemLogSil, projeDetayGetir, topluGunGirisi, topluProjePuantajGirisi, } from "@/app/actions/puantaj";
import type { PuantajGunVerisi, FaturaKodu } from "@/types";
import type { Database } from "@/supabase/types";
type Proje = Database["public"]["Tables"]["proje"]["Row"];
type PuantajGenel = Database["public"]["Tables"]["puantaj_genel"]["Row"];

// ─────────────────────────────────────────────────────────────────────────────
// Yardımcı tipler
// ─────────────────────────────────────────────────────────────────────────────

export type AyPuantajSonucu = {
  personeller: {
    id: string;
    ad: string;
    soyad: string;
    gorev_unvan: string | null;
    employment_periods: { baslangic_tarihi: string; bitis_tarihi: string | null }[];
  }[];
  puantajlar: PuantajGenel[];
  projeSaatleri: {
    personel_id: string;
    tarih: string;
    saat: number;
    proje: { ad: string } | null;
  }[];
  ayKapali: boolean;
  kullaniciRol: string;
};

export type ProjePuantajSatir = {
  id: string;
  personel_id: string;
  tarih: string;
  saat: number | null;   // özel durum seçilince NULL olabilir
  mesai_saati: number | null;
  ozel_durum: string | null;
  aciklama: string | null;
  personel: { id: string; ad: string; soyad: string };
};

// ─────────────────────────────────────────────────────────────────────────────
// GENEL PUANTAJ — Query
// ─────────────────────────────────────────────────────────────────────────────

export function useAyPuantaj(yil: number, ay: number) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useQuery<AyPuantajSonucu>({
    queryKey: QUERY_KEYS.PUANTAJ_GENEL(sirketId ?? "", yil, ay),
    queryFn: () => ayPuantajGetir(yil, ay) as Promise<AyPuantajSonucu>,
    enabled: !!sirketId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GENEL PUANTAJ — Mutations
// ─────────────────────────────────────────────────────────────────────────────

export function useGunVeriGir(yil: number, ay: number) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({
      personelId,
      tarih,
      veri,
    }: {
      personelId: string;
      tarih: string;
      veri: PuantajGunVerisi;
    }) => gunVeriGir(personelId, tarih, veri),
    onSuccess: async () => {
      if (!sirketId) return;
      await queryClient.refetchQueries({
        queryKey: QUERY_KEYS.PUANTAJ_GENEL(sirketId, yil, ay),
      });
    },
  });
}

export function useGunVeriSil(yil: number, ay: number) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({ personelId, tarih }: { personelId: string; tarih: string }) =>
      gunVeriSil(personelId, tarih),
    onSuccess: async () => {
      if (!sirketId) return;
      await queryClient.refetchQueries({
        queryKey: QUERY_KEYS.PUANTAJ_GENEL(sirketId, yil, ay),
      });
    },
  });
}

export function useAyKapat(yil: number, ay: number) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: () => ayKapat(yil, ay),
    onSuccess: () => {
      if (!sirketId) return;
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PUANTAJ_GENEL(sirketId, yil, ay),
      });
    },
  });
}

export function useAyAc(yil: number, ay: number) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: () => ayAc(yil, ay),
    onSuccess: () => {
      if (!sirketId) return;
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PUANTAJ_GENEL(sirketId, yil, ay),
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJE PUANTAJ — Query
// ─────────────────────────────────────────────────────────────────────────────

export function useProjePuantaj(
  projeId: string | null,
  yil: number,
  ay: number
) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useQuery<ProjePuantajSatir[]>({
    queryKey: QUERY_KEYS.PUANTAJ_PROJE(sirketId ?? "", projeId ?? "", yil, ay),
    queryFn: () =>
      projePuantajGetir(projeId!, yil, ay) as Promise<ProjePuantajSatir[]>,
    enabled: !!sirketId && !!projeId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJE PUANTAJ — Mutations
// ─────────────────────────────────────────────────────────────────────────────

/** Eski saat-only girişi (geriye dönük uyumluluk) */
export function useProjeSaatGir(
  projeId: string | null,
  yil: number,
  ay: number
) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({
      personelId,
      tarih,
      saat,
      aciklama,
    }: {
      personelId: string;
      tarih: string;
      saat: number;
      aciklama?: string | null;
    }) => projeSaatGir(personelId, projeId!, tarih, saat, aciklama),
    onSuccess: () => {
      if (!sirketId || !projeId) return;
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PUANTAJ_PROJE(sirketId, projeId, yil, ay),
      });
    },
  });
}

export function useProjeSaatSil(
  projeId: string | null,
  yil: number,
  ay: number
) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({ id }: { id: string }) => projeSaatSil(id),
    onSuccess: () => {
      if (!sirketId || !projeId) return;
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PUANTAJ_PROJE(sirketId, projeId, yil, ay),
      });
    },
  });
}

/**
 * Hem puantaj_proje hem puantaj_genel'e yazar.
 * Genel Puantaj ile aynı modal'dan çağrılır.
 */
export function useProjePuantajVeGenelGir(
  projeId: string | null,
  yil: number,
  ay: number
) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({
      personelId,
      tarih,
      veri,
    }: {
      personelId: string;
      tarih: string;
      veri: PuantajGunVerisi;
    }) => projePuantajVeGenelGir(personelId, projeId!, tarih, veri),
    onSuccess: async () => {
      if (!sirketId || !projeId) return;
      // Hem proje hem genel cache'i yenile (invalidate değil, anında refetch)
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.PUANTAJ_PROJE(sirketId, projeId, yil, ay),
        }),
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.PUANTAJ_GENEL(sirketId, yil, ay),
        }),
      ]);
    },
  });
}

/**
 * Hem puantaj_proje hem puantaj_genel'den siler.
 */
export function useProjePuantajVeGenelSil(
  projeId: string | null,
  yil: number,
  ay: number
) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({
      personelId,
      tarih,
    }: {
      personelId: string;
      tarih: string;
    }) => projePuantajVeGenelSil(personelId, projeId!, tarih),
    onSuccess: async () => {
      if (!sirketId || !projeId) return;
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.PUANTAJ_PROJE(sirketId, projeId, yil, ay),
        }),
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.PUANTAJ_GENEL(sirketId, yil, ay),
        }),
      ]);
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJELER — Query
// ─────────────────────────────────────────────────────────────────────────────

/** Tüm projeler (aktif + arşiv) */
export function useProjeler() {
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useQuery<Proje[]>({
    queryKey: QUERY_KEYS.PROJELER(sirketId ?? ""),
    queryFn: () => projeleriGetir() as Promise<Proje[]>,
    enabled: !!sirketId,
    staleTime: 60_000,
  });
}

/** Belirli bir ay için aktif olan projeler */
export function useDonemAktifProjeler(yil: number, ay: number) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useQuery<Proje[]>({
    queryKey: [...QUERY_KEYS.PROJELER(sirketId ?? ""), "donem", yil, ay],
    queryFn: () => donemAktifProjeleriGetir(yil, ay) as Promise<Proje[]>,
    enabled: !!sirketId,
    staleTime: 60_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJELER — Mutations
// ─────────────────────────────────────────────────────────────────────────────

export function useProjeEkle() {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: (veri: {
      ad: string;
      baslangic_tarihi: string;
      firma_adi?: string | null;
      adres_1?: string | null;
      adres_2?: string | null;
      bolge?: string | null;
      tersane_adi?: string | null;
      aciklama?: string | null;
      fatura_kodlari?: FaturaKodu[];
    }) => projeEkle(veri),
    onSuccess: () => {
      if (!sirketId) return;
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PROJELER(sirketId),
      });
    },
  });
}

export function useProjeGuncelle() {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({
      id,
      veri,
    }: {
      id: string;
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
      };
    }) => projeGuncelle(id, veri),
    onSuccess: () => {
      if (!sirketId) return;
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PROJELER(sirketId),
      });
    },
  });
}

export function useProjeArsivle() {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({ id, bitis_tarihi }: { id: string; bitis_tarihi: string }) =>
      projeArsivle(id, bitis_tarihi),
    onSuccess: () => {
      if (!sirketId) return;
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PROJELER(sirketId),
      });
    },
  });
}

export function useProjeAktivasyonu() {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({ id }: { id: string }) => projeAktivasyonu(id),
    onSuccess: () => {
      if (!sirketId) return;
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PROJELER(sirketId),
      });
    },
  });
}

export function useProjeSil() {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({ id }: { id: string }) => projeSil(id),
    onSuccess: () => {
      if (!sirketId) return;
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PROJELER(sirketId),
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// AY ÖZET — SGK Gün + Maaş Saat override
// ─────────────────────────────────────────────────────────────────────────────

export type AyOzetSatir = {
  personel_id: string;
  sgk_gun_override: number | null;
  maas_saati_override: number | null;
};

export function useAyOzet(yil: number, ay: number) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useQuery<AyOzetSatir[]>({
    queryKey: QUERY_KEYS.PUANTAJ_AY_OZET(sirketId ?? "", yil, ay),
    queryFn: () => ayOzetGetir(yil, ay) as Promise<AyOzetSatir[]>,
    enabled: !!sirketId,
    staleTime: 30_000,
  });
}

export function useAyOzetKaydet(yil: number, ay: number) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({
      personelId,
      sgkGun,
      maasSaati,
    }: {
      personelId: string;
      sgkGun: number | null;
      maasSaati: number | null;
    }) => ayOzetKaydet(personelId, yil, ay, sgkGun, maasSaati),
    onSuccess: async () => {
      if (!sirketId) return;
      await queryClient.refetchQueries({
        queryKey: QUERY_KEYS.PUANTAJ_AY_OZET(sirketId, yil, ay),
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJE DÖNEM LOG
// ─────────────────────────────────────────────────────────────────────────────

export type DonemLog = {
  id: string;
  proje_id: string;
  baslangic: string;
  bitis: string | null;
  aciklama: string | null;
  created_at: string;
};

export function useProjeDonemLog(projeId: string | null) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useQuery<DonemLog[]>({
    queryKey: ["proje_donem_log", sirketId ?? "", projeId ?? ""],
    queryFn: () => projeDonemLogListele(projeId!) as Promise<DonemLog[]>,
    enabled: !!sirketId && !!projeId,
    staleTime: 30_000,
  });
}

export function useProjeDonemLogEkle(projeId: string) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({
      baslangic,
      bitis,
      aciklama,
    }: {
      baslangic: string;
      bitis?: string | null;
      aciklama?: string | null;
    }) => projeDonemLogEkle(projeId, baslangic, bitis, aciklama),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["proje_donem_log", sirketId ?? "", projeId],
      });
    },
  });
}

export function useProjeDonemLogGuncelle(projeId: string) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({
      logId,
      bitis,
      aciklama,
    }: {
      logId: string;
      bitis: string | null;
      aciklama?: string | null;
    }) => projeDonemLogGuncelle(logId, bitis, aciklama),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["proje_donem_log", sirketId ?? "", projeId],
      });
    },
  });
}

export function useProjeDonemLogSil(projeId: string) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({ logId }: { logId: string }) => projeDonemLogSil(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["proje_donem_log", sirketId ?? "", projeId],
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJE DETAY
// ─────────────────────────────────────────────────────────────────────────────

export type ProjeDetaySonucu = Awaited<ReturnType<typeof projeDetayGetir>>;

export function useProjeDetay(projeId: string | null) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useQuery<ProjeDetaySonucu>({
    queryKey: ["proje_detay", sirketId ?? "", projeId ?? ""],
    queryFn: () => projeDetayGetir(projeId!) as Promise<ProjeDetaySonucu>,
    enabled: !!sirketId && !!projeId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPLU GÜN GİRİŞİ
// ─────────────────────────────────────────────────────────────────────────────

export function useTopluGunGirisi(yil: number, ay: number) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: (
      kayitlar: { personelId: string; tarih: string; veri: PuantajGunVerisi }[]
    ) => topluGunGirisi(kayitlar),
    onSuccess: async () => {
      if (!sirketId) return;
      await queryClient.refetchQueries({
        queryKey: QUERY_KEYS.PUANTAJ_GENEL(sirketId, yil, ay),
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJE TOPLU GÜN GİRİŞİ
// ─────────────────────────────────────────────────────────────────────────────

export function useTopluProjePuantajGirisi(
  projeId: string | null,
  yil: number,
  ay: number
) {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: (
      kayitlar: { personelId: string; tarih: string; veri: PuantajGunVerisi }[]
    ) => topluProjePuantajGirisi(projeId!, kayitlar),
    onSuccess: async () => {
      if (!sirketId || !projeId) return;
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.PUANTAJ_PROJE(sirketId, projeId, yil, ay),
        }),
        queryClient.refetchQueries({
          queryKey: QUERY_KEYS.PUANTAJ_GENEL(sirketId, yil, ay),
        }),
      ]);
    },
  });
}

