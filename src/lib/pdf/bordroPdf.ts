/**
 * src/lib/pdf/bordroPdf.ts
 * Bordro/Maaş listesi PDF export
 */

import { yeniDoc, baslikEkle, tabloEkle, pdfBlobUrl, pdfIndir, excelDonemPdf } from "./pdfUtils";

interface BordroSatir {
  personel: { ad: string; soyad: string; gorev_unvan?: string | null };
  brut_maas?: number | null;
  net_maas?: number | null;
  banka?: number | null;
  elden?: number | null;
  sgk_maas?: number | null;
  toplam_odeme?: number | null;
  mesai_bedeli?: number | null;
  ikramiye?: number | null;
  kesinti_toplam?: number | null;
  [key: string]: unknown;
}

function fmt(val: number | null | undefined): string {
  if (val == null) return "-";
  return val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function _olustur(satirlar: BordroSatir[], yil: number, ay: number) {
  const doc = await yeniDoc("landscape");
  const donem = excelDonemPdf(yil, ay);
  const y = baslikEkle(doc, "Maaş Bordro Listesi", donem);

  const rows = satirlar.map((b, i) => ({
    sira: i + 1,
    adSoyad: `${b.personel.ad} ${b.personel.soyad}`,
    unvan: b.personel.gorev_unvan ?? "-",
    brutMaas: fmt(b.brut_maas),
    netMaas: fmt(b.net_maas),
    banka: fmt(b.banka),
    mesai: fmt(b.mesai_bedeli),
    ikramiye: fmt(b.ikramiye),
    kesinti: fmt(b.kesinti_toplam),
    toplam: fmt(b.toplam_odeme),
  }));

  tabloEkle(
    doc,
    [
      { header: "#", dataKey: "sira", width: 8 },
      { header: "Ad Soyad", dataKey: "adSoyad", width: 42 },
      { header: "Unvan", dataKey: "unvan", width: 32 },
      { header: "Brüt (₺)", dataKey: "brutMaas", width: 24 },
      { header: "Net (₺)", dataKey: "netMaas", width: 24 },
      { header: "Banka (₺)", dataKey: "banka", width: 24 },
      { header: "Mesai (₺)", dataKey: "mesai", width: 22 },
      { header: "İkramiye (₺)", dataKey: "ikramiye", width: 22 },
      { header: "Kesinti (₺)", dataKey: "kesinti", width: 22 },
      { header: "Toplam (₺)", dataKey: "toplam", width: 26 },
    ],
    rows,
    y,
    { fontSize: 8 }
  );

  return doc;
}

export async function bordroPdfOnizle(satirlar: BordroSatir[], yil: number, ay: number): Promise<string> {
  const doc = await _olustur(satirlar, yil, ay);
  return pdfBlobUrl(doc);
}

export async function bordroPdfIndir(satirlar: BordroSatir[], yil: number, ay: number): Promise<void> {
  const doc = await _olustur(satirlar, yil, ay);
  pdfIndir(doc, `Bordro_${yil}_${String(ay).padStart(2, "0")}`);
}
