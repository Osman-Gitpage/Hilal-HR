/**
 * src/lib/pdf/personelPdf.ts
 * Personel listesi PDF export - Portrait A4 premium tasarımı.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { yeniDoc, pdfBlobUrl, pdfIndir, temizSirketAdi } from "./pdfUtils";
import { useSirketStore } from "@/stores/sirketStore";

export interface PersonelSatir {
  ad: string;
  soyad: string;
  tc?: string | null;
  tc_kimlik_no?: string | null;
  gorev_unvan?: string | null;
  departman?: string | null;
  ise_giris_tarihi?: string | null;
  telefon?: string | null;
  employment_periods?: {
    id: string;
    baslangic_tarihi: string;
    bitis_tarihi: string | null;
    ayrilma_nedeni: string | null;
  }[];
  maas_gecmisi?: {
    maas_net: number;
    gecerlilik_baslangic: string;
    gecerlilik_bitis: string | null;
  }[];
  [key: string]: any;
}

async function _olustur(satirlar: PersonelSatir[], yil: number, ay: number): Promise<jsPDF> {
  const sirketAdi = temizSirketAdi(useSirketStore.getState().aktifSirket?.ad || "HİLAL İZOLASYON");
  const bugunStr = new Date().toLocaleDateString("tr-TR");

  const doc = await yeniDoc("portrait");
  (doc as any).isCustomFooter = true; // Kendi footer'ımızı çizeceğiz
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  let aktifSayisi = 0;
  let pasifSayisi = 0;

  const rows = satirlar.map((p, index) => {
    // İşe giriş tarihi tespiti
    const activeEp = p.employment_periods?.find((ep) => ep.bitis_tarihi === null);
    const isAktif = p.employment_periods
      ? p.employment_periods.some(ep => ep.bitis_tarihi === null)
      : true; // Varsayılan aktif

    if (isAktif) {
      aktifSayisi++;
    } else {
      pasifSayisi++;
    }

    const firstEp = p.employment_periods?.[0];
    const girisTarihi = activeEp?.baslangic_tarihi || firstEp?.baslangic_tarihi || p.ise_giris_tarihi;
    const girisStr = girisTarihi
      ? new Date(girisTarihi).toLocaleDateString("tr-TR")
      : "-";

    // Maaş tespiti
    const activeMaasRecord = p.maas_gecmisi?.find((m) => m.gecerlilik_bitis === null) || p.maas_gecmisi?.[0];
    const maasNet = activeMaasRecord?.maas_net ?? p.maas ?? p.sgk_maasi;
    const maasStr = maasNet != null
      ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(maasNet)
      : "-";

    return {
      no: index + 1,
      adSoyad: `${p.ad} ${p.soyad}`,
      tc: p.tc || p.tc_kimlik_no || "-",
      unvan: p.gorev_unvan || "-",
      girisTarihi: girisStr,
      telefon: p.telefon || "-",
      maas: maasStr,
    };
  });

  const cardY = 28;
  const cardHeight = 10;
  const tableStartY = cardY + cardHeight + 5;

  autoTable(doc, {
    columns: [
      { header: "No", dataKey: "no" },
      { header: "Ad Soyad", dataKey: "adSoyad" },
      { header: "T.C. Kimlik No", dataKey: "tc" },
      { header: "Görev / Unvan", dataKey: "unvan" },
      { header: "Giriş Tarihi", dataKey: "girisTarihi" },
      { header: "Telefon", dataKey: "telefon" },
      { header: "Maaş Net", dataKey: "maas" },
    ],
    body: rows,
    startY: tableStartY,
    margin: { left: 10, right: 10 },
    styles: {
      font: "Roboto",
      fontSize: 8.2,
      cellPadding: 2,
      halign: "center",
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [226, 232, 240], // #e2e8f0 ince çizgiler
      textColor: [51, 65, 85], // Slate 700
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: [244, 246, 249], // Slate 100
      textColor: [15, 41, 77], // Slate Navy #0F294D
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    columnStyles: {
      no: { cellWidth: 8, textColor: [100, 116, 139] },
      adSoyad: { halign: "left", cellWidth: 42, fontStyle: "bold", textColor: [15, 23, 42] },
      tc: { cellWidth: 26, textColor: [51, 65, 85] },
      unvan: { halign: "left", cellWidth: 34, textColor: [51, 65, 85] },
      girisTarihi: { cellWidth: 26, textColor: [51, 65, 85] },
      telefon: { cellWidth: 28, textColor: [51, 65, 85] },
      maas: { halign: "right", cellWidth: 26, fontStyle: "bold", textColor: [15, 23, 42] },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50 alternate rows #f8fafc
    },
    didDrawPage: (data) => {
      // ─── PREMIUM HEADER ───
      doc.setFont("Roboto", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 41, 77); // Koyu Lacivert
      doc.text(sirketAdi.toUpperCase(), 10, 15);

      doc.setFont("Roboto", "normal");
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99); // Slate Grey
      doc.text("PERSONEL LİSTESİ RAPORU", 10, 21);

      // Sağ Taraf
      doc.setFont("Roboto", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 41, 77);
      doc.text(`${bugunStr}`, w - 10, 15, { align: "right" });

      doc.setFont("Roboto", "normal");
      doc.setFontSize(8);
      doc.setTextColor(113, 128, 150);
      doc.text("Hilal Yazılım", w - 10, 21, { align: "right" });

      // İnce Mavi Ayırıcı Çizgi
      doc.setDrawColor(30, 64, 175); // Royal Blue #1e40af
      doc.setLineWidth(0.4);
      doc.line(10, 24, w - 10, 24);

      // KPI Kartı (Sadece ilk sayfada)
      if (data.pageNumber === 1) {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(10, cardY, w - 20, cardHeight, 1.5, 1.5, "FD");

        // Dikey Separatörler
        doc.line(10 + (w - 20) / 3, cardY + 2, 10 + (w - 20) / 3, cardY + cardHeight - 2);
        doc.line(10 + 2 * (w - 20) / 3, cardY + 2, 10 + 2 * (w - 20) / 3, cardY + cardHeight - 2);

        // Metin 1: Toplam Personel
        const lbl1 = "Toplam Personel: ";
        const val1 = String(satirlar.length);
        doc.setFont("Roboto", "normal");
        doc.setFontSize(8.5);
        const wL1 = doc.getTextWidth(lbl1);
        doc.setFont("Roboto", "bold");
        const wV1 = doc.getTextWidth(val1);
        const startX1 = (10 + (w - 20) / 6) - (wL1 + wV1) / 2;

        doc.setFont("Roboto", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(lbl1, startX1, cardY + 6.5);
        doc.setFont("Roboto", "bold");
        doc.setTextColor(15, 41, 77);
        doc.text(val1, startX1 + wL1, cardY + 6.5);

        // Metin 2: Aktif Personel
        const lbl2 = "Aktif Çalışan: ";
        const val2 = String(aktifSayisi);
        doc.setFont("Roboto", "normal");
        doc.setFontSize(8.5);
        const wL2 = doc.getTextWidth(lbl2);
        doc.setFont("Roboto", "bold");
        const wV2 = doc.getTextWidth(val2);
        const startX2 = (10 + (w - 20) / 2) - (wL2 + wV2) / 2;

        doc.setFont("Roboto", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(lbl2, startX2, cardY + 6.5);
        doc.setFont("Roboto", "bold");
        doc.setTextColor(16, 185, 129); // Zümrüt Yeşili
        doc.text(val2, startX2 + wL2, cardY + 6.5);

        // Metin 3: Ayrılan Personel
        const lbl3 = "Ayrılan Personel: ";
        const val3 = String(pasifSayisi);
        doc.setFont("Roboto", "normal");
        doc.setFontSize(8.5);
        const wL3 = doc.getTextWidth(lbl3);
        doc.setFont("Roboto", "bold");
        const wV3 = doc.getTextWidth(val3);
        const startX3 = (10 + 5 * (w - 20) / 6) - (wL3 + wV3) / 2;

        doc.setFont("Roboto", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(lbl3, startX3, cardY + 6.5);
        doc.setFont("Roboto", "bold");
        doc.setTextColor(239, 68, 68); // Kırmızı
        doc.text(val3, startX3 + wL3, cardY + 6.5);
      }
    }
  });

  // Footer Çizimi
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);

    // Sol Alt
    doc.text("Hilal Muhasebe Yazılımı — HR Raporlama", 10, h - 6);

    // Sağ Alt
    doc.text(`Sayfa ${i} / ${pageCount}`, w - 10, h - 6, { align: "right" });
  }

  return doc;
}

export async function personelPdfOlustur(
  satirlar: PersonelSatir[],
  yil: number,
  ay: number
): Promise<string> {
  const doc = await _olustur(satirlar, yil, ay);
  return pdfBlobUrl(doc);
}

export const personelPdfOnizle = personelPdfOlustur;

export async function personelPdfIndir(
  satirlar: PersonelSatir[],
  yil: number,
  ay: number
): Promise<void> {
  const doc = await _olustur(satirlar, yil, ay);
  pdfIndir(doc, `Personel_${yil}_${String(ay).padStart(2, "0")}`);
}
