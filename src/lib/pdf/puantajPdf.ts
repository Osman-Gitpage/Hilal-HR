/**
 * src/lib/pdf/puantajPdf.ts
 * Puantaj tablosu PDF — landscape A4, günlük grid
 * Premium tasarıma sahip modern ve şık çıktı tasarımı.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { yeniDoc, pdfBlobUrl, pdfIndir, excelDonemPdf, temizSirketAdi } from "./pdfUtils";
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

async function _olustur(veri: PuantajPdfVeri): Promise<jsPDF> {
  const { personeller, puantajlar, ozetler, yil, ay, baslik } = veri;
  const sonGun = new Date(yil, ay, 0).getDate();

  // Aktif şirket adı ve bugünün tarihi
  const sirketAdi = temizSirketAdi(useSirketStore.getState().aktifSirket?.ad || "HİLAL İZOLASYON");
  const bugunStr = new Date().toLocaleDateString("tr-TR");

  const gunler = Array.from({ length: sonGun }, (_, i) => {
    const gun = i + 1;
    const tarih = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
    const haftaGunu = new Date(yil, ay - 1, gun).getDay();
    return { gun, tarih, haftaGunu, pazar: haftaGunu === 0 };
  });

  // Puantaj haritası
  const pMap = new Map<string, Map<string, HucreDurumu>>();
  for (const p of puantajlar) {
    if (!pMap.has(p.personel_id)) pMap.set(p.personel_id, new Map());
    pMap.get(p.personel_id)!.set(p.tarih, p);
  }

  // Özet haritası (override'lar için)
  const ozetMap = new Map<string, { sgk_gun_override: number | null; maas_saati_override: number | null; mesai_saati_override: number | null }>();
  if (ozetler) {
    for (const o of ozetler) {
      ozetMap.set(o.personel_id, o);
    }
  }

  const doc = await yeniDoc("landscape");
  (doc as any).isCustomFooter = true;
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Tablo başlıkları
  const columns = [
    { header: "No", dataKey: "no" },
    { header: "Ad Soyad", dataKey: "adSoyad" },
    ...gunler.map(({ gun }) => ({
      header: String(gun),
      dataKey: `g${gun}`,
    })),
    { header: "Toplam", dataKey: "toplam" },
    { header: "Mesai", dataKey: "mesai" },
    { header: "SGK", dataKey: "sgk" },
    { header: "Maaş", dataKey: "maas" },
  ];

  // Tablo satırları ve metrik toplamları
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

    // Metrik toplamlarını biriktir
    toplamCalisma += calisma;
    toplamMesai += finalMesai;

    row.toplam = calisma > 0 ? calisma : "-";
    row.mesai = finalMesai > 0 ? finalMesai : "-";
    row.sgk = finalSgk > 0 ? finalSgk : "-";
    row.maas = finalMaas > 0 ? finalMaas : "-";

    return row;
  });

  // Dinamik sütun genişliği hesaplama (gün kolonları tam sığsın diye)
  // No: 5mm, Ad Soyad: 33mm, toplam: 13mm, mesai: 11mm, sgk: 9mm, maas: 10mm (toplam 81mm)
  // Sabit kolonlar toplamı = 5 + 33 + 13 + 11 + 9 + 10 = 81mm
  // Kalan genişlik gün kolonlarına paylaştırılır
  const gunGenisligi = (w - 20 - 5 - 33 - 43) / sonGun;

  const columnStyles: Record<string, any> = {
    no: { cellWidth: 5, textColor: [100, 116, 139] },
    adSoyad: { halign: "left", cellWidth: 33, textColor: [15, 23, 42] },
    toplam: { fontStyle: "bold", cellWidth: 13, textColor: [15, 23, 42] },
    mesai: { fontStyle: "bold", cellWidth: 11, textColor: [15, 23, 42] },
    sgk: { fontStyle: "bold", cellWidth: 9, textColor: [15, 23, 42] },
    maas: { fontStyle: "bold", cellWidth: 10, textColor: [15, 23, 42] },
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
      lineColor: [226, 232, 240], // #e2e8f0 ince çizgiler
      textColor: [15, 23, 42], // Slate 900 (Koyu siyah/lacivert, soluk kalmaması için)
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: [244, 246, 249], // Slate 100
      textColor: [15, 41, 77], // Slate Navy #0F294D
      fontSize: 7.2,
      cellPadding: 1.5,
    },
    columnStyles,
    didParseCell: (data) => {
      const colId = data.column.dataKey as string;

      // Pazar sütunlarını mockup'taki gibi renklendir ve gün sütunlarını kompaktlaştır (Okunabilirlik arttırıldı)
      if (typeof colId === "string" && colId.startsWith("g")) {
        data.cell.styles.fontSize = 6.2;
        data.cell.styles.cellPadding = 0.2;
        if (data.section === "body") {
          data.cell.styles.fontStyle = "bold"; // Değerlerin net okunması ve soluk kalmaması için kalın yapıyoruz
          data.cell.styles.textColor = [0, 0, 0]; // Hücredeki değerlerin soluk kalmaması için koyu siyah yapıyoruz
        }

        const gunNum = parseInt(colId.substring(1));
        const { pazar } = gunler[gunNum - 1];
        if (pazar) {
          if (data.section === "head") {
            data.cell.styles.fillColor = [178, 82, 82]; // Sunday header kırmızımsı #b25252
            data.cell.styles.textColor = [255, 255, 255]; // Beyaz metin
          } else if (data.section === "body") {
            data.cell.styles.fillColor = [253, 245, 245]; // Sunday body açık pembe #fdf5f5
            data.cell.styles.textColor = [178, 82, 82]; // Kırmızı metin
          }
        }
      }

      // Özet kolonlarını kalın ve koyu yap
      if (data.section === "body" && ["toplam", "mesai", "sgk", "maas"].includes(colId)) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [15, 23, 42]; // Slate 900
      }
    },
    didDrawPage: (data) => {
      // ─── PREMIUM HEADER ───
      doc.setFont("Roboto", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 41, 77); // Koyu Lacivert
      doc.text(sirketAdi.toUpperCase(), 10, 15);

      doc.setFont("Roboto", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(75, 85, 99); // Slate Grey
      doc.text(baslik || "GENEL PUANTAJ RAPORU", 10, 21);

      // Sağ Taraf
      doc.setFont("Roboto", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(15, 41, 77);
      const donemMetni = `${AY_ADLARI[ay]} ${yil}`;
      doc.text(donemMetni, w - 10, 15, { align: "right" });

      doc.setFont("Roboto", "normal");
      doc.setFontSize(8);
      doc.setTextColor(113, 128, 150);
      doc.text(`Oluşturulma: ${bugunStr}`, w - 10, 21, { align: "right" });

      // İnce Mavi Ayırıcı Çizgi
      doc.setDrawColor(30, 64, 175); // Royal Blue #1e40af
      doc.setLineWidth(0.4);
      doc.line(10, 24, w - 10, 24);
    },
  });

  // ─── TEK SATIR ŞIK VE KOMPAKT METRİK KUTUSU (Sadece Son Sayfada) ───
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  let cardY = finalY + 6;
  const cardHeight = 9;

  // Sayfaya sığmıyorsa yeni sayfaya geç
  if (cardY + cardHeight + 15 > h - 12) {
    doc.addPage();
    cardY = 30;
  }

  // Tek geniş kutu çiz
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, cardY, w - 20, cardHeight, 1.5, 1.5, "FD");

  // Dikey separatör çizgileri çiz
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(10 + (w - 20) / 3, cardY + 2, 10 + (w - 20) / 3, cardY + cardHeight - 2);
  doc.line(10 + 2 * (w - 20) / 3, cardY + 2, 10 + 2 * (w - 20) / 3, cardY + cardHeight - 2);

  // Metin 1: Personel Sayısı
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

  // Metin 2: Toplam Çalışma
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
  doc.setTextColor(16, 185, 129); // Zümrüt Yeşili
  doc.text(val2, startX2 + wL2, cardY + 5.8);

  // Metin 3: Toplam Mesai
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
  doc.setTextColor(245, 158, 11); // Kehribar Sarı
  doc.text(val3, startX3 + wL3, cardY + 5.8);

  // ─── KOD AÇIKLAMALARI (LEGEND) ───
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

  // ─── DİNAMİK FOOTER EKLEME (SOL VE SAĞ UYUMLU TEK DÖNGÜ) ───
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);

    // Sol: Hilal Muhasebe Yazılımı
    doc.text("Hilal Muhasebe Yazılımı", 10, h - 6);

    // Sağ: Sayfa X / Y
    doc.text(`Sayfa ${i} / ${pageCount}`, w - 10, h - 6, { align: "right" });
  }

  return doc;
}

export async function puantajPdfOnizle(veri: PuantajPdfVeri): Promise<string> {
  const doc = await _olustur(veri);
  return pdfBlobUrl(doc);
}

export async function puantajPdfIndir(veri: PuantajPdfVeri): Promise<void> {
  const doc = await _olustur(veri);
  pdfIndir(doc, `Puantaj_${veri.yil}_${String(veri.ay).padStart(2, "0")}`);
}

// ─────────────────────────────────────────────
// PROJE PUANTAJ PDF İŞLEMLERİ
// ─────────────────────────────────────────────

export interface ProjePuantajPdfVeri {
  personeller: Personel[];
  satirlar: (HucreDurumu & { personel_id: string; tarih: string; saat?: number | null })[];
  projeAdi: string;
  yil: number;
  ay: number;
  baslik?: string;
}

async function _olusturProje(veri: ProjePuantajPdfVeri): Promise<jsPDF> {
  const { personeller, satirlar, projeAdi, yil, ay, baslik } = veri;
  const sonGun = new Date(yil, ay, 0).getDate();

  // Aktif şirket adı ve bugünün tarihi
  const sirketAdi = temizSirketAdi(useSirketStore.getState().aktifSirket?.ad || "HİLAL İZOLASYON");
  const bugunStr = new Date().toLocaleDateString("tr-TR");

  const gunler = Array.from({ length: sonGun }, (_, i) => {
    const gun = i + 1;
    const tarih = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
    const haftaGunu = new Date(yil, ay - 1, gun).getDay();
    return { gun, tarih, haftaGunu, pazar: haftaGunu === 0 };
  });

  // Veri haritası
  const pMap = new Map<string, Map<string, HucreDurumu & { saat?: number | null }>>();
  for (const s of satirlar) {
    if (!pMap.has(s.personel_id)) pMap.set(s.personel_id, new Map());
    pMap.get(s.personel_id)!.set(s.tarih, s);
  }

  const doc = await yeniDoc("landscape");
  (doc as any).isCustomFooter = true;
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Tablo başlıkları
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

  // Tablo satırları ve metrik toplamları
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
      
      // Proje hücresi için saat veya özel durum/mesai gösterimi
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

    // Metrik toplamlarını biriktir
    toplamCalisma += calisma;
    toplamMesai += mesai;
    row.toplam = calisma > 0 ? calisma : "-";
    row.mesai = mesai > 0 ? mesai : "-";

    return row;
  });

  // Dinamik sütun genişliği hesaplama
  // Sabit kolonlar toplamı = No: 5mm, Ad Soyad: 33mm, Toplam: 13mm, Mesai: 11mm = 62mm
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
      lineColor: [226, 232, 240], // ince çizgiler #e2e8f0
      textColor: [15, 23, 42], // Slate 900 (Koyu siyah/lacivert, soluk kalmaması için)
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: [244, 246, 249], // Slate 100
      textColor: [15, 41, 77], // Slate Navy #0F294D
      fontSize: 7.2,
      cellPadding: 1.5,
    },
    columnStyles,
    didParseCell: (data) => {
      const colId = data.column.dataKey as string;

      // Pazar sütunlarını mockup'taki gibi renklendir ve gün sütunlarını kompaktlaştır (Okunabilirlik arttırıldı)
      if (typeof colId === "string" && colId.startsWith("g")) {
        data.cell.styles.fontSize = 6.2;
        data.cell.styles.cellPadding = 0.2;
        if (data.section === "body") {
          data.cell.styles.fontStyle = "bold"; // Değerlerin net okunması ve soluk kalmaması için kalın yapıyoruz
          data.cell.styles.textColor = [0, 0, 0]; // Hücredeki değerlerin soluk kalmaması için koyu siyah yapıyoruz
        }

        const gunNum = parseInt(colId.substring(1));
        const { pazar } = gunler[gunNum - 1];
        if (pazar) {
          if (data.section === "head") {
            data.cell.styles.fillColor = [178, 82, 82]; // Sunday header kırmızımsı #b25252
            data.cell.styles.textColor = [255, 255, 255]; // Beyaz metin
          } else if (data.section === "body") {
            data.cell.styles.fillColor = [253, 245, 245]; // Sunday body açık pembe #fdf5f5
            data.cell.styles.textColor = [178, 82, 82]; // Kırmızı metin
          }
        }
      }

      // Özet kolonlarını kalın ve koyu yap
      if (data.section === "body" && ["toplam", "mesai"].includes(colId)) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [15, 23, 42]; // Slate 900
      }
    },
    didDrawPage: (data) => {
      // ─── PREMIUM HEADER ───
      doc.setFont("Roboto", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 41, 77); // Koyu Lacivert
      doc.text(sirketAdi.toUpperCase(), 10, 15);

      doc.setFont("Roboto", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(75, 85, 99); // Slate Grey
      doc.text(baslik || "PROJE PUANTAJ RAPORU", 10, 21);

      // Sağ Taraf
      doc.setFont("Roboto", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(15, 41, 77);
      const donemMetni = `${AY_ADLARI[ay]} ${yil}`;
      doc.text(donemMetni, w - 10, 15, { align: "right" });

      doc.setFont("Roboto", "normal");
      doc.setFontSize(8);
      doc.setTextColor(113, 128, 150);
      doc.text(`Proje: ${projeAdi}`, w - 10, 21, { align: "right" });

      // İnce Mavi Ayırıcı Çizgi
      doc.setDrawColor(30, 64, 175); // Royal Blue #1e40af
      doc.setLineWidth(0.4);
      doc.line(10, 24, w - 10, 24);
    },
  });

  // ─── TEK SATIR ŞIK VE KOMPAKT METRİK KUTUSU (Sadece Son Sayfada) ───
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  let cardY = finalY + 6;
  const cardHeight = 9;

  // Sayfaya sığmıyorsa yeni sayfaya geç
  if (cardY + cardHeight + 15 > h - 12) {
    doc.addPage();
    cardY = 30;
  }

  // Tek geniş kutu çiz
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, cardY, w - 20, cardHeight, 1.5, 1.5, "FD");

  // Dikey separatör çizgileri çiz
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(10 + (w - 20) / 3, cardY + 2, 10 + (w - 20) / 3, cardY + cardHeight - 2);
  doc.line(10 + 2 * (w - 20) / 3, cardY + 2, 10 + 2 * (w - 20) / 3, cardY + cardHeight - 2);

  // Metin 1: Personel Sayısı
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

  // Metin 2: Toplam Çalışma
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
  doc.setTextColor(16, 185, 129); // Zümrüt Yeşili
  doc.text(val2, startX2 + wL2, cardY + 5.8);

  // Metin 3: Toplam Mesai
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
  doc.setTextColor(245, 158, 11); // Kehribar Sarı
  doc.text(val3, startX3 + wL3, cardY + 5.8);

  // ─── KOD AÇIKLAMALARI (LEGEND) ───
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

  // ─── DİNAMİK FOOTER EKLEME (SOL VE SAĞ UYUMLU TEK DÖNGÜ) ───
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);

    // Sol: Hilal Muhasebe Yazılımı
    doc.text("Hilal Muhasebe Yazılımı", 10, h - 6);

    // Sağ: Sayfa X / Y
    doc.text(`Sayfa ${i} / ${pageCount}`, w - 10, h - 6, { align: "right" });
  }

  return doc;
}

export async function projePuantajPdfOnizle(veri: ProjePuantajPdfVeri): Promise<string> {
  const doc = await _olusturProje(veri);
  return pdfBlobUrl(doc);
}

export async function projePuantajPdfIndir(veri: ProjePuantajPdfVeri): Promise<void> {
  const doc = await _olusturProje(veri);
  pdfIndir(doc, `Proje_Puantaj_${veri.projeAdi.replace(/\s+/g, "_")}_${veri.yil}_${String(veri.ay).padStart(2, "0")}`);
}
