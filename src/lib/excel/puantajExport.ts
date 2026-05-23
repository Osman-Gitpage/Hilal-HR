/**
 * src/lib/excel/puantajExport.ts
 *
 * Puantaj tablosu Excel export.
 * Özellikler:
 *   - Personel x Gün grid tablosu
 *   - Özel durum kodları (YI, RT, RP...) hücreye yazılır
 *   - Sütun sonunda: Toplam Çalışma, Mesai, SGK Gün, Maaş Saati
 *   - Sayfanın altında Legend tablosu (kod: açıklama)
 */

import * as XLSX from "xlsx";
import { OZEL_DURUMLAR } from "@/lib/constants";
import { yeniWorkbook, workbookIndir, AY_ADLARI_EXCEL, sayi } from "./exportUtils";

// ─────────────────────────────────────────────
// Tipler
// ─────────────────────────────────────────────

interface HucreDurumu {
  giris_saati?: string | null;
  cikis_saati?: string | null;
  calisma_saati?: number | null;
  ozel_durum?: string | null;
  aciklama?: string | null;
  mesai_saati?: number | null;
}

interface Personel {
  id: string;
  ad: string;
  soyad: string;
  gorev_unvan: string | null;
}

interface OzetItem {
  personel_id: string;
  sgk_gun_override: number | null;
  maas_saati_override: number | null;
}

export interface PuantajExportVeri {
  personeller: Personel[];
  puantajlar: (HucreDurumu & { personel_id: string; tarih: string })[];
  ozetler?: OzetItem[];
  yil: number;
  ay: number;
}

// ─────────────────────────────────────────────
// Hesaplama Yardımcıları
// ─────────────────────────────────────────────

function gunHucreDegeri(veri?: HucreDurumu): string | number {
  if (!veri) return "";

  if (veri.ozel_durum) {
    const oz = OZEL_DURUMLAR[veri.ozel_durum as keyof typeof OZEL_DURUMLAR];

    // PM gibi "saat=0, mesai>0" durumlar → doğrudan mesai saatini yaz
    if (oz && oz.saat === 0 && oz.mesai > 0) {
      const fiiliMesai = sayi(veri.mesai_saati ?? 0) > 0
        ? sayi(veri.mesai_saati!)
        : oz.mesai;
      return fiiliMesai;
    }

    // Diğer özel durumlar: kod yaz (YI, RT, RP vb.)
    // Ek mesai varsa "YI+4" gibi
    const kod = oz?.kod ?? veri.ozel_durum;
    const mesai = sayi(veri.mesai_saati ?? 0);
    return mesai > 0 ? `${kod}+${mesai}` : kod;
  }

  // Normal gün: calisma_saati + varsa mesai
  if (veri.calisma_saati != null) {
    const mesai = sayi(veri.mesai_saati ?? 0);
    return mesai > 0
      ? `${veri.calisma_saati}+${mesai}`
      : veri.calisma_saati;
  }

  // Sadece giriş saati varsa
  if (veri.giris_saati) {
    return veri.giris_saati.slice(0, 5);
  }

  return "";
}


function hesaplaToplam(
  personelId: string,
  puantajlar: PuantajExportVeri["puantajlar"]
) {
  let calisma = 0;
  let mesai = 0;
  let sgkGun = 0;

  for (const p of puantajlar) {
    if (p.personel_id !== personelId) continue;

    if (p.ozel_durum) {
      const oz = OZEL_DURUMLAR[p.ozel_durum as keyof typeof OZEL_DURUMLAR];
      if (oz) {
        calisma += oz.saat;
        if (oz.saat > 0) sgkGun += 1;
      }
      const dbMesai = sayi(p.mesai_saati ?? 0);
      mesai += dbMesai > 0 ? dbMesai : (oz?.mesai ?? 0);
    } else if (p.calisma_saati) {
      calisma += sayi(p.calisma_saati);
      sgkGun += 1;
      if (p.mesai_saati) mesai += sayi(p.mesai_saati);
    }
  }

  return { calisma, mesai, sgkGun };
}

// ─────────────────────────────────────────────
// Ana Export Fonksiyonu
// ─────────────────────────────────────────────

export function puantajExport(veri: PuantajExportVeri): void {
  const { personeller, puantajlar, ozetler = [], yil, ay } = veri;
  const donem = `${AY_ADLARI_EXCEL[ay]} ${yil}`;

  // Ayın günlerini hesapla
  const sonGun = new Date(yil, ay, 0).getDate();
  const gunler = Array.from({ length: sonGun }, (_, i) => {
    const gun = i + 1;
    const tarihStr = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
    const haftaGunu = new Date(yil, ay - 1, gun).getDay(); // 0=Paz
    return { gun, tarihStr, haftaGunu };
  });

  // Puantaj haritası
  const puantajMap = new Map<string, Map<string, HucreDurumu>>();
  for (const p of puantajlar) {
    if (!puantajMap.has(p.personel_id)) puantajMap.set(p.personel_id, new Map());
    puantajMap.get(p.personel_id)!.set(p.tarih, p as HucreDurumu);
  }

  // Özet haritası
  const ozetMap = new Map<string, OzetItem>();
  for (const o of ozetler) ozetMap.set(o.personel_id, o);

  // ── Başlık satırı ──
  const gunBasliklari = gunler.map(({ gun, haftaGunu }) => {
    const gunAdlari = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    return `${gun}\n${gunAdlari[haftaGunu]}`;
  });

  const basliklar = [
    "Ad Soyad",
    "Unvan",
    ...gunBasliklari,
    "Toplam Çalışma",
    "Mesai",
    "SGK Gün",
    "Maaş Saati",
  ];

  // ── Veri satırları ──
  const satirlar: (string | number)[][] = personeller.map((p) => {
    const adSoyad = `${p.ad} ${p.soyad}`;
    const unvan = p.gorev_unvan ?? "-";

    const gunDegerleri = gunler.map(({ tarihStr }) => {
      const veriHucresi = puantajMap.get(p.id)?.get(tarihStr);
      const deger = gunHucreDegeri(veriHucresi);
      return deger === "" ? "-" : deger;
    });

    const { calisma, mesai, sgkGun } = hesaplaToplam(p.id, puantajlar);
    const ozet = ozetMap.get(p.id);
    const sgkGunSon = ozet?.sgk_gun_override ?? sgkGun;
    const maasSaatiSon = ozet?.maas_saati_override ?? calisma;

    return [adSoyad, unvan, ...gunDegerleri, calisma, mesai, sgkGunSon, maasSaatiSon];
  });

  // ── Legend satırları ──
  const legendBaslik = ["KOD", "AÇIKLAMA", "SAAT", "MESSAİ"];
  const legendSatirlar = Object.entries(OZEL_DURUMLAR).map(([, oz]) => [
    oz.kod,
    oz.label,
    oz.saat > 0 ? `${oz.saat} saat` : "-",
    oz.mesai > 0 ? `+${oz.mesai} saat mesai` : "-",
  ]);

  // ── Sheet oluştur ──
  const wsData: (string | number)[][] = [
    // Dönem başlığı
    [`${donem} Puantaj Tablosu`],
    [],
    basliklar,
    ...satirlar,
    [],
    ["─── LEGEND ───"],
    legendBaslik,
    ...legendSatirlar,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Sütun genişlikleri
  const cols = [
    { wch: 22 }, // Ad Soyad
    { wch: 18 }, // Unvan
    ...gunler.map(() => ({ wch: 5 })), // Günler
    { wch: 14 }, // Toplam
    { wch: 8 },  // Mesai
    { wch: 9 },  // SGK Gün
    { wch: 11 }, // Maaş Saati
  ];
  ws["!cols"] = cols;

  // Başlık satırını dondur (satır 3 = index 2 = başlıklar)
  ws["!freeze"] = { xSplit: 2, ySplit: 3 };

  const wb = yeniWorkbook();
  XLSX.utils.book_append_sheet(wb, ws, donem.slice(0, 31));
  workbookIndir(wb, `Puantaj_${yil}_${String(ay).padStart(2, "0")}`);
}

// ─────────────────────────────────────────────
// Proje Bazlı Puantaj Export
// ─────────────────────────────────────────────

export interface ProjePuantajSatirExport {
  personel_id: string;
  tarih: string;
  saat: number | null;
  mesai_saati?: number | null;
  ozel_durum?: string | null;
  aciklama?: string | null;
}

export interface ProjePuantajExportVeri {
  personeller: Personel[];
  satirlar: ProjePuantajSatirExport[];
  projeAdi: string;
  yil: number;
  ay: number;
}

export function projePuantajExport(veri: ProjePuantajExportVeri): void {
  const { personeller, satirlar, projeAdi, yil, ay } = veri;
  const donem = `${AY_ADLARI_EXCEL[ay]} ${yil}`;

  // Ayın günleri
  const sonGun = new Date(yil, ay, 0).getDate();
  const gunler = Array.from({ length: sonGun }, (_, i) => {
    const gun = i + 1;
    const tarihStr = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
    const haftaGunu = new Date(yil, ay - 1, gun).getDay();
    return { gun, tarihStr, haftaGunu };
  });

  // Veri haritası
  const veriMap = new Map<string, Map<string, ProjePuantajSatirExport>>();
  for (const s of satirlar) {
    if (!veriMap.has(s.personel_id)) veriMap.set(s.personel_id, new Map());
    veriMap.get(s.personel_id)!.set(s.tarih, s);
  }

  // Başlık satırları
  const gunAdlari = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const gunBasliklari = gunler.map(({ gun, haftaGunu }) => `${gun}\n${gunAdlari[haftaGunu]}`);
  const basliklar = ["Ad Soyad", "Unvan", ...gunBasliklari, "Toplam (s)"];

  // Veri satırları
  const wsData: (string | number)[][] = [
    [`${projeAdi} — ${donem} Proje Puantajı`],
    [],
    basliklar,
    ...personeller.map((p) => {
      const adSoyad = `${p.ad} ${p.soyad}`;
      const unvan = p.gorev_unvan ?? "-";
      let toplam = 0;

      const gunDegerleri = gunler.map(({ tarihStr }) => {
        const satir = veriMap.get(p.id)?.get(tarihStr);
        if (!satir) return "-";

        if (satir.ozel_durum) {
          const oz = OZEL_DURUMLAR[satir.ozel_durum as keyof typeof OZEL_DURUMLAR];
          // PM gibi saat=0, mesai>0 → fiili mesai saatini yaz
          if (oz && oz.saat === 0 && oz.mesai > 0) {
            const fiili = sayi(satir.mesai_saati ?? 0) > 0
              ? sayi(satir.mesai_saati!)
              : oz.mesai;
            toplam += fiili;
            return fiili;
          }
          const kod = oz?.kod ?? satir.ozel_durum;
          const mesai = sayi(satir.mesai_saati ?? 0);
          return mesai > 0 ? `${kod}+${mesai}` : kod;
        }

        if (satir.saat != null && satir.saat > 0) {
          const mesai = sayi(satir.mesai_saati ?? 0);
          toplam += satir.saat + mesai;
          return mesai > 0 ? `${satir.saat}+${mesai}` : satir.saat;
        }

        return "-";
      });

      return [adSoyad, unvan, ...gunDegerleri, toplam > 0 ? toplam : "-"];
    }),
    [],
    ["─── LEGEND ───"],
    ["KOD", "AÇIKLAMA", "SAAT", "MESSAİ"],
    ...Object.entries(OZEL_DURUMLAR).map(([, oz]) => [
      oz.kod,
      oz.label,
      oz.saat > 0 ? `${oz.saat} saat` : "-",
      oz.mesai > 0 ? `+${oz.mesai} saat mesai` : "-",
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Sütun genişlikleri
  ws["!cols"] = [
    { wch: 22 },
    { wch: 18 },
    ...gunler.map(() => ({ wch: 5 })),
    { wch: 12 },
  ];
  ws["!freeze"] = { xSplit: 2, ySplit: 3 };

  const wb = yeniWorkbook();
  const safeProje = projeAdi.replace(/[\\/:*?"<>|]/g, "_").slice(0, 20);
  XLSX.utils.book_append_sheet(wb, ws, `${safeProje} ${donem}`.slice(0, 31));
  workbookIndir(wb, `ProjePuantaj_${safeProje}_${yil}_${String(ay).padStart(2, "0")}`);
}
