import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  PARA_BIRIMI,
  PARA_LOCALE,
  PARA_BIRIMI_SEMBOL,
  TARIH_FORMAT,
  DONEM_FORMAT,
} from "@/lib/constants";

// ─────────────────────────────────────────────────────────────
// Para Formatlama
// ─────────────────────────────────────────────────────────────

/**
 * Sayıyı Türk Lirası formatında string'e çevirir
 * Örnek: 15000 → "₺15.000,00"
 */
export function formatPara(tutar: number): string {
  return new Intl.NumberFormat(PARA_LOCALE, {
    style: "currency",
    currency: PARA_BIRIMI,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(tutar);
}

/**
 * Sayıyı sembolsüz Türk Lirası formatında string'e çevirir
 * Örnek: 15000 → "15.000,00"
 */
export function formatParaSembolsuz(tutar: number): string {
  return new Intl.NumberFormat(PARA_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(tutar);
}

// ─────────────────────────────────────────────────────────────
// Tarih Formatlama
// ─────────────────────────────────────────────────────────────

/**
 * ISO tarih string'ini Türkçe formatına çevirir
 * Örnek: "2024-01-15" → "15.01.2024"
 */
export function formatTarih(isoTarih: string | null | undefined): string {
  if (!isoTarih) return "-";
  try {
    return format(parseISO(isoTarih), TARIH_FORMAT);
  } catch {
    return "-";
  }
}

/**
 * Yıl ve ay'ı Türkçe dönem formatına çevirir
 * Örnek: (2024, 1) → "Ocak 2024"
 */
export function formatDonem(yil: number, ay: number): string {
  const tarih = new Date(yil, ay - 1, 1);
  return format(tarih, DONEM_FORMAT, { locale: tr });
}

/**
 * Tarihi kısa Türkçe formatına çevirir
 * Örnek: "2024-01-15" → "15 Oca 2024"
 */
export function formatTarihKisa(isoTarih: string | null | undefined): string {
  if (!isoTarih) return "-";
  try {
    return format(parseISO(isoTarih), "d MMM yyyy", { locale: tr });
  } catch {
    return "-";
  }
}

// ─────────────────────────────────────────────────────────────
// Bordro Hesaplama Fonksiyonları
// ─────────────────────────────────────────────────────────────

/**
 * Saatlik ücret hesaplar
 * saatlik_ucret = maas_net / aylik_calisma_saati
 */
export function hesaplaSaatlikUcret(
  maasNet: number,
  aylikCalisma: number
): number {
  if (aylikCalisma <= 0) return 0;
  return maasNet / aylikCalisma;
}

/**
 * Hak ediş hesaplar
 * hak_edis = calisma_saati * saatlik_ucret
 */
export function hesaplaHakEdis(
  calismaSaati: number,
  saatlikUcret: number
): number {
  return calismaSaati * saatlikUcret;
}

/**
 * Mesai bedeli hesaplar (1x çarpan — fazla mesai primi yok)
 * mesai_bedeli = mesai_saati * saatlik_ucret
 */
export function hesaplaMesaiBedeli(
  mesaiSaati: number,
  saatlikUcret: number
): number {
  return mesaiSaati * saatlikUcret;
}

/**
 * Çalışma günü sayısını hesaplar
 * gun = calisma_saati / gunluk_saat (varsayılan: 8)
 */
export function hesaplaCalismaGunu(
  calismaSaati: number,
  gunlukSaat = 8
): number {
  if (gunlukSaat <= 0) return 0;
  return calismaSaati / gunlukSaat;
}

interface BordroGirdi {
  maasNet: number;
  calismaSaati: number;
  mesaiSaati: number;
  yol: number;
  yemek: number;
  prim: number;
  tazminat: number;
  senelikIzin: number;
  ekOdemelerToplam: number;
  banka: number;
  bes: number;
  avans: number;
  icra: number;
  iceriAvansKesinti: number;
  ekKesintilerToplam: number;
  aylikCalismaSaati: number;
}

interface BordroSonuc {
  saatlikUcret: number;
  hakEdis: number;
  mesaiBedeli: number;
  toplamOdeme: number;
  toplamKesinti: number;
  elden: number;
}

/**
 * Bordro kalemlerini hesaplar
 */
export function hesaplaBordro(girdi: BordroGirdi): BordroSonuc {
  const saatlikUcret = hesaplaSaatlikUcret(
    girdi.maasNet,
    girdi.aylikCalismaSaati
  );
  const hakEdis = hesaplaHakEdis(girdi.calismaSaati, saatlikUcret);
  const mesaiBedeli = hesaplaMesaiBedeli(girdi.mesaiSaati, saatlikUcret);

  const toplamOdeme =
    hakEdis +
    mesaiBedeli +
    girdi.yol +
    girdi.yemek +
    girdi.prim +
    girdi.tazminat +
    girdi.senelikIzin +
    girdi.ekOdemelerToplam;

  const toplamKesinti =
    girdi.banka +
    girdi.bes +
    girdi.avans +
    girdi.icra +
    girdi.iceriAvansKesinti +
    girdi.ekKesintilerToplam;

  const elden = toplamOdeme - toplamKesinti;

  return {
    saatlikUcret,
    hakEdis,
    mesaiBedeli,
    toplamOdeme,
    toplamKesinti,
    elden,
  };
}

/**
 * Banka ödeme sayfası için elden hesaplar
 * elden_bank = toplam_odeme - (banka + bes + tazminat + avans)
 */
export function hesaplaEldenBanka(
  toplamOdeme: number,
  banka: number,
  bes: number,
  tazminat: number,
  avans: number
): number {
  return toplamOdeme - (banka + bes + tazminat + avans);
}

// ─────────────────────────────────────────────────────────────
// Genel Yardımcı Fonksiyonlar
// ─────────────────────────────────────────────────────────────

/**
 * TC Kimlik numarasını maskeler
 * Örnek: "12345678901" → "123****901"
 */
export function maskTc(tc: string): string {
  if (!tc || tc.length !== 11) return tc;
  return `${tc.slice(0, 3)}****${tc.slice(-3)}`;
}

/**
 * TC Kimlik No algoritmasını doğrular.
 * - 11 hane, sadece rakam
 * - İlk hane 0 olamaz
 * - (tek haneler toplamı × 7 − çift haneler toplamı) mod 10 = 10. hane
 * - İlk 10 hane toplamı mod 10 = 11. hane
 * Geçerliyse "" (boş string), geçersizse hata mesajı döner.
 */
export function tcKimlikDogrula(tc: string): string {
  const s = tc?.trim() ?? "";
  if (!/^\d{11}$/.test(s)) return "TC Kimlik No 11 haneli sayı olmalıdır.";
  if (s[0] === "0") return "TC Kimlik No 0 ile başlayamaz.";

  const d = s.split("").map(Number);

  // 10. hane kontrolü (negatif modulo normalize edilir)
  const onuncuRaw = ((d[0] + d[2] + d[4] + d[6] + d[8]) * 7 - (d[1] + d[3] + d[5] + d[7])) % 10;
  const onuncu = onuncuRaw < 0 ? onuncuRaw + 10 : onuncuRaw;
  if (onuncu !== d[9]) return "Geçersiz TC Kimlik No.";

  // 11. hane kontrolü
  const onbirinci = (d[0] + d[1] + d[2] + d[3] + d[4] + d[5] + d[6] + d[7] + d[8] + d[9]) % 10;
  if (onbirinci !== d[10]) return "Geçersiz TC Kimlik No.";

  return "";
}

/**
 * Ad Soyad'ı birleştirir
 */
export function formatAdSoyad(ad: string, soyad: string): string {
  return `${ad} ${soyad}`.trim();
}

/**
 * Dönemin başlangıç tarihini döndürür (ISO)
 */
export function donemBaslangic(yil: number, ay: number): string {
  return new Date(yil, ay - 1, 1).toISOString().split("T")[0];
}

/**
 * Dönemin bitiş tarihini döndürür (ISO)
 */
export function donemBitis(yil: number, ay: number): string {
  return new Date(yil, ay, 0).toISOString().split("T")[0];
}

/**
 * Güvenli sayıya çevirme — NaN yerine 0 döner.
 * Form input'larından gelen unknown değerleri sayıya çevirir.
 */
export function num(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}
