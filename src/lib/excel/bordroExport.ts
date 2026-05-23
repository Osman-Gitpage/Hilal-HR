/**
 * src/lib/excel/bordroExport.ts
 *
 * Bordro / Maaş listesi Excel export fonksiyonları.
 * Dönem başlığı + tüm hesaplanmış kalemler dahil.
 */

import type { BordroListeItem } from "@/hooks/useMaasBordro";
import { BORDRO_DURUM_LABELS, VARSAYILAN_AYLIK_CALISMA_SAATI } from "@/lib/constants";
import {
  yeniWorkbook, sutunTaninmindanSheetEkle, sheetEkle,
  workbookIndir, excelPara, excelDonem, sayi,
  type SutunTanimi, type SutunSeti,
} from "./exportUtils";

// ─────────────────────────────────────────────
// Tüm Olası Sütunlar
// ─────────────────────────────────────────────

type BordroSatir = BordroListeItem & {
  _hakEdis: number;
  _mesaiBedeli: number;
  _elden: number;
};

function bordroSatirHazirla(
  b: BordroListeItem,
  aylikCalisma: number
): BordroSatir {
  const maasNet      = sayi(b.maas_net);
  const calismaSaati = sayi(b.calisma_saati);
  const mesaiSaati   = sayi(b.mesai_saati);
  const saatlikUcret = aylikCalisma > 0 ? maasNet / aylikCalisma : 0;
  const hakEdis      = calismaSaati * saatlikUcret;
  const mesaiBedeli  = mesaiSaati * saatlikUcret;
  const elden        = sayi(b.toplam_odeme) - sayi(b.toplam_kesinti);

  return { ...b, _hakEdis: hakEdis, _mesaiBedeli: mesaiBedeli, _elden: elden };
}

export const BORDRO_TUM_SUTUNLAR: SutunTanimi<BordroSatir>[] = [
  { baslik: "Ad Soyad",        degerAl: (b) => `${b.personel.ad} ${b.personel.soyad}`, genislik: 20 },
  { baslik: "Unvan",           degerAl: (b) => b.personel.gorev_unvan ?? "-",           genislik: 18 },
  { baslik: "Çalışma S.",      degerAl: (b) => sayi(b.calisma_saati),                  genislik: 12 },
  { baslik: "Hak Ediş (₺)",   degerAl: (b) => excelPara(b._hakEdis),                  genislik: 14 },
  { baslik: "Mesai S.",        degerAl: (b) => sayi(b.mesai_saati),                    genislik: 12 },
  { baslik: "Mesai Bedeli (₺)",degerAl: (b) => excelPara(b._mesaiBedeli),              genislik: 16 },
  { baslik: "Yol (₺)",         degerAl: (b) => excelPara(b.yol),                       genislik: 12 },
  { baslik: "Yemek (₺)",       degerAl: (b) => excelPara(b.yemek),                     genislik: 12 },
  { baslik: "Prim (₺)",        degerAl: (b) => excelPara(b.prim),                      genislik: 12 },
  { baslik: "Toplam Ödeme (₺)",degerAl: (b) => excelPara(b.toplam_odeme),              genislik: 16 },
  { baslik: "Banka (₺)",       degerAl: (b) => excelPara(b.banka),                     genislik: 12 },
  { baslik: "BES (₺)",         degerAl: (b) => excelPara(b.bes),                       genislik: 12 },
  { baslik: "Avans (₺)",       degerAl: (b) => excelPara(b.avans),                     genislik: 12 },
  { baslik: "Toplam Kesinti (₺)",degerAl: (b) => excelPara(b.toplam_kesinti),          genislik: 18 },
  { baslik: "Elden (₺)",       degerAl: (b) => excelPara(b._elden),                    genislik: 12 },
  { baslik: "Durum",           degerAl: (b) => BORDRO_DURUM_LABELS[b.durum] ?? b.durum, genislik: 18 },
];

// ─────────────────────────────────────────────
// Sabit Sütun Setleri
// ─────────────────────────────────────────────

export const BORDRO_SUTUN_SETLERI: SutunSeti<BordroSatir>[] = [
  {
    id: "ozet",
    etiket: "Özet (Elden)",
    sutunlar: BORDRO_TUM_SUTUNLAR.filter((s) =>
      ["Ad Soyad", "Toplam Ödeme (₺)", "Toplam Kesinti (₺)", "Elden (₺)", "Durum"].includes(s.baslik)
    ),
  },
  {
    id: "odeme",
    etiket: "Ödeme Kalemleri",
    sutunlar: BORDRO_TUM_SUTUNLAR.filter((s) =>
      ["Ad Soyad", "Hak Ediş (₺)", "Mesai Bedeli (₺)", "Yol (₺)", "Yemek (₺)", "Prim (₺)", "Toplam Ödeme (₺)"].includes(s.baslik)
    ),
  },
  {
    id: "tam",
    etiket: "Tam Tablo",
    sutunlar: BORDRO_TUM_SUTUNLAR,
  },
];

// ─────────────────────────────────────────────
// Export Fonksiyonu
// ─────────────────────────────────────────────

export interface BordroExportOptions {
  sutunlar?: SutunTanimi<BordroSatir>[];
  yil: number;
  ay: number;
  aylikCalisma?: number;
}

export function bordroListesiExport(
  veri: BordroListeItem[],
  options: BordroExportOptions
): void {
  const { yil, ay, aylikCalisma = VARSAYILAN_AYLIK_CALISMA_SAATI } = options;
  const sutunlar = options.sutunlar ?? BORDRO_TUM_SUTUNLAR;
  const donem    = excelDonem(yil, ay);

  // Satırları hazırla (hesaplanan alanları ekle)
  const satirlar = veri.map((b) => bordroSatirHazirla(b, aylikCalisma));

  // Dönem başlık sheet'i + veri sheet'i
  const wb = yeniWorkbook();

  // Başlık satırı — dönem bilgisi
  const baslikSatiri = [`${donem} Bordro Listesi`];
  const bosListe: (string | number | null | undefined)[][] = [
    baslikSatiri,
    [], // boş satır
  ];
  const veriSatirlari = satirlar.map((s) =>
    sutunlar.map((sut) => {
      const v = sut.degerAl(s);
      return v ?? "";
    })
  );

  sheetEkle(
    wb,
    donem,
    sutunlar.map((s) => s.baslik),
    veriSatirlari,
    sutunlar.map((s) => s.genislik ?? 14)
  );

  workbookIndir(wb, `Bordro_${yil}_${String(ay).padStart(2, "0")}`);
}

// Tip yeniden export (modal için)
export type { BordroSatir };
