// ─────────────────────────────────────────────
// Çalışma Saati Sabitleri
// ─────────────────────────────────────────────
export const VARSAYILAN_GUNLUK_CALISMA_SAATI = 8;
export const VARSAYILAN_AYLIK_CALISMA_SAATI = 225;

// ─────────────────────────────────────────────
// Ay Adları
// ─────────────────────────────────────────────
/** Index 0 boş — doğrudan ay numarasıyla erişim için: AY_ADLARI[1] = "Ocak" */
export const AY_ADLARI = [
  "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
] as const;

// ─────────────────────────────────────────────
// Ek Ödeme / Kesinti Limitleri
// ─────────────────────────────────────────────
export const MAX_EK_ODEME = 10;
export const MAX_EK_KESINTI = 10;
export const MAX_NOT = 10;

// ─────────────────────────────────────────────
// Bordro Durum Etiketleri
// ─────────────────────────────────────────────

/** Bordro `durum` alanının Türkçe gösterim etiketleri. */
export const BORDRO_DURUM_LABELS: Record<string, string> = {
  taslak:            "Taslak",
  kontrol_bekliyor:  "Kontrol Bekliyor",
  onaylandi:         "Onaylandı",
  kilitlendi:        "Kilitlendi",
} as const;

/** Bordro durum badge renk sınıfı (Tailwind / CSS class isimleri). */
export const BORDRO_DURUM_RENK: Record<string, string> = {
  taslak:           "badge-gray",
  kontrol_bekliyor: "badge-yellow",
  onaylandi:        "badge-green",
  kilitlendi:       "badge-red",
} as const;

export type BordroDurum = "taslak" | "kontrol_bekliyor" | "onaylandi" | "kilitlendi";

// ─────────────────────────────────────────────
// Tarih Formatlama
// ─────────────────────────────────────────────
export const TARIH_FORMAT = "dd.MM.yyyy";
export const DONEM_FORMAT = "MMMM yyyy";

// ─────────────────────────────────────────────
// Para Birimi
// ─────────────────────────────────────────────
export const PARA_BIRIMI = "TRY";
export const PARA_BIRIMI_SEMBOL = "₺";
export const PARA_LOCALE = "tr-TR";

// ─────────────────────────────────────────────
// Kullanıcı Rolleri
// ─────────────────────────────────────────────
export const ROLLER = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;

export type Rol = (typeof ROLLER)[keyof typeof ROLLER];

// ─────────────────────────────────────────────
// Cinsiyet
// ─────────────────────────────────────────────
export const CINSIYET_SECENEKLER = [
  { value: "erkek", label: "Erkek" },
  { value: "kadin", label: "Kadın" },
] as const;

// ─────────────────────────────────────────────
// Türkiye Resmi Tatilleri (Varsayılan)
// ─────────────────────────────────────────────
export const VARSAYILAN_RESMI_TATILLER = [
  { tarih: "01-01", ad: "Yılbaşı" },
  { tarih: "04-23", ad: "Ulusal Egemenlik ve Çocuk Bayramı" },
  { tarih: "05-01", ad: "Emek ve Dayanışma Günü" },
  { tarih: "05-19", ad: "Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
  { tarih: "07-15", ad: "Demokrasi ve Millî Birlik Günü" },
  { tarih: "08-30", ad: "Zafer Bayramı" },
  { tarih: "10-29", ad: "Cumhuriyet Bayramı" },
] as const;

// ─────────────────────────────────────────────
// Query Keys (TanStack Query)
// ─────────────────────────────────────────────
export const QUERY_KEYS = {
  SIRKETLER: ["sirketler"] as const,
  SIRKET: (id: string) => ["sirketler", id] as const,
  PERSONEL_LIST: (sirketId: string) => ["personel", sirketId] as const,
  PERSONEL: (id: string) => ["personel", "detail", id] as const,
  EMPLOYMENT_PERIODS: (personelId: string) =>
    ["employment_periods", personelId] as const,
  MAAS_GECMISI: (personelId: string) => ["maas_gecmisi", personelId] as const,
  MAAS_BORDRO: (sirketId: string, yil: number, ay: number) =>
    ["maas_bordro", sirketId, yil, ay] as const,
  PERSONEL_BORDRO: (personelId: string, yil: number, ay: number) =>
    ["personel_bordro", personelId, yil, ay] as const,
  BANKA_ODEME: (sirketId: string, yil: number, ay: number) =>
    ["banka_odeme", sirketId, yil, ay] as const,
  EK_KALEM: (bordroId: string) =>
    ["bordro_ek_kalem", bordroId] as const,
  AYARLAR: (sirketId: string) => ["ayarlar", sirketId] as const,
  // Puantaj
  PUANTAJ_GENEL: (sirketId: string, yil: number, ay: number) =>
    ["puantaj_genel", sirketId, yil, ay] as const,
  PUANTAJ_PROJE: (sirketId: string, projeId: string, yil: number, ay: number) =>
    ["puantaj_proje", sirketId, projeId, yil, ay] as const,
  PROJELER: (sirketId: string) => ["projeler", sirketId] as const,
  PUANTAJ_AY_OZET: (sirketId: string, yil: number, ay: number) =>
    ["puantaj_ay_ozet", sirketId, yil, ay] as const,
  // Cari
  GEMI_LIST: (sirketId: string) => ["gemi", "list", sirketId] as const,
  GEMI_DETAY: (gemiId: string) => ["gemi", "detay", gemiId] as const,
  BELGE_LIST: (gemiId: string, tur?: string) =>
    tur ? ["belge", "list", gemiId, tur] as const : ["belge", "list", gemiId] as const,
  BELGE_DETAY: (belgeId: string) => ["belge", "detay", belgeId] as const,
  ODEME_LIST: (belgeId: string) => ["cari_odeme", "list", belgeId] as const,
  CARI_KPI: (sirketId: string) => ["cari", "kpi", sirketId] as const,
  CARI_GENEL: (sirketId: string, pb?: string) =>
    pb ? ["cari", "genel", sirketId, pb] as const : ["cari", "genel", sirketId] as const,
} as const;

// ─────────────────────────────────────────────
// Puantaj — Özel Durum Sabitleri
// ─────────────────────────────────────────────

/**
 * Puantaj özel durum kodları ve meta verileri.
 * `saat`  → bu durumun sayıldığı günlük çalışma saati (SGK/bordro için)
 * `mesai` → ek mesai saati (PM = Pazar Mesaisi 16 saat ek)
 * `renk`  → grid hücresinde kullanılan Tailwind renk anahtarı
 */
export const OZEL_DURUMLAR = {
  YI: { label: "Yıllık İzin",    kod: "Yİ", saat: 8,  mesai: 0,  renk: "blue"   },
  RT: { label: "Resmi Tatil",    kod: "RT", saat: 8,  mesai: 0,  renk: "purple" },
  RP: { label: "Raporlu",        kod: "RP", saat: 8,  mesai: 0,  renk: "green"  },
  CY: { label: "Çalışma Yok",   kod: "ÇY", saat: 8,  mesai: 0,  renk: "gray"   },
  UI: { label: "Ücretsiz İzin", kod: "Üİ", saat: 0,  mesai: 0,  renk: "orange" },
  PM: { label: "Pazar Mesaisi", kod: "PM", saat: 0,  mesai: 16, renk: "pink"   },
  IK: { label: "İş Kazası",     kod: "İK", saat: 8,  mesai: 0,  renk: "red"    },
} as const;

export type OzelDurumKod = keyof typeof OZEL_DURUMLAR;

