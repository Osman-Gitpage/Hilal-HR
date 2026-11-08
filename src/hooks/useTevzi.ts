"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { useSirketStore } from "@/stores/sirketStore";
import {
  tevziKaydet,
  tevziGetir,
  oncekiGunTevziGetir,
  tevziListesiGetir,
} from "@/app/actions/tevzi";
import type { TevziSatir, TevziKayit } from "@/app/actions/tevzi";

export type { TevziSatir, TevziKayit };

// ─── Belirli Tarih Kaydı ──────────────────────────────────────────────────────

export function useTevziKayit(tarih: string) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useQuery({
    queryKey: QUERY_KEYS.TEVZI_KAYIT(sirketId ?? "", tarih),
    queryFn: () => tevziGetir(tarih),
    enabled: !!sirketId && !!tarih,
    staleTime: 60_000,
  });
}

// ─── Önceki Gün Kaydı ────────────────────────────────────────────────────────

export function useTevziOncekiGun() {
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useQuery({
    queryKey: QUERY_KEYS.TEVZI_ONCEKI(sirketId ?? ""),
    queryFn: () => oncekiGunTevziGetir(),
    enabled: !!sirketId,
    staleTime: 5 * 60_000,
  });
}

// ─── Son 30 Gün Liste ─────────────────────────────────────────────────────────

export function useTevziListesi() {
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useQuery({
    queryKey: QUERY_KEYS.TEVZI_LISTESI(sirketId ?? ""),
    queryFn: () => tevziListesiGetir(),
    enabled: !!sirketId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

// ─── Kaydet Mutation ──────────────────────────────────────────────────────────

export function useTevziKaydet() {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useMutation({
    mutationFn: ({ tarih, satirlar }: { tarih: string; satirlar: TevziSatir[] }) =>
      tevziKaydet(tarih, satirlar),
    onSuccess: (_, { tarih }) => {
      if (sirketId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.TEVZI_KAYIT(sirketId, tarih),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.TEVZI_LISTESI(sirketId),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.TEVZI_ONCEKI(sirketId),
        });
      }
    },
  });
}
