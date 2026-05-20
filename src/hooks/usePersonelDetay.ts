"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";
import { QUERY_KEYS } from "@/lib/constants";
import type { Personel, EmploymentPeriod, MaasGecmisi } from "@/supabase/app-types";

// ─────────────────────────────────────────────
// Personel Detay
// ─────────────────────────────────────────────
async function fetchPersonelDetay(personelId: string): Promise<Personel> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("personel")
    .select("*")
    .eq("id", personelId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export function usePersonelDetay(personelId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.PERSONEL(personelId ?? ""),
    queryFn: () => fetchPersonelDetay(personelId!),
    enabled: !!personelId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────
// Çalışma Geçmişi
// ─────────────────────────────────────────────
async function fetchEmploymentPeriods(
  personelId: string
): Promise<EmploymentPeriod[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("employment_periods")
    .select("*")
    .eq("personel_id", personelId)
    .order("baslangic_tarihi", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useEmploymentPeriods(personelId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.EMPLOYMENT_PERIODS(personelId ?? ""),
    queryFn: () => fetchEmploymentPeriods(personelId!),
    enabled: !!personelId,
    staleTime: 60_000,
  });
}

// ─────────────────────────────────────────────
// Maaş Geçmişi
// ─────────────────────────────────────────────
async function fetchMaasGecmisi(personelId: string): Promise<MaasGecmisi[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("maas_gecmisi")
    .select("*")
    .eq("personel_id", personelId)
    .order("gecerlilik_baslangic", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export function useMaasGecmisi(personelId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.MAAS_GECMISI(personelId ?? ""),
    queryFn: () => fetchMaasGecmisi(personelId!),
    enabled: !!personelId,
    staleTime: 60_000,
  });
}

// ─────────────────────────────────────────────
// Aktif maaş (gecerlilik_bitis = null)
// ─────────────────────────────────────────────
export function useAktifMaas(personelId: string | null) {
  const { data: gecmis } = useMaasGecmisi(personelId);
  return gecmis?.find((m) => m.gecerlilik_bitis === null) ?? null;
}
