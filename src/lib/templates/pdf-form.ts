// ─── PDF Form Doldurma + İmza/Kaşe Engine ────────────────────────────────────
// pdf-lib ile AcroForm doldurma, imza/kaşe drawImage, flatten

import { PDFDocument, rgb, StandardFonts, PDFTextField, PDFCheckBox } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

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
  
  // Register fontkit
  pdf.registerFontkit(fontkit);

  // Load Roboto font to support Turkish characters
  let fontBytes: ArrayBuffer;
  if (typeof window === "undefined") {
    // Server-side
    const fs = require("fs");
    const path = require("path");
    const fontPath = path.join(process.cwd(), "public", "fonts", "Roboto.ttf");
    fontBytes = fs.readFileSync(fontPath);
  } else {
    // Client-side
    const response = await fetch("/fonts/Roboto.ttf");
    fontBytes = await response.arrayBuffer();
  }
  const customFont = await pdf.embedFont(fontBytes);

  const form = pdf.getForm();

  for (const [alanAdi, deger] of Object.entries(alanlar)) {
    try {
      const field = form.getField(alanAdi);
      if (field instanceof PDFTextField) {
        field.setText(deger);
        field.updateAppearances(customFont);
      } else if (field instanceof PDFCheckBox) {
        if (deger.toLowerCase() === "true" || deger.toLowerCase() === "yes" || deger === "1") {
          field.check();
        } else {
          field.uncheck();
        }
        field.updateAppearances();
      } else if ("setText" in field) {
        (field as any).setText(deger);
        if ("updateAppearances" in field && typeof (field as any).updateAppearances === "function") {
          (field as any).updateAppearances(customFont);
        }
      } else if ("check" in field && (deger.toLowerCase() === "true" || deger.toLowerCase() === "yes" || deger === "1")) {
        (field as any).check();
        if ("updateAppearances" in field && typeof (field as any).updateAppearances === "function") {
          (field as any).updateAppearances();
        }
      }
    } catch {
      // Alan bulunamazsa veya doldurulamazsa sessizce atla
      console.warn(`PDF form alanı bulunamadı veya güncellenemedi: ${alanAdi}`);
    }
  }

  // Flatten — tüm form alanlarını statik metin yap
  form.flatten({ updateFieldAppearances: false });

  return pdf.save({ updateFieldAppearances: false });
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
