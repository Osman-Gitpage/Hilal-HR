"use client";

// ─── Tersane React Query Hooks ────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  tersaneSablonlariGetir,
  tersaneSablonOlustur,
  tersaneSablonGuncelle,
  tersaneSablonSil,
  ozelBelgeEkle,
  ozelBelgeSil,
  eksikKontrol,
  ozlukOlustur,
} from "@/app/actions/tersane";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════════════════════
// ŞABLON HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useTersaneSablonlar() {
  return useQuery({
    queryKey: ["tersane-sablonlar"],
    queryFn: () => tersaneSablonlariGetir(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTersaneSablonMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["tersane-sablonlar"] });

  const olustur = useMutation({
    mutationFn: tersaneSablonOlustur,
    onSuccess: (result) => {
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Şablon oluşturuldu.");
      invalidate();
    },
    onError: () => toast.error("Şablon oluşturma başarısız."),
  });

  const guncelle = useMutation({
    mutationFn: ({ id, params }: {
      id: string;
      params: Parameters<typeof tersaneSablonGuncelle>[1];
    }) => tersaneSablonGuncelle(id, params),
    onSuccess: (result) => {
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Şablon güncellendi.");
      invalidate();
    },
    onError: () => toast.error("Şablon güncelleme başarısız."),
  });

  const sil = useMutation({
    mutationFn: tersaneSablonSil,
    onSuccess: (result) => {
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Şablon silindi.");
      invalidate();
    },
    onError: () => toast.error("Şablon silme başarısız."),
  });

  return { olustur, guncelle, sil };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÖZEL BELGE HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useOzelBelgeMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["tersane-sablonlar"] });

  const ekle = useMutation({
    mutationFn: ozelBelgeEkle,
    onSuccess: (result) => {
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Belge eklendi.");
      invalidate();
    },
    onError: () => toast.error("Belge ekleme başarısız."),
  });

  const sil = useMutation({
    mutationFn: ozelBelgeSil,
    onSuccess: (result) => {
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Belge silindi.");
      invalidate();
    },
    onError: () => toast.error("Belge silme başarısız."),
  });

  return { ekle, sil };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EKSİK KONTROL + ÖZLÜK OLUŞTURMA
// ═══════════════════════════════════════════════════════════════════════════════

export function useEksikKontrol(personelId: string | undefined, sablonId: string | undefined) {
  return useQuery({
    queryKey: ["eksik-kontrol", personelId, sablonId],
    queryFn: () => eksikKontrol(personelId!, sablonId!),
    enabled: !!personelId && !!sablonId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useOzlukOlustur() {
  return useMutation({
    mutationFn: ({ personelId, sablonId }: { personelId: string; sablonId: string }) =>
      ozlukOlustur(personelId, sablonId),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      if (result.hatalar.length > 0) {
        toast.warning(`Özlük paketi oluşturuldu, ${result.hatalar.length} uyarı var.`);
      } else {
        toast.success("Özlük paketi hazır!");
      }
    },
    onError: () => toast.error("Özlük paketi oluşturulamadı."),
  });
}
