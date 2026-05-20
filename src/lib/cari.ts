// ─── Cari / Fatura Modülü — Yardımcı Fonksiyonlar ───────────────────────────
// Saf fonksiyonlar; DB veya I/O bağımlılığı yoktur.

import type { BelgeKalem, OdemeDurumu, ParaBirimi } from "@/types";

// ─────────────────────────────────────────────
// Kalem Hesaplamaları
// ─────────────────────────────────────────────

/** Bir kalemin net tutarını hesaplar: miktar × birim_fiyat − satır_iskonto */
export function kalemTutari(kalem: BelgeKalem): number {
  const brut = kalem.miktar * kalem.birim_fiyat;
  return Math.max(0, brut - (kalem.iskonto ?? 0));
}

/** Kalem listesinin ara toplamını hesaplar (iskonto uygulanmış) */
export function hesaplaToplam(kalemler: BelgeKalem[]): number {
  return kalemler.reduce((acc, k) => acc + kalemTutari(k), 0);
}

/**
 * Genel toplamı hesaplar (KDV dahil).
 * @param toplam     Ara toplam (kalemler toplamı)
 * @param iskonto    Belge geneli iskonto tutarı
 * @param kdvOrani   KDV yüzdesi (ör: 20 → %20). Undefined/0 ise KDV eklenmez.
 */
export function hesaplaGenelToplam(
  toplam: number,
  iskonto: number,
  kdvOrani?: number | null
): number {
  const matrah = Math.max(0, toplam - (iskonto ?? 0));
  if (!kdvOrani) return matrah;
  return Math.round(matrah * (1 + kdvOrani / 100) * 100) / 100;
}

/** KDV tutarını ayrı gösterir */
export function kdvTutari(matrah: number, kdvOrani: number): number {
  return Math.round(matrah * (kdvOrani / 100) * 100) / 100;
}

// ─────────────────────────────────────────────
// Ödeme Durumu
// ─────────────────────────────────────────────

/** Belgenin ödeme durumunu belirler */
export function odemeDurumu(
  genelToplam: number,
  odemeToplami: number
): OdemeDurumu {
  if (genelToplam <= 0) return "odendi";
  if (odemeToplami <= 0) return "odenmedi";
  if (odemeToplami >= genelToplam) return "odendi";
  return "kismi";
}

/** Kalan tutarı hesaplar (negatif olamaz) */
export function kalanTutar(genelToplam: number, odemeToplami: number): number {
  return Math.max(0, genelToplam - odemeToplami);
}

// ─────────────────────────────────────────────
// Para Birimi Formatla
// ─────────────────────────────────────────────

const formatCache: Partial<Record<ParaBirimi, Intl.NumberFormat>> = {};

export function paraFormat(tutar: number, paraBirimi: ParaBirimi): string {
  if (!formatCache[paraBirimi]) {
    formatCache[paraBirimi] = new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: paraBirimi,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return formatCache[paraBirimi]!.format(tutar);
}

// ─────────────────────────────────────────────
// Otomatik Belge No Üretimi
// ─────────────────────────────────────────────

/**
 * Belge numarası önerisi üretir.
 * Örnek: PRF-2026-0001 | FAT-2026-0042
 */
export function belgeNoOner(tur: "proforma" | "fatura", sira: number): string {
  const prefix = tur === "proforma" ? "PROFORMA" : "FATURA";
  const no = String(sira).padStart(3, "0");
  return `${prefix}${no}`;
}
