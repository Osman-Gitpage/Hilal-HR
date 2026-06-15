// ─── DOCX Şablon Doldurma Engine ──────────────────────────────────────────────
// docxtemplater ile Word şablon doldurucu
// Personel bilgilerini şablona yerleştirir

import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

/** Şablona doldurulacak personel verileri */
export interface DocxSablonVerisi {
  // Kişisel
  ad: string;
  soyad: string;
  ad_soyad: string;
  tc: string;
  dogum_tarihi: string;
  cinsiyet: string;
  telefon: string;
  email: string;
  adres: string;
  sgk_sicil: string;

  // Çalışma
  gorev_unvan: string;
  ise_baslama_tarihi: string;
  ise_cikis_tarihi: string;

  // Banka
  banka_adi: string;
  iban: string;
  sube_kodu: string;
  hesap_no: string;

  // Şirket
  sirket_adi: string;
  sirket_vergi_no: string;
  sirket_adres: string;
  sirket_telefon: string;
  sirket_email: string;

  // Tarih
  bugun: string;
  bugun_uzun: string;

  // Özel alanlar (kullanıcı tanımlı)
  [key: string]: string;
}

/**
 * DOCX şablon dosyasını verilerle doldur.
 * @param sablonBuffer - .docx dosyasının ArrayBuffer'ı
 * @param veri - Şablona yerleştirilecek veriler ({ad}, {soyad} vb.)
 * @returns Doldurulmuş .docx dosyasının Uint8Array'i
 */
export function docxSablonDoldur(
  sablonBuffer: ArrayBuffer,
  veri: DocxSablonVerisi
): Uint8Array {
  const zip = new PizZip(sablonBuffer);

  const doc = new Docxtemplater(zip, {
    // Boş tag'ler için hata fırlatma
    nullGetter: () => "",
    // Paragraf içi loop desteği
    paragraphLoop: true,
    // Satır bazlı loop desteği
    linebreaks: true,
  });

  // Tüm tag'leri doldur
  doc.render(veri);

  // Sonuç buffer
  const output = doc.getZip().generate({
    type: "uint8array",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  return output;
}

/**
 * Personel + şirket bilgilerinden DocxSablonVerisi oluştur.
 */
export function sablonVerisiOlustur(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  personel: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sirket: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  donem?: Record<string, any>
): DocxSablonVerisi {
  const bugun = new Date();
  const formatTarih = (t: string | null) => {
    if (!t) return "";
    return new Date(t).toLocaleDateString("tr-TR");
  };

  return {
    ad: personel.ad ?? "",
    soyad: personel.soyad ?? "",
    ad_soyad: `${personel.ad ?? ""} ${personel.soyad ?? ""}`.trim(),
    tc: personel.tc ?? "",
    dogum_tarihi: formatTarih(personel.dogum_tarihi),
    cinsiyet: personel.cinsiyet === "erkek" ? "Erkek" : personel.cinsiyet === "kadin" ? "Kadın" : "",
    telefon: personel.telefon ?? "",
    email: personel.email ?? "",
    adres: personel.adres ?? "",
    sgk_sicil: personel.sgk_sicil ?? "",
    gorev_unvan: personel.gorev_unvan ?? "",
    ise_baslama_tarihi: formatTarih(donem?.baslangic_tarihi ?? null),
    ise_cikis_tarihi: formatTarih(donem?.bitis_tarihi ?? null),
    banka_adi: personel.banka_adi ?? "",
    iban: personel.iban ?? "",
    sube_kodu: personel.sube_kodu ?? "",
    hesap_no: personel.hesap_no ?? "",
    sirket_adi: sirket.ad ?? "",
    sirket_vergi_no: sirket.vergi_no ?? "",
    sirket_adres: sirket.adres ?? "",
    sirket_telefon: sirket.telefon ?? "",
    sirket_email: sirket.email ?? "",
    bugun: bugun.toLocaleDateString("tr-TR"),
    bugun_uzun: bugun.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}
