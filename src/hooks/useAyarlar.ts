"use client";

import { useQuery } from "@tanstack/react-query";
import { ayarlariGetir } from "@/app/actions/ayarlar";
import { VARSAYILAN_AYLIK_CALISMA_SAATI, VARSAYILAN_GUNLUK_CALISMA_SAATI } from "@/lib/constants";

export type Ayarlar = {
  id: string | null;
  sirket_id: string;
  gunluk_calisma_saati: number;
  aylik_calisma_saati: number;
};

export function useAyarlar() {
  return useQuery<Ayarlar>({
    queryKey: ["ayarlar"],
    queryFn: () => ayarlariGetir(),
    staleTime: 1000 * 60 * 5, // 5 dakika cache
    placeholderData: {
      id: null,
      sirket_id: "",
      gunluk_calisma_saati: VARSAYILAN_GUNLUK_CALISMA_SAATI,
      aylik_calisma_saati: VARSAYILAN_AYLIK_CALISMA_SAATI,
    },
  });
}
