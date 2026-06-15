"use client";

// ─── useFileUpload Hook ──────────────────────────────────────────────────────
// Presigned URL ile client-side direct B2 upload
// Progress tracking, dosya validasyonu, hata yönetimi

import { useState, useCallback } from "react";
import { uploadUrlOlustur } from "@/app/actions/upload";
import { dosyaValidasyonu, b2ObjectKey } from "@/lib/utils/evrak-utils";
import type { UploadProgress } from "@/types/evrak";

interface UseFileUploadOptions {
  sirketId: string;
  kategoriId: string;
  personelId?: string;
  onSuccess?: (objectKey: string, dosyaAdi: string, dosyaBoyut: number) => void;
  onError?: (hata: string) => void;
}

interface UseFileUploadReturn {
  upload: (dosya: File) => Promise<string | null>;
  progress: UploadProgress;
  iptal: () => void;
  sifirla: () => void;
}

export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  const { sirketId, kategoriId, personelId, onSuccess, onError } = options;

  const [progress, setProgress] = useState<UploadProgress>({
    durum: "bekliyor",
    yuzde: 0,
  });

  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const sifirla = useCallback(() => {
    setProgress({ durum: "bekliyor", yuzde: 0 });
    setAbortController(null);
  }, []);

  const iptal = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    sifirla();
  }, [abortController, sifirla]);

  const upload = useCallback(
    async (dosya: File): Promise<string | null> => {
      // 1. Validasyon
      const validasyonHatasi = dosyaValidasyonu(dosya);
      if (validasyonHatasi) {
        setProgress({ durum: "hata", yuzde: 0, hata: validasyonHatasi });
        onError?.(validasyonHatasi);
        return null;
      }

      // 2. Object key oluştur
      const uuid = crypto.randomUUID();
      const objectKey = b2ObjectKey({
        sirketId,
        personelId,
        kategoriId,
        dosyaAdi: dosya.name,
        uuid,
      });

      try {
        setProgress({ durum: "yukleniyor", yuzde: 5 });

        // 3. Presigned URL al
        const result = await uploadUrlOlustur({
          objectKey,
          contentType: dosya.type,
        });

        if ("error" in result) {
          throw new Error(result.error);
        }

        setProgress({ durum: "yukleniyor", yuzde: 15 });

        // 4. Direct upload via XMLHttpRequest (progress tracking için)
        const controller = new AbortController();
        setAbortController(controller);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              // 15-95 arası progress
              const yuzde = Math.round(15 + (e.loaded / e.total) * 80);
              setProgress({ durum: "yukleniyor", yuzde });
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Yükleme başarısız: HTTP ${xhr.status}`));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Ağ hatası oluştu."));
          });

          xhr.addEventListener("abort", () => {
            reject(new Error("Yükleme iptal edildi."));
          });

          // Abort controller bağlantısı
          controller.signal.addEventListener("abort", () => xhr.abort());

          xhr.open("PUT", result.url);
          xhr.setRequestHeader("Content-Type", dosya.type);
          xhr.send(dosya);
        });

        // 5. Başarılı
        setProgress({ durum: "tamamlandi", yuzde: 100 });
        setAbortController(null);
        onSuccess?.(objectKey, dosya.name, dosya.size);

        return objectKey;
      } catch (err) {
        const hata = err instanceof Error ? err.message : "Bilinmeyen hata oluştu.";

        // İptal edilmişse sessizce dur
        if (hata === "Yükleme iptal edildi.") {
          sifirla();
          return null;
        }

        setProgress({ durum: "hata", yuzde: 0, hata });
        onError?.(hata);
        return null;
      }
    },
    [sirketId, kategoriId, personelId, onSuccess, onError, sifirla]
  );

  return { upload, progress, iptal, sifirla };
}
