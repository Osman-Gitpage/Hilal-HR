/**
 * src/lib/pdf/puantajPdf.ts
 * Puantaj tablosu PDF — landscape A4, günlük grid
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { yeniDoc, baslikEkle, pdfBlobUrl, pdfIndir, excelDonemPdf } from "./pdfUtils";
import { OZEL_DURUMLAR } from "@/lib/constants";

const AY_ADLARI = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const GUN_ADLARI = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

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
  yil: number;
  ay: number;
  baslik?: string;
}

function gunDeger(veri?: HucreDurumu): string {
  if (!veri) return "";
  if (veri.ozel_durum) {
    const oz = OZEL_DURUMLAR[veri.ozel_durum as keyof typeof OZEL_DURUMLAR];
    if (oz && oz.saat === 0 && oz.mesai > 0) {
      const m = veri.mesai_saati ?? oz.mesai;
      return String(m);
    }
    const kod = oz?.kod ?? veri.ozel_durum;
    const mesai = veri.mesai_saati ?? 0;
    return mesai > 0 ? `${kod}+${mesai}` : kod;
  }
  if (veri.calisma_saati != null) {
    const mesai = veri.mesai_saati ?? 0;
    return mesai > 0 ? `${veri.calisma_saati}+${mesai}` : String(veri.calisma_saati);
  }
  return "";
}

async function _olustur(veri: PuantajPdfVeri): Promise<jsPDF> {
  const { personeller, puantajlar, yil, ay, baslik } = veri;
  const donem = excelDonemPdf(yil, ay);
  const sonGun = new Date(yil, ay, 0).getDate();

  const gunler = Array.from({ length: sonGun }, (_, i) => {
    const gun = i + 1;
    const tarih = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
    const haftaGunu = new Date(yil, ay - 1, gun).getDay();
    return { gun, tarih, haftaGunu, pazar: haftaGunu === 0 };
  });

  // Puantaj map
  const pMap = new Map<string, Map<string, HucreDurumu>>();
  for (const p of puantajlar) {
    if (!pMap.has(p.personel_id)) pMap.set(p.personel_id, new Map());
    pMap.get(p.personel_id)!.set(p.tarih, p);
  }

  const doc = await yeniDoc("landscape");
  baslikEkle(doc, baslik ?? `${AY_ADLARI[ay]} ${yil} Puantaj Tablosu`, donem);

  // Tablo başlıkları
  const columns = [
    { header: "Ad Soyad", dataKey: "adSoyad" },
    ...gunler.map(({ gun, haftaGunu }) => ({
      header: `${gun}\n${GUN_ADLARI[haftaGunu]}`,
      dataKey: `g${gun}`,
    })),
    { header: "Toplam", dataKey: "toplam" },
  ];

  // Tablo satırları
  const rows = personeller.map((p) => {
    let toplam = 0;
    const row: Record<string, string | number> = {
      adSoyad: `${p.ad} ${p.soyad}`,
    };
    for (const { gun, tarih, pazar: _p } of gunler) {
      const h = pMap.get(p.id)?.get(tarih);
      const val = gunDeger(h);
      row[`g${gun}`] = val;
      if (h?.calisma_saati) toplam += h.calisma_saati;
      if (h?.mesai_saati) toplam += h.mesai_saati;
      if (h?.ozel_durum) {
        const oz = OZEL_DURUMLAR[h.ozel_durum as keyof typeof OZEL_DURUMLAR];
        if (oz) toplam += oz.saat + oz.mesai;
      }
    }
    row.toplam = toplam > 0 ? toplam : "-";
    return row;
  });

  autoTable(doc, {
    columns,
    body: rows,
    startY: 28,
    styles: {
      font: "Roboto",
      fontSize: 6.5,
      cellPadding: 1.5,
      halign: "center",
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: [41, 98, 255],
      textColor: [255, 255, 255],
      fontSize: 6,
      cellPadding: 1,
    },
    columnStyles: {
      0: { halign: "left", cellWidth: 32, fontStyle: "bold" },
    },
    didParseCell: (data) => {
      // Pazar sütunlarını vurgula
      if (data.section === "body") {
        const colIdx = data.column.index;
        if (colIdx > 0 && colIdx <= gunler.length) {
          const { pazar } = gunler[colIdx - 1];
          if (pazar) {
            data.cell.styles.fillColor = [255, 240, 240];
            data.cell.styles.textColor = [200, 0, 0];
          }
        }
      }
      if (data.section === "head" && data.column.index > 0 && data.column.index <= gunler.length) {
        const { pazar } = gunler[data.column.index - 1];
        if (pazar) {
          data.cell.styles.fillColor = [180, 0, 0];
        }
      }
    },
    margin: { left: 7, right: 7 },
  });

  // Legend
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  doc.setFont("Roboto", "bold");
  doc.setFontSize(8);
  doc.text("Kod Açıklamaları:", 7, finalY);

  const legendItems = Object.entries(OZEL_DURUMLAR).map(
    ([, oz]) => `${oz.kod}: ${oz.label}`
  );
  doc.setFont("Roboto", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(80);

  const pageW = doc.internal.pageSize.getWidth();
  const cols = 4;
  const colW = (pageW - 14) / cols;
  legendItems.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    doc.text(item, 7 + col * colW, finalY + 5 + row * 5);
  });
  doc.setTextColor(0);

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
