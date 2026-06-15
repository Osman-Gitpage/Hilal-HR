// ─── PDF Birleştirme Engine ───────────────────────────────────────────────────
// pdf-lib ile birden fazla PDF'i tek dosyaya birleştirme

import { PDFDocument } from "pdf-lib";

/**
 * Birden fazla PDF dosyasını tek bir PDF'de birleştir.
 * @param pdfBuffers - Birleştirilecek PDF Uint8Array'leri (sıralı)
 * @returns Birleştirilmiş PDF'in Uint8Array'i
 */
export async function pdfBirlestir(
  pdfBuffers: Uint8Array[]
): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    try {
      const source = await PDFDocument.load(buffer, {
        ignoreEncryption: true,
      });

      const pageIndices = source.getPageIndices();
      const copiedPages = await merged.copyPages(source, pageIndices);

      for (const page of copiedPages) {
        merged.addPage(page);
      }
    } catch (err) {
      console.error("PDF birleştirme hatası (bir dosya atlandı):", err);
      // Hatalı PDF'i atla, diğerlerine devam et
    }
  }

  if (merged.getPageCount() === 0) {
    throw new Error("Birleştirilecek geçerli PDF sayfası bulunamadı.");
  }

  return merged.save();
}

/**
 * Bir PDF'in sayfa sayısını al.
 */
export async function pdfSayfaSayisi(
  pdfBuffer: Uint8Array
): Promise<number> {
  const pdf = await PDFDocument.load(pdfBuffer, {
    ignoreEncryption: true,
  });
  return pdf.getPageCount();
}
