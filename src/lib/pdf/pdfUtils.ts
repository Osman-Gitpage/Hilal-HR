/**
 * src/lib/pdf/pdfUtils.ts
 * Temel jsPDF yardımcıları — font yükleme, başlık, footer, önizleme blob
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const AY_ADLARI_PDF = [
  "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function excelDonemPdf(yil: number, ay: number) {
  return `${AY_ADLARI_PDF[ay]} ${yil}`;
}

export function temizSirketAdi(ad: string): string {
  if (!ad) return "";
  const keywords = [
    "GEMİ", "GEMI",
    "İNŞ", "INS",
    "TURİZM", "TURIZM",
    "GIDA",
    "SAN",
    "TİC", "TIC",
    "LTD",
    "A.Ş.", "A.S.",
    "ŞTİ", "STI"
  ];
  
  const words = ad.split(/\s+/);
  const cleanWords: string[] = [];
  
  for (const word of words) {
    const upperWord = word.toUpperCase()
      .replace(/I/g, "İ")
      .replace(/ı/g, "I");
    
    const shouldStop = keywords.some(kw => {
      return upperWord.startsWith(kw) || upperWord.includes(kw);
    });
    
    if (shouldStop) {
      break;
    }
    cleanWords.push(word);
  }
  
  if (cleanWords.length === 0) return ad;
  return cleanWords.join(" ").trim();
}

// ─────────────────────────────────────────────
// Font Yükleme
// ─────────────────────────────────────────────

let fontCache: { regular: string; bold: string } | null = null;

async function fontYukle(): Promise<{ regular: string; bold: string }> {
  if (fontCache) return fontCache;

  const toBase64 = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const [regular, bold] = await Promise.all([
    toBase64("/fonts/Roboto.ttf"),
    toBase64("/fonts/Roboto-Bold.ttf"),
  ]);

  fontCache = { regular, bold };
  return fontCache;
}

// ─────────────────────────────────────────────
// Yeni Doc Oluştur
// ─────────────────────────────────────────────

export async function yeniDoc(yon: "portrait" | "landscape" = "portrait"): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: yon, unit: "mm", format: "a4" });

  const fonts = await fontYukle();
  doc.addFileToVFS("Roboto-Regular.ttf", fonts.regular);
  doc.addFileToVFS("Roboto-Bold.ttf", fonts.bold);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  doc.setFont("Roboto", "normal");

  return doc;
}

// ─────────────────────────────────────────────
// Başlık + Footer
// ─────────────────────────────────────────────

export function baslikEkle(doc: jsPDF, baslik: string, donem: string): number {
  const w = doc.internal.pageSize.getWidth();

  doc.setFont("Roboto", "bold");
  doc.setFontSize(14);
  doc.text(baslik, w / 2, 15, { align: "center" });

  doc.setFont("Roboto", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(donem, w / 2, 22, { align: "center" });
  doc.setTextColor(0);

  return 28; // ilk tablonun başlangıç Y koordinatı
}

export function footerEkle(doc: jsPDF): void {
  if ((doc as any).isCustomFooter) return;

  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150);

    const tarih = new Date().toLocaleDateString("tr-TR");
    doc.text(`Oluşturulma: ${tarih}`, 10, h - 6);
    doc.text(`Sayfa ${i} / ${pageCount}`, w - 10, h - 6, { align: "right" });
    doc.setTextColor(0);
  }
}

// ─────────────────────────────────────────────
// Tablo Çizici
// ─────────────────────────────────────────────

export interface PdfSutun {
  header: string;
  dataKey: string;
  width?: number;
}

export function tabloEkle(
  doc: jsPDF,
  sutunlar: PdfSutun[],
  satirlar: Record<string, string | number>[],
  startY: number,
  options?: {
    fontSize?: number;
    headerColor?: [number, number, number];
    alternateColor?: [number, number, number];
  }
): number {
  const { fontSize = 9, headerColor = [41, 98, 255], alternateColor = [245, 247, 255] } =
    options ?? {};

  autoTable(doc, {
    columns: sutunlar.map((s) => ({ header: s.header, dataKey: s.dataKey })),
    body: satirlar,
    startY,
    styles: {
      font: "Roboto",
      fontSize,
      cellPadding: 2.5,
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: headerColor,
      textColor: [255, 255, 255],
      fontSize: fontSize,
    },
    alternateRowStyles: {
      fillColor: alternateColor,
    },
    columnStyles: Object.fromEntries(
      sutunlar.map((s, i) => [i, { cellWidth: s.width ?? "auto" }])
    ),
    margin: { left: 10, right: 10 },
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
}

// ─────────────────────────────────────────────
// İndir ve Önizle
// ─────────────────────────────────────────────

export function pdfIndir(doc: jsPDF, dosyaAdi: string): void {
  footerEkle(doc);
  doc.save(`${dosyaAdi}.pdf`);
}

export function pdfBlobUrl(doc: jsPDF): string {
  footerEkle(doc);
  return doc.output("bloburl") as unknown as string;
}
