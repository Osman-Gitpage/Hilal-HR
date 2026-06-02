/**
 * src/lib/excel/bankaExport.ts
 *
 * Banka Ödeme sayfası Excel export.
 * Sütunlar: Ad Soyad, Bordro Bankası, Fiili Banka, BES, Tazminat, Avans, Not, Elden
 */

import type { BankaOdemeSatiri } from "@/hooks/useMaasBordro";
import { bankaEldenHesaplaYeni } from "@/lib/utils/maasHesap";
import {
  yeniWorkbook, sutunTaninmindanSheetEkle, workbookIndir,
  excelPara, excelDonem,
  type SutunTanimi, type SutunSeti,
} from "./exportUtils";

// ─────────────────────────────────────────────
// Satır tipi (hesaplanmış elden dahil)
// ─────────────────────────────────────────────

type BankaSatir = BankaOdemeSatiri & { _elden: number };

function bankaHazirla(b: BankaOdemeSatiri): BankaSatir {
  const elden = bankaEldenHesaplaYeni(b.bordro_elden ?? 0, b.banka, b.bordro_banka, b.tazminat, b.avans);
  return { ...b, _elden: elden };
}

// ─────────────────────────────────────────────
// Tüm Sütunlar
// ─────────────────────────────────────────────

export const BANKA_TUM_SUTUNLAR: SutunTanimi<BankaSatir>[] = [
  { baslik: "Ad Soyad",          degerAl: (b) => `${b.personel.ad} ${b.personel.soyad}`,  genislik: 22 },
  { baslik: "Unvan",             degerAl: (b) => b.personel.gorev_unvan ?? "-",            genislik: 18 },
  { baslik: "Toplam Ödeme (₺)", degerAl: (b) => excelPara(b.toplam_odeme),               genislik: 16 },
  { baslik: "Bordro Bankası (₺)",degerAl: (b) => excelPara(b.bes_bordro),                 genislik: 17 },
  { baslik: "Fiili Banka (₺)",  degerAl: (b) => excelPara(b.banka),                      genislik: 15 },
  { baslik: "BES (₺)",          degerAl: (b) => excelPara(b.bes_bordro),                  genislik: 12 },
  { baslik: "Tazminat (₺)",     degerAl: (b) => excelPara(b.tazminat),                   genislik: 14 },
  { baslik: "Avans (₺)",        degerAl: (b) => excelPara(b.avans),                      genislik: 12 },
  { baslik: "Not",               degerAl: (b) => b.odeme_not ?? "",                        genislik: 22 },
  { baslik: "Elden (₺)",        degerAl: (b) => excelPara(b._elden),                     genislik: 14 },
  { baslik: "Kayıt Durumu",     degerAl: (b) => b.kayitli ? "Kayıtlı" : "Taslak",        genislik: 14 },
];

// ─────────────────────────────────────────────
// Sabit Sütun Setleri
// ─────────────────────────────────────────────

export const BANKA_SUTUN_SETLERI: SutunSeti<BankaSatir>[] = [
  {
    id: "ozet",
    etiket: "Özet (Elden)",
    sutunlar: BANKA_TUM_SUTUNLAR.filter((s) =>
      ["Ad Soyad", "Fiili Banka (₺)", "BES (₺)", "Tazminat (₺)", "Avans (₺)", "Elden (₺)"].includes(s.baslik)
    ),
  },
  {
    id: "tam",
    etiket: "Tam Tablo",
    sutunlar: BANKA_TUM_SUTUNLAR,
  },
];

// ─────────────────────────────────────────────
// Export Fonksiyonu
// ─────────────────────────────────────────────

export interface BankaExportOptions {
  sutunlar?: SutunTanimi<BankaSatir>[];
  yil: number;
  ay: number;
}

export function bankaOdemeExport(
  veri: BankaOdemeSatiri[],
  options: BankaExportOptions
): void {
  const { yil, ay } = options;
  const sutunlar = options.sutunlar ?? BANKA_TUM_SUTUNLAR;
  const donem = excelDonem(yil, ay);

  const satirlar = veri.map(bankaHazirla);

  const wb = yeniWorkbook();
  sutunTaninmindanSheetEkle(wb, donem, sutunlar, satirlar);
  workbookIndir(wb, `Banka_Odeme_${yil}_${String(ay).padStart(2, "0")}`);
}

export type { BankaSatir };
