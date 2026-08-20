/**
 * src/lib/excel/puantajExport.ts
 *
 * Puantaj tablosu Excel export (Genel, Proje ve Toplu Çıktı).
 * Özellikler:
 *   - Personel x Gün grid tablosu
 *   - Özel durum kodları (YI, RT, RP...) hücreye yazılır
 *   - Ek Mesai sütunları dahil geliştirilmiş özet sütunları
 *   - 2. Sheet olarak Personel Günlük Notları ekleme
 *   - Profesyonel kolon hizalama, genişlikler ve başlık dondurma
 *   - Toplu XLSX çıktısı (Genel + Tüm Projeler tek dosyada)
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
  mesai_saati_override: number | null;
}

export interface PuantajExportVeri {
  personeller: Personel[];
  puantajlar: (HucreDurumu & { personel_id: string; tarih: string })[];
  ozetler?: OzetItem[];
  yil: number;
  ay: number;
}

export interface ProjePuantajSatirExport {
  personel_id: string;
  tarih: string;
  saat: number | null;
  mesai_saati?: number | null;
  ozel_durum?: string | null;
  aciklama?: string | null;
  personel?: { id: string; ad: string; soyad: string };
}

export interface ProjePuantajExportVeri {
  personeller: Personel[];
  satirlar: ProjePuantajSatirExport[];
  projeAdi: string;
  yil: number;
  ay: number;
}

export interface TopluPuantajExportVeri {
  personeller: Personel[];
  puantajlar: (HucreDurumu & { personel_id: string; tarih: string })[];
  ozetler?: OzetItem[];
  projeler: { id: string; ad: string; firma_adi?: string | null }[];
  projePuantajlar: (ProjePuantajSatirExport & { proje_id: string })[];
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

function formatTarihTR(tarihStr: string): string {
  const parts = tarihStr.split("-");
  if (parts.length !== 3) return tarihStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

// ─────────────────────────────────────────────
// Notlar Sheet Oluşturucu
// ─────────────────────────────────────────────

interface NotSatiri {
  tarih: string;
  personelAd: string;
  unvan: string;
  projeAdi?: string;
  durum: string;
  aciklama: string;
}

function olusturNotlarSheet(notlar: NotSatiri[], baslikMetni: string): XLSX.WorkSheet | null {
  if (!notlar || notlar.length === 0) return null;

  const hasProje = notlar.some((n) => !!n.projeAdi);

  const basliklar = hasProje
    ? ["Tarih", "Personel", "Unvan", "Proje", "Durum / Çalışma", "Günlük Not / Açıklama"]
    : ["Tarih", "Personel", "Unvan", "Durum / Çalışma", "Günlük Not / Açıklama"];

  const satirlar = notlar.map((n) => {
    return hasProje
      ? [formatTarihTR(n.tarih), n.personelAd, n.unvan, n.projeAdi ?? "-", n.durum, n.aciklama]
      : [formatTarihTR(n.tarih), n.personelAd, n.unvan, n.durum, n.aciklama];
  });

  const wsData = [
    [baslikMetni],
    [],
    basliklar,
    ...satirlar,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = hasProje
    ? [{ wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 50 }]
    : [{ wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 50 }];

  ws["!freeze"] = { xSplit: 0, ySplit: 3 };

  return ws;
}

// ─────────────────────────────────────────────
// Genel Puantaj Sheet Oluşturucu Helper
// ─────────────────────────────────────────────

function olusturGenelPuantajSheet(veri: PuantajExportVeri): {
  ws: XLSX.WorkSheet;
  notlarSheet: XLSX.WorkSheet | null;
  donem: string;
} {
  const { personeller, puantajlar, ozetler = [], yil, ay } = veri;
  const donem = `${AY_ADLARI_EXCEL[ay]} ${yil}`;

  // Ayın günlerini hesapla
  const sonGun = new Date(yil, ay, 0).getDate();
  const gunler = Array.from({ length: sonGun }, (_, i) => {
    const gun = i + 1;
    const tarihStr = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
    const haftaGunu = new Date(yil, ay - 1, gun).getDay();
    return { gun, tarihStr, haftaGunu };
  });

  // Puantaj haritası
  const puantajMap = new Map<string, Map<string, HucreDurumu>>();
  const notlar: NotSatiri[] = [];

  const personelMap = new Map<string, Personel>();
  for (const p of personeller) personelMap.set(p.id, p);

  for (const p of puantajlar) {
    if (!puantajMap.has(p.personel_id)) puantajMap.set(p.personel_id, new Map());
    puantajMap.get(p.personel_id)!.set(p.tarih, p as HucreDurumu);

    if (p.aciklama && p.aciklama.trim()) {
      const pers = personelMap.get(p.personel_id);
      if (pers) {
        notlar.push({
          tarih: p.tarih,
          personelAd: `${pers.ad} ${pers.soyad}`,
          unvan: pers.gorev_unvan ?? "-",
          durum: String(gunHucreDegeri(p) || "-"),
          aciklama: p.aciklama.trim(),
        });
      }
    }
  }

  // Özet haritası
  const ozetMap = new Map<string, OzetItem>();
  for (const o of ozetler) ozetMap.set(o.personel_id, o);

  // Başlık satırı
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
    "Ek Mesai",
    "SGK Gün",
    "Maaş Saati",
  ];

  // Veri satırları
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
    const ekMesai = ozet?.mesai_saati_override ?? 0;
    const toplamMesai = mesai + ekMesai;

    return [
      adSoyad,
      unvan,
      ...gunDegerleri,
      calisma,
      toplamMesai,
      ekMesai > 0 ? ekMesai : "-",
      sgkGunSon,
      maasSaatiSon,
    ];
  });

  // Legend
  const legendBaslik = ["KOD", "AÇIKLAMA", "SAAT", "MESAİ"];
  const legendSatirlar = Object.entries(OZEL_DURUMLAR).map(([, oz]) => [
    oz.kod,
    oz.label,
    oz.saat > 0 ? `${oz.saat} saat` : "-",
    oz.mesai > 0 ? `+${oz.mesai} saat mesai` : "-",
  ]);

  const wsData: (string | number)[][] = [
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

  ws["!cols"] = [
    { wch: 24 }, // Ad Soyad
    { wch: 18 }, // Unvan
    ...gunler.map(() => ({ wch: 5.5 })), // Günler
    { wch: 14 }, // Toplam Çalışma
    { wch: 9 },  // Mesai
    { wch: 10 }, // Ek Mesai
    { wch: 9 },  // SGK Gün
    { wch: 11 }, // Maaş Saati
  ];
  ws["!freeze"] = { xSplit: 2, ySplit: 3 };

  const notlarSheet = olusturNotlarSheet(notlar, `${donem} Genel Puantaj - Personel Günlük Notları`);

  return { ws, notlarSheet, donem };
}

// ─────────────────────────────────────────────
// Proje Puantaj Sheet Oluşturucu Helper
// ─────────────────────────────────────────────

function olusturProjePuantajSheet(
  veri: ProjePuantajExportVeri,
  personelListesi?: Personel[]
): {
  ws: XLSX.WorkSheet;
  notlarSheet: XLSX.WorkSheet | null;
  safeProje: string;
  donem: string;
} {
  const { satirlar, projeAdi, yil, ay } = veri;
  const personeller = veri.personeller && veri.personeller.length > 0
    ? veri.personeller
    : (personelListesi ?? []);
  const donem = `${AY_ADLARI_EXCEL[ay]} ${yil}`;

  const sonGun = new Date(yil, ay, 0).getDate();
  const gunler = Array.from({ length: sonGun }, (_, i) => {
    const gun = i + 1;
    const tarihStr = `${yil}-${String(ay).padStart(2, "0")}-${String(gun).padStart(2, "0")}`;
    const haftaGunu = new Date(yil, ay - 1, gun).getDay();
    return { gun, tarihStr, haftaGunu };
  });

  const veriMap = new Map<string, Map<string, ProjePuantajSatirExport>>();
  const notlar: NotSatiri[] = [];

  const personelMap = new Map<string, Personel>();
  for (const p of personeller) personelMap.set(p.id, p);

  for (const s of satirlar) {
    if (!veriMap.has(s.personel_id)) veriMap.set(s.personel_id, new Map());
    veriMap.get(s.personel_id)!.set(s.tarih, s);

    if (s.aciklama && s.aciklama.trim()) {
      const pers = personelMap.get(s.personel_id) ?? s.personel;
      const persAd = pers ? `${pers.ad} ${pers.soyad}` : "Bilinmiyor";
      const unvan = (pers as any)?.gorev_unvan ?? "-";

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

  const gunAdlari = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const gunBasliklari = gunler.map(({ gun, haftaGunu }) => `${gun}\n${gunAdlari[haftaGunu]}`);
  const basliklar = ["Ad Soyad", "Unvan", ...gunBasliklari, "Toplam (s)", "Mesai (s)"];

  const wsData: (string | number)[][] = [
    [`${projeAdi} — ${donem} Proje Puantajı`],
    [],
    basliklar,
    ...personeller.map((p) => {
      const adSoyad = `${p.ad} ${p.soyad}`;
      const unvan = p.gorev_unvan ?? "-";
      let toplamCalisma = 0;
      let toplamMesai = 0;

      const gunDegerleri = gunler.map(({ tarihStr }) => {
        const satir = veriMap.get(p.id)?.get(tarihStr);
        if (!satir) return "-";

        if (satir.ozel_durum) {
          const oz = OZEL_DURUMLAR[satir.ozel_durum as keyof typeof OZEL_DURUMLAR];
          if (oz && oz.saat === 0 && oz.mesai > 0) {
            const fiili = sayi(satir.mesai_saati ?? 0) > 0
              ? sayi(satir.mesai_saati!)
              : oz.mesai;
            toplamMesai += fiili;
            return fiili;
          }
          const kod = oz?.kod ?? satir.ozel_durum;
          const mesai = sayi(satir.mesai_saati ?? 0);
          if (mesai > 0) toplamMesai += mesai;
          return mesai > 0 ? `${kod}+${mesai}` : kod;
        }

        if (satir.saat != null && satir.saat > 0) {
          const mesai = sayi(satir.mesai_saati ?? 0);
          toplamCalisma += satir.saat;
          if (mesai > 0) toplamMesai += mesai;
          return mesai > 0 ? `${satir.saat}+${mesai}` : satir.saat;
        }

        return "-";
      });

      return [
        adSoyad,
        unvan,
        ...gunDegerleri,
        toplamCalisma > 0 ? toplamCalisma : "-",
        toplamMesai > 0 ? toplamMesai : "-",
      ];
    }),
    [],
    ["─── LEGEND ───"],
    ["KOD", "AÇIKLAMA", "SAAT", "MESAİ"],
    ...Object.entries(OZEL_DURUMLAR).map(([, oz]) => [
      oz.kod,
      oz.label,
      oz.saat > 0 ? `${oz.saat} saat` : "-",
      oz.mesai > 0 ? `+${oz.mesai} saat mesai` : "-",
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws["!cols"] = [
    { wch: 24 },
    { wch: 18 },
    ...gunler.map(() => ({ wch: 5.5 })),
    { wch: 12 },
    { wch: 10 },
  ];
  ws["!freeze"] = { xSplit: 2, ySplit: 3 };

  const notlarSheet = olusturNotlarSheet(notlar, `${projeAdi} — ${donem} Proje Günlük Notları`);
  const safeProje = projeAdi.replace(/[\\/:*?"<>|]/g, "_").slice(0, 20);

  return { ws, notlarSheet, safeProje, donem };
}

// ─────────────────────────────────────────────
// Eksport Fonksiyonları (Tekli & Toplu)
// ─────────────────────────────────────────────

/**
 * Genel Puantaj Excel Export
 */
export function puantajExport(veri: PuantajExportVeri): void {
  const { ws, notlarSheet, donem } = olusturGenelPuantajSheet(veri);
  const wb = yeniWorkbook();

  XLSX.utils.book_append_sheet(wb, ws, donem.slice(0, 31));
  if (notlarSheet) {
    XLSX.utils.book_append_sheet(wb, notlarSheet, "Günlük Notlar");
  }

  workbookIndir(wb, `Puantaj_${veri.yil}_${String(veri.ay).padStart(2, "0")}`);
}

/**
 * Proje Puantaj Excel Export
 */
export function projePuantajExport(veri: ProjePuantajExportVeri): void {
  const { ws, notlarSheet, safeProje, donem } = olusturProjePuantajSheet(veri);
  const wb = yeniWorkbook();

  XLSX.utils.book_append_sheet(wb, ws, `${safeProje} ${donem}`.slice(0, 31));
  if (notlarSheet) {
    XLSX.utils.book_append_sheet(wb, notlarSheet, "Günlük Notlar");
  }

  workbookIndir(wb, `ProjePuantaj_${safeProje}_${veri.yil}_${String(veri.ay).padStart(2, "0")}`);
}

/**
 * Toplu Puantaj Excel Export (Genel + Tüm Aktif Projeler)
 */
export function topluPuantajExport(veri: TopluPuantajExportVeri): void {
  const { personeller, puantajlar, ozetler, projeler, projePuantajlar, yil, ay } = veri;
  const wb = yeniWorkbook();

  // 1. Genel Puantaj Sheet & Notlar
  const genelVeri: PuantajExportVeri = { personeller, puantajlar, ozetler, yil, ay };
  const { ws: wsGenel, notlarSheet: wsGenelNotlar } = olusturGenelPuantajSheet(genelVeri);

  XLSX.utils.book_append_sheet(wb, wsGenel, "Genel Puantaj");
  if (wsGenelNotlar) {
    XLSX.utils.book_append_sheet(wb, wsGenelNotlar, "Genel Notlar");
  }

  // 2. Her bir proje için Puantaj Sheet & Notlar
  for (const proje of projeler) {
    const pSatirlar = projePuantajlar.filter((p) => p.proje_id === proje.id);
    const projeVeri: ProjePuantajExportVeri = {
      personeller,
      satirlar: pSatirlar,
      projeAdi: proje.ad,
      yil,
      ay,
    };

    const { ws: wsProje, notlarSheet: wsProjeNotlar, safeProje } = olusturProjePuantajSheet(projeVeri);

    // Sheet isminin 31 karakteri aşmaması için güvenli isim
    const sheetName = safeProje.slice(0, 25);
    let finalSheetName = sheetName;
    let counter = 1;
    while (wb.SheetNames.includes(finalSheetName)) {
      finalSheetName = `${sheetName}_${counter}`;
      counter++;
    }

    XLSX.utils.book_append_sheet(wb, wsProje, finalSheetName);

    if (wsProjeNotlar) {
      let notlarSheetName = `${finalSheetName} Not`;
      if (notlarSheetName.length > 31) notlarSheetName = notlarSheetName.slice(0, 31);
      let nCounter = 1;
      while (wb.SheetNames.includes(notlarSheetName)) {
        notlarSheetName = `${notlarSheetName.slice(0, 28)}_${nCounter}`;
        nCounter++;
      }
      XLSX.utils.book_append_sheet(wb, wsProjeNotlar, notlarSheetName);
    }
  }

  workbookIndir(wb, `Toplu_Puantaj_${yil}_${String(ay).padStart(2, "0")}`);
}
