// ─── Cari Modülü — Saf Yardımcı Fonksiyonlar ────────────────────────────────
// Hiçbir DB / I/O bağımlılığı yoktur; her yerden import edilebilir.

import type { ParaBirimi, BelgeTur, OdemeDurumu, Odeme, OdemeYontem } from "@/types/cari";

// ── Para Birimi Formatla ─────────────────────────────────────────────────────

const formatCache: Partial<Record<ParaBirimi, Intl.NumberFormat>> = {};

/**
 * Tutarı yerelleştirilmiş para birimi formatında döndürür.
 * @example paraFormat(1234.5, "EUR") → "€1.234,50"
 */
export function paraFormat(tutar: number, pb: ParaBirimi): string {
  if (!formatCache[pb]) {
    formatCache[pb] = new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: pb,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return formatCache[pb]!.format(tutar);
}

// ── Ödeme Hesaplamaları ──────────────────────────────────────────────────────

/**
 * Tek bir ödemenin TL karşılığını hesaplar.
 * TL cinsinden belgeler için kur = 1 olduğundan tutar aynen döner.
 */
export function odemeTlKarsiligi(odeme: Odeme): number {
  return odeme.tutar * odeme.kur;
}

/**
 * Ödeme listesinin TL cinsinden toplamını hesaplar.
 */
export function odenenToplamTl(odemeler: Odeme[]): number {
  return odemeler.reduce((sum, o) => sum + odemeTlKarsiligi(o), 0);
}

/**
 * Belgenin kalan borcunu hesaplar (negatif olamaz).
 * @param belgeNormalTutar  belge.tutar (TL cinsinden)
 * @param odenenTl          SUM(odeme.tutar × odeme.kur)
 */
export function kalanHesapla(belgeNormalTutar: number, odenenTl: number): number {
  return Math.max(0, belgeNormalTutar - odenenTl);
}

// ── Ödeme Durumu ─────────────────────────────────────────────────────────────

/**
 * Belgenin ödeme durumunu hesaplar.
 *
 * Ödenmedi → SUM(ödemeler) == 0
 * Kısmi    → 0 < SUM(ödemeler) < belge.tutar
 * Ödendi   → SUM(ödemeler) >= belge.tutar
 */
export function calcOdemeDurumu(
  belgeTutar: number,
  odenenTl: number
): OdemeDurumu {
  if (belgeTutar <= 0) return "odendi";
  if (odenenTl <= 0) return "odenmedi";
  if (odenenTl >= belgeTutar) return "odendi";
  return "kismi";
}

// ── Gecikme Kontrolü ─────────────────────────────────────────────────────────

const GECIKME_GUN = 30;

/**
 * Belgenin gecikmiş olup olmadığını kontrol eder.
 * Koşul: bugün - belge.tarih > 30 gün AND durum != 'odendi'
 */
export function isGecikmiş(tarih: string, durum: OdemeDurumu): boolean {
  if (durum === "odendi") return false;
  const belgeGun = new Date(tarih).getTime();
  const bugun = Date.now();
  const farkGun = (bugun - belgeGun) / (1000 * 60 * 60 * 24);
  return farkGun > GECIKME_GUN;
}

// ── Belge No Üretimi ─────────────────────────────────────────────────────────

/**
 * Belge türüne ve sıra numarasına göre belge numarası önerisi üretir.
 * @example belgeNoOner("proforma", 3) → "PRF-003"
 * @example belgeNoOner("fatura", 12) → "FAT-012"
 * @example belgeNoOner("hesap_bilgisi", 1) → "HB-001"
 */
export function belgeNoOner(tur: BelgeTur, sira: number): string {
  const prefix: Record<BelgeTur, string> = {
    proforma: "PRF",
    fatura: "FAT",
    hesap_bilgisi: "HB",
  };
  const no = String(sira).padStart(3, "0");
  return `${prefix[tur]}-${no}`;
}

// ── Belge Türü Etiket ────────────────────────────────────────────────────────

/** Belge türünün Türkçe görüntü adını döndürür. */
export function belgeTypeName(tur: BelgeTur): string {
  const names: Record<BelgeTur, string> = {
    fatura: "Fatura",
    proforma: "Proforma",
    hesap_bilgisi: "Hesap Bilgisi",
  };
  return names[tur];
}

// ── Dosya Boyutu Formatla ────────────────────────────────────────────────────

/**
 * Bayt cinsinden dosya boyutunu okunabilir formata çevirir.
 * @example formatBoyut(1536000) → "1.5 MB"
 */
export function formatBoyut(byte: number | null): string {
  if (!byte || byte <= 0) return "—";
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${(byte / 1024).toFixed(1)} KB`;
  return `${(byte / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Tarih Yardımcıları ───────────────────────────────────────────────────────

/** YYYY-MM-DD formatındaki tarihi Türkçe görüntüye çevirir. */
export function tarihFormat(tarih: string): string {
  const d = new Date(tarih + "T00:00:00");
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Bugünün tarihini YYYY-MM-DD formatında döndürür. */
export function bugunYYYYMMDD(): string {
  return new Date().toISOString().split("T")[0];
}

// ── Ödeme Yöntemi Yardımcıları ────────────────────────────────────────────────

/** Ödeme yönteminin Türkçe etiketini döndürür. */
export function odemeYontemEtiket(yontem: OdemeYontem): string {
  switch (yontem) {
    case "banka":
      return "Banka";
    case "elden":
      return "Elden";
    case "cek":
      return "Çek";
    default:
      return yontem;
  }
}

/** Ödeme yönteminin UI rozet (badge) CSS sınıflarını döndürür. */
export function odemeYontemBadgeClass(yontem: OdemeYontem): string {
  switch (yontem) {
    case "banka":
      return "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400";
    case "elden":
      return "bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400";
    case "cek":
      return "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400";
    default:
      return "bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400";
  }
}

