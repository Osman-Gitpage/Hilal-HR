/**
 * src/lib/pdf/bordroPdf.ts
 * Ücret Bordrosu PDF export - Landscape A4 premium tasarımı.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { yeniDoc, pdfBlobUrl, pdfIndir, temizSirketAdi } from "./pdfUtils";
import { createClient } from "@/supabase/client";
import { VARSAYILAN_AYLIK_CALISMA_SAATI } from "@/lib/constants";

export interface BordroSatir {
  id: string;
  personel: {
    id: string;
    ad: string;
    soyad: string;
    gorev_unvan: string | null;
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
  [key: string]: any;
}

function fmt(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return "0,00";
  return val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function _olustur(satirlar: BordroSatir[], yil: number, ay: number): Promise<jsPDF> {
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

  // Fetch ek kalemler for these bordros to calculate digerPlus and digerMinus
  const bordroIds = satirlar.map(b => b.id).filter(Boolean);
  const { data: ekKalemler } = bordroIds.length > 0
    ? await supabase.from("bordro_ek_kalem").select("bordro_id, tip, tutar").in("bordro_id", bordroIds)
    : { data: [] };

  const ekOdemelerMap = new Map<string, number>();
  const ekKesintilerMap = new Map<string, number>();
  for (const ek of ekKalemler || []) {
    if (ek.tip === "odeme") {
      ekOdemelerMap.set(ek.bordro_id, (ekOdemelerMap.get(ek.bordro_id) ?? 0) + Number(ek.tutar ?? 0));
    } else if (ek.tip === "kesinti") {
      ekKesintilerMap.set(ek.bordro_id, (ekKesintilerMap.get(ek.bordro_id) ?? 0) + Number(ek.tutar ?? 0));
    }
  }

  const AY_ADLARI = [
    "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];
  const donemMetni = `${AY_ADLARI[ay]} ${yil}`;

  const isTekPersonel = satirlar.length === 1;
  const tekPersonelAdSoyad = isTekPersonel 
    ? `${satirlar[0].personel?.ad} ${satirlar[0].personel?.soyad}`.toUpperCase()
    : "";

  const doc = await yeniDoc("landscape");
  (doc as any).isCustomFooter = true;
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  const totals = {
    maas: 0,
    calismaSaati: 0,
    hakedis: 0,
    mesaiSaati: 0,
    mesaiBedeli: 0,
    yol: 0,
    yemek: 0,
    prim: 0,
    digerPlus: 0,
    toplamOdeme: 0,
    banka: 0,
    bes: 0,
    avans: 0,
    digerMinus: 0,
    toplamKesinti: 0,
    elden: 0,
    eskiDevir: 0,
    yeniDevir: 0,
  };

  const rows = satirlar.map((b, i) => {
    const _maasNet = Number(b.maas_net ?? 0);
    const _calismaSaati = Number(b.calisma_saati ?? 0);
    const _mesaiSaati = Number(b.mesai_saati ?? 0);
    const saatlikUcret = aylikCalisma > 0 ? _maasNet / aylikCalisma : 0;
    const hakedis = _calismaSaati * saatlikUcret;
    const mesaiBedeli = _mesaiSaati * saatlikUcret;

    const ekOdeme = ekOdemelerMap.get(b.id) ?? 0;
    const ekKesinti = ekKesintilerMap.get(b.id) ?? 0;

    const digerPlus = Number(b.tazminat ?? 0) + Number(b.senelik_izin ?? 0) + ekOdeme;
    const digerMinus = Number(b.icra ?? 0) + ekKesinti + Number(b.iceri_avans_kesinti ?? 0);

    const elden = Number(b.toplam_odeme ?? 0) - Number(b.toplam_kesinti ?? 0);
    const eskiDevir = Number(b.iceri_avans_devir ?? 0);
    const yeniDevir = Math.max(0, eskiDevir + Number(b.iceri_avans_verilen ?? 0) - Number(b.iceri_avans_kesinti ?? 0));

    totals.maas += _maasNet;
    totals.calismaSaati += _calismaSaati;
    totals.hakedis += hakedis;
    totals.mesaiSaati += _mesaiSaati;
    totals.mesaiBedeli += mesaiBedeli;
    totals.yol += Number(b.yol ?? 0);
    totals.yemek += Number(b.yemek ?? 0);
    totals.prim += Number(b.prim ?? 0);
    totals.digerPlus += digerPlus;
    totals.toplamOdeme += Number(b.toplam_odeme ?? 0);
    totals.banka += Number(b.banka ?? 0);
    totals.bes += Number(b.bes ?? 0);
    totals.avans += Number(b.avans ?? 0);
    totals.digerMinus += digerMinus;
    totals.toplamKesinti += Number(b.toplam_kesinti ?? 0);
    totals.elden += elden;
    totals.eskiDevir += eskiDevir;
    totals.yeniDevir += yeniDevir;

    return {
      no: i + 1,
      adSoyad: `${b.personel?.ad} ${b.personel?.soyad}`,
      maas: fmt(_maasNet),
      calismaSaati: _calismaSaati,
      hakedis: fmt(hakedis),
      mesaiSaati: _mesaiSaati,
      mesaiBedeli: fmt(mesaiBedeli),
      yol: fmt(Number(b.yol ?? 0)),
      yemek: fmt(Number(b.yemek ?? 0)),
      prim: fmt(Number(b.prim ?? 0)),
      digerPlus: fmt(digerPlus),
      toplamOdeme: fmt(Number(b.toplam_odeme ?? 0)),
      banka: fmt(Number(b.banka ?? 0)),
      bes: fmt(Number(b.bes ?? 0)),
      avans: fmt(Number(b.avans ?? 0)),
      digerMinus: fmt(digerMinus),
      toplamKesinti: fmt(Number(b.toplam_kesinti ?? 0)),
      elden: fmt(elden),
      eskiDevir: fmt(eskiDevir),
      yeniDevir: fmt(yeniDevir),
    };
  });

  // Push the totals row to the body
  rows.push({
    no: "" as any,
    adSoyad: "TOPLAMLAR................" as any,
    maas: "" as any,
    calismaSaati: totals.calismaSaati as any,
    hakedis: fmt(totals.hakedis) as any,
    mesaiSaati: totals.mesaiSaati as any,
    mesaiBedeli: fmt(totals.mesaiBedeli) as any,
    yol: fmt(totals.yol) as any,
    yemek: fmt(totals.yemek) as any,
    prim: fmt(totals.prim) as any,
    digerPlus: fmt(totals.digerPlus) as any,
    toplamOdeme: fmt(totals.toplamOdeme) as any,
    banka: fmt(totals.banka) as any,
    bes: fmt(totals.bes) as any,
    avans: fmt(totals.avans) as any,
    digerMinus: fmt(totals.digerMinus) as any,
    toplamKesinti: fmt(totals.toplamKesinti) as any,
    elden: fmt(totals.elden) as any,
    eskiDevir: fmt(totals.eskiDevir) as any,
    yeniDevir: fmt(totals.yeniDevir) as any,
  });

  // Sütun genişlikleri — toplam tam 277mm (A4 landscape: 297mm - 2×10mm margin)
  // 5+22+15+9+15+7+15+13+13+13+13+16+16+13+13+13+16+16+17+17 = 277mm
  // eskiDevir/yeniDevir 17mm → "104.600,00" (10 karakter) 7.5pt'de sığar
  const columnStyles: Record<string, any> = {
    no:            { cellWidth: 5,  textColor: [100, 116, 139] },
    adSoyad:       { halign: "left", cellWidth: 22, fontStyle: "bold", textColor: [15, 23, 42] },
    maas:          { halign: "right", cellWidth: 15 },
    calismaSaati:  { halign: "center", cellWidth: 9 },
    hakedis:       { halign: "right", cellWidth: 15 },
    mesaiSaati:    { halign: "center", cellWidth: 7 },
    mesaiBedeli:   { halign: "right", cellWidth: 15 },
    yol:           { halign: "right", cellWidth: 13 },
    yemek:         { halign: "right", cellWidth: 13 },
    prim:          { halign: "right", cellWidth: 13 },
    digerPlus:     { halign: "right", cellWidth: 13 },
    toplamOdeme:   { halign: "right", cellWidth: 16 },
    banka:         { halign: "right", cellWidth: 16 },
    bes:           { halign: "right", cellWidth: 13 },
    avans:         { halign: "right", cellWidth: 13 },
    digerMinus:    { halign: "right", cellWidth: 13 },
    toplamKesinti: { halign: "right", cellWidth: 16 },
    elden:         { halign: "right", cellWidth: 16 },
    eskiDevir:     { halign: "right", cellWidth: 17 },
    yeniDevir:     { halign: "right", cellWidth: 17 },
  };

  autoTable(doc, {
    columns: [
      { header: "NO", dataKey: "no" },
      { header: "AD SOYAD", dataKey: "adSoyad" },
      { header: "MAAŞ", dataKey: "maas" },
      { header: "Ç.SAATİ", dataKey: "calismaSaati" },
      { header: "HAK EDİŞ", dataKey: "hakedis" },
      { header: "M.SAATİ", dataKey: "mesaiSaati" },
      { header: "MESAİ\nBEDELİ", dataKey: "mesaiBedeli" },
      { header: "YOL", dataKey: "yol" },
      { header: "YEMEK", dataKey: "yemek" },
      { header: "PRİM", dataKey: "prim" },
      { header: "DİĞER\n(+)", dataKey: "digerPlus" },
      { header: "TOPLAM", dataKey: "toplamOdeme" },
      { header: "BANKA", dataKey: "banka" },
      { header: "BES", dataKey: "bes" },
      { header: "AVANS", dataKey: "avans" },
      { header: "DİĞER\n(-)", dataKey: "digerMinus" },
      { header: "KESİNTİ", dataKey: "toplamKesinti" },
      { header: "ELDEN\n(NET)", dataKey: "elden" },
      { header: "ESKİ\nDEVİR", dataKey: "eskiDevir" },
      { header: "YENİ\nDEVİR", dataKey: "yeniDevir" },
    ],
    body: rows,
    startY: 28,
    margin: { left: 10, right: 10 },
    styles: {
      font: "Roboto",
      fontSize: 7.5,
      cellPadding: { top: 1.4, bottom: 1.4, left: 0.4, right: 0.4 }, // 0.4mm yatay → daha fazla metin alanı
      halign: "center",
      valign: "middle",
      overflow: "hidden", // Rakamların wrap yapmasını engelle — tek satırda tut
      lineWidth: { top: 0, bottom: 0.1, left: 0, right: 0 },
      lineColor: [226, 232, 240],
      textColor: [0, 0, 0],
      fillColor: [255, 255, 255],
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 7.5,
      cellPadding: { top: 1.8, bottom: 1.8, left: 0.4, right: 0.4 },
      overflow: "hidden",
      lineWidth: { top: 0.8, bottom: 0.8, left: 0, right: 0 },
      lineColor: [0, 0, 0],
    },
    columnStyles,
    didParseCell: (data) => {
      const colId = data.column.dataKey as string;

      // Make body cells bold for adSoyad, toplamOdeme, and elden
      if (data.section === "body") {
        data.cell.styles.textColor = [0, 0, 0]; // Ensure all text in body is high-contrast black
        
        if (colId === "adSoyad") {
          data.cell.styles.fontStyle = "bold";
        }
      }

      if (colId === "toplamOdeme") {
        data.cell.styles.textColor = [204, 119, 0]; // Amber #cc7700
        if (data.section === "body") {
          data.cell.styles.fontStyle = "bold";
        }
      }
      if (colId === "elden") {
        data.cell.styles.textColor = [204, 0, 0]; // Red #cc0000
        if (data.section === "body") {
          data.cell.styles.fontStyle = "bold";
        }
      }

      // Check if this is the totals row
      if (data.row.index === rows.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [0, 0, 0];
        if (colId === "toplamOdeme") {
          data.cell.styles.textColor = [204, 119, 0];
        }
        if (colId === "elden") {
          data.cell.styles.textColor = [204, 0, 0];
        }
      }
    },
    willDrawCell: (data) => {
      if (data.section === "body" && data.row.index < rows.length - 1) {
        doc.setDrawColor(107, 114, 128); // Grey #6b7280
        doc.setLineWidth(0.2);
      }
    },
    didDrawCell: (data) => {
      // Draw double thick borders above and below the totals row
      if (data.row.index === rows.length - 1) {
        const startX = data.cell.x;
        const endX = data.cell.x + data.cell.width;
        const yTop = data.cell.y;
        const yBottom = data.cell.y + data.cell.height;

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.8);
        doc.line(startX, yTop, endX, yTop);
        doc.line(startX, yBottom, endX, yBottom);
      }
    },
    didDrawPage: (data) => {
      // ─── PREMIUM HEADER ───
      doc.setFont("Roboto", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`Ünvan..............: ${sirketAdi}`, 10, 15);

      doc.setFont("Roboto", "bold");
      doc.setFontSize(15);
      const baslikMetni = isTekPersonel 
        ? tekPersonelAdSoyad
        : "ÜCRET BORDROSU";
      doc.text(baslikMetni, w / 2, 14, { align: "center" });

      doc.setFont("Roboto", "bold");
      doc.setFontSize(11);
      const altBaslikMetni = isTekPersonel
        ? `${donemMetni} Ücret Bordrosu`
        : donemMetni;
      doc.text(altBaslikMetni, w / 2, 20, { align: "center" });

      // Page stamp on the top right
      doc.setFont("Roboto", "normal");
      doc.setFontSize(9);
      doc.text(`Sayfa ${data.pageNumber}`, w - 10, 15, { align: "right" });

      // Thick black divider line at the very top of the table area
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);
      doc.line(10, 24, w - 10, 24);
    }
  });

  // Stamp footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text("Hilal Muhasebe Yazılımı", 10, h - 6);
  }

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
