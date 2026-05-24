/**
 * src/lib/pdf/izinRaporPdf.ts
 * Yıllık İzin Kullanım Raporu PDF export - Portrait A4 premium tasarımı.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { yeniDoc, pdfBlobUrl, pdfIndir, temizSirketAdi } from "./pdfUtils";
import { createClient } from "@/supabase/client";

function hesaplaIzinEntitlement(girisTarihiStr: string | null | undefined, bitisTarihiStr?: string | null): { yil: number; hak: number } {
  if (!girisTarihiStr) return { yil: 0, hak: 0 };
  
  const giris = new Date(girisTarihiStr);
  const son = bitisTarihiStr ? new Date(bitisTarihiStr) : new Date();
  
  const farkMs = son.getTime() - giris.getTime();
  if (farkMs <= 0) return { yil: 0, hak: 0 };

  const yil = farkMs / (1000 * 60 * 60 * 24 * 365.25);
  const tamYil = Math.floor(yil);

  let hak = 0;
  for (let y = 1; y <= tamYil; y++) {
    if (y <= 5) {
      hak += 14;
    } else if (y <= 15) {
      hak += 20;
    } else {
      hak += 26;
    }
  }

  return { yil, hak };
}

async function _olustur(): Promise<jsPDF> {
  const supabase = createClient();

  // Fetch active sirket name and ID
  const { data: aktifSirket } = await supabase
    .from("sirketler")
    .select("id, ad")
    .limit(1)
    .maybeSingle();
  const sirketId = aktifSirket?.id;
  const sirketAdi = temizSirketAdi(aktifSirket?.ad || "HİLAL İZOLASYON");

  if (!sirketId) {
    throw new Error("Aktif şirket bulunamadı.");
  }

  // Fetch all personnel with their employment periods
  const { data: personelList = [] } = await supabase
    .from("personel")
    .select(`
      id,
      ad,
      soyad,
      tc,
      gorev_unvan,
      employment_periods (
        baslangic_tarihi,
        bitis_tarihi
      )
    `)
    .eq("sirket_id", sirketId);

  // Fetch all used leave entries (maas_bordro active version records)
  const { data: bordroList = [] } = await supabase
    .from("maas_bordro")
    .select("personel_id, yillik_izin_gun")
    .eq("sirket_id", sirketId)
    .eq("is_active_version", true);

  const usedLeavesMap = new Map<string, number>();
  for (const b of bordroList || []) {
    usedLeavesMap.set(b.personel_id, (usedLeavesMap.get(b.personel_id) ?? 0) + Number(b.yillik_izin_gun ?? 0));
  }

  const doc = await yeniDoc("portrait");
  (doc as any).isCustomFooter = true;
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  const rows = (personelList || []).map((p, index) => {
    // Find active period or first period
    const periods = p.employment_periods || [];
    const activeEp = periods.find(ep => ep.bitis_tarihi === null);
    const firstEp = periods[0];
    
    const girisTarihi = activeEp?.baslangic_tarihi || firstEp?.baslangic_tarihi;
    const bitisTarihi = activeEp ? null : firstEp?.bitis_tarihi;

    const { yil: serviceYears, hak: entitlementDays } = hesaplaIzinEntitlement(girisTarihi, bitisTarihi);
    const usedDays = usedLeavesMap.get(p.id) ?? 0;
    const remainingDays = entitlementDays - usedDays;

    const girisStr = girisTarihi
      ? new Date(girisTarihi).toLocaleDateString("tr-TR")
      : "-";

    return {
      no: index + 1,
      adSoyad: `${p.ad} ${p.soyad}`,
      unvan: p.gorev_unvan || "-",
      girisTarihi: girisStr,
      sure: serviceYears > 0 ? `${serviceYears.toFixed(1)} Yıl` : "-",
      hakEdilen: `${entitlementDays} Gün`,
      kullanilan: `${usedDays} Gün`,
      kalan: `${remainingDays} Gün`,
      kalanVal: remainingDays, // store numeric value for color highlights
    };
  });

  const totals = {
    toplamHakEdilen: rows.reduce((acc, r) => acc + parseInt(r.hakEdilen), 0),
    toplamKullanılan: rows.reduce((acc, r) => acc + parseInt(r.kullanilan), 0),
    toplamKalan: rows.reduce((acc, r) => acc + r.kalanVal, 0),
  };

  // Add Grand Totals Row
  rows.push({
    no: "" as any,
    adSoyad: "TOPLAMLAR" as any,
    unvan: "" as any,
    girisTarihi: "" as any,
    sure: "" as any,
    hakEdilen: `${totals.toplamHakEdilen} Gün` as any,
    kullanilan: `${totals.toplamKullanılan} Gün` as any,
    kalan: `${totals.toplamKalan} Gün` as any,
    kalanVal: totals.toplamKalan,
  });

  autoTable(doc, {
    columns: [
      { header: "No", dataKey: "no" },
      { header: "Ad Soyad", dataKey: "adSoyad" },
      { header: "Görev / Unvan", dataKey: "unvan" },
      { header: "Giriş Tarihi", dataKey: "girisTarihi" },
      { header: "Kıdem Süresi", dataKey: "sure" },
      { header: "Hak Edilen İzin", dataKey: "hakEdilen" },
      { header: "Kullanılan İzin", dataKey: "kullanilan" },
      { header: "Kalan İzin", dataKey: "kalan" },
    ],
    body: rows,
    startY: 28,
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
      adSoyad: { halign: "left", cellWidth: 38, fontStyle: "bold", textColor: [15, 23, 42] },
      unvan: { halign: "left", cellWidth: 32, textColor: [51, 65, 85] },
      girisTarihi: { cellWidth: 24, textColor: [51, 65, 85] },
      sure: { cellWidth: 22, textColor: [51, 65, 85] },
      hakEdilen: { cellWidth: 22, textColor: [51, 65, 85], halign: "center" },
      kullanilan: { cellWidth: 22, textColor: [185, 28, 28], halign: "center" }, // Red for used leaves
      kalan: { cellWidth: 22, textColor: [16, 185, 129], fontStyle: "bold", halign: "center" }, // Emerald for remaining
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50 alternate rows #f8fafc
    },
    didParseCell: (data) => {
      // Styling the totals row at the bottom
      if (data.row.index === rows.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [15, 23, 42];
        if (data.column.dataKey === "kalan") {
          data.cell.styles.textColor = [16, 185, 129];
        }
        if (data.column.dataKey === "kullanilan") {
          data.cell.styles.textColor = [185, 28, 28];
        }
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
      doc.setFont("Roboto", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 41, 77); // Koyu Lacivert
      doc.text(sirketAdi.toUpperCase(), 10, 15);

      doc.setFont("Roboto", "normal");
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99); // Slate Grey
      doc.text("YILLIK İZİN KULLANIM RAPORU (KÜMÜLATİF)", 10, 21);

      // Sağ Taraf
      doc.setFont("Roboto", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 41, 77);
      doc.text(`${new Date().toLocaleDateString("tr-TR")}`, w - 10, 15, { align: "right" });

      doc.setFont("Roboto", "normal");
      doc.setFontSize(8);
      doc.setTextColor(113, 128, 150);
      doc.text("Hilal Muhasebe Yazılımı", w - 10, 21, { align: "right" });

      // İnce Mavi Ayırıcı Çizgi
      doc.setDrawColor(30, 64, 175); // Royal Blue #1e40af
      doc.setLineWidth(0.4);
      doc.line(10, 24, w - 10, 24);
    }
  });

  // Footer Çizimi
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(156, 163, 175);

    // Sol Alt
    doc.text("Hilal Muhasebe Yazılımı — Yıllık İzin Raporlama", 10, h - 6);

    // Sağ Alt
    doc.text(`Sayfa ${i} / ${pageCount}`, w - 10, h - 6, { align: "right" });
  }

  return doc;
}

export async function izinRaporPdfOnizle(): Promise<string> {
  const doc = await _olustur();
  return pdfBlobUrl(doc);
}

export async function izinRaporPdfIndir(): Promise<void> {
  const doc = await _olustur();
  pdfIndir(doc, `Yillik_Izin_Raporu_${new Date().getFullYear()}`);
}
