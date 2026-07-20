/**
 * src/lib/excel/cariExport.ts
 * Cari modülü — Excel (xlsx) dışa aktarma
 */

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { BelgeListItem } from "@/types/cari";
import { paraFormat, tarihFormat, belgeTypeName } from "@/lib/cari";

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

const DURUM_ETIKET: Record<string, string> = {
  odendi: "Ödendi",
  kismi: "Kısmi Ödendi",
  odenmedi: "Ödenmedi",
};

function kalanGoster(b: BelgeListItem): string {
  if (b.kalan <= 0) return "Kapandı";
  const tutar =
    b.para_birimi !== "TRY" && b.kur > 0 ? b.kalan / b.kur : b.kalan;
  return paraFormat(tutar, b.para_birimi);
}

// ─── Belge Listesi Excel ──────────────────────────────────────────────────────

export function cariListeExcel(
  belgeler: BelgeListItem[],
  options: { dosyaAdi?: string; yil?: number } = {}
): void {
  const { dosyaAdi = "cari-belgeler", yil } = options;

  // ── Satırlar ──
  const satirlar = belgeler.map((b) => ({
    "Belge No": b.belge_no,
    Tür: belgeTypeName(b.tur),
    Tarih: tarihFormat(b.tarih),
    Açıklama: b.aciklama ?? "",
    "Gemi Adı": b.gemi_adi ?? "",
    Firma: b.firma_ad ?? "",
    "Para Birimi": b.para_birimi,
    Tutar: b.tutar,
    "Tutar (Formatl\u0131)": paraFormat(b.tutar, b.para_birimi),
    Kur: b.kur,
    "Kalan (Ham)": b.kalan > 0 ? b.kalan : 0,
    "Kalan (G\u00f6r\u00fcnt\u00fc)": kalanGoster(b),
    "Ödeme Durumu": DURUM_ETIKET[b.odeme_durumu] ?? b.odeme_durumu,
    Gecikmiş: b.gecikmiş ? "Evet" : "Hayır",
  }));

  // ── Özet satırları ──
  const pbMap: Record<string, { alacak: number; odenen: number; kalan: number }> = {};
  for (const b of belgeler) {
    if (!pbMap[b.para_birimi]) pbMap[b.para_birimi] = { alacak: 0, odenen: 0, kalan: 0 };
    pbMap[b.para_birimi].alacak += b.tutar;
    pbMap[b.para_birimi].odenen += b.tutar - b.kalan;
    pbMap[b.para_birimi].kalan += b.kalan;
  }

  const ozetSatirlari = Object.entries(pbMap).map(([pb, o]) => ({
    "Para Birimi": pb,
    "Toplam Alacak": paraFormat(o.alacak, pb as any),
    Ödenen: paraFormat(o.odenen, pb as any),
    "Kalan Bakiye": paraFormat(o.kalan, pb as any),
    "Belge Sayısı": belgeler.filter((b) => b.para_birimi === pb).length,
  }));

  // ── Workbook ──
  const wb = XLSX.utils.book_new();

  // Sayfa 1: Detay Listesi
  const ws1 = XLSX.utils.json_to_sheet(satirlar);

  // Sütun genişlikleri
  ws1["!cols"] = [
    { wch: 14 }, // Belge No
    { wch: 16 }, // Tür
    { wch: 18 }, // Tarih
    { wch: 35 }, // Açıklama
    { wch: 22 }, // Gemi
    { wch: 25 }, // Firma
    { wch: 12 }, // Para Birimi
    { wch: 14 }, // Tutar
    { wch: 18 }, // Tutar Formatlı
    { wch: 10 }, // Kur
    { wch: 14 }, // Kalan Ham
    { wch: 18 }, // Kalan Görüntü
    { wch: 16 }, // Ödeme Durumu
    { wch: 10 }, // Gecikmiş
  ];

  XLSX.utils.book_append_sheet(wb, ws1, "Belge Listesi");

  // Sayfa 2: Özet
  const ws2 = XLSX.utils.json_to_sheet(ozetSatirlari);
  ws2["!cols"] = [
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Özet");

  // ── İndir ──
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const tarihStr = new Date().toISOString().slice(0, 10);
  const ad = yil ? `${dosyaAdi}-${yil}-${tarihStr}` : `${dosyaAdi}-${tarihStr}`;
  saveAs(blob, `${ad}.xlsx`);
}
