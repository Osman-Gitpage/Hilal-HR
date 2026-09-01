export type AracDurum = "musait" | "gorevde" | "bakimda" | "rezerve";

export type YakitTipi =
  | "Benzin"
  | "Dizel"
  | "Elektrik"
  | "Hybrid"
  | "Plug-in Hybrid";

export type VitesTipi = "Otomatik" | "Manuel";

export interface RuhsatBilgileri {
  ruhsatSeriNo: string;
  motorNo: string;
  saseNo: string;
}

export interface AylikTuketim {
  ay: string;
  miktar: string;
}

export interface ServisDurumuItem {
  baslik: string;
  sonTarih: string;
  kalanGun: number;
  tip: "bakim" | "muayene" | "kasko";
}

export interface Police {
  id: string;
  tur: string;
  sirket: string;
  policeNo: string;
  bitisTarihi: string;
  kalanGun: number;
  tutar?: number;
  belgeAdi?: string;
  belgeUrl?: string;
}

export interface TrafikCezasi {
  id: string;
  tarih: string;
  cezaTuru: string;
  aciklama: string;
  tutar: number;
}

export interface MuayeneBilgileri {
  muayeneTarihi: string;
  kalanGun: number;
  muayeneUcreti?: number; // TÜVTÜRK Muayene + Egzoz Ücreti (₺)
  istasyon?: string;
  raporNo?: string;
  sonuc?: string;
  egzozEmisyonTarihi?: string;
  belgeAdi?: string;
  belgeUrl?: string;
}

export interface AylikYakitKaydi {
  id: string;
  yil: number;
  ay: string;
  yakitTuru: string;
  miktar: number;
  birimFiyat: number;
  toplamTutar: number;
  belgeNo?: string;
}

export interface ServisKaydi {
  id: string;
  yil: number;
  tarih: string;
  km: number;
  islemTuru: string;
  servisAdi: string;
  aciklama: string;
  faturaNo?: string;
  faturaDosyaAdi?: string;
  faturaDosyaUrl?: string;
  tutar: number;
}

export interface Arac {
  id: string;
  marka: string;
  model: string;
  altBaslik?: string;
  paket?: string;
  yil: number;
  plaka: string;
  yakitTipi: YakitTipi;
  vites: VitesTipi;
  gorsel: string;
  km: number;
  toplamTuketimYil?: string;
  toplamTuketim?: string;
  aylikTuketimler?: AylikTuketim[];
  ruhsat?: RuhsatBilgileri;
  servisDurumlari?: ServisDurumuItem[];
  policeler?: Police[];
  cezalar?: TrafikCezasi[];
  muayene?: MuayeneBilgileri;
  yakitKayitlari?: AylikYakitKaydi[];
  servisKayitlari?: ServisKaydi[];
}
