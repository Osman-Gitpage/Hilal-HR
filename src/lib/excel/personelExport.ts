/**
 * src/lib/excel/personelExport.ts
 *
 * Personel listesi Excel export fonksiyonları.
 * Sabit sütun setleri + serbest sütun seçimi destekler.
 */

import type { PersonelListeItem } from "@/hooks/usePersonelList";
import {
  yeniWorkbook, sutunTaninmindanSheetEkle, workbookIndir,
  excelTarih, excelPara, excelDonem,
  type SutunTanimi, type SutunSeti,
} from "./exportUtils";

// ─────────────────────────────────────────────
// Yardımcılar
// ─────────────────────────────────────────────

function aktifMi(p: PersonelListeItem): boolean {
  return p.employment_periods.some((ep) => ep.bitis_tarihi === null);
}

function iseGirisTarihi(p: PersonelListeItem): string | null {
  return (
    p.employment_periods.find((ep) => ep.bitis_tarihi === null)
      ?.baslangic_tarihi ?? null
  );
}

function istenCikisTarihi(p: PersonelListeItem): string | null {
  return (
    p.employment_periods
      .filter((ep) => ep.bitis_tarihi !== null)
      .sort((a, b) =>
        (b.bitis_tarihi ?? "").localeCompare(a.bitis_tarihi ?? "")
      )[0]?.bitis_tarihi ?? null
  );
}

function aktifMaas(p: PersonelListeItem): number | null {
  const bulut = p.maas_gecmisi.find((m) => m.gecerlilik_bitis === null);
  return bulut?.maas_net ?? null;
}

// ─────────────────────────────────────────────
// Tüm Olası Sütunlar
// ─────────────────────────────────────────────

export const PERSONEL_TUM_SUTUNLAR: SutunTanimi<PersonelListeItem>[] = [
  { baslik: "Ad",            degerAl: (p) => p.ad,                            genislik: 15 },
  { baslik: "Soyad",         degerAl: (p) => p.soyad,                         genislik: 15 },
  { baslik: "TC Kimlik No",  degerAl: (p) => p.tc,                            genislik: 14 },
  { baslik: "Görev / Unvan", degerAl: (p) => p.gorev_unvan ?? "-",            genislik: 20 },
  { baslik: "İşe Giriş",    degerAl: (p) => excelTarih(iseGirisTarihi(p)),   genislik: 14 },
  { baslik: "İşten Çıkış",  degerAl: (p) => excelTarih(istenCikisTarihi(p)), genislik: 14 },
  { baslik: "Durum",         degerAl: (p) => (aktifMi(p) ? "Aktif" : "Arşiv"), genislik: 10 },
  { baslik: "Maaş Net (₺)", degerAl: (p) => excelPara(aktifMaas(p)),         genislik: 16 },
  { baslik: "Ayrılma Nedeni",
    degerAl: (p) =>
      p.employment_periods.find((ep) => ep.bitis_tarihi !== null)
        ?.ayrilma_nedeni ?? "-",
    genislik: 20,
  },
];

// ─────────────────────────────────────────────
// Sabit Sütun Setleri
// ─────────────────────────────────────────────

export const PERSONEL_SUTUN_SETLERI: SutunSeti<PersonelListeItem>[] = [
  {
    id: "temel",
    etiket: "Temel Bilgiler",
    sutunlar: PERSONEL_TUM_SUTUNLAR.filter((s) =>
      ["Ad", "Soyad", "Görev / Unvan", "Durum"].includes(s.baslik)
    ),
  },
  {
    id: "tam",
    etiket: "Tam Bilgi",
    sutunlar: PERSONEL_TUM_SUTUNLAR,
  },
  {
    id: "bordro",
    etiket: "Bordro İçin",
    sutunlar: PERSONEL_TUM_SUTUNLAR.filter((s) =>
      ["Ad", "Soyad", "TC Kimlik No", "İşe Giriş", "Maaş Net (₺)"].includes(s.baslik)
    ),
  },
];

// ─────────────────────────────────────────────
// Export Fonksiyonu
// ─────────────────────────────────────────────

export interface PersonelExportOptions {
  /** Kullanılacak sütunlar — undefined ise "tam" set */
  sutunlar?: SutunTanimi<PersonelListeItem>[];
  /** Yalnızca aktif mi, tümü mü */
  sadecAktif?: boolean;
}

export function personelListesiExport(
  veri: PersonelListeItem[],
  options: PersonelExportOptions = {}
): void {
  const sutunlar = options.sutunlar ?? PERSONEL_TUM_SUTUNLAR;
  const filtreli = options.sadecAktif
    ? veri.filter(aktifMi)
    : veri;

  const wb = yeniWorkbook();
  sutunTaninmindanSheetEkle(wb, "Personel Listesi", sutunlar, filtreli);
  workbookIndir(wb, `Personel_Listesi_${new Date().toISOString().slice(0, 10)}`);
}
