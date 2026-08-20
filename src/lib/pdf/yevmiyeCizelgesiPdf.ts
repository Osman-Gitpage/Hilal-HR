/**
 * src/lib/pdf/yevmiyeCizelgesiPdf.ts
 * Yevmiye Çizelgesi PDF - 1'e 1 Görsel İle Birebir Aynı Tasarım
 * Eşit font büyüklükleri (DGS ASFAT eşit, YEVMİYE ÇİZELGESİ & DÖNEM eşit 18px),
 * Beyaz arkaplanlı üst düzey modern 4 KPI Kartı (Soft renk rozetli).
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { yeniDoc, pdfBlobUrl, pdfIndir } from "./pdfUtils";
import { useSirketStore } from "@/stores/sirketStore";

const AY_ADLARI = [
  "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const GUN_ADLARI = [
  "Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"
];

// Türkiye Resmi Tatilleri / Bayramlar (Ay-Gün formatında)
const RESMI_TATILLER: Record<string, string> = {
  "01-01": "Yılbaşı",
  "04-23": "Ulusal Egemenlik ve Çocuk Bayramı",
  "05-01": "Emek ve Dayanışma Günü",
  "05-19": "Atatürk'ü Anma, Gençlik ve Spor Bayramı",
  "07-15": "Demokrasi ve Milli Birlik Günü",
  "08-30": "Zafer Bayramı",
  "10-29": "Cumhuriyet Bayramı",
};

export interface YevmiyeCizelgesiPdfVeri {
  yil: number;
  ay: number;
  projeAdi?: string;
  sirketAdi?: string;
  gunlerData?: Record<number, { yevmiye: number; pazarMesai: number; aciklama?: string }>;
  satirlar?: Array<{
    tarih: string;
    saat?: number | null;
    calisma_saati?: number | null;
    mesai_saati?: number | null;
    ozel_durum?: string | null;
    aciklama?: string | null;
  }>;
}

export async function _olusturYevmiyeCizelgesi(veri: YevmiyeCizelgesiPdfVeri): Promise<jsPDF> {
  const { yil, ay, satirlar, gunlerData } = veri;
  const doc = await yeniDoc("portrait");
  (doc as any).isCustomFooter = true;

  const w = doc.internal.pageSize.getWidth(); // ~210 mm
  const margin = 10;
  const contentWidth = w - 2 * margin; // 190 mm

  // Aktif şirket adı
  const sirketAdiState = useSirketStore.getState().aktifSirket?.ad || "DGS ASFAT";

  const ayAdi = AY_ADLARI[ay] || "TEMMUZ";
  const donemStr = `${String(ay).padStart(2, "0")}/${yil}`;
  const sonGun = new Date(yil, ay, 0).getDate();

  // Günlük verileri hesapla
  const gunlukMap: Record<number, { yevmiye: number; pazarMesai: number; aciklama: string }> = {};
  for (let g = 1; g <= sonGun; g++) {
    gunlukMap[g] = { yevmiye: 0, pazarMesai: 0, aciklama: "" };
  }

  if (gunlerData) {
    for (let g = 1; g <= sonGun; g++) {
      if (gunlerData[g]) {
        gunlukMap[g] = {
          yevmiye: gunlerData[g].yevmiye ?? 0,
          pazarMesai: gunlerData[g].pazarMesai ?? 0,
          aciklama: gunlerData[g].aciklama ?? "",
        };
      }
    }
  } else if (satirlar && satirlar.length > 0) {
    for (const s of satirlar) {
      if (!s.tarih) continue;
      const d = new Date(s.tarih);
      if (isNaN(d.getTime())) continue;
      const dayNum = d.getDate();
      if (dayNum >= 1 && dayNum <= sonGun) {
        const haftaGunu = d.getDay(); // 0 = Pazar
        const saat = s.saat ?? s.calisma_saati ?? 0;
        const mesai = s.mesai_saati ?? 0;

        // Yevmiye = 7.5 saat üzerinden
        const yev = saat > 0 ? (saat >= 7.5 ? Math.round(saat / 7.5) : Number((saat / 7.5).toFixed(1))) : 0;
        
        if (haftaGunu === 0) {
          gunlukMap[dayNum].pazarMesai += mesai > 0 ? Number((mesai / 7.5).toFixed(1)) : 0;
          gunlukMap[dayNum].yevmiye += yev;
        } else {
          gunlukMap[dayNum].yevmiye += yev;
        }

        if (s.aciklama) {
          gunlukMap[dayNum].aciklama = s.aciklama;
        }
      }
    }
  }

  // Renk tanımları
  const NAVY = [15, 41, 77]; // #0F294D
  const NAVY_DARK = [10, 25, 47]; // #0A192F
  const GOLD = [212, 139, 22]; // #D48B16
  const RED_TEXT = [220, 38, 38]; // #DC2626
  const RED_BG = [253, 242, 242]; // #FDF2F2
  const BORDER_COLOR = [226, 232, 240]; // #E2E8F0
  const TEXT_DARK = [15, 23, 42]; // #0F172A

  // ───────────────────────────────────────────────────────────────────────────
  // 1. HEADER SEKTÖRÜ (ÜST BOŞLUK: startY = 6, EŞİT FONT BÜYÜKLÜKLERİ)
  // ───────────────────────────────────────────────────────────────────────────
  const startY = 6;

  // SOL LOGO: DGS ASFAT (DGS ve ASFAT ikisi de EŞİT 19px)
  doc.setFont("Roboto", "bold");
  doc.setFontSize(19);
  doc.setTextColor(15, 41, 77);
  doc.text("DGS ASFAT", margin, startY + 8);

  const totalLogoWidth = doc.getTextWidth("DGS ASFAT");

  // Sol Altın Çizgi
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(1.2);
  doc.line(margin, startY + 10.5, margin + totalLogoWidth, startY + 10.5);

  // Logo Alt Yazısı (- PROFESSIONAL -)
  doc.setFont("Roboto", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 41, 77);
  doc.text("—  PROFESSIONAL  —", margin + totalLogoWidth / 2, startY + 14.5, { align: "center" });

  // ORTA BAŞLIK: YEVMİYE ÇİZELGESİ (18px)
  const centerX = w / 2;
  doc.setFont("Roboto", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 41, 77);
  doc.text("YEVMİYE ÇİZELGESİ", centerX, startY + 7, { align: "center" });

  // Subtitle (TEMMUZ AYI + Yan Çizgiler)
  doc.setFont("Roboto", "bold");
  doc.setFontSize(11);
  doc.setTextColor(GOLD[0], GOLD[1], GOLD[2]);
  const subTitleText = `${ayAdi.toUpperCase()} AYI`;
  doc.text(subTitleText, centerX, startY + 14, { align: "center" });

  const subWidth = doc.getTextWidth(subTitleText);
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(0.6);
  doc.line(centerX - subWidth / 2 - 20, startY + 13, centerX - subWidth / 2 - 4, startY + 13);
  doc.line(centerX + subWidth / 2 + 4, startY + 13, centerX + subWidth / 2 + 20, startY + 13);

  // SAĞ DÖNEM SEKTÖRÜ: DÖNEM (YEVMİYE ÇİZELGESİ İLE EŞİT 18px)
  const rightX = w - margin;
  doc.setFont("Roboto", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 41, 77);
  
  const donemTitle = "DÖNEM";
  const donemTitleW = doc.getTextWidth(donemTitle);
  const donemStartX = rightX - donemTitleW;
  doc.text(donemTitle, donemStartX, startY + 8);

  // Sağ Altın Çizgi
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(1.2);
  doc.line(donemStartX, startY + 10.5, rightX, startY + 10.5);

  // Sağ Alt Yazı (— 07/2026 —)
  doc.setFont("Roboto", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 41, 77);
  const donemSub = `—  ${donemStr}  —`;
  doc.text(donemSub, donemStartX + donemTitleW / 2, startY + 14.5, { align: "center" });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. TABLO VERİLERİ VE YAPILANDIRILMASI
  // ───────────────────────────────────────────────────────────────────────────
  const tableStartY = startY + 18;

  const head = [
    [
      { content: "📅   GÜN", colSpan: 3, styles: { halign: "center" } },
      { content: "YEVMİYE", styles: { halign: "center" } },
      { content: "PAZAR MESAİ YEVMİYE", styles: { halign: "center" } },
      { content: "AÇIKLAMA", styles: { halign: "left" } },
    ]
  ];

  let toplamYevmiye = 0;
  let toplamPazarMesai = 0;
  let calismaGunuSayisi = 0;

  const rows: Array<Record<string, any>> = [];

  for (let g = 1; g <= sonGun; g++) {
    const gunObj = new Date(yil, ay - 1, g);
    const haftaGunuIndex = gunObj.getDay(); // 0 = Pazar
    const gunAd = GUN_ADLARI[haftaGunuIndex];
    const isPazar = haftaGunuIndex === 0;

    const gunStr = String(g).padStart(2, "0");
    const ayStr = String(ay).padStart(2, "0");
    const tarihFormatted = `${gunStr}.${ayStr}.${yil}`;

    const dateKey = `${ayStr}-${gunStr}`;
    const resmiTatilAdi = RESMI_TATILLER[dateKey];
    const isResmiTatil = !!resmiTatilAdi;
    const isTatil = isPazar || isResmiTatil;

    const data = gunlukMap[g] || { yevmiye: 0, pazarMesai: 0, aciklama: "" };
    toplamYevmiye += data.yevmiye;
    toplamPazarMesai += data.pazarMesai;

    if (data.yevmiye > 0) {
      calismaGunuSayisi++;
    }

    let aciklamaMetni = data.aciklama;
    if (!aciklamaMetni) {
      if (isResmiTatil) aciklamaMetni = resmiTatilAdi;
    }

    rows.push({
      gunNo: gunStr,
      tarih: tarihFormatted,
      gunAd: gunAd,
      yevmiye: data.yevmiye > 0 ? String(data.yevmiye) : "—",
      pazarMesai: data.pazarMesai > 0 ? String(data.pazarMesai) : "—",
      aciklama: aciklamaMetni || "—",
      isTatil,
    });
  }

  const toplamSaat = Number((toplamYevmiye * 7.5).toFixed(1));

  // Sütun genişlikleri (Toplam 190 mm)
  const colWidths = [12, 24, 24, 28, 42, 60];

  autoTable(doc, {
    head: head as any,
    body: rows.map((r) => [r.gunNo, r.tarih, r.gunAd, r.yevmiye, r.pazarMesai, r.aciklama]),
    startY: tableStartY,
    margin: { left: margin, right: margin },
    styles: {
      font: "Roboto",
      fontSize: 8,
      cellPadding: 1.6,
      halign: "center",
      valign: "middle",
      lineWidth: 0.1,
      lineColor: BORDER_COLOR as [number, number, number],
      textColor: TEXT_DARK as [number, number, number],
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: NAVY as [number, number, number],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { cellWidth: colWidths[0], fontStyle: "bold", textColor: NAVY as [number, number, number] }, // GunNo
      1: { cellWidth: colWidths[1], halign: "center" }, // Tarih
      2: { cellWidth: colWidths[2], halign: "left" }, // GunAd
      3: { cellWidth: colWidths[3], fontStyle: "bold", halign: "center" }, // Yevmiye
      4: { cellWidth: colWidths[4], fontStyle: "bold", halign: "center" }, // PazarMesai
      5: { cellWidth: colWidths[5], halign: "left", textColor: [71, 85, 105] }, // Aciklama
    },
    didParseCell: (data) => {
      if (data.section === "body") {
        const rawRow = rows[data.row.index];
        if (rawRow && rawRow.isTatil) {
          data.cell.styles.fillColor = RED_BG as [number, number, number];
          if (data.column.index <= 2) {
            data.cell.styles.textColor = RED_TEXT as [number, number, number];
            data.cell.styles.fontStyle = "bold";
          }
        }
      }
    },
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. TABLO ALT TOPLAM SATIRLARI (ŞIK LACİVERT/GECE MAVİSİ ZEMİN)
  // ───────────────────────────────────────────────────────────────────────────
  const finalTableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  const footerRowH = 6.8;

  // Satır 1: TOPLAM YEVMİYE
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.rect(margin, finalTableY, contentWidth, footerRowH, "F");

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  const x1 = margin + colWidths[0] + colWidths[1] + colWidths[2]; // 60mm -> Yevmiye col start
  const x2 = x1 + colWidths[3]; // Pazar mesai col start
  const x3 = x2 + colWidths[4]; // Aciklama col start
  doc.line(x1, finalTableY, x1, finalTableY + footerRowH * 2);
  doc.line(x2, finalTableY, x2, finalTableY + footerRowH * 2);
  doc.line(x3, finalTableY, x3, finalTableY + footerRowH * 2);

  doc.setFont("Roboto", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("📊   TOPLAM YEVMİYE", margin + 8, finalTableY + 4.7);

  doc.setFontSize(11);
  doc.text(String(toplamYevmiye), x1 + colWidths[3] / 2, finalTableY + 4.8, { align: "center" });
  doc.text(String(toplamPazarMesai), x2 + colWidths[4] / 2, finalTableY + 4.8, { align: "center" });

  // Satır 2: TOPLAM SAAT
  const row2Y = finalTableY + footerRowH;
  doc.setFillColor(NAVY_DARK[0], NAVY_DARK[1], NAVY_DARK[2]);
  doc.rect(margin, row2Y, contentWidth, footerRowH, "F");

  doc.setFont("Roboto", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("🕒   TOPLAM SAAT", margin + 8, row2Y + 4.7);

  doc.setFontSize(11);
  doc.setTextColor(254, 243, 199);
  doc.text(String(toplamSaat), x1 + colWidths[3] / 2, row2Y + 4.8, { align: "center" });
  doc.text(String(Number((toplamPazarMesai * 7.5).toFixed(1))), x2 + colWidths[4] / 2, row2Y + 4.8, { align: "center" });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. ÖZET KPI KARTLARI (TÜM KARTLAR BEYAZ ARKA PLANLI, ÜST DÜZEY MODERN STİL)
  // ───────────────────────────────────────────────────────────────────────────
  const cardsY = row2Y + footerRowH + 6;
  const cardGap = 4;
  const cardW = (contentWidth - 3 * cardGap) / 4;
  const cardH = 22;
  const circleRadius = 4.5;

  const renderWhiteKpiCard = (
    cX: number,
    label: string,
    val: string,
    unit: string,
    iconType: "worker" | "clock" | "calendar" | "helmet"
  ) => {
    // Beyaz Dolgu + Temiz Çerçeve
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(cX, cardsY, cardW, cardH, 2.5, 2.5, "FD");

    const circX = cX + 8;
    const circY = cardsY + cardH / 2;

    // Her metrik için soft renk rozet zeminleri ve ikon renkleri
    let badgeBg = [238, 242, 255]; // Soft Indigo/Navy
    let iconColor = [15, 41, 77]; // Navy

    if (iconType === "clock") {
      badgeBg = [254, 243, 199]; // Soft Amber/Gold
      iconColor = [212, 139, 22];
    } else if (iconType === "calendar") {
      badgeBg = [209, 250, 229]; // Soft Emerald/Green
      iconColor = [16, 185, 129];
    } else if (iconType === "helmet") {
      badgeBg = [254, 226, 226]; // Soft Rose/Red
      iconColor = [225, 29, 72];
    }

    doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
    doc.circle(circX, circY, circleRadius, "F");

    // İkon Çizimleri
    doc.setFillColor(iconColor[0], iconColor[1], iconColor[2]);
    doc.setDrawColor(iconColor[0], iconColor[1], iconColor[2]);

    if (iconType === "worker") {
      doc.circle(circX, circY - 1.2, 1.4, "F");
      doc.roundedRect(circX - 2, circY + 0.6, 4, 2.5, 0.8, 0.8, "F");
    } else if (iconType === "clock") {
      doc.setLineWidth(0.4);
      doc.circle(circX, circY, 2.2, "D");
      doc.line(circX, circY - 1.2, circX, circY);
      doc.line(circX, circY, circX + 1, circY);
    } else if (iconType === "calendar") {
      doc.setLineWidth(0.4);
      doc.roundedRect(circX - 2.2, circY - 2.2, 4.4, 4.4, 0.6, 0.6, "D");
      doc.line(circX - 2.2, circY - 0.8, circX + 2.2, circY - 0.8);
      doc.circle(circX - 0.8, circY + 0.8, 0.4, "F");
      doc.circle(circX + 0.8, circY + 0.8, 0.4, "F");
    } else if (iconType === "helmet") {
      doc.roundedRect(circX - 2.5, circY - 1.5, 5, 2.8, 1.2, 1.2, "F");
      doc.rect(circX - 3.2, circY + 0.8, 6.4, 0.8, "F");
    }

    // Metinler (Tüm kartlarda net ve okunaklı lacivert/slate renkler)
    doc.setFont("Roboto", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139); // Slate Grey label
    doc.text(label, cX + 15, cardsY + 6.5);

    doc.setFontSize(16);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]); // Bold Navy Value
    doc.text(val, cX + 15, cardsY + 14.5);

    if (unit) {
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184); // Muted Subtitle
      doc.text(unit, cX + 15, cardsY + 19);
    }
  };

  // 4 Adet Beyaz Arka Planlı Şık Kart Render
  renderWhiteKpiCard(margin, "TOPLAM YEVMİYE", String(toplamYevmiye), "Yevmiye", "worker");
  renderWhiteKpiCard(margin + cardW + cardGap, "TOPLAM SAAT", String(toplamSaat), "Saat", "clock");
  renderWhiteKpiCard(margin + (cardW + cardGap) * 2, "ÇALIŞMA GÜNÜ", String(calismaGunuSayisi), "Gün", "calendar");
  renderWhiteKpiCard(margin + (cardW + cardGap) * 3, "PAZAR MESAİ YEVMİYE", String(toplamPazarMesai), "", "helmet");

  // ───────────────────────────────────────────────────────────────────────────
  // 5. EN ALT BİLGİLENDİRME ÇUBUĞU (Dipnot: 1 Yevmiye = 7.5 Saat + Sağ Şeritler)
  // ───────────────────────────────────────────────────────────────────────────
  const noticeY = cardsY + cardH + 5;
  const noticeH = 7;

  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
  doc.roundedRect(margin, noticeY, contentWidth, noticeH, 1.5, 1.5, "F");

  doc.setFont("Roboto", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("ⓘ   NOT: 1 Yevmiye = 7.5 Saat üzerinden hesaplanmıştır.", margin + 4, noticeY + 4.6);

  const stripeStartX = w - margin - 22;
  doc.setFillColor(GOLD[0], GOLD[1], GOLD[2]);
  for (let i = 0; i < 4; i++) {
    const sx = stripeStartX + i * 5;
    doc.triangle(sx, noticeY + noticeH, sx + 2, noticeY, sx + 4, noticeY, "F");
    doc.triangle(sx, noticeY + noticeH, sx + 4, noticeY, sx + 2, noticeY + noticeH, "F");
  }

  return doc;
}

export async function yevmiyeCizelgesiPdfOnizle(veri: YevmiyeCizelgesiPdfVeri): Promise<string> {
  const doc = await _olusturYevmiyeCizelgesi(veri);
  return pdfBlobUrl(doc);
}

export async function yevmiyeCizelgesiPdfIndir(veri: YevmiyeCizelgesiPdfVeri): Promise<void> {
  const doc = await _olusturYevmiyeCizelgesi(veri);
  pdfIndir(doc, `Yevmiye_Cizelgesi_${veri.yil}_${String(veri.ay).padStart(2, "0")}`);
}
