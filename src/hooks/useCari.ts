"use client";

// ─── Cari Modülü — React Query Hooks ─────────────────────────────────────────
// Sıfırdan yazıldı. docs/cari-modul.md spesifikasyonuna göre.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSirketStore } from "@/stores/sirketStore";
import { QUERY_KEYS } from "@/lib/constants";
import type { BelgeListFiltre } from "@/types/cari";

import {
  // Firma
  firmaListesiGetir,
  firmaEkle,
  firmaGuncelle,
  firmaSil,
  // Belge
  belgeListesiGetir,
  belgeDetayGetir,
  belgeEkle,
  belgeGuncelle,
  belgeNotlarGuncelle,
  belgeSil,
  // Ödeme
  odemeEkle,
  odemeSil,
  topluOdemeEkle,
  // Dosya
  belgeDosyaEkle,
  belgeDosyaSil,
  // KPI
  cariKpiGetir,
} from "@/app/actions/cari";

// ═══════════════════════════════════════════════════════════════════════════════
// KPI
// ═══════════════════════════════════════════════════════════════════════════════

export function useCariKpi(yil?: number) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: [...QUERY_KEYS.CARI_KPI(sirketId ?? ""), { yil }],
    queryFn: () => cariKpiGetir(yil),
    enabled: !!sirketId,
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// BELGE LİSTESİ
// ═══════════════════════════════════════════════════════════════════════════════

export function useBelgeList(filtre?: BelgeListFiltre) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: [...QUERY_KEYS.CARI_BELGE_LIST(sirketId ?? ""), filtre],
    queryFn: () => belgeListesiGetir(filtre),
    enabled: !!sirketId,
    staleTime: 30_000,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// BELGE DETAY
// ═══════════════════════════════════════════════════════════════════════════════

export function useBelgeDetay(belgeId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.CARI_BELGE_DETAY(belgeId ?? ""),
    queryFn: () => belgeDetayGetir(belgeId!),
    enabled: !!belgeId,
    staleTime: 30_000,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FİRMA LİSTESİ
// ═══════════════════════════════════════════════════════════════════════════════

export function useFirmaList() {
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  return useQuery({
    queryKey: QUERY_KEYS.CARI_FIRMA_LIST(sirketId ?? ""),
    queryFn: () => firmaListesiGetir(),
    enabled: !!sirketId,
    staleTime: 60_000,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVALIDATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export function useInvalidateCari() {
  const qc = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return {
    invalidateBelgeList: () =>
      sirketId &&
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CARI_BELGE_LIST(sirketId) }),

    invalidateBelgeDetay: (belgeId: string) =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CARI_BELGE_DETAY(belgeId) }),

    invalidateDosyaList: (belgeId: string) =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CARI_DOSYA_LIST(belgeId) }),

    invalidateFirmaList: () =>
      sirketId &&
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CARI_FIRMA_LIST(sirketId) }),

    invalidateKpi: () =>
      sirketId &&
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CARI_KPI(sirketId) }),

    invalidateOdemeList: (belgeId: string) =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CARI_ODEME_LIST(belgeId) }),

    /** Tüm cari cache'i temizler */
    invalidateAll: () =>
      qc.invalidateQueries({ queryKey: ["cari"] }),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FİRMA MUTATION'LAR
// ═══════════════════════════════════════════════════════════════════════════════

export function useFirmaEkle() {
  const { invalidateFirmaList } = useInvalidateCari();
  return useMutation({
    mutationFn: (payload: { ad: string; notlar?: string | null }) =>
      firmaEkle(payload),
    onSuccess: () => invalidateFirmaList(),
  });
}

export function useFirmaGuncelle() {
  const { invalidateFirmaList } = useInvalidateCari();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { ad: string; notlar?: string | null } }) =>
      firmaGuncelle(id, payload),
    onSuccess: () => invalidateFirmaList(),
  });
}

export function useFirmaSil() {
  const { invalidateFirmaList, invalidateBelgeList, invalidateKpi } = useInvalidateCari();
  return useMutation({
    mutationFn: (id: string) => firmaSil(id),
    onSuccess: () => {
      invalidateFirmaList();
      invalidateBelgeList();
      invalidateKpi();
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// BELGE MUTATION'LAR
// ═══════════════════════════════════════════════════════════════════════════════

export function useBelgeEkle() {
  const { invalidateBelgeList, invalidateKpi } = useInvalidateCari();
  return useMutation({
    mutationFn: (payload: Parameters<typeof belgeEkle>[0]) => belgeEkle(payload),
    onSuccess: () => {
      invalidateBelgeList();
      invalidateKpi();
    },
  });
}

export function useBelgeGuncelle() {
  const { invalidateBelgeList, invalidateBelgeDetay, invalidateKpi } = useInvalidateCari();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof belgeGuncelle>[1];
    }) => belgeGuncelle(id, payload),
    onSuccess: (_, { id }) => {
      invalidateBelgeList();
      invalidateBelgeDetay(id);
      invalidateKpi();
    },
  });
}

export function useBelgeNotlarGuncelle() {
  const { invalidateBelgeDetay } = useInvalidateCari();
  return useMutation({
    mutationFn: ({ id, notlar }: { id: string; notlar: string | null }) =>
      belgeNotlarGuncelle(id, notlar),
    onSuccess: (_, { id }) => invalidateBelgeDetay(id),
  });
}

export function useBelgeSil() {
  const { invalidateBelgeList, invalidateKpi } = useInvalidateCari();
  return useMutation({
    mutationFn: (id: string) => belgeSil(id),
    onSuccess: () => {
      invalidateBelgeList();
      invalidateKpi();
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÖDEME MUTATION'LAR
// ═══════════════════════════════════════════════════════════════════════════════

export function useOdemeEkle() {
  const { invalidateBelgeDetay, invalidateBelgeList, invalidateKpi } = useInvalidateCari();
  return useMutation({
    mutationFn: (payload: Parameters<typeof odemeEkle>[0]) => odemeEkle(payload),
    onSuccess: (_, payload) => {
      invalidateBelgeDetay(payload.belge_id);
      invalidateBelgeList();
      invalidateKpi();
    },
  });
}

export function useOdemeSil() {
  const { invalidateBelgeDetay, invalidateBelgeList, invalidateKpi } = useInvalidateCari();
  return useMutation({
    mutationFn: ({ odemeId, belgeId }: { odemeId: string; belgeId: string }) =>
      odemeSil(odemeId, belgeId),
    onSuccess: (_, { belgeId }) => {
      invalidateBelgeDetay(belgeId);
      invalidateBelgeList();
      invalidateKpi();
    },
  });
}

export function useTopluOdemeEkle() {
  const { invalidateBelgeList, invalidateKpi } = useInvalidateCari();
  return useMutation({
    mutationFn: (payload: Parameters<typeof topluOdemeEkle>[0]) =>
      topluOdemeEkle(payload),
    onSuccess: () => {
      invalidateBelgeList();
      invalidateKpi();
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOSYA MUTATION'LAR
// ═══════════════════════════════════════════════════════════════════════════════

export function useBelgeDosyaEkle() {
  const { invalidateBelgeDetay } = useInvalidateCari();
  return useMutation({
    mutationFn: (payload: Parameters<typeof belgeDosyaEkle>[0]) =>
      belgeDosyaEkle(payload),
    onSuccess: (_, payload) => invalidateBelgeDetay(payload.belge_id),
  });
}

export function useBelgeDosyaSil() {
  const { invalidateBelgeDetay } = useInvalidateCari();
  return useMutation({
    mutationFn: ({ dosyaId, belgeId }: { dosyaId: string; belgeId: string }) =>
      belgeDosyaSil(dosyaId, belgeId),
    onSuccess: (_, { belgeId }) => invalidateBelgeDetay(belgeId),
  });
}
