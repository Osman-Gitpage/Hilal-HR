/**
 * src/lib/pdf/pusulaPdf.ts
 * Personel Hesap Pusulası PDF export - Landscape A4 formatında.
 * Bire bir kullanıcının sağladığı jsPDF çizim kodunu bizim veri modellerimizle eşleştirir.
 */

import jsPDF from "jspdf";
import { yeniDoc, pdfBlobUrl, pdfIndir, temizSirketAdi } from "./pdfUtils";
import { createClient } from "@/supabase/client";
import { VARSAYILAN_AYLIK_CALISMA_SAATI } from "@/lib/constants";

export interface PusulaBordroSatir {
  id: string;
  personel_id: string;
  personel: {
    id: string;
    ad: string;
    soyad: string;
    gorev_unvan: string | null;
    tc?: string | null;
    tc_kimlik_no?: string | null;
  };
  maas_net?: number | string | null;
  calisma_saati?: number | string | null;
  mesai_saati?: number | string | null;
  yol?: number | string | null;
  yemek?: number | string | null;
  prim?: number | string | null;
  tazminat?: number | string | null;
  senelik_izin?: number | string | null;
  banka?: number | string | null;
  bes?: number | string | null;
  avans?: number | string | null;
  icra?: number | string | null;
  toplam_odeme?: number | string | null;
  toplam_kesinti?: number | string | null;
  iceri_avans_devir?: number | string | null;
  iceri_avans_verilen?: number | string | null;
  iceri_avans_kesinti?: number | string | null;
  yillik_izin_gun?: number | string | null;
  notlar?: any;
  [key: string]: any;
}

const aylar = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const format = (n: number | string | null | undefined): string => {
  const num = parseFloat(String(n ?? 0));
  if (isNaN(num) || num === 0) return "0";
  return num.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// ─── Renk sabitleri ──────────────────────────────────────────────────────────
const C = {
  white: [255, 255, 255],
  black: [0, 0, 0],
  gray666: [102, 102, 102],
  gray1a: [26, 26, 26],
  gray2d: [45, 55, 72],
  gray33: [51, 65, 85],
  gray47: [71, 85, 105],
  gray94: [148, 163, 184],
  grayf8: [248, 250, 252],
  grayf1: [241, 245, 249],
  grayd1: [209, 217, 230],
  graycc: [204, 204, 204],
  grayee: [238, 238, 238],
  slate1e: [30, 41, 59],
  slate0f: [15, 23, 42],
  green05: [5, 150, 105],
  red: [225, 29, 72],
  blue: [59, 130, 246],
};

function _cizTekSayfa(
  doc: jsPDF,
  b: PusulaBordroSatir,
  yil: number,
  ay: number,
  sirketAdi: string,
  ekOdemeSum: number,
  ekKesintiSum: number,
  ekOdemelerList: { ad: string; tutar: number }[],
  ekKesintilerList: { ad: string; tutar: number }[],
  aylikCalisma: number
) {
  const PW = 297; // sayfa genişliği
  const PAD = 8;   // kenar boşluğu
  const CW = PW - PAD * 2; // içerik genişliği

  const periodStr = `${aylar[ay - 1].toUpperCase()} / ${yil}`;

  const maas = Number(b.maas_net ?? 0);
  const saatBedeli = aylikCalisma > 0 ? maas / aylikCalisma : 0;
  const normalMesaiSaati = Number(b.calisma_saati ?? 0);
  const hakEdis = normalMesaiSaati * saatBedeli;
  const ekMesaiSaati = Number(b.mesai_saati ?? 0);
  const ekMesaiBedeli = ekMesaiSaati * saatBedeli;

  const yol = Number(b.yol ?? 0);
  const yemek = Number(b.yemek ?? 0);
  const prim = Number(b.prim ?? 0);
  const tazminat = Number(b.tazminat ?? 0);
  const izinUcreti = Number(b.senelik_izin ?? 0);

  const ekOdemeler = ekOdemeSum;
  const digerKazanc = tazminat + izinUcreti + ekOdemeler;

  const bankaOdemesi = Number(b.banka ?? 0);
  const besKesintisi = Number(b.bes ?? 0);
  const avansOdemesi = Number(b.avans ?? 0);
  const icra = Number(b.icra ?? 0);
  const digerKesinti = ekKesintiSum;

  const toplamOdeme = Number(b.toplam_odeme ?? 0);
  const toplamKesinti = Number(b.toplam_kesinti ?? 0);
  const netOdeme = toplamOdeme - toplamKesinti;

  const mesaiGunu = normalMesaiSaati >= aylikCalisma ? 30 : Math.max(0, Math.round(30 * (normalMesaiSaati / aylikCalisma)));
  const eksikGun = 30 - mesaiGunu > 0 ? 30 - mesaiGunu : 0;

  const devredenAvans = Number(b.iceri_avans_devir ?? 0);
  const verilenAvans = Number(b.iceri_avans_verilen ?? 0);
  const kesilenAvans = Number(b.iceri_avans_kesinti ?? 0);
  const kalanAvans = Math.max(0, devredenAvans + verilenAvans - kesilenAvans);

  const kullanilanIzin = Number(b.yillik_izin_gun ?? 0);

  const personelAdSoyad = `${b.personel?.ad} ${b.personel?.soyad}`.toUpperCase();

  // ── Düşük seviyeli çizim yardımcıları ────────────────────────────────────

  /** Metin yaz (Roboto Türkçe Font ile uyumlu hale getirildi) */
  const text = (str: any, x: number, yVal: number, opts: any = {}) => {
    const { size = 10, weight = "normal", color = C.black, align = "left" } = opts;
    doc.setFontSize(size);
    doc.setFont("Roboto", weight === 700 || weight === "bold" ? "bold" : "normal");
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(String(str ?? ""), x, yVal, { align });
  };

  /** Dolgu dikdörtgeni */
  const fillRect = (x: number, yVal: number, w: number, h: number, color: number[]) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(x, yVal, w, h, "F");
  };

  /** Kenarlı dikdörtgen */
  const strokeRect = (x: number, yVal: number, w: number, h: number, color = C.grayd1, lw = 0.2) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(lw);
    doc.rect(x, yVal, w, h, "S");
  };

  /** Dolgu + kenarlı dikdörtgen */
  const fillStrokeRect = (x: number, yVal: number, w: number, h: number, fill: number[], stroke = C.grayd1, lw = 0.2) => {
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
    doc.setLineWidth(lw);
    doc.rect(x, yVal, w, h, "FD");
  };

  /** Yatay çizgi */
  const hLine = (x1: number, x2: number, yVal: number, color = C.grayd1, lw = 0.2) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(lw);
    doc.line(x1, yVal, x2, yVal);
  };

  /** Dikey çizgi */
  const vLine = (x: number, y1: number, y2: number, color = C.grayd1, lw = 0.2) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(lw);
    doc.line(x, y1, x, y2);
  };

  // ── 1. HEADER ─────────────────────────────────────────────────────────────
  let currentY = PAD;
  const headerH = 15;
  const headerY = currentY;

  // Orta: Badge + dönem (Vertically centered perfectly!)
  const cx = PAD + CW / 2;
  const badgeW = 72;
  const badgeX = cx - badgeW / 2;
  const badgeH = 7;
  fillStrokeRect(badgeX, headerY + 1, badgeW, badgeH, C.grayf8, C.grayd1);
  text("PERSONEL ÖDEME PUSULASI", cx, headerY + 5.8, { size: 9, weight: 700, color: C.gray2d, align: "center" });
  text(periodStr, cx, headerY + 12, { size: 10, weight: 500, color: C.gray33, align: "center" });

  // Sağ: Personel ad soyad
  const rX = PAD + CW;
  text("PERSONEL AD SOYAD", rX, headerY + 4, { size: 7, color: C.gray666, align: "right" });
  text(personelAdSoyad, rX, headerY + 9.5, { size: 11, weight: 700, color: C.gray1a, align: "right" });

  // Alt çizgi
  currentY = headerY + headerH;
  hLine(PAD, PAD + CW, currentY, C.graycc, 0.3);
  currentY += 3;

  // ── 2. SUMMARY ROW ────────────────────────────────────────────────────────
  const summaryX = PAD;
  const summaryW = CW;

  // Eşit sütun dağılımı (Sütunlar 100% kaplayacak şekilde /6 oranında dağıtıldı!)
  const colW = summaryW / 6;
  const summaryHeaderH = 8;
  const summaryRowH = 9;
  const summaryTotalH = summaryHeaderH + summaryRowH;

  // Dış kutu
  fillStrokeRect(summaryX, currentY, summaryW, summaryTotalH, C.white, C.grayd1);

  // Header arkaplanı
  fillRect(summaryX, currentY, summaryW, summaryHeaderH, C.grayf8);
  hLine(summaryX, summaryX + summaryW, currentY + summaryHeaderH, C.grayd1, 0.2);

  // Sütun başlıkları (YAZI BOYUTU BÜYÜTÜLDÜ: size: 9)
  const sumCols = [
    { label: "TÜR", w: colW },
    { label: "MAAŞ", w: colW },
    { label: "NORMAL GÜN", w: colW },
    { label: "TOPLAM ÖDEME", w: colW },
    { label: "TOPLAM KESİNTİ", w: colW },
    { label: "ELDEN ALACAK", w: colW },
  ];
  let sx = summaryX;
  sumCols.forEach((col, i) => {
    if (i > 0) vLine(sx, currentY, currentY + summaryTotalH, C.grayd1, 0.2);
    text(col.label, sx + col.w / 2, currentY + 5.8, { size: 9, weight: 700, color: C.gray47, align: "center" });
    sx += col.w;
  });

  // Veri satırı (YAZI BOYUTLARI BÜYÜTÜLDÜ: size: 10.5 / 12.5)
  const sumVals = [
    { val: "Genel Toplam", big: false },
    { val: format(maas), big: false },
    { val: format(mesaiGunu), big: false },
    { val: format(toplamOdeme), big: false },
    { val: format(toplamKesinti), big: false },
    { val: format(netOdeme), big: true },
  ];
  sx = summaryX;
  const dataY = currentY + summaryHeaderH;
  sumVals.forEach((item, i) => {
    if (i > 0) vLine(sx, dataY, dataY + summaryRowH, C.grayf1, 0.2);
    text(item.val, sx + sumCols[i].w / 2, dataY + 6.2,
      { size: item.big ? 12.5 : 10.5, weight: 600, color: item.big ? C.red : C.slate1e, align: "center" });
    sx += sumCols[i].w;
  });

  currentY += summaryTotalH + 4;

  // ── 3. ÜÇ KOLON (Ödemeler | Kesintiler | İçeriye Avans) ──────────────────
  const colGap = 2;
  const colCount = 3;
  const eachW = (CW - colGap * (colCount - 1)) / colCount;
  const colHeaderH = 7;

  // SATIR YÜKSEKLİĞİ EŞİTLENDİ VE BÜYÜTÜLDÜ (rowH = 6.8)
  const rowH = 6.8;
  const colBodyPad = 3;
  const totalRows = 9; // Tüm kutular eşit 9 satır olarak çizilecek
  const bodyH = totalRows * rowH + colBodyPad * 2;

  // ─ Yardımcı: kolon header + body dikdörtgeni ─
  const drawColumnBox = (cx2: number, cy: number, colW: number) => {
    strokeRect(cx2, cy, colW, colHeaderH + bodyH, C.grayd1, 0.2);
    fillRect(cx2 + 0.1, cy + 0.1, colW - 0.2, colHeaderH - 0.1, C.grayf8);
    hLine(cx2, cx2 + colW, cy + colHeaderH, C.grayd1, 0.2);
  };

  // ─ Yardımcı: basit row (label + value) ─
  const drawRow = (cx2: number, ryVal: number, colW: number, label: string, value: string, opts: any = {}) => {
    const {
      labelBold = false, valueBold = false,
      labelColor = C.gray33, valueColor = C.slate1e,
      fontSize = 9, borderBottom = true
    } = opts;
    const valueX = cx2 + colW - colBodyPad;

    // Satır dikey ortalama (6.8mm için 2.2mm baseline offseti)
    const textY = ryVal + rowH - 2.2;

    text(label, cx2 + colBodyPad, textY, { size: fontSize, weight: labelBold ? 700 : "normal", color: labelColor });
    text(value, valueX, textY, { size: fontSize, weight: valueBold ? 700 : 500, color: valueColor, align: "right" });
    if (borderBottom) hLine(cx2, cx2 + colW, ryVal + rowH, C.grayf1, 0.15);
    return ryVal + rowH;
  };

  // ── Ödemeler Kolonu (9 Satır) ───────────────────────────────────────────────────────
  const col1X = PAD;
  drawColumnBox(col1X, currentY, eachW);

  // TABLO BAŞLIK FONTU BÜYÜTÜLDÜ (size: 9.8)
  text("ÖDEMELER", col1X + eachW / 2, currentY + 5.2,
    { size: 9.8, weight: 700, color: C.slate1e, align: "center" });

  let ry1 = currentY + colHeaderH + colBodyPad;
  ry1 = drawRow(col1X, ry1, eachW, `Çalışma Saati | Saat Bedeli: ${format(saatBedeli)}`, format(normalMesaiSaati));
  ry1 = drawRow(col1X, ry1, eachW, "Hak Ediş", format(hakEdis), { labelBold: true, valueBold: true, labelColor: C.slate0f, valueColor: C.slate0f });
  ry1 = drawRow(col1X, ry1, eachW, "Ek Mesai Saati", format(ekMesaiSaati));
  ry1 = drawRow(col1X, ry1, eachW, "Ek Mesai Bedeli", format(ekMesaiBedeli), { labelBold: true, valueBold: true, labelColor: C.slate0f, valueColor: C.slate0f });
  ry1 = drawRow(col1X, ry1, eachW, "Yol Ücreti", format(yol));
  ry1 = drawRow(col1X, ry1, eachW, "Yemek Ücreti", format(yemek));
  ry1 = drawRow(col1X, ry1, eachW, "Bonus / Prim", format(prim));
  ry1 = drawRow(col1X, ry1, eachW, "Ek Ödeme", format(digerKazanc), { labelBold: true, valueBold: true, labelColor: C.slate0f, valueColor: C.slate0f });

  // Satır 9: Toplam Ödeme
  hLine(col1X + 1, col1X + eachW - 1, ry1, C.graycc, 0.3);
  drawRow(col1X, ry1, eachW, "TOPLAM ÖDEME", format(toplamOdeme),
    { labelBold: true, valueBold: true, labelColor: C.slate0f, valueColor: C.green05, fontSize: 9.5, borderBottom: false });

  // ── Kesintiler Kolonu (9 Satır) ─────────────────────────────────────────────────────
  const col2X = col1X + eachW + colGap;
  drawColumnBox(col2X, currentY, eachW);

  // TABLO BAŞLIK FONTU BÜYÜTÜLDÜ (size: 9.8)
  text("KESİNTİLER", col2X + eachW / 2, currentY + 5.2,
    { size: 9.8, weight: 700, color: C.slate1e, align: "center" });

  let ry2 = currentY + colHeaderH + colBodyPad;
  ry2 = drawRow(col2X, ry2, eachW, "Banka Ödemesi", format(bankaOdemesi));
  ry2 = drawRow(col2X, ry2, eachW, "BES Kesintisi", format(besKesintisi));
  ry2 = drawRow(col2X, ry2, eachW, "Avans Ödemesi", format(avansOdemesi));
  ry2 = drawRow(col2X, ry2, eachW, "İcra", format(icra));
  ry2 = drawRow(col2X, ry2, eachW, "Ek Kesinti", format(digerKesinti), { labelBold: true, valueBold: true, labelColor: C.slate0f, valueColor: C.slate0f });
  ry2 = drawRow(col2X, ry2, eachW, " ", " ");
  ry2 = drawRow(col2X, ry2, eachW, " ", " ");

  // Satır 8: Toplam Kesinti
  hLine(col2X + 1, col2X + eachW - 1, ry2, C.graycc, 0.3);
  ry2 = drawRow(col2X, ry2, eachW, "TOPLAM KESİNTİ", format(toplamKesinti),
    { labelBold: true, valueBold: true, labelColor: C.slate0f, valueColor: C.slate0f, fontSize: 9.5 });

  // Satır 9: Net Elden (Vurgulu Koyu Gri Zemin)
  fillRect(col2X + 0.1, ry2 + 0.1, eachW - 0.2, rowH - 0.2, C.grayf8);
  drawRow(col2X, ry2, eachW, "NET ELDEN", format(netOdeme),
    { labelBold: true, valueBold: true, labelColor: C.red, valueColor: C.red, fontSize: 10.5, borderBottom: false });

  // ── İçeriye Avans Kolonu (9 Satır) ──────────────────────────────────────────────────
  const col3X = col2X + eachW + colGap;
  drawColumnBox(col3X, currentY, eachW);

  // TABLO BAŞLIK FONTU BÜYÜTÜLDÜ (size: 9.8)
  text("İÇERİYE AVANS", col3X + eachW / 2, currentY + 5.2,
    { size: 9.8, weight: 700, color: C.slate1e, align: "center" });

  let ry3 = currentY + colHeaderH + colBodyPad;
  ry3 = drawRow(col3X, ry3, eachW, "Devredilen İçeriye Avans", format(devredenAvans));
  ry3 = drawRow(col3X, ry3, eachW, "Verilen İçeriye Avans", format(verilenAvans));
  ry3 = drawRow(col3X, ry3, eachW, "Kesilen İçeriye Avans", format(kesilenAvans));
  ry3 = drawRow(col3X, ry3, eachW, "Kalan İçeriye Avans", format(kalanAvans),
    { labelBold: true, valueBold: true, labelColor: C.green05, valueColor: C.green05 });

  // Satır 5: YILLIK İZİN (Section header - FONT BÜYÜTÜLDÜ: size: 9.8)
  fillRect(col3X + 0.1, ry3 + 0.1, eachW - 0.2, rowH - 0.2, C.grayf8);
  text("YILLIK İZİN", col3X + eachW / 2, ry3 + rowH - 2.2, { size: 9.8, weight: 700, color: C.slate1e, align: "center" });
  hLine(col3X, col3X + eachW, ry3 + rowH, C.grayd1, 0.2);
  ry3 += rowH;

  // Satır 6: Kullanılan İzin
  ry3 = drawRow(col3X, ry3, eachW, "Kullanılan", format(kullanilanIzin));

  // Satır 7: EKSİK GÜN (Section header - FONT BÜYÜTÜLDÜ: size: 9.8)
  fillRect(col3X + 0.1, ry3 + 0.1, eachW - 0.2, rowH - 0.2, C.grayf8);
  text("EKSİK GÜN", col3X + eachW / 2, ry3 + rowH - 2.2, { size: 9.8, weight: 700, color: C.slate1e, align: "center" });
  hLine(col3X, col3X + eachW, ry3 + rowH, C.grayd1, 0.2);
  ry3 += rowH;

  // Satır 8: Eksik Gün
  ry3 = drawRow(col3X, ry3, eachW, "Eksik Gün", format(eksikGun));

  // Satır 9: Hizalama Boş Satırı
  drawRow(col3X, ry3, eachW, " ", " ", { borderBottom: false });

  // Alt bölüme geçiş
  currentY = currentY + colHeaderH + bodyH + 4;

  // ── 4. ALT BÖLÜM (3 kolon: Ek Ödeme Detay | Ek Kesinti Detay | Notlar) ──
  const botColH = 35;
  const botRowH = 5;

  const drawBottomCol = (bx: number, by: number, title: string) => {
    strokeRect(bx, by, eachW, botColH, C.grayd1, 0.2);
    fillRect(bx + 0.1, by + 0.1, eachW - 0.2, colHeaderH - 0.1, C.grayf8);
    hLine(bx, bx + eachW, by + colHeaderH, C.grayd1, 0.2);
    text(title, bx + eachW / 2, by + 5.2, { size: 9.8, weight: 700, color: C.slate1e, align: "center" });
  };

  // ─ Ek Ödeme Detay (FONT BÜYÜTÜLDÜ: header size 9.8, row size 9.5) ─
  drawBottomCol(col1X, currentY, "EK ÖDEME DETAY");
  let bry = currentY + colHeaderH + colBodyPad;
  hLine(col1X + 1, col1X + eachW - 1, bry + botRowH, C.graycc, 0.25);
  text("Açıklama", col1X + colBodyPad, bry + botRowH - 1.5, { size: 9.8, weight: 700, color: C.slate0f });
  text("Tutar", col1X + eachW - colBodyPad, bry + botRowH - 1.5, { size: 9.8, weight: 700, color: C.slate0f, align: "right" });
  bry += botRowH + 1;
  const epList = ekOdemelerList.filter(ek => ek.tutar > 0);
  epList.forEach(ek => {
    text(ek.ad || "Ek Ödeme", col1X + colBodyPad, bry + botRowH - 1.5, { size: 9.5, weight: 700 });
    text(format(ek.tutar), col1X + eachW - colBodyPad, bry + botRowH - 1.5, { size: 9.5, weight: 700, align: "right" });
    hLine(col1X, col1X + eachW, bry + botRowH, C.grayf1, 0.15);
    bry += botRowH;
  });

  // ─ Ek Kesinti Detay (FONT BÜYÜTÜLDÜ: header size 9.8, row size 9.5) ─
  drawBottomCol(col2X, currentY, "EK KESİNTİ DETAY");
  bry = currentY + colHeaderH + colBodyPad;
  hLine(col2X + 1, col2X + eachW - 1, bry + botRowH, C.graycc, 0.25);
  text("Açıklama", col2X + colBodyPad, bry + botRowH - 1.5, { size: 9.8, weight: 700, color: C.slate0f });
  text("Tutar", col2X + eachW - colBodyPad, bry + botRowH - 1.5, { size: 9.8, weight: 700, color: C.slate0f, align: "right" });
  bry += botRowH + 1;
  const edList = ekKesintilerList.filter(ek => ek.tutar > 0);
  edList.forEach(ek => {
    text(ek.ad || "Ek Kesinti", col2X + colBodyPad, bry + botRowH - 1.5, { size: 9.5, weight: 700 });
    text(format(ek.tutar), col2X + eachW - colBodyPad, bry + botRowH - 1.5, { size: 9.5, weight: 700, align: "right" });
    hLine(col2X, col2X + eachW, bry + botRowH, C.grayf1, 0.15);
    bry += botRowH;
  });

  // ─ Bilgi / Notlar (FONT BÜYÜTÜLDÜ: size 10, placeholder size 9.5) ─
  drawBottomCol(col3X, currentY, "BİLGİ / NOTLAR");
  bry = currentY + colHeaderH + colBodyPad;

  const notesArray = Array.isArray(b.notlar) ? b.notlar : [];
  const notesText = notesArray.map((n: any) => n.metin || "").filter(Boolean).join("\n");

  if (notesText) {
    const lines = String(notesText).split("\n");
    lines.forEach(satir => {
      const temiz = satir.trim().replace(/,{2,}$/, "");
      if (!temiz) return;
      doc.setFontSize(10);
      doc.setTextColor(C.blue[0], C.blue[1], C.blue[2]);
      doc.text("•", col3X + colBodyPad, bry + botRowH - 1.5);
      text(temiz, col3X + colBodyPad + 4, bry + botRowH - 1.5, { size: 10, color: C.gray33 });
      bry += botRowH;
    });
  } else {
    text("Bu ay için eklenmiş bir not bulunmamaktadır.",
      col3X + eachW / 2, currentY + colHeaderH + botColH / 2 + 2,
      { size: 9.5, color: C.gray94, align: "center" });
  }
}

async function _olustur(satirlar: PusulaBordroSatir[], yil: number, ay: number): Promise<jsPDF> {
  const supabase = createClient();

  // Fetch settings for aylik_calisma_saati
  const { data: ayarlar } = await supabase
    .from("ayarlar")
    .select("aylik_calisma_saati")
    .maybeSingle();
  const aylikCalisma = ayarlar?.aylik_calisma_saati ?? VARSAYILAN_AYLIK_CALISMA_SAATI;

  // Fetch active sirket name
  const { data: aktifSirket } = await supabase
    .from("sirketler")
    .select("ad")
    .limit(1)
    .maybeSingle();
  const sirketAdi = temizSirketAdi(aktifSirket?.ad || "HİLAL İZOLASYON");

  // Fetch ek kalemler to compute additions/deductions
  const bordroIds = satirlar.map(b => b.id).filter(Boolean);
  const { data: ekKalemler } = bordroIds.length > 0
    ? await supabase.from("bordro_ek_kalem").select("bordro_id, tip, ad, tutar").in("bordro_id", bordroIds)
    : { data: [] };

  const ekOdemelerMap = new Map<string, { ad: string; tutar: number }[]>();
  const ekKesintilerMap = new Map<string, { ad: string; tutar: number }[]>();
  const ekOdemelerSumMap = new Map<string, number>();
  const ekKesintilerSumMap = new Map<string, number>();

  for (const ek of ekKalemler || []) {
    const tutarVal = Number(ek.tutar ?? 0);
    if (ek.tip === "odeme") {
      const current = ekOdemelerMap.get(ek.bordro_id) ?? [];
      current.push({ ad: ek.ad, tutar: tutarVal });
      ekOdemelerMap.set(ek.bordro_id, current);
      ekOdemelerSumMap.set(ek.bordro_id, (ekOdemelerSumMap.get(ek.bordro_id) ?? 0) + tutarVal);
    } else if (ek.tip === "kesinti") {
      const current = ekKesintilerMap.get(ek.bordro_id) ?? [];
      current.push({ ad: ek.ad, tutar: tutarVal });
      ekKesintilerMap.set(ek.bordro_id, current);
      ekKesintilerSumMap.set(ek.bordro_id, (ekKesintilerSumMap.get(ek.bordro_id) ?? 0) + tutarVal);
    }
  }

  // A4 Landscape page creation (with custom fonts registered)
  const doc = await yeniDoc("landscape");
  (doc as any).isCustomFooter = true; // Use custom footer stamps
  const w = doc.internal.pageSize.getWidth(); // 297mm
  const h = doc.internal.pageSize.getHeight(); // 210mm
  const mLeft = 8;
  const mRight = 8;

  for (let idx = 0; idx < satirlar.length; idx++) {
    const b = satirlar[idx];
    if (idx > 0) {
      doc.addPage();
    }

    const ekOdemelerList = ekOdemelerMap.get(b.id) ?? [];
    const ekKesintilerList = ekKesintilerMap.get(b.id) ?? [];
    const ekOdemeSum = ekOdemelerSumMap.get(b.id) ?? 0;
    const ekKesintiSum = ekKesintilerSumMap.get(b.id) ?? 0;

    _cizTekSayfa(
      doc,
      b,
      yil,
      ay,
      sirketAdi,
      ekOdemeSum,
      ekKesintiSum,
      ekOdemelerList,
      ekKesintilerList,
      aylikCalisma
    );
  }



  return doc;
}

export async function pusulaPdfOnizle(satirlar: PusulaBordroSatir[], yil: number, ay: number): Promise<string> {
  const doc = await _olustur(satirlar, yil, ay);
  return pdfBlobUrl(doc);
}

export async function pusulaPdfIndir(satirlar: PusulaBordroSatir[], yil: number, ay: number): Promise<void> {
  const doc = await _olustur(satirlar, yil, ay);
  pdfIndir(doc, `Pusula_${yil}_${String(ay).padStart(2, "0")}`);
}
