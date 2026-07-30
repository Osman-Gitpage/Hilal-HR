// ─── Cari Modülü — Uygulama Tipleri ─────────────────────────────────────────
// docs/cari-modul.md spesifikasyonuna göre tanımlandı.

// ── Enum / Literal Tipler ────────────────────────────────────────────────────

export type ParaBirimi = "TRY" | "EUR" | "USD";

export type BelgeTur = "fatura" | "proforma" | "hesap_bilgisi";

export type OdemeDurumu = "odendi" | "kismi" | "odenmedi";

export type OdemeYontem = "banka" | "elden" | "cek";

export type DosyaTipi = "PDF" | "Word";

/** Dosya kategorisi: belge–dekont çifti veya serbest dosya */
export type DosyaKategori = "belge" | "dekont" | "diger";

// ── Temel Kayıt Tipleri ──────────────────────────────────────────────────────

export interface Firma {
  id: string;
  ad: string;
  notlar: string | null;
}

export interface Belge {
  id: string;
  sirket_id: string;
  firma_id: string | null;
  tur: BelgeTur;
  belge_no: string;
  tarih: string;       // 'YYYY-MM-DD'
  aciklama: string;
  gemi_adi: string | null;  // Opsiyonel gemi adı
  tutar: number;
  para_birimi: ParaBirimi;
  kur: number;         // TL kuru (TRY → 1, EUR/USD → piyasa kuru)
  notlar: string | null;
  created_at: string;
  updated_at: string;
}

export interface BelgeDosya {
  id: string;
  sirket_id: string;
  belge_id: string;
  dosya_url: string;
  dosya_adi: string;
  dosya_tipi: DosyaTipi;
  boyut_byte: number | null;
  /** 'belge' | 'dekont' | 'diger' — varsayılan 'diger' */
  kategori: DosyaKategori;
  /** Belge–Dekont çift numarası (1, 2, 3…). 'diger' için null. */
  cift_no: number | null;
  created_at: string;
}

export interface Odeme {
  id: string;
  sirket_id: string;
  belge_id: string;
  tarih: string;       // 'YYYY-MM-DD'
  tutar: number;
  para_birimi: ParaBirimi;
  kur: number;         // TL kuru
  yontem: OdemeYontem;
  aciklama: string | null;
  created_at: string;
}

// ── Hesaplanmış View Modelleri ───────────────────────────────────────────────

/** Belge listesinde her satırda gösterilen veri */
export interface BelgeListItem extends Belge {
  firma_ad: string | null;
  /** SUM(odeme.tutar × odeme.kur) — TL cinsinden toplam ödeme */
  odenen_toplam_tl: number;
  /** belge.tutar - odenen_toplam_tl (≥ 0) */
  kalan: number;
  odeme_durumu: OdemeDurumu;
  /** tarih + 30 gün geçmiş AND durum != odendi */
  gecikmiş: boolean;
  odemeler?: Odeme[];
}

/** Belge detay sayfasında kullanılan tam veri */
export interface BelgeDetay extends BelgeListItem {
  firma: Firma | null;
  odemeler: Odeme[];
  dosyalar: BelgeDosya[];
}

/** Firma listesinde para birimi bazlı bakiye özeti */
export interface FirmaBakiye {
  para_birimi: ParaBirimi;
  alacak: number;
  odenen: number;
  kalan: number;
}

/** Firma listesi kartı */
export interface FirmaListItem extends Firma {
  bakiye: FirmaBakiye[];
}

/** KPI kartı verisi */
export interface CariKpi {
  para_birimi: ParaBirimi;
  toplam_alacak: number;
  odenen: number;
  odenmemis: number;
}

// ── Form / Action Payload Tipleri ────────────────────────────────────────────

export interface BelgePayload {
  firma_id?: string | null;
  tur: BelgeTur;
  belge_no: string;
  tarih: string;
  aciklama: string;
  gemi_adi?: string | null;  // Opsiyonel gemi adı
  tutar: number;
  para_birimi: ParaBirimi;
  kur: number;
  notlar?: string | null;
}

export interface OdemePayload {
  belge_id: string;
  tarih: string;
  tutar: number;
  para_birimi: ParaBirimi;
  kur: number;
  yontem: OdemeYontem;
  aciklama?: string | null;
}

export interface TopluOdemeItem {
  belge_id: string;
  tutar: number;
}

export interface TopluOdemePayload {
  tarih: string;
  para_birimi: ParaBirimi;
  kur: number;
  yontem: OdemeYontem;
  aciklama?: string | null;
  kalemler: TopluOdemeItem[];
}

export interface DosyaPayload {
  belge_id: string;
  dosya_url: string;
  dosya_adi: string;
  dosya_tipi: DosyaTipi;
  boyut_byte?: number | null;
  kategori?: DosyaKategori;
  cift_no?: number | null;
}

// ── Filtre Tipleri ───────────────────────────────────────────────────────────

export interface BelgeListFiltre {
  tur?: BelgeTur;
  durum?: OdemeDurumu;       // Tekil (geriye uyumlu)
  durumlar?: OdemeDurumu[];  // Çoklu durum filtresi
  arama?: string;
  firma_id?: string;
  yil?: number;  // Fatura tarihi yıl filtresi (01.01.YYYY – 31.12.YYYY)
}
