"use client";

// ─── Evrak React Query Hooks ──────────────────────────────────────────────────
// Evrak kategorileri, personel evrakları, şirket evrakları, özet, mutations

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  evrakKategorileriGetir,
  evrakKategoriOlustur,
  evrakKategoriGuncelle,
  evrakKategoriSil,
  evrakKategoriSiralamaGuncelle,
  personelEvraklariGetir,
  sirketEvraklariGetir,
  evrakOlustur,
  evrakSil,
  evrakVersiyonSil,
  evrakOnayla,
  evrakReddet,
  evrakGuncelle,
  arsivdenGetir,
  evrakOzetiGetir,
  suresiYaklasanEvraklarGetir,
  evrakLoglarGetir,
} from "@/app/actions/evrak";
import type { EvrakKategoriTip } from "@/types/evrak";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════════════════════
// KATEGORİ HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/** Evrak kategorilerini getir (opsiyonel tip filtresi) */
export function useEvrakKategorileri(tip?: EvrakKategoriTip) {
  return useQuery({
    queryKey: ["evrak-kategorileri", tip ?? "tumu"],
    queryFn: () => evrakKategorileriGetir(tip),
    staleTime: 1000 * 60 * 5, // 5 dakika cache
  });
}

/** Kategori CRUD mutation'ları */
export function useEvrakKategoriMutations() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["evrak-kategorileri"] });
    qc.invalidateQueries({ queryKey: ["evrak-ozeti"] });
  };

  const olustur = useMutation({
    mutationFn: evrakKategoriOlustur,
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Kategori oluşturuldu.");
      invalidate();
    },
    onError: () => toast.error("Kategori oluşturma başarısız."),
  });

  const guncelle = useMutation({
    mutationFn: ({ id, params }: {
      id: string;
      params: Parameters<typeof evrakKategoriGuncelle>[1];
    }) => evrakKategoriGuncelle(id, params),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Kategori güncellendi.");
      invalidate();
    },
    onError: () => toast.error("Kategori güncelleme başarısız."),
  });

  const sil = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      evrakKategoriSil(id, force),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Kategori silindi.");
      invalidate();
    },
    onError: () => toast.error("Kategori silme başarısız."),
  });

  const siralamaGuncelle = useMutation({
    mutationFn: evrakKategoriSiralamaGuncelle,
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      invalidate();
    },
    onError: () => toast.error("Sıralama güncelleme başarısız."),
  });

  return { olustur, guncelle, sil, siralamaGuncelle };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVRAK HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/** Bir personelin evraklarını getir */
export function usePersonelEvraklar(
  personelId: string | undefined,
  donemId?: string
) {
  return useQuery({
    queryKey: ["personel-evraklar", personelId, donemId],
    queryFn: () => personelEvraklariGetir(personelId!, donemId),
    enabled: !!personelId,
    staleTime: 1000 * 60 * 2, // 2 dakika cache
  });
}

/** Şirket evraklarını getir */
export function useSirketEvraklar() {
  return useQuery({
    queryKey: ["sirket-evraklar"],
    queryFn: () => sirketEvraklariGetir(),
    staleTime: 1000 * 60 * 2,
  });
}

/** Evrak özet matrisi (ana sayfa tablosu) */
export function useEvrakOzeti() {
  return useQuery({
    queryKey: ["evrak-ozeti"],
    queryFn: () => evrakOzetiGetir(),
    staleTime: 1000 * 60 * 2,
  });
}

/** Süresi yaklaşan evraklar (KPI) */
export function useSuresiYaklasanlar() {
  return useQuery({
    queryKey: ["evrak-suresi-yaklasan"],
    queryFn: () => suresiYaklasanEvraklarGetir(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Evrak logları */
export function useEvrakLoglar(evrakId?: string) {
  return useQuery({
    queryKey: ["evrak-loglar", evrakId ?? "tumu"],
    queryFn: () => evrakLoglarGetir(evrakId),
    enabled: evrakId !== undefined,
    staleTime: 1000 * 60 * 1,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVRAK MUTATION HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/** Evrak CRUD ve işlem mutation'ları */
export function useEvrakMutations() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["personel-evraklar"] });
    qc.invalidateQueries({ queryKey: ["sirket-evraklar"] });
    qc.invalidateQueries({ queryKey: ["evrak-ozeti"] });
    qc.invalidateQueries({ queryKey: ["evrak-suresi-yaklasan"] });
    qc.invalidateQueries({ queryKey: ["evrak-loglar"] });
  };

  const olustur = useMutation({
    mutationFn: evrakOlustur,
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Evrak yüklendi.");
      invalidate();
    },
    onError: () => toast.error("Evrak yükleme başarısız."),
  });

  const guncelle = useMutation({
    mutationFn: ({ id, params }: {
      id: string;
      params: Parameters<typeof evrakGuncelle>[1];
    }) => evrakGuncelle(id, params),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Evrak güncellendi.");
      invalidate();
    },
    onError: () => toast.error("Evrak güncelleme başarısız."),
  });

  const sil = useMutation({
    mutationFn: evrakSil,
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Evrak silindi.");
      invalidate();
    },
    onError: () => toast.error("Evrak silme başarısız."),
  });

  const versiyonSil = useMutation({
    mutationFn: evrakVersiyonSil,
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Versiyon silindi.");
      invalidate();
    },
    onError: () => toast.error("Versiyon silme başarısız."),
  });

  const onayla = useMutation({
    mutationFn: evrakOnayla,
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Evrak onaylandı.");
      invalidate();
    },
    onError: () => toast.error("Onay işlemi başarısız."),
  });

  const reddet = useMutation({
    mutationFn: ({ id, sebep }: { id: string; sebep?: string }) =>
      evrakReddet(id, sebep),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Evrak reddedildi.");
      invalidate();
    },
    onError: () => toast.error("Red işlemi başarısız."),
  });

  return { olustur, guncelle, sil, versiyonSil, onayla, reddet };
}

/** Arşivden getir mutation */
export function useArsivdenGetir() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      evrakId,
      yeniDonemId,
    }: {
      evrakId: string;
      yeniDonemId: string;
    }) => arsivdenGetir(evrakId, yeniDonemId),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Evrak arşivden aktif döneme kopyalandı.");
      qc.invalidateQueries({ queryKey: ["personel-evraklar"] });
      qc.invalidateQueries({ queryKey: ["evrak-ozeti"] });
    },
    onError: () => toast.error("Arşivden getirme başarısız."),
  });
}
