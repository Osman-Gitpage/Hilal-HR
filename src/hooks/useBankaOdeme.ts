"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";
import { QUERY_KEYS } from "@/lib/constants";
import { useSirketStore } from "@/stores/sirketStore";
import type { BankaOdeme } from "@/supabase/app-types";

export type BankaOdemeItem = BankaOdeme & {
  personel: { id: string; ad: string; soyad: string };
  maas_bordro: { toplam_odeme: number; bes: number } | null;
};

async function fetchDonemBankaOdeme(
  sirketId: string,
  yil: number,
  ay: number
): Promise<BankaOdemeItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("banka_odeme")
    .select(
      `
      *,
      personel ( id, ad, soyad ),
      maas_bordro ( toplam_odeme, bes )
    `
    )
    .eq("sirket_id", sirketId)
    .eq("donem_yil", yil)
    .eq("donem_ay", ay);

  if (error) throw new Error(error.message);
  return (data ?? []) as BankaOdemeItem[];
}

export function useDonemBankaOdeme(yil: number, ay: number) {
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useQuery({
    queryKey: QUERY_KEYS.BANKA_ODEME(sirketId ?? "", yil, ay),
    queryFn: () => fetchDonemBankaOdeme(sirketId!, yil, ay),
    enabled: !!sirketId,
    staleTime: 30_000,
  });
}
