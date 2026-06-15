// Genel domain tipleri — UI ve form işlemlerinde kullanılır
// Supabase Row tipleri: @/supabase/types.ts
// Sabitler: @/lib/constants

export interface DonemSecici {
  yil: number;
  ay: number;
}

export interface PaginationParams {
  sayfa: number;
  sayfaBasi: number;
}

export interface FilterParams {
  arama?: string;
  durum?: "aktif" | "pasif" | "tumu";
}

export interface EkOdeme {
  aciklama: string;
  tutar: number;
}

export interface EkKesinti {
  aciklama: string;
  tutar: number;
}

export interface BordroNot {
  icerik: string;
}

export interface ResmiTatil {
  tarih: string; // "MM-DD" formatında
  ad: string;
}

export interface ApiHata {
  mesaj: string;
  kod?: string;
}

// Form durumu yardımcı tipi
export type FormDurumu<T = undefined> =
  | { durum: "bos" }
  | { durum: "yukleniyor" }
  | { durum: "basarili"; veri?: T }
  | { durum: "hata"; hata: string };

// ─── Puantaj Modülü ──────────────────────────────────────────────────────────

/**
 * Özel durum kodları:
 * YI = Yıllık İzin | RT = Resmi Tatil | RP = Raporlu
 * CY = Çalışma Yok | UI = Ücretsiz İzin | PM = Pazar Mesaisi | IK = İş Kazası
 */
export type OzelDurum = "YI" | "RT" | "RP" | "CY" | "UI" | "PM" | "IK";

/** Bir güne ait puantaj verisi (form ve grid hücrelerinde kullanılır) */
export interface PuantajGunVerisi {
  giris_saati?: string | null;
  cikis_saati?: string | null;
  calisma_saati?: number | null;
  ozel_durum?: OzelDurum | null;
  aciklama?: string | null;
  /** Fazla mesai saati (opsiyonel) — puantaj_genel.mesai_saati alanına yazılır */
  mesai_saati?: number | null;
}

// ─── Proje Modülü ─────────────────────────────────────────────────────────────

/** Proforma veya Fatura kodu satırı */
export interface FaturaKodu {
  tip: "Fatura" | "Proforma";
  kod: string;
  tarih: string; // "YYYY-MM-DD"
}


// ─── Cari Modülü ──────────────────────────────────────────────────────────────
// Tüm cari tipleri src/types/cari.ts'de tanımlıdır.
export type {
  ParaBirimi,
  BelgeTur,
  OdemeDurumu,
  OdemeYontem,
  DosyaTipi,
  Firma,
  Belge,
  BelgeDosya,
  Odeme,
  BelgeListItem,
  BelgeDetay,
  FirmaBakiye,
  FirmaListItem,
  CariKpi,
  BelgePayload,
  OdemePayload,
  TopluOdemeItem,
  TopluOdemePayload,
  DosyaPayload,
  BelgeListFiltre,
} from "./cari";

// ─── Evrak Modülü ─────────────────────────────────────────────────────────────
// Tüm evrak tipleri src/types/evrak.ts'de tanımlıdır.
export type {
  EvrakKategoriTip,
  EvrakDurum,
  EvrakOnayDurumu,
  EvrakGecerlilikDurumu,
  EvrakIslem,
  EvrakKategori,
  EvrakKategoriForm,
  Evrak,
  EvrakWithKategori,
  EvrakVersiyonGrubu,
  EvrakLog,
  TersaneSablonKategoriRef,
  TersaneSablon,
  TersaneOzelBelge,
  TersaneSablonWithBelgeler,
  PersonelEvrakDurum,
  PersonelEvrakOzet,
  UploadProgress,
  EvrakYukleForm,
  EvrakListeFiltre,
} from "./evrak";

export {
  EVRAK_KABUL_EDILEN_TIPLER,
  EVRAK_UZANTI_MAP,
  EVRAK_MAX_DOSYA_BOYUT,
  EVRAK_MAX_VERSIYON,
  EVRAK_YAKLASAN_ESIK_GUN,
} from "./evrak";
