/**
 * src/lib/pdf/puantajPdf.ts
 * Puantaj tablosu PDF — landscape A4, günlük grid
 * Premium tasarıma sahip modern ve şık çıktı tasarımı.
 * Özellikler:
 *   - Genel & Proje Puantaj tabloları
 *   - Ek Mesai sütunu desteği
 *   - Personel Günlük Notları 2. Sayfada şık tablo halinde gösterim
 *   - Toplu PDF (Genel + Tüm Projeler tek PDF dosyasında)
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { yeniDoc, pdfBlobUrl, pdfIndir, temizSirketAdi } from "./pdfUtils";
import { OZEL_DURUMLAR } from "@/lib/constants";
import { useSirketStore } from "@/stores/sirketStore";

const AY_ADLARI = [
  "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

interface HucreDurumu {
  calisma_saati?: number | null;
  mesai_saati?: number | null;
  ozel_durum?: string | null;
  giris_saati?: string | null;
  aciklama?: string | null;
}

interface Personel {
  id: string;
  ad: string;
  soyad: string;
  gorev_unvan?: string | null;
}

export interface PuantajPdfVeri {
  personeller: Personel[];
  puantajlar: (HucreDurumu & { personel_id: string; tarih: string })[];
  ozetler?: {
    personel_id: string;
    sgk_gun_override: number | null;
    maas_saati_override: number | null;
    mesai_saati_override: number | null;
  }[];
  yil: number;
  ay: number;
  baslik?: string;
}

export interface ProjePuantajPdfVeri {
  personeller: Personel[];
  satirlar: (HucreDurumu & { personel_id: string; tarih: string; saat?: number | null })[];
  projeAdi: string;
  yil: number;
  ay: number;
  baslik?: string;
}

export interface TopluPuantajPdfVeri {
  personeller: Personel[];
  puantajlar: (HucreDurumu & { personel_id: string; tarih: string })[];
  ozetler?: {
    personel_id: string;
    sgk_gun_override: number | null;
    maas_saati_override: number | null;
    mesai_saati_override: number | null;
  }[];
  projeler: { id: string; ad: string; firma_adi?: string | null }[];
  projePuantajlar: (HucreDurumu & {
    proje_id: string;
    personel_id: string;
    tarih: string;
    saat?: number | null;
    personel?: { id: string; ad: string; soyad: string };
  })[];
  yil: number;
  ay: number;
}

function gunDeger(veri?: HucreDurumu): string {
  if (!veri) return "";
  if (veri.ozel_durum) {
    const oz = OZEL_DURUMLAR[veri.ozel_durum as keyof typeof OZEL_DURUMLAR];
    const kod = oz?.kod ?? veri.ozel_durum;
    const mesai = veri.mesai_saati ?? (oz && oz.saat === 0 && oz.mesai > 0 ? oz.mesai : 0);
    const saat = oz ? oz.saat : 0;

    if (saat === 0 && mesai > 0) {
      return `+${mesai}`;
    }
    return mesai > 0 ? `${kod}+${mesai}` : kod;
  }
  if (veri.calisma_saati != null) {
    const mesai = veri.mesai_saati ?? 0;
    return mesai > 0 ? `${veri.calisma_saati}+${mesai}` : String(veri.calisma_saati);
  }
  return "";
}

function formatTarihTR(tarihStr: string): string {
  const parts = tarihStr.split("-");
  if (parts.length !== 3) return tarihStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

// ─────────────────────────────────────────────
// Notlar Sayfası Ekleme Yardımcısı
// ─────────────────────────────────────────────

interface NotItemPDF {
  tarih: string;
  personelAd: string;
  unvan: string;
  projeAdi?: string;
  durum: string;
  aciklama: string;
}

function ekleNotlarSayfasi(
  doc: jsPDF,
  notlar: NotItemPDF[],
  sirketAdi: string,
  donemMetni: string,
  altBaslik: string
) {
  if (!notlar || notlar.length === 0) return;

  doc.addPage();
  const w = doc.internal.pageSize.getWidth();

  const columns = [
    { header: "No", dataKey: "no" },
    { header: "Tarih", dataKey: "tarih" },
    { header: "Ad Soyad", dataKey: "adSoyad" },
    { header: "Unvan", dataKey: "unvan" },
    ...(notlar.some((n) => !!n.projeAdi) ? [{ header: "Proje", dataKey: "proje" }] : []),
    { header: "Durum / Çalışma", dataKey: "durum" },
    { header: "Günlük Not / Açıklama", dataKey: "aciklama" },
  ];

  const rows = notlar.map((n, i) => ({
    no: i + 1,
    tarih: formatTarihTR(n.tarih),
    adSoyad: n.personelAd,
    unvan: n.unvan,
    proje: n.projeAdi ?? "-",
    durum: n.durum,
    aciklama: n.aciklama,
  }));

  autoTable(doc, {
    columns,
    body: rows,
    startY: 28,
    margin: { left: 10, right: 10 },
    styles: {
      font: "Roboto",
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [226, 232, 240],
      textColor: [15, 23, 42],
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: [244, 246, 249],
      textColor: [15, 41, 77],
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    columnStyles: {
      no: { cellWidth: 8, halign: "center" },
      tarih: { cellWidth: 20, halign: "center" },
      adSoyad: { cellWidth: 35, fontStyle: "bold" },
      unvan: { cellWidth: 25 },
      proje: { cellWidth: 30 },
      durum: { cellWidth: 22, halign: "center", fontStyle: "bold" },
      aciklama: { halign: "left" },
    },
    didDrawPage: () => {
      doc.setFont("Roboto", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 41, 77);
      doc.text(sirketAdi.toUpperCase(), 10, 15);

      doc.setFont("Roboto", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(75, 85, 99);
      doc.text(`PERSONEL GÜNLÜK NOTLARI — ${altBaslik}`, 10, 21);

      doc.setFont("Roboto", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(15, 41, 77);
      doc.text(donemMetni, w - 10, 15, { align: "right" });

      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.4);
      doc.line(10, 24, w - 10, 24);
    },
  });
}

// ─────────────────────────────────────────────
// GENEL PUANTAJ PDF OLUŞTURMA
// ─────────────────────────────────────────────

async function _olustur(veri: PuantajPdfVeri): Promise<jsPDF> {
  const doc = await yeniDoc("landscape");
  (doc as any).isCustomFooter = true;
  await _sayfaEkleGenel(doc, veri);
  _sayfaNumaralariEkle(doc);
  return doc;
}

async function _sayfaEkleGenel(doc: jsPDF, veri: PuantajPdfVeri): Promise<void> {
  const { personeller, puantajlar, ozetler, yil, ay, baslik } = veri;
  const sonGun = new Date(yil, ay, 0).getDate();

  const sirketAdi = temizSirketAdi(useSirketStore.getState().aktifSirket?.ad || "HİLAL İZOLASYON");
  const bugunStr = new Date().toLocaleDateString("tr-TR");
  const donemMetni = `${AY_ADLARI[ay]} ${yil}`;

  const gunler = Array.from({ length: sonGun }, (_, i) => {
    const gun = i + 1;
    const tarih = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
    const haftaGunu = new Date(yil, ay - 1, gun).getDay();
    return { gun, tarih, haftaGunu, pazar: haftaGunu === 0 };
  });

  // Puantaj haritası & Günlük Notlar
  const pMap = new Map<string, Map<string, HucreDurumu>>();
  const notlar: NotItemPDF[] = [];

  const persMap = new Map<string, Personel>();
  for (const p of personeller) persMap.set(p.id, p);

  for (const p of puantajlar) {
    if (!pMap.has(p.personel_id)) pMap.set(p.personel_id, new Map());
    pMap.get(p.personel_id)!.set(p.tarih, p);

    if (p.aciklama && p.aciklama.trim()) {
      const pers = persMap.get(p.personel_id);
      if (pers) {
        notlar.push({
          tarih: p.tarih,
          personelAd: `${pers.ad} ${pers.soyad}`,
          unvan: pers.gorev_unvan ?? "-",
          durum: gunDeger(p) || "-",
          aciklama: p.aciklama.trim(),
        });
      }
    }
  }

  // Özet haritası (override'lar)
  const ozetMap = new Map<string, { sgk_gun_override: number | null; maas_saati_override: number | null; mesai_saati_override: number | null }>();
  if (ozetler) {
    for (const o of ozetler) ozetMap.set(o.personel_id, o);
  }

  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Tablo başlıkları (Ek Mesai sütunu eklendi)
  const columns = [
    { header: "No", dataKey: "no" },
    { header: "Ad Soyad", dataKey: "adSoyad" },
    ...gunler.map(({ gun }) => ({
      header: String(gun),
      dataKey: `g${gun}`,
    })),
    { header: "Toplam", dataKey: "toplam" },
    { header: "Mesai", dataKey: "mesai" },
    { header: "Ek Mesai", dataKey: "ekMesai" },
    { header: "SGK", dataKey: "sgk" },
    { header: "Maaş", dataKey: "maas" },
  ];

  let toplamCalisma = 0;
  let toplamMesai = 0;

  const rows = personeller.map((p, index) => {
    let calisma = 0;
    let mesai = 0;
    let sgkGun = 0;

    const row: Record<string, string | number> = {
      no: index + 1,
      adSoyad: `${p.ad} ${p.soyad}`,
    };

    for (const { gun, tarih } of gunler) {
      const hData = pMap.get(p.id)?.get(tarih);
      row[`g${gun}`] = gunDeger(hData);

      if (hData) {
        if (hData.ozel_durum) {
          const oz = OZEL_DURUMLAR[hData.ozel_durum as keyof typeof OZEL_DURUMLAR];
          if (oz) {
            calisma += oz.saat;
            if (oz.saat > 0) sgkGun += 1;
          }
          const dbMesai = hData.mesai_saati;
          mesai += dbMesai != null ? Number(dbMesai) : (oz?.mesai ?? 0);
        } else if (hData.calisma_saati != null) {
          calisma += hData.calisma_saati;
          sgkGun += 1;
          if (hData.mesai_saati) {
            mesai += Number(hData.mesai_saati);
          }
        }
      }
    }

    const ozet = ozetMap.get(p.id);
    const finalSgk = ozet?.sgk_gun_override ?? sgkGun;
    const finalMaas = ozet?.maas_saati_override ?? calisma;
    const ekMesai = ozet?.mesai_saati_override ?? 0;
    const finalMesai = mesai + ekMesai;

    toplamCalisma += calisma;
    toplamMesai += finalMesai;

    row.toplam = calisma > 0 ? calisma : "-";
    row.mesai = finalMesai > 0 ? finalMesai : "-";
    row.ekMesai = ekMesai > 0 ? ekMesai : "-";
    row.sgk = finalSgk > 0 ? finalSgk : "-";
    row.maas = finalMaas > 0 ? finalMaas : "-";

    return row;
  });

  // Sabit kolonlar toplamı = No: 5, Ad Soyad: 32, Toplam: 11, Mesai: 9, Ek Mesai: 10, SGK: 8, Maaş: 9 (toplam 84mm)
  const gunGenisligi = (w - 20 - 5 - 32 - 47) / sonGun;

  const columnStyles: Record<string, any> = {
    no: { cellWidth: 5, textColor: [100, 116, 139] },
    adSoyad: { halign: "left", cellWidth: 32, textColor: [15, 23, 42] },
    toplam: { fontStyle: "bold", cellWidth: 11, textColor: [15, 23, 42] },
    mesai: { fontStyle: "bold", cellWidth: 9, textColor: [15, 23, 42] },
    ekMesai: { fontStyle: "bold", cellWidth: 10, textColor: [180, 83, 9] }, // Amber 700
    sgk: { fontStyle: "bold", cellWidth: 8, textColor: [15, 23, 42] },
    maas: { fontStyle: "bold", cellWidth: 9, textColor: [15, 23, 42] },
  };

  for (let d = 1; d <= sonGun; d++) {
    columnStyles[`g${d}`] = { cellWidth: gunGenisligi };
  }

  autoTable(doc, {
    columns,
    body: rows,
    startY: 28,
    margin: { left: 10, right: 10 },
    styles: {
      font: "Roboto",
      fontSize: 7.2,
      cellPadding: 1.2,
      halign: "center",
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [226, 232, 240],
      textColor: [15, 23, 42],
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: [244, 246, 249],
      textColor: [15, 41, 77],
      fontSize: 7.2,
      cellPadding: 1.5,
    },
    columnStyles,
    didParseCell: (data) => {
      const colId = data.column.dataKey as string;

      if (typeof colId === "string" && colId.startsWith("g")) {
        data.cell.styles.fontSize = 6.2;
        data.cell.styles.cellPadding = 0.2;
        if (data.section === "body") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [0, 0, 0];
        }

        const gunNum = parseInt(colId.substring(1));
        const { pazar } = gunler[gunNum - 1];
        if (pazar) {
          if (data.section === "head") {
            data.cell.styles.fillColor = [178, 82, 82];
            data.cell.styles.textColor = [255, 255, 255];
          } else if (data.section === "body") {
            data.cell.styles.fillColor = [253, 245, 245];
            data.cell.styles.textColor = [178, 82, 82];
          }
        }
      }

      if (data.section === "body" && ["toplam", "mesai", "ekMesai", "sgk", "maas"].includes(colId)) {
        data.cell.styles.fontStyle = "bold";
      }
    },
    didDrawPage: () => {
      doc.setFont("Roboto", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 41, 77);
      doc.text(sirketAdi.toUpperCase(), 10, 15);

      doc.setFont("Roboto", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(75, 85, 99);
      doc.text(baslik || "GENEL PUANTAJ RAPORU", 10, 21);

      doc.setFont("Roboto", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(15, 41, 77);
      doc.text(donemMetni, w - 10, 15, { align: "right" });

      doc.setFont("Roboto", "normal");
      doc.setFontSize(8);
      doc.setTextColor(113, 128, 150);
      doc.text(`Oluşturulma: ${bugunStr}`, w - 10, 21, { align: "right" });

      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.4);
      doc.line(10, 24, w - 10, 24);
    },
  });

  // Metrik kutusu
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  let cardY = finalY + 6;
  const cardHeight = 9;

  if (cardY + cardHeight + 15 > h - 12) {
    doc.addPage();
    cardY = 30;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, cardY, w - 20, cardHeight, 1.5, 1.5, "FD");

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(10 + (w - 20) / 3, cardY + 2, 10 + (w - 20) / 3, cardY + cardHeight - 2);
  doc.line(10 + 2 * (w - 20) / 3, cardY + 2, 10 + 2 * (w - 20) / 3, cardY + cardHeight - 2);

  // Personel Sayısı
  const lbl1 = "Personel Sayısı: ";
  const val1 = String(personeller.length);
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8.5);
  const wL1 = doc.getTextWidth(lbl1);
  doc.setFont("Roboto", "bold");
  const wV1 = doc.getTextWidth(val1);
  const startX1 = (10 + (w - 20) / 6) - (wL1 + wV1) / 2;

  doc.setFont("Roboto", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(lbl1, startX1, cardY + 5.8);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(15, 41, 77);
  doc.text(val1, startX1 + wL1, cardY + 5.8);

  // Toplam Çalışma
  const lbl2 = "Toplam Çalışma: ";
  const val2 = `${toplamCalisma} Saat`;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8.5);
  const wL2 = doc.getTextWidth(lbl2);
  doc.setFont("Roboto", "bold");
  const wV2 = doc.getTextWidth(val2);
  const startX2 = (10 + (w - 20) / 2) - (wL2 + wV2) / 2;

  doc.setFont("Roboto", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(lbl2, startX2, cardY + 5.8);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text(val2, startX2 + wL2, cardY + 5.8);

  // Toplam Mesai
  const lbl3 = "Toplam Mesai: ";
  const val3 = `${toplamMesai} Saat`;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8.5);
  const wL3 = doc.getTextWidth(lbl3);
  doc.setFont("Roboto", "bold");
  const wV3 = doc.getTextWidth(val3);
  const startX3 = (10 + 5 * (w - 20) / 6) - (wL3 + wV3) / 2;

  doc.setFont("Roboto", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(lbl3, startX3, cardY + 5.8);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(245, 158, 11);
  doc.text(val3, startX3 + wL3, cardY + 5.8);

  // Legend
  const legendY = cardY + cardHeight + 6;
  if (legendY + 12 < h - 12) {
    doc.setFont("Roboto", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text("Kod Açıklamaları:", 10, legendY);

    doc.setFont("Roboto", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 130, 140);

    const legendItems = Object.entries(OZEL_DURUMLAR).map(
      ([, oz]) => `${oz.kod}: ${oz.label}`
    );

    const colsCount = 5;
    const colW = (w - 20) / colsCount;
    legendItems.forEach((item, i) => {
      const col = i % colsCount;
      const row = Math.floor(i / colsCount);
      doc.text(item, 10 + col * colW, legendY + 4.5 + row * 4);
    });
  }

  // Notlar varsa 2. Sayfaya Notlar Tablosu ekle
  ekleNotlarSayfasi(doc, notlar, sirketAdi, donemMetni, "GENEL PUANTAJ");
}

// ─────────────────────────────────────────────
// PROJE PUANTAJ PDF OLUŞTURMA
// ─────────────────────────────────────────────

async function _olusturProje(veri: ProjePuantajPdfVeri): Promise<jsPDF> {
  const doc = await yeniDoc("landscape");
  (doc as any).isCustomFooter = true;
  await _sayfaEkleProje(doc, veri);
  _sayfaNumaralariEkle(doc);
  return doc;
}

async function _sayfaEkleProje(doc: jsPDF, veri: ProjePuantajPdfVeri): Promise<void> {
  const { personeller, satirlar, projeAdi, yil, ay, baslik } = veri;
  const sonGun = new Date(yil, ay, 0).getDate();

  const sirketAdi = temizSirketAdi(useSirketStore.getState().aktifSirket?.ad || "HİLAL İZOLASYON");
  const bugunStr = new Date().toLocaleDateString("tr-TR");
  const donemMetni = `${AY_ADLARI[ay]} ${yil}`;

  const gunler = Array.from({ length: sonGun }, (_, i) => {
    const gun = i + 1;
    const tarih = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
    const haftaGunu = new Date(yil, ay - 1, gun).getDay();
    return { gun, tarih, haftaGunu, pazar: haftaGunu === 0 };
  });

  const pMap = new Map<string, Map<string, HucreDurumu & { saat?: number | null }>>();
  const notlar: NotItemPDF[] = [];

  const persMap = new Map<string, Personel>();
  for (const p of personeller) persMap.set(p.id, p);

  for (const s of satirlar) {
    if (!pMap.has(s.personel_id)) pMap.set(s.personel_id, new Map());
    pMap.get(s.personel_id)!.set(s.tarih, s);

    if (s.aciklama && s.aciklama.trim()) {
      const pers = persMap.get(s.personel_id);
      const persAd = pers ? `${pers.ad} ${pers.soyad}` : "Bilinmiyor";
      const unvan = pers?.gorev_unvan ?? "-";

      let durumStr = "-";
      if (s.ozel_durum) {
        const oz = OZEL_DURUMLAR[s.ozel_durum as keyof typeof OZEL_DURUMLAR];
        durumStr = oz?.kod ?? s.ozel_durum;
      } else if (s.saat != null) {
        durumStr = `${s.saat}s`;
      }

      notlar.push({
        tarih: s.tarih,
        personelAd: persAd,
        unvan,
        projeAdi,
        durum: durumStr,
        aciklama: s.aciklama.trim(),
      });
    }
  }

  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  const columns = [
    { header: "No", dataKey: "no" },
    { header: "Ad Soyad", dataKey: "adSoyad" },
    ...gunler.map(({ gun }) => ({
      header: String(gun),
      dataKey: `g${gun}`,
    })),
    { header: "Toplam", dataKey: "toplam" },
    { header: "Mesai", dataKey: "mesai" },
  ];

  let toplamCalisma = 0;
  let toplamMesai = 0;

  const rows = personeller.map((p, index) => {
    let calisma = 0;
    let mesai = 0;

    const row: Record<string, string | number> = {
      no: index + 1,
      adSoyad: `${p.ad} ${p.soyad}`,
    };

    for (const { gun, tarih } of gunler) {
      const hData = pMap.get(p.id)?.get(tarih);

      let val = "";
      if (hData) {
        if (hData.ozel_durum) {
          const oz = OZEL_DURUMLAR[hData.ozel_durum as keyof typeof OZEL_DURUMLAR];
          const kod = oz?.kod ?? hData.ozel_durum;
          const m = hData.mesai_saati ?? (oz && oz.saat === 0 && oz.mesai > 0 ? oz.mesai : 0);
          val = m > 0 ? `${kod}+${m}` : kod;
          mesai += m;
        } else if (hData.saat != null) {
          const m = hData.mesai_saati ?? 0;
          val = m > 0 ? `${hData.saat}+${m}` : String(hData.saat);
          calisma += hData.saat;
          mesai += m;
        } else if (hData.calisma_saati != null) {
          const m = hData.mesai_saati ?? 0;
          val = m > 0 ? `${hData.calisma_saati}+${m}` : String(hData.calisma_saati);
          calisma += hData.calisma_saati;
          mesai += m;
        }
      }
      row[`g${gun}`] = val;
    }

    toplamCalisma += calisma;
    toplamMesai += mesai;
    row.toplam = calisma > 0 ? calisma : "-";
    row.mesai = mesai > 0 ? mesai : "-";

    return row;
  });

  const gunGenisligi = (w - 20 - 5 - 33 - 24) / sonGun;

  const columnStyles: Record<string, any> = {
    no: { cellWidth: 5, textColor: [100, 116, 139] },
    adSoyad: { halign: "left", cellWidth: 33, textColor: [15, 23, 42] },
    toplam: { fontStyle: "bold", cellWidth: 13, textColor: [15, 23, 42] },
    mesai: { fontStyle: "bold", cellWidth: 11, textColor: [15, 23, 42] },
  };

  for (let d = 1; d <= sonGun; d++) {
    columnStyles[`g${d}`] = { cellWidth: gunGenisligi };
  }

  autoTable(doc, {
    columns,
    body: rows,
    startY: 28,
    margin: { left: 10, right: 10 },
    styles: {
      font: "Roboto",
      fontSize: 7.2,
      cellPadding: 1.2,
      halign: "center",
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [226, 232, 240],
      textColor: [15, 23, 42],
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: [244, 246, 249],
      textColor: [15, 41, 77],
      fontSize: 7.2,
      cellPadding: 1.5,
    },
    columnStyles,
    didParseCell: (data) => {
      const colId = data.column.dataKey as string;

      if (typeof colId === "string" && colId.startsWith("g")) {
        data.cell.styles.fontSize = 6.2;
        data.cell.styles.cellPadding = 0.2;
        if (data.section === "body") {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [0, 0, 0];
        }

        const gunNum = parseInt(colId.substring(1));
        const { pazar } = gunler[gunNum - 1];
        if (pazar) {
          if (data.section === "head") {
            data.cell.styles.fillColor = [178, 82, 82];
            data.cell.styles.textColor = [255, 255, 255];
          } else if (data.section === "body") {
            data.cell.styles.fillColor = [253, 245, 245];
            data.cell.styles.textColor = [178, 82, 82];
          }
        }
      }

      if (data.section === "body" && ["toplam", "mesai"].includes(colId)) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [15, 23, 42];
      }
    },
    didDrawPage: () => {
      doc.setFont("Roboto", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 41, 77);
      doc.text(sirketAdi.toUpperCase(), 10, 15);

      doc.setFont("Roboto", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(75, 85, 99);
      doc.text(baslik || "PROJE PUANTAJ RAPORU", 10, 21);

      doc.setFont("Roboto", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(15, 41, 77);
      doc.text(donemMetni, w - 10, 15, { align: "right" });

      doc.setFont("Roboto", "normal");
      doc.setFontSize(8);
      doc.setTextColor(113, 128, 150);
      doc.text(`Proje: ${projeAdi}`, w - 10, 21, { align: "right" });

      doc.setDrawColor(30, 64, 175);
      doc.setLineWidth(0.4);
      doc.line(10, 24, w - 10, 24);
    },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  let cardY = finalY + 6;
  const cardHeight = 9;

  if (cardY + cardHeight + 15 > h - 12) {
    doc.addPage();
    cardY = 30;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, cardY, w - 20, cardHeight, 1.5, 1.5, "FD");

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(10 + (w - 20) / 3, cardY + 2, 10 + (w - 20) / 3, cardY + cardHeight - 2);
  doc.line(10 + 2 * (w - 20) / 3, cardY + 2, 10 + 2 * (w - 20) / 3, cardY + cardHeight - 2);

  const lbl1 = "Personel Sayısı: ";
  const val1 = String(personeller.length);
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8.5);
  const wL1 = doc.getTextWidth(lbl1);
  doc.setFont("Roboto", "bold");
  const wV1 = doc.getTextWidth(val1);
  const startX1 = (10 + (w - 20) / 6) - (wL1 + wV1) / 2;

  doc.setFont("Roboto", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(lbl1, startX1, cardY + 5.8);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(15, 41, 77);
  doc.text(val1, startX1 + wL1, cardY + 5.8);

  const lbl2 = "Toplam Proje Süresi: ";
  const val2 = `${toplamCalisma} Saat`;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8.5);
  const wL2 = doc.getTextWidth(lbl2);
  doc.setFont("Roboto", "bold");
  const wV2 = doc.getTextWidth(val2);
  const startX2 = (10 + (w - 20) / 2) - (wL2 + wV2) / 2;

  doc.setFont("Roboto", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(lbl2, startX2, cardY + 5.8);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text(val2, startX2 + wL2, cardY + 5.8);

  const lbl3 = "Toplam Mesai: ";
  const val3 = `${toplamMesai} Saat`;
  doc.setFont("Roboto", "normal");
  doc.setFontSize(8.5);
  const wL3 = doc.getTextWidth(lbl3);
  doc.setFont("Roboto", "bold");
  const wV3 = doc.getTextWidth(val3);
  const startX3 = (10 + 5 * (w - 20) / 6) - (wL3 + wV3) / 2;

  doc.setFont("Roboto", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(lbl3, startX3, cardY + 5.8);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(245, 158, 11);
  doc.text(val3, startX3 + wL3, cardY + 5.8);

  const legendY = cardY + cardHeight + 6;
  if (legendY + 12 < h - 12) {
    doc.setFont("Roboto", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(75, 85, 99);
    doc.text("Kod Açıklamaları:", 10, legendY);

    doc.setFont("Roboto", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 130, 140);

    const legendItems = Object.entries(OZEL_DURUMLAR).map(
      ([, oz]) => `${oz.kod}: ${oz.label}`
    );

    const colsCount = 5;
    const colW = (w - 20) / colsCount;
    legendItems.forEach((item, i) => {
      const col = i % colsCount;
      const row = Math.floor(i / colsCount);
      doc.text(item, 10 + col * colW, legendY + 4.5 + row * 4);
    });
  }

  // Notlar varsa 2. Sayfaya Notlar Tablosu ekle
  ekleNotlarSayfasi(doc, notlar, sirketAdi, donemMetni, projeAdi);
}

// ─────────────────────────────────────────────
// TOPLU PUANTAJ PDF OLUŞTURMA
// ─────────────────────────────────────────────

async function _olusturToplu(veri: TopluPuantajPdfVeri): Promise<jsPDF> {
  const { personeller, puantajlar, ozetler, projeler, projePuantajlar, yil, ay } = veri;
  const doc = await yeniDoc("landscape");
  (doc as any).isCustomFooter = true;

  // 1. Genel Puantaj Sayfaları
  await _sayfaEkleGenel(doc, { personeller, puantajlar, ozetler, yil, ay, baslik: "GENEL PUANTAJ RAPORU (TOPLU)" });

  // 2. Her Bir Proje için Puantaj Sayfaları
  for (const proje of projeler) {
    const pSatirlar = projePuantajlar.filter((p) => p.proje_id === proje.id);
    doc.addPage();
    await _sayfaEkleProje(doc, {
      personeller,
      satirlar: pSatirlar as never,
      projeAdi: proje.ad,
      yil,
      ay,
      baslik: `PROJE PUANTAJ RAPORU — ${proje.ad}`,
    });
  }

  _sayfaNumaralariEkle(doc);
  return doc;
}

function _sayfaNumaralariEkle(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);
    doc.text("Hilal Muhasebe Yazılımı", 10, h - 6);
    doc.text(`Sayfa ${i} / ${pageCount}`, w - 10, h - 6, { align: "right" });
  }
}

// ─────────────────────────────────────────────
// DIŞA AKTARILAN PDF FONKSİYONLARI
// ─────────────────────────────────────────────

export async function puantajPdfOnizle(veri: PuantajPdfVeri): Promise<string> {
  const doc = await _olustur(veri);
  return pdfBlobUrl(doc);
}

export async function puantajPdfIndir(veri: PuantajPdfVeri): Promise<void> {
  const doc = await _olustur(veri);
  pdfIndir(doc, `Puantaj_${veri.yil}_${String(veri.ay).padStart(2, "0")}`);
}

export async function projePuantajPdfOnizle(veri: ProjePuantajPdfVeri): Promise<string> {
  const doc = await _olusturProje(veri);
  return pdfBlobUrl(doc);
}

export async function projePuantajPdfIndir(veri: ProjePuantajPdfVeri): Promise<void> {
  const doc = await _olusturProje(veri);
  pdfIndir(doc, `Proje_Puantaj_${veri.projeAdi.replace(/\s+/g, "_")}_${veri.yil}_${String(veri.ay).padStart(2, "0")}`);
}

export async function topluPuantajPdfOnizle(veri: TopluPuantajPdfVeri): Promise<string> {
  const doc = await _olusturToplu(veri);
  return pdfBlobUrl(doc);
}

export async function topluPuantajPdfIndir(veri: TopluPuantajPdfVeri): Promise<void> {
  const doc = await _olusturToplu(veri);
  pdfIndir(doc, `Toplu_Puantaj_${veri.yil}_${String(veri.ay).padStart(2, "0")}`);
}
