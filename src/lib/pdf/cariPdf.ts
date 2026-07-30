/**
 * src/lib/pdf/cariPdf.ts
 * Cari Modülü — PDF Rapor Oluşturucu (v5 — Tür ve İmza Kutuları Satırsız, Alt Ödeme Hareketli Rapor)
 *
 * Kullanıcı İstekleri:
 * 1. Düzenleyen ve onaylayan kaşe/imza kutuları tamamen kaldırıldı.
 * 2. Tür (Belge Türü) sütunu tamamen kaldırıldı.
 * 3. Alt kısma gelen ödeme / tahsilat hareketleri eklendi (Hangi tarihte, ne şekilde/yöntemle, kaç birim/tutar ödeme alındığı).
 */

import { yeniDoc } from "./pdfUtils";
import autoTable from "jspdf-autotable";
import type { BelgeListItem, BelgeDetay, FirmaListItem } from "@/types/cari";
import { paraFormat, tarihFormat } from "@/lib/cari";
import jsPDF from "jspdf";

// ─── Sade & Beyaz Renk Paleti ───────────────────────────────────────────────

const STYLES = {
  textBlack:   [15, 23, 42]   as [number, number, number], // slate-900 (Ana Metinler & Başlıklar)
  textBody:    [51, 65, 85]   as [number, number, number], // slate-700 (Tablo İçi Metin)
  textMuted:   [100, 116, 139] as [number, number, number], // slate-500 (Etiketler & Altbilgi)
  white:       [255, 255, 255] as [number, number, number], // Saf Beyaz
  borderDark:  [30, 41, 59]   as [number, number, number], // 0.4pt Koyu Ayraç Çizgisi
  borderLight: [203, 213, 225] as [number, number, number], // 0.15pt İnce Izgara Çizgisi
};

// ─── Yardımcı Dönüştürücüler ──────────────────────────────────────────────────

function kalanHesapla(b: BelgeListItem): number {
  return b.para_birimi !== "TRY" && b.kur > 0 ? b.kalan / b.kur : b.kalan;
}

function kalanGoster(b: BelgeListItem): string {
  const kalanVal = kalanHesapla(b);
  if (kalanVal <= 0.001) return "0,00 (Kapandı)";
  return paraFormat(kalanVal, b.para_birimi);
}

// ─── 1. Sade Başlık (Antet Çizgili) ──────────────────────────────────────────

function sadeBaslikCiz(
  doc: jsPDF,
  w: number,
  baslik: string,
  altBaslik: string,
  meta?: { belgeSayisi: number; tarih: string; filtre?: string }
): number {
  // Sol Üst — Doküman Başlığı
  doc.setFont("Roboto", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...STYLES.textBlack);
  doc.text(baslik.toUpperCase(), 10, 10);

  // Sol Alt — Firma / Dönem Metni
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...STYLES.textMuted);
  doc.text(altBaslik, 10, 15);

  // Sağ Üst Bilgileri
  if (meta) {
    const rightX = w - 10;
    doc.setFont("Roboto", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...STYLES.textBlack);
    doc.text(`Toplam ${meta.belgeSayisi} Belge`, rightX, 10, { align: "right" });

    doc.setFont("Roboto", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...STYLES.textMuted);
    doc.text(`Tarih: ${meta.tarih}`, rightX, 15, { align: "right" });

    if (meta.filtre) {
      doc.setFontSize(7);
      doc.text(`Filtre: ${meta.filtre}`, rightX, 19, { align: "right" });
    }
  }

  // Alt İnce Siyah Çizgi (1pt)
  const lineY = meta?.filtre ? 21 : 17;
  doc.setDrawColor(...STYLES.borderDark);
  doc.setLineWidth(0.4);
  doc.line(10, lineY, w - 10, lineY);

  doc.setTextColor(...STYLES.textBlack);
  return lineY + 3;
}

// ─── 2. Belge Tablosu (Tür & Durum Sütunsuz, Taşan Metinlerde "...") ────────

function belgeTablosuCiz(
  doc: jsPDF,
  belgeler: BelgeListItem[],
  startY: number
): number {
  const satirlar = belgeler.map((b, idx) => ({
    no:       String(idx + 1),
    belge_no: b.belge_no || "—",
    tarih:    tarihFormat(b.tarih),
    firma:    b.firma_ad || "—",
    gemi:     b.gemi_adi || "—",
    aciklama: b.aciklama || "—",
    tutar:    paraFormat(b.tutar, b.para_birimi),
    kalan:    kalanGoster(b),
  }));

  autoTable(doc, {
    columns: [
      { header: "#",            dataKey: "no" },
      { header: "Belge No",     dataKey: "belge_no" },
      { header: "Tarih",        dataKey: "tarih" },
      { header: "Firma / Cari",   dataKey: "firma" },
      { header: "Gemi / Proje",   dataKey: "gemi" },
      { header: "Açıklama",     dataKey: "aciklama" },
      { header: "Belge Tutarı",  dataKey: "tutar" },
      { header: "Kalan Bakiye",  dataKey: "kalan" },
    ],
    body: satirlar,
    startY,
    styles: {
      font: "Roboto",
      fontSize: 7.5,
      cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
      textColor: STYLES.textBody,
      lineColor: STYLES.borderLight,
      lineWidth: 0.15,
      fillColor: STYLES.white,
      overflow: "ellipsize", // Sabit yükseklik: Sığmayan metinler "..." yapılır
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: STYLES.white,
      textColor: STYLES.textBlack,
      fontSize: 8,
      cellPadding: { top: 2.8, bottom: 2.8, left: 2.5, right: 2.5 },
      lineWidth: 0.3,
      lineColor: STYLES.borderDark,
    },
    alternateRowStyles: {
      fillColor: STYLES.white,
    },
    columnStyles: {
      0: { cellWidth: 8,   halign: "center", textColor: STYLES.textMuted, fontSize: 7 },
      1: { cellWidth: 38,  font: "Roboto", fontStyle: "bold", textColor: STYLES.textBlack, fontSize: 8 },
      2: { cellWidth: 25,  halign: "center" },
      3: { cellWidth: 55 },
      4: { cellWidth: 35 },
      5: { cellWidth: 56 },
      6: { cellWidth: 30,  halign: "right", fontStyle: "bold", textColor: STYLES.textBlack, fontSize: 8 },
      7: { cellWidth: 30,  halign: "right", fontStyle: "bold", textColor: STYLES.textBlack, fontSize: 8.5 },
    },
    margin: { left: 10, right: 10, top: 10, bottom: 12 },
    tableLineColor: STYLES.borderDark,
    tableLineWidth: 0.3,
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

// ─── 3. Gelen Ödemeler & Tahsilat Hareketleri Alt Tablosu ───────────────────

function gelenOdemelerTablosuCiz(
  doc: jsPDF,
  belgeler: BelgeListItem[],
  startY: number
): void {
  // Tüm belgelerden ödeme hareketlerini topla
  const tumOdemeler: {
    belge_no: string;
    gemi_adi: string;
    tarih: string;
    yontem: string;
    aciklama: string;
    tutarMetin: string;
  }[] = [];

  for (const b of belgeler) {
    if (b.odemeler && b.odemeler.length > 0) {
      for (const o of b.odemeler) {
        let yontemMtn = "Banka Havalesi / EFT";
        if (o.yontem === "elden") yontemMtn = "Elden Tahsilat";
        else if (o.yontem === "cek") yontemMtn = "Çek / Senet";

        tumOdemeler.push({
          belge_no: b.belge_no || "—",
          gemi_adi: b.gemi_adi || "—",
          tarih: o.tarih ? tarihFormat(o.tarih) : tarihFormat(b.tarih),
          yontem: yontemMtn,
          aciklama: o.aciklama || "—",
          tutarMetin: paraFormat(o.tutar, o.para_birimi || b.para_birimi || "TRY"),
        });
      }
    }
  }

  if (tumOdemeler.length === 0) return;

  const currentY = startY + 6;

  // Başlık Metni
  doc.setFont("Roboto", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...STYLES.textBlack);
  doc.text("GELEN ÖDEME & TAHSİLAT HAREKETLERİ", 10, currentY);

  autoTable(doc, {
    head: [["#", "Ödeme Tarihi", "İlişkili Belge No", "Gemi Adı", "Ödeme Yöntemi", "Açıklama", "Tahsil Edilen Tutar / Birim"]],
    body: tumOdemeler.map((o, idx) => [
      String(idx + 1),
      o.tarih,
      o.belge_no,
      o.gemi_adi,
      o.yontem,
      o.aciklama,
      o.tutarMetin,
    ]),
    startY: currentY + 3,
    styles: {
      font: "Roboto",
      fontSize: 7,
      cellPadding: { top: 1.8, bottom: 1.8, left: 2.5, right: 2.5 },
      textColor: STYLES.textBody,
      lineColor: STYLES.borderLight,
      lineWidth: 0.15,
      fillColor: STYLES.white,
      overflow: "ellipsize",
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: STYLES.white,
      textColor: STYLES.textBlack,
      fontSize: 7.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      lineWidth: 0.3,
      lineColor: STYLES.borderDark,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center", textColor: STYLES.textMuted, fontSize: 6.5 },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 38, fontStyle: "bold", textColor: STYLES.textBlack },
      3: { cellWidth: 55 },
      4: { cellWidth: 35 },
      5: { cellWidth: "auto" },
      6: { cellWidth: 45, halign: "right", fontStyle: "bold", textColor: STYLES.textBlack, fontSize: 8 },
    },
    margin: { left: 10, right: 10, top: 10, bottom: 12 },
    tableLineColor: STYLES.borderDark,
    tableLineWidth: 0.3,
  });
}

// ─── 4. Sayfa Alt Bilgisi (Footer) ──────────────────────────────────────────

function sadeFooterCiz(doc: jsPDF, baslik: string, belgeSayisi: number): void {
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Alt İnce Çizgi
    doc.setDrawColor(...STYLES.borderLight);
    doc.setLineWidth(0.2);
    doc.line(10, h - 8, w - 10, h - 8);

    // Sol Alt
    doc.setFont("Roboto", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...STYLES.textMuted);
    doc.text(`${baslik} · Toplam ${belgeSayisi} kayıt`, 10, h - 4.5);

    // Orta Alt
    const tarih = new Date().toLocaleDateString("tr-TR");
    doc.text(`Tarih: ${tarih}`, w / 2, h - 4.5, { align: "center" });

    // Sağ Alt — Sayfa
    doc.setFont("Roboto", "bold");
    doc.setTextColor(...STYLES.textBlack);
    doc.text(`Sayfa ${i} / ${pageCount}`, w - 10, h - 4.5, { align: "right" });
  }
}

// ─── EXPORT 1: Cari Liste PDF Raporu ─────────────────────────────────────────

export interface CariPdfSecenekler {
  baslik?: string;
  donem?: string;
  firmaAdi?: string;
  aktifFiltreler?: string;
}

export async function cariListePdf(
  belgeler: BelgeListItem[],
  secenekler: CariPdfSecenekler = {}
): Promise<void> {
  const {
    baslik = "Cari Belge ve Hesap Ekstresi",
    donem = new Date().toLocaleDateString("tr-TR"),
    firmaAdi,
    aktifFiltreler,
  } = secenekler;

  const doc = await yeniDoc("landscape");
  const w = doc.internal.pageSize.getWidth();

  const altBaslik = firmaAdi
    ? `${firmaAdi} · Rapor Tarihi: ${donem}`
    : `Genel Rapor · Tarih: ${donem}`;

  const startY = sadeBaslikCiz(doc, w, baslik, altBaslik, {
    belgeSayisi: belgeler.length,
    tarih: new Date().toLocaleDateString("tr-TR"),
    filtre: aktifFiltreler,
  });

  const tableFinalY = belgeTablosuCiz(doc, belgeler, startY);
  gelenOdemelerTablosuCiz(doc, belgeler, tableFinalY);

  sadeFooterCiz(doc, baslik, belgeler.length);

  const dosyaTarih = new Date().toISOString().slice(0, 10);
  doc.save(`cari-ekstre-${dosyaTarih}.pdf`);
}

// ─── EXPORT 2: Seçili Belgeler PDF Raporu ─────────────────────────────────────

export async function seciliBelgelerPdf(
  belgeler: BelgeListItem[]
): Promise<void> {
  if (belgeler.length === 0) return;

  const doc = await yeniDoc("landscape");
  const w = doc.internal.pageSize.getWidth();

  const baslik = "Seçili Cari Belgeler Raporu";
  const altBaslik = `Özel Seçim Raporu · ${belgeler.length} Adet Belge Seçildi · Tarih: ${new Date().toLocaleDateString("tr-TR")}`;

  const startY = sadeBaslikCiz(doc, w, baslik, altBaslik, {
    belgeSayisi: belgeler.length,
    tarih: new Date().toLocaleDateString("tr-TR"),
  });

  const tableFinalY = belgeTablosuCiz(doc, belgeler, startY);
  gelenOdemelerTablosuCiz(doc, belgeler, tableFinalY);

  sadeFooterCiz(doc, baslik, belgeler.length);

  const dosyaTarih = new Date().toISOString().slice(0, 10);
  doc.save(`secili-cari-belgeler-${dosyaTarih}.pdf`);
}

// ─── EXPORT 3: Firma Cari Hesap Ekstresi (Özel Firma Ekstresi) ───────────────

export async function firmaEkstrePdf(
  firma: FirmaListItem,
  belgeler: BelgeListItem[],
  secenekler: { donem?: string } = {}
): Promise<void> {
  const doc = await yeniDoc("landscape");
  const w = doc.internal.pageSize.getWidth();

  const baslik = `CARİ HESAP EKSTRESİ — ${firma.ad.toUpperCase()}`;
  const donem = secenekler.donem || new Date().toLocaleDateString("tr-TR");
  const altBaslik = `Firma Cari Hesap Hareket Dökümü · Tarih: ${donem}`;

  const startY = sadeBaslikCiz(doc, w, baslik, altBaslik, {
    belgeSayisi: belgeler.length,
    tarih: donem,
  });

  const tableFinalY = belgeTablosuCiz(doc, belgeler, startY);
  gelenOdemelerTablosuCiz(doc, belgeler, tableFinalY);

  sadeFooterCiz(doc, baslik, belgeler.length);

  const cleanFirmaAd = firma.ad.replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, "_");
  doc.save(`cari-ekstre-${cleanFirmaAd}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── EXPORT 4: Belge / Fatura Fiş Detay PDF ───────────────────────────────────

export async function belgeDetayPdf(
  belge: BelgeDetay
): Promise<void> {
  const doc = await yeniDoc("portrait");
  const w = doc.internal.pageSize.getWidth();

  const baslik = `CARİ BELGE DETAY FİŞİ`;
  const altBaslik = `Evrak No: ${belge.belge_no} · Tarih: ${tarihFormat(belge.tarih)}`;

  const startY = sadeBaslikCiz(doc, w, baslik, altBaslik, {
    belgeSayisi: 1,
    tarih: tarihFormat(belge.tarih),
  });

  const bilgiSatirlari = [
    ["Belge / Evrak No", belge.belge_no, "Tarih", tarihFormat(belge.tarih)],
    ["Firma / Cari", belge.firma_ad || "—", "Gemi / Proje", belge.gemi_adi || "—"],
    ["Belge Tutarı", paraFormat(belge.tutar, belge.para_birimi), "Kalan Bakiye", kalanGoster(belge)],
  ];

  autoTable(doc, {
    body: bilgiSatirlari,
    startY,
    styles: {
      font: "Roboto",
      fontSize: 8,
      cellPadding: 2.5,
      textColor: STYLES.textBody,
      lineColor: STYLES.borderLight,
      lineWidth: 0.15,
      fillColor: STYLES.white,
    },
    columnStyles: {
      0: { fontStyle: "bold", textColor: STYLES.textBlack, cellWidth: 35 },
      1: { cellWidth: 55 },
      2: { fontStyle: "bold", textColor: STYLES.textBlack, cellWidth: 35 },
      3: { cellWidth: 55 },
    },
    margin: { left: 10, right: 10 },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  if (belge.odemeler && belge.odemeler.length > 0) {
    doc.setFont("Roboto", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...STYLES.textBlack);
    doc.text("GELEN ÖDEME & TAHSİLAT HAREKETLERİ", 10, finalY);

    const odemeSatirlari = belge.odemeler.map((o, i) => [
      String(i + 1),
      tarihFormat(o.tarih),
      o.yontem === "elden" ? "Elden Tahsilat" : o.yontem === "cek" ? "Çek / Senet" : "Banka Havalesi / EFT",
      o.aciklama || "—",
      paraFormat(o.tutar, o.para_birimi),
    ]);

    autoTable(doc, {
      head: [["#", "Ödeme Tarihi", "Ödeme Yöntemi", "Açıklama", "Tahsil Edilen Tutar"]],
      body: odemeSatirlari,
      startY: finalY + 3,
      styles: {
        font: "Roboto",
        fontSize: 7.5,
        cellPadding: 2,
        textColor: STYLES.textBody,
        lineColor: STYLES.borderLight,
        lineWidth: 0.15,
        fillColor: STYLES.white,
        overflow: "ellipsize",
      },
      headStyles: {
        fillColor: STYLES.white,
        textColor: STYLES.textBlack,
        fontStyle: "bold",
        lineWidth: 0.3,
        lineColor: STYLES.borderDark,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 35, halign: "center" },
        3: { cellWidth: "auto" },
        4: { cellWidth: 40, halign: "right", fontStyle: "bold", textColor: STYLES.textBlack },
      },
      margin: { left: 10, right: 10 },
    });
  }

  sadeFooterCiz(doc, "Belge Detay Fişi", 1);

  doc.save(`belge-detay-${belge.belge_no}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
