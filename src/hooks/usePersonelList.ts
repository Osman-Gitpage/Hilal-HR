"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";
import { QUERY_KEYS } from "@/lib/constants";
import { useSirketStore } from "@/stores/sirketStore";

// ─────────────────────────────────────────────
// Personel listesi (aktif + arşiv)
// ─────────────────────────────────────────────

export type PersonelListeItem = {
  id: string;
  ad: string;
  soyad: string;
  tc: string;
  gorev_unvan: string | null;
  created_at: string;
  employment_periods: {
    id: string;
    baslangic_tarihi: string;
    bitis_tarihi: string | null;
    ayrilma_nedeni: string | null;
  }[];
  maas_gecmisi: {
    maas_net: number;
    gecerlilik_baslangic: string;
    gecerlilik_bitis: string | null;
  }[];
};

async function fetchPersonelList(sirketId: string): Promise<PersonelListeItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("personel")
    .select(
      `
      id, ad, soyad, tc, gorev_unvan, created_at,
      employment_periods (
        id, baslangic_tarihi, bitis_tarihi, ayrilma_nedeni
      ),
      maas_gecmisi (
        maas_net, gecerlilik_baslangic, gecerlilik_bitis
      )
    `
    )
    .eq("sirket_id", sirketId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PersonelListeItem[];
}

export function usePersonelList() {
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return useQuery({
    queryKey: QUERY_KEYS.PERSONEL_LIST(sirketId ?? ""),
    queryFn: () => fetchPersonelList(sirketId!),
    enabled: !!sirketId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────
// Personel invalidate (mutation sonrası)
// ─────────────────────────────────────────────
export function useInvalidatePersonelList() {
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);

  return () => {
    if (sirketId) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PERSONEL_LIST(sirketId),
      });
    }
  };
}

// ─────────────────────────────────────────────
// KPI: Bu ay yeni personel sayısı
// ─────────────────────────────────────────────
export function usePersonelKpi(liste: PersonelListeItem[]) {
  const bugun = new Date();
  const ayBaslangic = new Date(bugun.getFullYear(), bugun.getMonth(), 1);

  const aktifler = liste.filter((p) =>
    p.employment_periods.some((ep) => ep.bitis_tarihi === null)
  );

  const yeniBuAy = liste.filter((p) => {
    const aktifEp = p.employment_periods.find((ep) => ep.bitis_tarihi === null);
    if (!aktifEp) return false;
    return new Date(aktifEp.baslangic_tarihi) >= ayBaslangic;
  });

  return {
    toplamAktif: aktifler.length,
    yeniBuAy: yeniBuAy.length,
    toplamArsiv: liste.length - aktifler.length,
  };
}
