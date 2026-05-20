/**
 * src/types/bordro-form.ts
 *
 * Bordro veri girişi formu için state ve action tipleri.
 * useBordroForm hook'u ve alt bileşenler bu tipleri kullanır.
 */

import type { BordroNot } from "@/supabase/app-types";

// ─── Ek Kalem (DB tabanlı) ───────────────────────────────────

/**
 * Tek bir ek ödeme veya kesinti kalemini temsil eder.
 * `_isNew`     → true ise henüz DB'ye yazılmamış (insert gerekir)
 * `_isDeleted` → true ise silinmek üzere işaretlenmiş (DB delete gerekir, UI'dan gizlenir)
 */
export interface EkKalemRow {
  /** DB uuid. Yeni kalemlerde `crypto.randomUUID()` ile üretilen geçici id. */
  id: string;
  ad: string;
  tutar: number;
  sira: number;
  _isNew?: boolean;
  _isDeleted?: boolean;
}

// ─── Form State ──────────────────────────────────────────────

/** Bordro veri girişi formunun tüm alanlarını temsil eder. */
export interface BordroFormState {
  // Ödemeler
  calismaSaati: number;
  mesaiSaati: number;
  yol: number;
  yemek: number;
  prim: number;
  tazminat: number;
  senelikIzin: number;
  ekOdemeler: EkKalemRow[];

  // Kesintiler
  banka: number;
  bes: number;
  avans: number;
  icra: number;
  iceriAvansKesinti: number;
  iceriAvansVerilen: number;
  ekKesintiler: EkKalemRow[];

  // Not & Bilgi
  yillikIzinGun: number;
  notlar: BordroNot[];
  aciklama: string;
}

// ─── Sabit: Başlangıç Değerleri ──────────────────────────────

/** Boş/yeni bordro için varsayılan form değerleri. */
export const INITIAL_FORM_STATE: BordroFormState = {
  calismaSaati: 0,
  mesaiSaati: 0,
  yol: 0,
  yemek: 0,
  prim: 0,
  tazminat: 0,
  senelikIzin: 0,
  ekOdemeler: [],
  banka: 0,
  bes: 0,
  avans: 0,
  icra: 0,
  iceriAvansKesinti: 0,
  iceriAvansVerilen: 0,
  ekKesintiler: [],
  yillikIzinGun: 0,
  notlar: [],
  aciklama: "",
};

// ─── Sayısal Alan Adları ─────────────────────────────────────

/** Form state'indeki tüm sayısal (number) alanların isimleri. */
export type BordroNumericField = {
  [K in keyof BordroFormState]: BordroFormState[K] extends number ? K : never;
}[keyof BordroFormState];
