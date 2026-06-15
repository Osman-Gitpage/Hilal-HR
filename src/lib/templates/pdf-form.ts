// ─── PDF Form Doldurma + İmza/Kaşe Engine ────────────────────────────────────
// pdf-lib ile AcroForm doldurma, imza/kaşe drawImage, flatten

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * PDF formundaki AcroForm alanlarını doldur.
 * @param pdfBuffer - PDF dosyasının Uint8Array'i
 * @param alanlar - { alanAdi: deger } formatında form alanları
 * @returns Doldurulmuş PDF'in Uint8Array'i
 */
export async function pdfFormDoldur(
  pdfBuffer: Uint8Array,
  alanlar: Record<string, string>
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const form = pdf.getForm();

  for (const [alanAdi, deger] of Object.entries(alanlar)) {
    try {
      const field = form.getTextField(alanAdi);
      field.setText(deger);
    } catch {
      // Alan bulunamazsa sessizce atla
      console.warn(`PDF form alanı bulunamadı: ${alanAdi}`);
    }
  }

  // Flatten — tüm form alanlarını statik metin yap
  form.flatten();

  return pdf.save();
}

/**
 * PDF'e imza veya kaşe görseli ekle.
 * @param pdfBuffer - PDF dosyasının Uint8Array'i
 * @param gorselBuffer - PNG/JPG görsel dosyasının Uint8Array'i
 * @param options - Pozisyon ve boyut ayarları
 * @returns Güncellenmiş PDF'in Uint8Array'i
 */
export async function pdfGorselEkle(
  pdfBuffer: Uint8Array,
  gorselBuffer: Uint8Array,
  options: {
    sayfa?: number; // 0-indexed, varsayılan son sayfa
    x: number; // sol kenardan px
    y: number; // alt kenardan px
    genislik: number;
    yukseklik: number;
    isPng?: boolean; // varsayılan true
  }
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);

  // Görseli embed et
  const gorsel = options.isPng !== false
    ? await pdf.embedPng(gorselBuffer)
    : await pdf.embedJpg(gorselBuffer);

  // Hedef sayfayı seç
  const pages = pdf.getPages();
  const sayfaIndex = options.sayfa ?? pages.length - 1;
  const sayfa = pages[Math.min(sayfaIndex, pages.length - 1)];

  // Görseli sayfaya çiz
  sayfa.drawImage(gorsel, {
    x: options.x,
    y: options.y,
    width: options.genislik,
    height: options.yukseklik,
  });

  return pdf.save();
}

/**
 * Boş PDF sayfasına metin yaz (basit metin tabanlı belge oluşturma).
 */
export async function pdfMetinOlustur(
  satirlar: string[],
  options?: {
    baslik?: string;
    fontSize?: number;
  }
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontSize = options?.fontSize ?? 11;

  const page = pdf.addPage([595.28, 841.89]); // A4
  let y = 800;
  const x = 50;
  const satirYukseklik = fontSize * 1.5;

  // Başlık
  if (options?.baslik) {
    page.drawText(options.baslik, {
      x,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    y -= 30;
  }

  // Satırlar
  for (const satir of satirlar) {
    if (y < 50) {
      // Yeni sayfa
      const newPage = pdf.addPage([595.28, 841.89]);
      y = 800;
      newPage.drawText(satir, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    } else {
      page.drawText(satir, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }
    y -= satirYukseklik;
  }

  return pdf.save();
}
