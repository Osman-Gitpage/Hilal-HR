/**
 * src/lib/excel/exportUtils.ts
 *
 * xlsx (SheetJS) tabanlı temel yardımcı fonksiyonlar.
 * Tüm modül export fonksiyonları bu dosyayı kullanır.
 */

import * as XLSX from "xlsx";

// ─────────────────────────────────────────────
// Tipler
// ─────────────────────────────────────────────

/** Tek bir sütun tanımı */
export interface SutunTanimi<T = Record<string, unknown>> {
  /** Excel'de gösterilecek başlık */
  baslik: string;
  /** Satır verisinden değer üreten fonksiyon */
  degerAl: (satir: T) => string | number | null | undefined;
  /** Excel sütun genişliği (karakter) */
  genislik?: number;
  /** Sayısal format kodu (ör: "#,##0.00") */
  format?: string;
}

/** Sabit sütun seti tanımı */
export interface SutunSeti<T = Record<string, unknown>> {
  id: string;
  etiket: string;
  sutunlar: SutunTanimi<T>[];
}

// ─────────────────────────────────────────────
// Workbook İşlemleri
// ─────────────────────────────────────────────

/** Boş bir workbook oluşturur */
export function yeniWorkbook(): XLSX.WorkBook {
  return XLSX.utils.book_new();
}

/**
 * Workbook'a sheet ekler.
 * @param wb       Hedef workbook
 * @param sheetAdi Sheet adı (max 31 karakter)
 * @param basliklar Sütun başlıkları
 * @param satirlar  Satır verileri (2D dizi veya obje dizisi)
 * @param sutunGenislikleri Opsiyonel sütun genişlikleri
 */
export function sheetEkle(
  wb: XLSX.WorkBook,
  sheetAdi: string,
  basliklar: string[],
  satirlar: (string | number | null | undefined)[][],
  sutunGenislikleri?: number[]
): void {
  const wsData = [basliklar, ...satirlar];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Sütun genişlikleri
  if (sutunGenislikleri?.length) {
    ws["!cols"] = sutunGenislikleri.map((w) => ({ wch: w }));
  } else {
    // Otomatik genişlik: başlık uzunluğuna göre
    ws["!cols"] = basliklar.map((b) => ({ wch: Math.max(b.length + 2, 10) }));
  }

  // Üst satırı dondur (başlık sabit)
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  const safeSheetAdi = sheetAdi.slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetAdi);
}

/**
 * Workbook'u .xlsx olarak indirir.
 * Dosya adı otomatik olarak ".xlsx" uzantısı alır.
 */
export function workbookIndir(wb: XLSX.WorkBook, dosyaAdi: string): void {
  const ad = dosyaAdi.endsWith(".xlsx") ? dosyaAdi : `${dosyaAdi}.xlsx`;
  XLSX.writeFile(wb, ad, { bookType: "xlsx", type: "binary" });
}

// ─────────────────────────────────────────────
// Sütun Tanımından Sheet Oluşturma
// ─────────────────────────────────────────────

/**
 * SutunTanimi dizisi + veri listesinden sheet oluşturur ve workbook'a ekler.
 */
export function sutunTaninmindanSheetEkle<T>(
  wb: XLSX.WorkBook,
  sheetAdi: string,
  sutunlar: SutunTanimi<T>[],
  veri: T[],
  altSatirlar?: (string | number | null | undefined)[][]
): void {
  const basliklar = sutunlar.map((s) => s.baslik);
  const satirlar = veri.map((satir) =>
    sutunlar.map((s) => {
      const deger = s.degerAl(satir);
      return deger ?? "";
    })
  );

  // Alt satırlar (legend, notlar vb.)
  const tumSatirlar = altSatirlar
    ? [...satirlar, [], ...altSatirlar]
    : satirlar;

  const wsData = [basliklar, ...tumSatirlar];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Sütun genişlikleri
  ws["!cols"] = sutunlar.map((s) => ({
    wch: s.genislik ?? Math.max(s.baslik.length + 2, 10),
  }));

  // Başlık satırını dondur
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  const safeAd = sheetAdi.slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeAd);
}

// ─────────────────────────────────────────────
// Format Yardımcıları
// ─────────────────────────────────────────────

/** Sayıyı para formatında string'e çevirir (₺15.000,00) */
export function excelPara(tutar: number | string | null | undefined): number {
  const n = Number(tutar ?? 0);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

/** ISO tarih string'ini dd.MM.yyyy formatına çevirir */
export function excelTarih(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  } catch {
    return "-";
  }
}

/** Yıl + ay'dan dönem string'i oluşturur */
export const AY_ADLARI_EXCEL = [
  "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function excelDonem(yil: number, ay: number): string {
  return `${AY_ADLARI_EXCEL[ay] ?? ay} ${yil}`;
}

/** Sayıyı güvenli şekilde number'a çevirir, hatalıysa 0 döner */
export function sayi(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}
