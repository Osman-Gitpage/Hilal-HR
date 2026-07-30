// ─── Evrak Utility Fonksiyonları ──────────────────────────────────────────────
// Geçerlilik durumu hesaplama, renk kodları, tarih hesaplamaları

import {
  type EvrakGecerlilikDurumu,
  type Evrak,
  type EvrakKategori,
  EVRAK_YAKLASAN_ESIK_GUN,
} from "@/types/evrak";
import { quickValidateFile } from "@/lib/storage/validation";
import { generateObjectKey } from "@/lib/storage/object-key";

// ─── Geçerlilik Durumu Hesaplama ──────────────────────────────────────────────

/**
 * Bir evrakın geçerlilik durumunu hesaplar.
 *
 * - Yeşil (gecerli):   bitis_tarihi > bugün + 30 gün VEYA süresiz
 * - Sarı (yaklasan):   bugün < bitis_tarihi <= bugün + 30 gün
 * - Kırmızı (gecersiz): bitis_tarihi <= bugün
 * - Kırmızı (eksik):   evrak yok ve zorunluysa
 */
export function gecerlilikDurumuHesapla(
  evrak: Evrak | null,
  kategori: EvrakKategori
): EvrakGecerlilikDurumu {
  // Evrak yoksa ve zorunluysa → eksik
  if (!evrak) {
    return kategori.zorunlu ? "eksik" : "gecerli";
  }

  // Süresiz evrak → her zaman geçerli
  if (!kategori.sureli || !evrak.bitis_tarihi) {
    return "gecerli";
  }

  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);

  const bitisTarihi = new Date(evrak.bitis_tarihi);
  bitisTarihi.setHours(0, 0, 0, 0);

  const esikTarihi = new Date(bugun);
  esikTarihi.setDate(esikTarihi.getDate() + EVRAK_YAKLASAN_ESIK_GUN);

  // Süresi geçmiş
  if (bitisTarihi <= bugun) {
    return "gecersiz";
  }

  // Süresi yaklaşan (30 gün içinde)
  if (bitisTarihi <= esikTarihi) {
    return "yaklasan";
  }

  // Geçerli
  return "gecerli";
}

// ─── Bitiş Tarihi Hesaplama ───────────────────────────────────────────────────

/**
 * Başlangıç tarihi ve varsayılan süre (gün) ile bitiş tarihini hesaplar.
 */
export function bitisTarihiHesapla(
  baslangicTarihi: string | Date,
  surGun: number
): Date {
  const baslangic = new Date(baslangicTarihi);
  const bitis = new Date(baslangic);
  bitis.setDate(bitis.getDate() + surGun);
  return bitis;
}

/**
 * Varsayılan süreyi insan okunabilir formata çevirir.
 * Örn: 180 → "6 Ay", 365 → "1 Yıl", 90 → "90 Gün"
 */
export function sureEtiketi(gun: number | null): string {
  if (gun === null) return "Süresiz";
  if (gun === 365) return "1 Yıl";
  if (gun === 730) return "2 Yıl";
  if (gun % 30 === 0) return `${gun / 30} Ay`;
  return `${gun} Gün`;
}

// ─── Renk Kodları ─────────────────────────────────────────────────────────────

/** Geçerlilik durumuna göre Tailwind renk class'ları */
export function durumRengi(durum: EvrakGecerlilikDurumu): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  icon: string;
} {
  switch (durum) {
    case "gecerli":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500/20",
        badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        icon: "✅",
      };
    case "yaklasan":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/20",
        badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        icon: "⚠️",
      };
    case "gecersiz":
      return {
        bg: "bg-red-500/10",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-500/20",
        badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        icon: "❌",
      };
    case "eksik":
      return {
        bg: "bg-gray-500/10",
        text: "text-gray-500 dark:text-gray-400",
        border: "border-gray-500/20",
        badge: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
        icon: "📄",
      };
  }
}

/** Onay durumuna göre renk */
export function onayDurumRengi(durum: string): {
  bg: string;
  text: string;
  label: string;
} {
  switch (durum) {
    case "onaylandi":
      return {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-400",
        label: "Onaylandı",
      };
    case "reddedildi":
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        label: "Reddedildi",
      };
    case "beklemede":
    default:
      return {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-400",
        label: "Beklemede",
      };
  }
}

// ─── Dosya Validasyonu ────────────────────────────────────────────────────────

/**
 * @deprecated Bu fonksiyon kaldırıldı. Yeni sistemde `quickValidateFile` kullanın.
 * @see {@link quickValidateFile} from "@/lib/storage"
 */
export function dosyaValidasyonu(dosya: File): string | null {
  return quickValidateFile(dosya);
}

/**
 * Dosya boyutunu insan okunabilir formata çevirir.
 * Örn: 1048576 → "1.0 MB", 512000 → "500 KB"
 */
export function dosyaBoyutuFormatla(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Dosya adından uzantıyı alır.
 */
export function dosyaUzantisi(dosyaAdi: string): string {
  const parcalar = dosyaAdi.split(".");
  return parcalar.length > 1 ? parcalar[parcalar.length - 1].toLowerCase() : "";
}

/**
 * Dosya tipine göre ikon döner (lucide icon name).
 */
export function dosyaTipiIkonu(dosyaTipi: string | null): string {
  if (!dosyaTipi) return "File";
  if (dosyaTipi.includes("pdf")) return "FileText";
  if (dosyaTipi.includes("word") || dosyaTipi.includes("document")) return "FileText";
  if (dosyaTipi.includes("sheet") || dosyaTipi.includes("excel")) return "FileSpreadsheet";
  if (dosyaTipi.includes("image")) return "Image";
  return "File";
}

// ─── B2 Object Key ────────────────────────────────────────────────────────────

/**
 * @deprecated Bu fonksiyon kaldırıldı. Yeni sistemde `generateObjectKey` kullanın.
 * @see {@link generateObjectKey} from "@/lib/storage"
 *
 * Eski format: {sirketId}/evrak/{personelId|sirket}/{kategoriId}/{uuid}.{ext}
 * Yeni format: {companyId}/{module}/{entityId}/{category}/{uuid}.{ext}
 */
export function b2ObjectKey(params: {
  sirketId: string;
  personelId?: string;
  kategoriId: string;
  dosyaAdi: string;
  uuid?: string;
}): string {
  const { sirketId, personelId, kategoriId, dosyaAdi } = params;
  return generateObjectKey({
    companyId: sirketId,
    module: "evrak",
    entityId: personelId ?? "sirket",
    category: kategoriId,
    fileName: dosyaAdi,
  });
}

// ─── Kalan Gün Hesaplama ──────────────────────────────────────────────────────

/**
 * Bitiş tarihine kalan gün sayısını hesaplar.
 * Negatif değer → süresi geçmiş.
 */
export function kalanGun(bitisTarihi: string | null): number | null {
  if (!bitisTarihi) return null;

  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);

  const bitis = new Date(bitisTarihi);
  bitis.setHours(0, 0, 0, 0);

  const fark = bitis.getTime() - bugun.getTime();
  return Math.ceil(fark / (1000 * 60 * 60 * 24));
}

/**
 * Kalan gün sayısını kullanıcı dostu metne çevirir.
 */
export function kalanGunEtiketi(bitisTarihi: string | null): string {
  const gun = kalanGun(bitisTarihi);
  if (gun === null) return "Süresiz";
  if (gun < 0) return `${Math.abs(gun)} gün geçmiş`;
  if (gun === 0) return "Bugün sona eriyor";
  if (gun === 1) return "Yarın sona eriyor";
  if (gun <= 30) return `${gun} gün kaldı`;
  if (gun <= 90) return `~${Math.round(gun / 30)} ay kaldı`;
  return `${Math.round(gun / 30)} ay kaldı`;
}
