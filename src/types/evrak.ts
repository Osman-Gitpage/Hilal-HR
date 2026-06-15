// ─── Evrak Modülü Tip Tanımları ───────────────────────────────────────────────
// Supabase Row tipleri: @/supabase/app-types.ts
// Bu dosya: UI/domain-level tipler ve genişletilmiş interface'ler

// ─── Enum / Literal Tipler ────────────────────────────────────────────────────

export type EvrakKategoriTip = "personel" | "sirket" | "tersane_ozel";

export type EvrakDurum = "aktif" | "arsiv";

export type EvrakOnayDurumu = "beklemede" | "onaylandi" | "reddedildi";

export type EvrakGecerlilikDurumu = "gecerli" | "yaklasan" | "gecersiz" | "eksik";

export type EvrakIslem =
  | "yuklendi"
  | "silindi"
  | "versiyon_silindi"
  | "onaylandi"
  | "reddedildi"
  | "arsivlendi"
  | "kopyalandi"
  | "ozluk_olusturuldu";

// ─── Evrak Kategori ───────────────────────────────────────────────────────────

export interface EvrakKategori {
  id: string;
  sirket_id: string;
  ad: string;
  tip: EvrakKategoriTip;
  zorunlu: boolean;
  sureli: boolean;
  varsayilan_sure: number | null;
  sira: number;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface EvrakKategoriForm {
  ad: string;
  tip: EvrakKategoriTip;
  zorunlu: boolean;
  sureli: boolean;
  varsayilan_sure: number | null;
  sira: number;
}

// ─── Evrak ────────────────────────────────────────────────────────────────────

export interface Evrak {
  id: string;
  sirket_id: string;
  kategori_id: string;
  personel_id: string | null;
  employment_period_id: string | null;
  dosya_url: string;
  dosya_adi: string;
  dosya_boyut: number | null;
  dosya_tipi: string | null;
  versiyon: number;
  baslangic_tarihi: string | null;
  bitis_tarihi: string | null;
  durum: EvrakDurum;
  onay_durumu: EvrakOnayDurumu;
  yuklenme_tarihi: string;
  created_at: string;
  updated_at: string;
}

/** Evrak + kategori bilgisi (JOIN sonucu) */
export interface EvrakWithKategori extends Evrak {
  kategori: EvrakKategori;
}

/** Bir kategoriye ait tüm versiyonlar */
export interface EvrakVersiyonGrubu {
  kategori: EvrakKategori;
  evraklar: Evrak[]; // versiyon sırasına göre (en yeni ilk)
  aktifEvrak: Evrak | null; // en son yüklenen aktif versiyon
  gecerlilik: EvrakGecerlilikDurumu;
}

// ─── Evrak Log ────────────────────────────────────────────────────────────────

export interface EvrakLog {
  id: string;
  sirket_id: string;
  evrak_id: string | null;
  islem: EvrakIslem;
  kullanici_id: string | null;
  detay: Record<string, unknown> | null;
  tarih: string;
}

// ─── Tersane Şablon ───────────────────────────────────────────────────────────

export interface TersaneSablonKategoriRef {
  kategori_id: string;
  sira: number;
}

export interface TersaneSablon {
  id: string;
  sirket_id: string;
  ad: string;
  standart_kategoriler: TersaneSablonKategoriRef[];
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface TersaneOzelBelge {
  id: string;
  sirket_id: string;
  tersane_sablon_id: string;
  ad: string;
  sablon_dosya_url: string | null;
  sablon_tipi: "docx" | "pdf" | null;
  sira: number;
  created_at: string;
  updated_at: string;
}

export interface TersaneSablonWithBelgeler extends TersaneSablon {
  tersane_ozel_belge: TersaneOzelBelge[];
}

// ─── Personel Evrak Durumu (UI) ───────────────────────────────────────────────

/** Tek bir personelin tek bir kategorisindeki evrak durumu */
export interface PersonelEvrakDurum {
  kategori: EvrakKategori;
  evrak: Evrak | null;
  gecerlilik: EvrakGecerlilikDurumu;
}

/** Tek bir personelin tüm evrak özeti (ana liste tablosu için) */
export interface PersonelEvrakOzet {
  personel_id: string;
  personel_ad: string;
  personel_soyad: string;
  aktif_donem_id: string | null;
  evrak_durumlari: PersonelEvrakDurum[];
  eksik_sayisi: number;
  yaklasan_sayisi: number;
}

// ─── Upload / Dosya ───────────────────────────────────────────────────────────

export interface UploadProgress {
  durum: "bekliyor" | "yukleniyor" | "tamamlandi" | "hata";
  yuzde: number;
  hata?: string;
}

/** Evrak yükleme form verisi */
export interface EvrakYukleForm {
  kategori_id: string;
  personel_id?: string;
  employment_period_id?: string;
  dosya: File;
  baslangic_tarihi?: string;
  bitis_tarihi?: string;
  varsayilan_sure_kullan?: boolean;
}

// ─── Filtreler ────────────────────────────────────────────────────────────────

export interface EvrakListeFiltre {
  sadece_eksik?: boolean;
  sadece_yaklasan?: boolean;
  arama?: string;
  kategori_id?: string;
}

// ─── Sabitler ─────────────────────────────────────────────────────────────────

/** Desteklenen dosya tipleri */
export const EVRAK_KABUL_EDILEN_TIPLER = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "image/png",
  "image/jpeg",
] as const;

/** Dosya uzantısı → MIME map */
export const EVRAK_UZANTI_MAP: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

/** Maksimum dosya boyutu (10MB) */
export const EVRAK_MAX_DOSYA_BOYUT = 10 * 1024 * 1024;

/** Maksimum versiyon sayısı */
export const EVRAK_MAX_VERSIYON = 3;

/** Geçerlilik uyarı eşiği (gün) */
export const EVRAK_YAKLASAN_ESIK_GUN = 30;
