/**
 * src/supabase/app-types.ts
 *
 * Uygulama genelinde kullanılan named type alias'lar.
 * types.ts'i değiştirmeden Supabase CLI regenerate'e dayanıklı.
 *
 * Kullanım:
 *   import type { Personel, EkKalem } from "@/supabase/app-types";
 */

import type { Tables, TablesInsert, TablesUpdate } from "./types";

// ─── Tablo Row type'ları ──────────────────────────────────────────
export type Personel         = Tables<"personel">;
export type MaasGecmisi      = Tables<"maas_gecmisi">;
export type EmploymentPeriod = Tables<"employment_periods">;
export type MaasBordro       = Tables<"maas_bordro">;
export type BankaOdeme       = Tables<"banka_odeme">;
export type Proje            = Tables<"proje">;
export type Sirket           = Tables<"sirketler">;

// ─── Insert / Update type'ları ────────────────────────────────────
export type PersonelInsert   = TablesInsert<"personel">;
export type PersonelUpdate   = TablesUpdate<"personel">;
export type MaasBordroInsert = TablesInsert<"maas_bordro">;
export type MaasBordroUpdate = TablesUpdate<"maas_bordro">;
export type BankaOdemeInsert = TablesInsert<"banka_odeme">;
export type BankaOdemeUpdate = TablesUpdate<"banka_odeme">;
export type BordroEkKalem       = Tables<"bordro_ek_kalem">;
export type BordroEkKalemInsert = TablesInsert<"bordro_ek_kalem">;
export type BordroEkKalemUpdate = TablesUpdate<"bordro_ek_kalem">;

// ─── JSON alanlar için özel interface'ler ─────────────────────────
/** @deprecated maas_bordro.ek_odemeler / ek_kesintiler JSON — T0.4 sonrası kaldırılacak */
export interface EkKalem {
  ad: string;
  tutar: number;
  [key: string]: string | number | boolean | null | undefined;
}

/** maas_bordro.notlar JSON array elemanı */
export interface BordroNot {
  metin: string;
  [key: string]: string | number | boolean | null | undefined;
}

// ─── Cari Modülü Tablo Tipleri ────────────────────────────────────────────────
export type Belge          = Tables<"belge">;
export type BelgeDosyaRow  = Tables<"belge_dosya">;
export type OdemeRow       = Tables<"odeme">;
export type FirmaRow       = Tables<"firma">;

export type BelgeInsert    = TablesInsert<"belge">;
export type BelgeUpdate    = TablesUpdate<"belge">;
export type OdemeInsert    = TablesInsert<"odeme">;
export type OdemeUpdate    = TablesUpdate<"odeme">;
export type BelgeDosyaInsert = TablesInsert<"belge_dosya">;
export type FirmaInsert    = TablesInsert<"firma">;
export type FirmaUpdate    = TablesUpdate<"firma">;

// ─── Evrak Modülü Tablo Tipleri ───────────────────────────────────────────────
export type EvrakKategoriRow      = Tables<"evrak_kategori">;
export type EvrakKategoriInsert   = TablesInsert<"evrak_kategori">;
export type EvrakKategoriUpdate   = TablesUpdate<"evrak_kategori">;
export type EvrakRow              = Tables<"evrak">;
export type EvrakInsert           = TablesInsert<"evrak">;
export type EvrakUpdate           = TablesUpdate<"evrak">;
export type EvrakLogRow           = Tables<"evrak_log">;
export type EvrakLogInsert        = TablesInsert<"evrak_log">;
export type TersaneSablonRow      = Tables<"tersane_sablon">;
export type TersaneSablonInsert   = TablesInsert<"tersane_sablon">;
export type TersaneSablonUpdate   = TablesUpdate<"tersane_sablon">;
export type TersaneOzelBelgeRow   = Tables<"tersane_ozel_belge">;
export type TersaneOzelBelgeInsert = TablesInsert<"tersane_ozel_belge">;
export type TersaneOzelBelgeUpdate = TablesUpdate<"tersane_ozel_belge">;
