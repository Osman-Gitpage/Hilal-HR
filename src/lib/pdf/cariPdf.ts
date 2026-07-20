/**
 * src/lib/pdf/cariPdf.ts
 * Cari modülü — PDF rapor oluşturucu
 * Tam liste raporu + seçili satırlar PDF
 */

import { yeniDoc, baslikEkle, footerEkle } from "./pdfUtils";
import autoTable from "jspdf-autotable";
import type { BelgeListItem, ParaBirimi } from "@/types/cari";
import { paraFormat, tarihFormat, belgeTypeName } from "@/lib/cari";

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

const DURUM_ETIKET: Record<string, string> = {
  odendi: "Ödendi",
  kismi: "Kısmi",
  odenmedi: "Ödenmedi",
};

const TUR_ETIKET: Record<string, string> = {
  fatura: "Resmi Fatura",
  proforma: "Proforma",
  hesap_bilgisi: "Hesap Bilgisi",
};

function durumRenk(durum: string, gecikmiş: boolean): [number, number, number] {
  if (gecikmiş) return [220, 38, 38];
  if (durum === "odendi") return [22, 163, 74];
  if (durum === "kismi") return [217, 119, 6];
  return [100, 116, 139];
}

function kalanGoster(b: BelgeListItem): string {
  if (b.kalan <= 0) return "Kapandı";
  const tutar =
    b.para_birimi !== "TRY" && b.kur > 0 ? b.kalan / b.kur : b.kalan;
  return paraFormat(tutar, b.para_birimi);
}

// ─── Özet Satırları ──────────────────────────────────────────────────────────

function ozetHesapla(belgeler: BelgeListItem[]) {
  const pbMap: Record<
    string,
    { alacak: number; odenen: number; kalan: number }
  > = {};
  for (const b of belgeler) {
    if (!pbMap[b.para_birimi]) {
      pbMap[b.para_birimi] = { alacak: 0, odenen: 0, kalan: 0 };
    }
    pbMap[b.para_birimi].alacak += b.tutar;
    pbMap[b.para_birimi].odenen += b.tutar - b.kalan;
    pbMap[b.para_birimi].kalan += b.kalan;
  }
  return pbMap;
}

// ─── Ana Rapor — Tüm / Filtrelenmiş Liste ────────────────────────────────────

export interface CariPdfSecenekler {
  baslik?: string;
  donem?: string;
  firmaAdi?: string;
}

export async function cariListePdf(
  belgeler: BelgeListItem[],
  secenekler: CariPdfSecenekler = {}
): Promise<void> {
  const {
    baslik = "Cari Belge Listesi",
    donem = new Date().toLocaleDateString("tr-TR"),
    firmaAdi,
  } = secenekler;

  const doc = await yeniDoc("landscape");
  const w = doc.internal.pageSize.getWidth();

  // ── Başlık ──
  doc.setFont("Roboto", "bold");
  doc.setFontSize(14);
  doc.text(baslik, w / 2, 14, { align: "center" });

  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    firmaAdi ? `${firmaAdi} · ${donem}` : donem,
    w / 2,
    20,
    { align: "center" }
  );
  doc.setTextColor(0);

  // ── Özet Kutusu ──
  const ozet = ozetHesapla(belgeler);
  const pbListesi = Object.keys(ozet) as ParaBirimi[];

  let startY = 26;

  // mini özet bar
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, startY, w - 20, 10, 2, 2, "F");

  const ozetMetinler = pbListesi.map((pb) => {
    const o = ozet[pb];
    return `${pb}: Alacak ${paraFormat(o.alacak, pb)}  Ödenen ${paraFormat(
      o.odenen,
      pb
    )}  Kalan ${paraFormat(o.kalan, pb)}`;
  });

  doc.setFont("Roboto", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60);
  doc.text(ozetMetinler.join("     "), w / 2, startY + 6.5, {
    align: "center",
  });
  doc.setTextColor(0);

  startY += 14;

  // ── Tablo ──
  const satirlar = belgeler.map((b) => ({
    belge_no: b.belge_no,
    tur: TUR_ETIKET[b.tur] ?? b.tur,
    tarih: tarihFormat(b.tarih),
    aciklama: b.aciklama ?? "",
    gemi: b.gemi_adi ?? "—",
    firma: b.firma_ad ?? "—",
    tutar: paraFormat(b.tutar, b.para_birimi),
    kalan: kalanGoster(b),
    durum: DURUM_ETIKET[b.odeme_durumu] ?? b.odeme_durumu,
  }));

  autoTable(doc, {
    columns: [
      { header: "Belge No", dataKey: "belge_no" },
      { header: "Tür", dataKey: "tur" },
      { header: "Tarih", dataKey: "tarih" },
      { header: "Açıklama", dataKey: "aciklama" },
      { header: "Gemi", dataKey: "gemi" },
      { header: "Firma", dataKey: "firma" },
      { header: "Tutar", dataKey: "tutar" },
      { header: "Kalan", dataKey: "kalan" },
      { header: "Durum", dataKey: "durum" },
    ],
    body: satirlar,
    startY,
    styles: {
      font: "Roboto",
      fontSize: 8,
      cellPadding: 2.2,
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 26 },
      2: { cellWidth: 24 },
      3: { cellWidth: "auto" },
      4: { cellWidth: 30 },
      5: { cellWidth: 35 },
      6: { cellWidth: 28, halign: "right" },
      7: { cellWidth: 26, halign: "right" },
      8: { cellWidth: 20, halign: "center" },
    },
    margin: { left: 10, right: 10 },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 8) {
        const belge = belgeler[data.row.index];
        if (belge) {
          const [r, g, b2] = durumRenk(belge.odeme_durumu, belge.gecikmiş);
          data.cell.styles.textColor = [r, g, b2];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // ── Alt Bilgi ──
  footerEkle(doc);

  // ── İndir ──
  const dosyaAdi = `cari-belgeler-${new Date().toISOString().slice(0, 10)}`;
  doc.save(`${dosyaAdi}.pdf`);
}

// ─── Seçili Satırlar PDF ──────────────────────────────────────────────────────

export async function seciliBelgelerPdf(
  belgeler: BelgeListItem[]
): Promise<void> {
  if (belgeler.length === 0) return;

  const doc = await yeniDoc("landscape");
  const w = doc.internal.pageSize.getWidth();

  // Başlık
  doc.setFont("Roboto", "bold");
  doc.setFontSize(14);
  doc.text("Seçili Belgeler", w / 2, 14, { align: "center" });

  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    `${belgeler.length} belge · ${new Date().toLocaleDateString("tr-TR")}`,
    w / 2,
    20,
    { align: "center" }
  );
  doc.setTextColor(0);

  let startY = 26;

  // Özet bar
  const ozet = ozetHesapla(belgeler);
  const pbListesi = Object.keys(ozet) as ParaBirimi[];

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(10, startY, w - 20, 10, 2, 2, "F");

  const ozetMetinler = pbListesi.map((pb) => {
    const o = ozet[pb];
    return `${pb}: Toplam ${paraFormat(o.alacak, pb)}  Kalan ${paraFormat(
      o.kalan,
      pb
    )}`;
  });

  doc.setFont("Roboto", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 64, 175);
  doc.text(ozetMetinler.join("     "), w / 2, startY + 6.5, {
    align: "center",
  });
  doc.setTextColor(0);

  startY += 14;

  const satirlar = belgeler.map((b) => ({
    belge_no: b.belge_no,
    tur: TUR_ETIKET[b.tur] ?? b.tur,
    tarih: tarihFormat(b.tarih),
    aciklama: b.aciklama ?? "",
    gemi: b.gemi_adi ?? "—",
    firma: b.firma_ad ?? "—",
    tutar: paraFormat(b.tutar, b.para_birimi),
    kalan: kalanGoster(b),
    durum:
      (b.gecikmiş ? "⚠ " : "") +
      (DURUM_ETIKET[b.odeme_durumu] ?? b.odeme_durumu),
  }));

  autoTable(doc, {
    columns: [
      { header: "Belge No", dataKey: "belge_no" },
      { header: "Tür", dataKey: "tur" },
      { header: "Tarih", dataKey: "tarih" },
      { header: "Açıklama", dataKey: "aciklama" },
      { header: "Gemi", dataKey: "gemi" },
      { header: "Firma", dataKey: "firma" },
      { header: "Tutar", dataKey: "tutar" },
      { header: "Kalan", dataKey: "kalan" },
      { header: "Durum", dataKey: "durum" },
    ],
    body: satirlar,
    startY,
    styles: {
      font: "Roboto",
      fontSize: 8,
      cellPadding: 2.5,
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [239, 246, 255],
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 26 },
      2: { cellWidth: 24 },
      3: { cellWidth: "auto" },
      4: { cellWidth: 30 },
      5: { cellWidth: 35 },
      6: { cellWidth: 28, halign: "right" },
      7: { cellWidth: 26, halign: "right" },
      8: { cellWidth: 22, halign: "center" },
    },
    margin: { left: 10, right: 10 },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 8) {
        const belge = belgeler[data.row.index];
        if (belge) {
          const [r, g, b2] = durumRenk(belge.odeme_durumu, belge.gecikmiş);
          data.cell.styles.textColor = [r, g, b2];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  footerEkle(doc);
  doc.save(
    `secili-belgeler-${new Date().toISOString().slice(0, 10)}.pdf`
  );
}
