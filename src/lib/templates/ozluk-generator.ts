// ─── Özlük Paketi Generator Orchestrator ──────────────────────────────────────
// Tüm adımları birleştir: şablon doldur → PDF dönüştür → evrakları topla → ZIP

import JSZip from "jszip";
import { docxSablonDoldur, sablonVerisiOlustur } from "./docx-template";
import { pdfBirlestir } from "./pdf-merge";
import { pdfGorselEkle } from "./pdf-form";
import { getPresignedDownloadUrl } from "@/lib/storage";

/** Özlük paketi oluşturma girdisi */
export interface OzlukGirdisi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  personel: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sirket: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  donem?: Record<string, any>;

  /** Şablon dosyaları (B2 object key veya ArrayBuffer) */
  sablonlar: {
    ad: string;
    objectKey?: string; // B2 key
    buffer?: ArrayBuffer; // Doğrudan buffer
    tip: "docx" | "pdf" | "diger";
  }[];

  /** Personelin mevcut evrakları (B2 object key) */
  evraklar: {
    kategoriAd: string;
    dosyaAdi: string;
    objectKey: string;
    dosyaTipi: string;
  }[];

  /** İmza görseli (PNG, B2 object key) */
  imzaObjectKey?: string;

  /** Kaşe görseli (PNG, B2 object key) */
  kaseObjectKey?: string;

  /** İmza/kaşe pozisyon ayarları */
  imzaPozisyon?: { x: number; y: number; genislik: number; yukseklik: number };
  kasePozisyon?: { x: number; y: number; genislik: number; yukseklik: number };
}

/** Özlük paketi oluşturma çıktısı */
export interface OzlukCiktisi {
  zipBuffer: Uint8Array;
  dosyaAdi: string;
  dosyalar: string[];
  hatalar: string[];
}

/**
 * B2'den dosya indir → Uint8Array olarak döndür.
 */
async function b2DosyaIndir(objectKey: string): Promise<Uint8Array> {
  const url = await getPresignedDownloadUrl({ objectKey });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Dosya indirilemedi: ${objectKey} (HTTP ${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Özlük paketi oluştur.
 * 1. DOCX şablonları doldur
 * 2. Mevcut evrakları topla
 * 3. İmza/kaşe ekle (varsa)
 * 4. Tümünü ZIP'e paketle
 */
export async function ozlukPaketiOlustur(
  girdi: OzlukGirdisi
): Promise<OzlukCiktisi> {
  const zip = new JSZip();
  const dosyalar: string[] = [];
  const hatalar: string[] = [];
  const sablonVerisi = sablonVerisiOlustur(girdi.personel, girdi.sirket, girdi.donem);

  // ── 1. Şablonları İşle ──────────────────────────────────────────────────────
  for (const sablon of girdi.sablonlar) {
    try {
      let buffer: ArrayBuffer;

      // Buffer al (B2 veya doğrudan)
      if (sablon.buffer) {
        buffer = sablon.buffer;
      } else if (sablon.objectKey) {
        buffer = (await b2DosyaIndir(sablon.objectKey)).buffer as ArrayBuffer;
      } else {
        hatalar.push(`${sablon.ad}: Dosya kaynağı bulunamadı.`);
        continue;
      }

      if (sablon.tip === "docx") {
        // DOCX şablonu doldur
        const doldurulmus = docxSablonDoldur(buffer, sablonVerisi);
        const dosyaAdi = `01_Sablonlar/${sablon.ad}`;
        zip.file(dosyaAdi, doldurulmus);
        dosyalar.push(dosyaAdi);
      } else {
        // PDF veya diğer dosyaları doğrudan ekle
        const dosyaAdi = `01_Sablonlar/${sablon.ad}`;
        zip.file(dosyaAdi, new Uint8Array(buffer));
        dosyalar.push(dosyaAdi);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      hatalar.push(`${sablon.ad}: ${msg}`);
    }
  }

  // ── 2. Mevcut Evrakları Topla ───────────────────────────────────────────────
  for (const evrak of girdi.evraklar) {
    try {
      const buffer = await b2DosyaIndir(evrak.objectKey);
      const dosyaAdi = `02_Evraklar/${evrak.kategoriAd}/${evrak.dosyaAdi}`;
      zip.file(dosyaAdi, buffer);
      dosyalar.push(dosyaAdi);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      hatalar.push(`${evrak.dosyaAdi}: ${msg}`);
    }
  }

  // ── 3. İmza/Kaşe Ekle ──────────────────────────────────────────────────────
  if (girdi.imzaObjectKey) {
    try {
      const buffer = await b2DosyaIndir(girdi.imzaObjectKey);
      zip.file("03_Gorseller/imza.png", buffer);
      dosyalar.push("03_Gorseller/imza.png");
    } catch (err) {
      hatalar.push(`İmza görseli: ${err instanceof Error ? err.message : "İndirilemedi"}`);
    }
  }

  if (girdi.kaseObjectKey) {
    try {
      const buffer = await b2DosyaIndir(girdi.kaseObjectKey);
      zip.file("03_Gorseller/kase.png", buffer);
      dosyalar.push("03_Gorseller/kase.png");
    } catch (err) {
      hatalar.push(`Kaşe görseli: ${err instanceof Error ? err.message : "İndirilemedi"}`);
    }
  }

  // ── 4. ZIP Oluştur ──────────────────────────────────────────────────────────
  const zipBuffer = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const adSoyad = `${girdi.personel.ad}_${girdi.personel.soyad}`.replace(/\s+/g, "_");
  const tarih = new Date().toISOString().split("T")[0];
  const dosyaAdi = `Ozluk_${adSoyad}_${tarih}.zip`;

  return { zipBuffer, dosyaAdi, dosyalar, hatalar };
}
