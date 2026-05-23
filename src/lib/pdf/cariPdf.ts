/**
 * src/lib/pdf/cariPdf.ts
 * Belge Listesi ve Gemi Listesi PDF export
 */

import { yeniDoc, baslikEkle, tabloEkle, pdfBlobUrl, pdfIndir, excelDonemPdf } from "./pdfUtils";

function fmt(val: number | null | undefined): string {
  if (val == null) return "-";
  return val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function tarihFmt(val: string | null | undefined): string {
  if (!val) return "-";
  return new Date(val).toLocaleDateString("tr-TR");
}

// ─────────────────────────────────────────────
// Belge Listesi
// ─────────────────────────────────────────────

interface BelgeSatir {
  belge_no?: string | null;
  belge_tarihi?: string | null;
  vade_tarihi?: string | null;
  cari_adi?: string | null;
  tutar?: number | null;
  kalan?: number | null;
  durum?: string | null;
  aciklama?: string | null;
  [key: string]: unknown;
}

async function _belgeOlustur(satirlar: BelgeSatir[], yil: number, ay: number) {
  const doc = await yeniDoc("landscape");
  const donem = excelDonemPdf(yil, ay);
  const y = baslikEkle(doc, "Belge Listesi", donem);

  const rows = satirlar.map((b, i) => ({
    sira: i + 1,
    belgeNo: b.belge_no ?? "-",
    belgeTarihi: tarihFmt(b.belge_tarihi),
    vadeTarihi: tarihFmt(b.vade_tarihi),
    cariAdi: b.cari_adi ?? "-",
    tutar: fmt(b.tutar),
    kalan: fmt(b.kalan),
    durum: b.durum ?? "-",
    aciklama: b.aciklama ?? "-",
  }));

  tabloEkle(
    doc,
    [
      { header: "#", dataKey: "sira", width: 8 },
      { header: "Belge No", dataKey: "belgeNo", width: 25 },
      { header: "Tarih", dataKey: "belgeTarihi", width: 22 },
      { header: "Vade", dataKey: "vadeTarihi", width: 22 },
      { header: "Cari Adı", dataKey: "cariAdi", width: 45 },
      { header: "Tutar (₺)", dataKey: "tutar", width: 28 },
      { header: "Kalan (₺)", dataKey: "kalan", width: 28 },
      { header: "Durum", dataKey: "durum", width: 22 },
      { header: "Açıklama", dataKey: "aciklama", width: 40 },
    ],
    rows,
    y,
    { fontSize: 8 }
  );

  return doc;
}

export async function belgePdfOnizle(satirlar: BelgeSatir[], yil: number, ay: number): Promise<string> {
  return pdfBlobUrl(await _belgeOlustur(satirlar, yil, ay));
}

export async function belgePdfIndir(satirlar: BelgeSatir[], yil: number, ay: number): Promise<void> {
  pdfIndir(await _belgeOlustur(satirlar, yil, ay), `Belgeler_${yil}_${String(ay).padStart(2, "0")}`);
}

// ─────────────────────────────────────────────
// Gemi / Cari Listesi
// ─────────────────────────────────────────────

interface CariSatir {
  ad?: string | null;
  kod?: string | null;
  telefon?: string | null;
  email?: string | null;
  adres?: string | null;
  bakiye?: number | null;
  [key: string]: unknown;
}

async function _cariOlustur(satirlar: CariSatir[], yil: number, ay: number) {
  const doc = await yeniDoc("portrait");
  const donem = excelDonemPdf(yil, ay);
  const y = baslikEkle(doc, "Cari / Gemi Listesi", donem);

  const rows = satirlar.map((c, i) => ({
    sira: i + 1,
    ad: c.ad ?? "-",
    kod: c.kod ?? "-",
    telefon: c.telefon ?? "-",
    email: c.email ?? "-",
    bakiye: fmt(c.bakiye),
  }));

  tabloEkle(
    doc,
    [
      { header: "#", dataKey: "sira", width: 10 },
      { header: "Ad", dataKey: "ad", width: 55 },
      { header: "Kod", dataKey: "kod", width: 25 },
      { header: "Telefon", dataKey: "telefon", width: 30 },
      { header: "E-posta", dataKey: "email", width: 45 },
      { header: "Bakiye (₺)", dataKey: "bakiye", width: 28 },
    ],
    rows,
    y
  );

  return doc;
}

export async function cariPdfOnizle(satirlar: CariSatir[], yil: number, ay: number): Promise<string> {
  return pdfBlobUrl(await _cariOlustur(satirlar, yil, ay));
}

export async function cariPdfIndir(satirlar: CariSatir[], yil: number, ay: number): Promise<void> {
  pdfIndir(await _cariOlustur(satirlar, yil, ay), `Cari_${yil}_${String(ay).padStart(2, "0")}`);
}
