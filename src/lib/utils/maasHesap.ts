/**
 * Maaş hesaplama yardımcı fonksiyonları
 * Tüm iş mantığı burada — bileşenler sadece görüntüler.
 */

import { VARSAYILAN_AYLIK_CALISMA_SAATI } from "@/lib/constants";

export interface BordroHesapGirdisi {
  maas_net: number;
  calisma_saati: number;
  mesai_saati: number;
  yol: number;
  yemek: number;
  prim: number;
  tazminat: number;
  senelik_izin: number;
  /** EkKalem veya EkKalemRow — sadece tutar alanı kullanılır */
  ek_odemeler: { tutar: number }[];
  banka: number;
  bes: number;
  avans: number;
  icra: number;
  iceri_avans_kesinti: number;
  /** EkKalem veya EkKalemRow — sadece tutar alanı kullanılır */
  ek_kesintiler: { tutar: number }[];
  aylik_calisma_saati?: number; // ayarlardan, yoksa default
}

export interface BordroHesapCikti {
  saatlik_ucret: number;
  mesai_gunu: number;
  hak_edis: number;
  mesai_bedeli: number;
  ek_odemeler_toplam: number;
  toplam_odeme: number;
  ek_kesintiler_toplam: number;
  toplam_kesinti: number;
  elden: number;
}

/**
 * Ana bordro hesaplama fonksiyonu
 */
export function bordroyuHesapla(girdi: BordroHesapGirdisi): BordroHesapCikti {
  const aylikSaat = girdi.aylik_calisma_saati ?? VARSAYILAN_AYLIK_CALISMA_SAATI;

  const saatlik_ucret = aylikSaat > 0 ? girdi.maas_net / aylikSaat : 0;
  const mesai_gunu = saatlik_ucret > 0 ? girdi.mesai_saati / 8 : 0;
  const hak_edis = girdi.calisma_saati * saatlik_ucret;
  const mesai_bedeli = girdi.mesai_saati * saatlik_ucret; // 1x çarpan

  const ek_odemeler_toplam = girdi.ek_odemeler.reduce(
    (sum, k) => sum + (k.tutar ?? 0),
    0
  );

  const toplam_odeme =
    hak_edis +
    mesai_bedeli +
    girdi.yol +
    girdi.yemek +
    girdi.prim +
    girdi.tazminat +
    girdi.senelik_izin +
    ek_odemeler_toplam;

  const ek_kesintiler_toplam = girdi.ek_kesintiler.reduce(
    (sum, k) => sum + (k.tutar ?? 0),
    0
  );

  const toplam_kesinti =
    girdi.banka +
    girdi.bes +
    girdi.avans +
    girdi.icra +
    girdi.iceri_avans_kesinti +
    ek_kesintiler_toplam;

  const elden = toplam_odeme - toplam_kesinti;

  return {
    saatlik_ucret: yuvarla(saatlik_ucret),
    mesai_gunu: yuvarla(mesai_gunu, 2),
    hak_edis: yuvarla(hak_edis),
    mesai_bedeli: yuvarla(mesai_bedeli),
    ek_odemeler_toplam: yuvarla(ek_odemeler_toplam),
    toplam_odeme: yuvarla(toplam_odeme),
    ek_kesintiler_toplam: yuvarla(ek_kesintiler_toplam),
    toplam_kesinti: yuvarla(toplam_kesinti),
    elden: yuvarla(elden),
  };
}

/**
 * Banka ödeme sayfası elden hesabı
 * Elden = toplam_odeme - (banka + bes + tazminat + avans)
 */
export function bankaEldenHesapla(
  toplam_odeme: number,
  banka: number,
  bes: number,
  tazminat: number,
  avans: number
): number {
  return yuvarla(toplam_odeme - (banka + bes + tazminat + avans));
}

/**
 * Banka ödeme sayfası yeni elden hesabı (Bordro Elden'den fark düşme)
 * Elden = bordro_elden - (banka_duzenle - bordro_bankasi) - tazminat - avans
 */
export function bankaEldenHesaplaYeni(
  bordro_elden: number,
  banka_duzenle: number,
  bordro_bankasi: number,
  tazminat: number,
  avans: number
): number {
  return yuvarla(bordro_elden - (banka_duzenle - bordro_bankasi) - tazminat - avans);
}

/**
 * İçeri avans devir hesabı
 * Devredilecek = (devredilen + verilen) - kesilen
 */
export function avansDeviriHesapla(
  devir: number,
  verilen: number,
  kesinti: number
): number {
  return Math.max(0, devir + verilen - kesinti);
}

function yuvarla(sayi: number, basamak = 2): number {
  const carpan = Math.pow(10, basamak);
  return Math.round(sayi * carpan) / carpan;
}
