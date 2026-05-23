/**
 * src/lib/excel/cariExport.ts
 *
 * Cari modülü Excel export:
 *   - Belge Listesi (proforma + fatura)
 *   - Gemi Listesi
 */

import {
  yeniWorkbook, sutunTaninmindanSheetEkle, workbookIndir,
  excelPara, excelTarih,
  type SutunTanimi, type SutunSeti,
} from "./exportUtils";

// ─────────────────────────────────────────────
// Belge Listesi
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BelgeSatir = Record<string, any>;

export const BELGE_TUM_SUTUNLAR: SutunTanimi<BelgeSatir>[] = [
  { baslik: "Belge No",      degerAl: (b) => b.belge_no,                                   genislik: 16 },
  { baslik: "Tür",           degerAl: (b) => b.tur === "proforma" ? "Proforma" : "Fatura",  genislik: 12 },
  { baslik: "Bağlantı",      degerAl: (b) => b.gemi_ad ?? b.firma_ad ?? "-",               genislik: 22 },
  { baslik: "Tür (Bağlantı)",degerAl: (b) => b.gemi_ad ? "Gemi" : b.firma_ad ? "Firma" : "-", genislik: 14 },
  { baslik: "Tarih",         degerAl: (b) => excelTarih(b.tarih),                           genislik: 14 },
  { baslik: "Para Birimi",   degerAl: (b) => b.para_birimi,                                 genislik: 12 },
  { baslik: "Genel Toplam",  degerAl: (b) => excelPara(b.genel_toplam),                     genislik: 16 },
  { baslik: "Ödeme Durumu",  degerAl: (b) => {
    const d = b.odeme_durumu;
    if (d === "odendi")   return "Ödendi";
    if (d === "kismi")    return "Kısmi";
    return "Ödenmedi";
  }, genislik: 14 },
  { baslik: "Ödenen",        degerAl: (b) => excelPara(b.odenen ?? 0),                      genislik: 14 },
  { baslik: "Kalan",         degerAl: (b) => excelPara(b.kalan ?? 0),                       genislik: 14 },
];

export const BELGE_SUTUN_SETLERI: SutunSeti<BelgeSatir>[] = [
  {
    id: "ozet",
    etiket: "Özet",
    sutunlar: BELGE_TUM_SUTUNLAR.filter((s) =>
      ["Belge No", "Tür", "Bağlantı", "Tarih", "Genel Toplam", "Ödeme Durumu", "Kalan"].includes(s.baslik)
    ),
  },
  {
    id: "tam",
    etiket: "Tam Tablo",
    sutunlar: BELGE_TUM_SUTUNLAR,
  },
];

export interface BelgeExportOptions {
  sutunlar?: SutunTanimi<BelgeSatir>[];
}

export function belgeListesiExport(
  veri: BelgeSatir[],
  options: BelgeExportOptions = {}
): void {
  const sutunlar = options.sutunlar ?? BELGE_TUM_SUTUNLAR;
  const wb = yeniWorkbook();
  sutunTaninmindanSheetEkle(wb, "Belge Listesi", sutunlar, veri);
  workbookIndir(wb, `Cari_Belge_Listesi_${new Date().toISOString().slice(0, 10)}`);
}

// ─────────────────────────────────────────────
// Gemi Listesi
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GemiSatir = Record<string, any>;

export const GEMI_TUM_SUTUNLAR: SutunTanimi<GemiSatir>[] = [
  { baslik: "Gemi Adı",       degerAl: (g) => g.ad,                              genislik: 22 },
  { baslik: "Firma",          degerAl: (g) => g.firma?.ad ?? "-",                genislik: 22 },
  { baslik: "IMO No",         degerAl: (g) => g.imo_no ?? "-",                   genislik: 14 },
  { baslik: "TRY Bakiye (₺)", degerAl: (g) => excelPara(
    Math.max(0, (g.ozet?.TRY?.alacak ?? 0) - (g.ozet?.TRY?.odenen ?? 0))
  ), genislik: 16 },
  { baslik: "EUR Bakiye (€)", degerAl: (g) => excelPara(
    Math.max(0, (g.ozet?.EUR?.alacak ?? 0) - (g.ozet?.EUR?.odenen ?? 0))
  ), genislik: 16 },
  { baslik: "USD Bakiye ($)", degerAl: (g) => excelPara(
    Math.max(0, (g.ozet?.USD?.alacak ?? 0) - (g.ozet?.USD?.odenen ?? 0))
  ), genislik: 16 },
];

export const GEMI_SUTUN_SETLERI: SutunSeti<GemiSatir>[] = [
  {
    id: "temel",
    etiket: "Temel Bilgiler",
    sutunlar: GEMI_TUM_SUTUNLAR.filter((s) =>
      ["Gemi Adı", "Firma", "IMO No"].includes(s.baslik)
    ),
  },
  {
    id: "tam",
    etiket: "Tam Tablo",
    sutunlar: GEMI_TUM_SUTUNLAR,
  },
];

export interface GemiExportOptions {
  sutunlar?: SutunTanimi<GemiSatir>[];
}

export function gemiListesiExport(
  veri: GemiSatir[],
  options: GemiExportOptions = {}
): void {
  const sutunlar = options.sutunlar ?? GEMI_TUM_SUTUNLAR;
  const wb = yeniWorkbook();
  sutunTaninmindanSheetEkle(wb, "Gemi Listesi", sutunlar, veri);
  workbookIndir(wb, `Gemi_Listesi_${new Date().toISOString().slice(0, 10)}`);
}
