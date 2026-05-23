/**
 * src/lib/pdf/personelPdf.ts
 * Personel listesi PDF export
 */

import { yeniDoc, baslikEkle, tabloEkle, pdfBlobUrl, pdfIndir, excelDonemPdf } from "./pdfUtils";

interface PersonelSatir {
  ad: string;
  soyad: string;
  tc_kimlik_no?: string | null;
  gorev_unvan?: string | null;
  departman?: string | null;
  ise_giris_tarihi?: string | null;
  maas?: number | null;
  sgk_maasi?: number | null;
  telefon?: string | null;
  iban?: string | null;
  medeni_hal?: string | null;
  egitim_durumu?: string | null;
  [key: string]: unknown;
}

export async function personelPdfOlustur(
  satirlar: PersonelSatir[],
  yil: number,
  ay: number
): Promise<string> {
  const doc = await yeniDoc("portrait");
  const donem = excelDonemPdf(yil, ay);
  let y = baslikEkle(doc, "Personel Listesi", donem);

  const tableRows = satirlar.map((p, i) => ({
    sira: i + 1,
    adSoyad: `${p.ad} ${p.soyad}`,
    unvan: p.gorev_unvan ?? "-",
    departman: p.departman ?? "-",
    girisTarihi: p.ise_giris_tarihi
      ? new Date(p.ise_giris_tarihi).toLocaleDateString("tr-TR")
      : "-",
    telefon: p.telefon ?? "-",
  }));

  tabloEkle(
    doc,
    [
      { header: "#", dataKey: "sira", width: 10 },
      { header: "Ad Soyad", dataKey: "adSoyad", width: 50 },
      { header: "Unvan", dataKey: "unvan", width: 45 },
      { header: "Departman", dataKey: "departman", width: 35 },
      { header: "Giriş Tarihi", dataKey: "girisTarihi", width: 25 },
      { header: "Telefon", dataKey: "telefon", width: 30 },
    ],
    tableRows,
    y
  );

  return pdfBlobUrl(doc);
}

/** personelPdfOlustur alias — view entegrasyonlarında kısa isim */
export const personelPdfOnizle = personelPdfOlustur;

export async function personelPdfIndir(satirlar: PersonelSatir[], yil: number, ay: number): Promise<void> {
  const doc = await yeniDoc("portrait");
  const donem = excelDonemPdf(yil, ay);
  let y = baslikEkle(doc, "Personel Listesi", donem);

  const tableRows = satirlar.map((p, i) => ({
    sira: i + 1,
    adSoyad: `${p.ad} ${p.soyad}`,
    unvan: p.gorev_unvan ?? "-",
    departman: p.departman ?? "-",
    girisTarihi: p.ise_giris_tarihi
      ? new Date(p.ise_giris_tarihi).toLocaleDateString("tr-TR")
      : "-",
    telefon: p.telefon ?? "-",
  }));

  tabloEkle(
    doc,
    [
      { header: "#", dataKey: "sira", width: 10 },
      { header: "Ad Soyad", dataKey: "adSoyad", width: 50 },
      { header: "Unvan", dataKey: "unvan", width: 45 },
      { header: "Departman", dataKey: "departman", width: 35 },
      { header: "Giriş Tarihi", dataKey: "girisTarihi", width: 25 },
      { header: "Telefon", dataKey: "telefon", width: 30 },
    ],
    tableRows,
    y
  );

  pdfIndir(doc, `Personel_${yil}_${String(ay).padStart(2, "0")}`);
}
