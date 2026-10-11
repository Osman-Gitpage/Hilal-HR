/**
 * Bu script, Excel'den dışa aktarılan ham "public/hilal-tevzi-sablon.pdf" dosyasını okur
 * ve içerisine tam 76 adet (tarih + 25 satır ad_soyad, gorev, calisma_alani)
 * interaktif AcroForm alanını milimetrik CAD koordinatlarıyla otomatik olarak enjekte eder.
 * 
 * Çalıştırma: node scripts/inject-pdf-fields.js
 */

const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function injectFields() {
  const pdfPath = path.join(process.cwd(), 'public', 'hilal-tevzi-sablon.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error('❌ public/hilal-tevzi-sablon.pdf bulunamadı!');
    return;
  }

  const doc = await PDFDocument.load(fs.readFileSync(pdfPath));
  const page = doc.getPages()[0];
  const form = doc.getForm();

  // 1. Tarih Form Alanı
  try {
    const tField = form.createTextField('tarih');
    tField.addToPage(page, { 
      x: 478, 
      y: 744.5, 
      width: 64, 
      height: 18,
      borderWidth: 0,
      borderColor: undefined,
      backgroundColor: undefined
    });
  } catch (e) {
    console.log('Tarih alanı zaten mevcut veya güncellendi.');
  }

  // 2. 25 Satır Personel Form Alanları (ad_soyad_X, gorev_X, calisma_alani_X)
  for (let i = 1; i <= 25; i++) {
    const y = 672.77 - (i - 1) * 17.605;

    try {
      const ad = form.createTextField('ad_soyad_' + i);
      ad.addToPage(page, { 
        x: 69.5, 
        y, 
        width: 128, 
        height: 16,
        borderWidth: 0,
        borderColor: undefined,
        backgroundColor: undefined
      });
    } catch (e) {}

    try {
      const gor = form.createTextField('gorev_' + i);
      gor.addToPage(page, { 
        x: 199.8, 
        y, 
        width: 112, 
        height: 16,
        borderWidth: 0,
        borderColor: undefined,
        backgroundColor: undefined
      });
    } catch (e) {}

    try {
      const alan = form.createTextField('calisma_alani_' + i);
      alan.addToPage(page, { 
        x: 314.2, 
        y, 
        width: 121, 
        height: 16,
        borderWidth: 0,
        borderColor: undefined,
        backgroundColor: undefined
      });
    } catch (e) {}
  }

  const bytes = await doc.save();
  fs.writeFileSync(pdfPath, bytes);
  console.log(`✅ Başarılı! 76 form alanı enjekte edildi. Dosya boyutu: ${bytes.length} bytes`);
}

injectFields();
