import { z } from "zod";

/**
 * src/lib/validations/core.ts
 * Ortak Çekirdek Doğrulayıcılar ve Algoritma Süzgeçleri
 */

// ─── 1. TC Kimlik No Doğrulama Algoritması ─────────────────────────────────
export function isValidTCKN(tc: string): boolean {
  const s = tc?.trim() ?? "";
  if (!/^\d{11}$/.test(s)) return false;
  if (s[0] === "0") return false;

  const d = s.split("").map(Number);

  // 10. hane kontrolü: ((1,3,5,7,9. haneler toplamı * 7) - (2,4,6,8. haneler toplamı)) % 10
  const onuncuRaw = ((d[0] + d[2] + d[4] + d[6] + d[8]) * 7 - (d[1] + d[3] + d[5] + d[7])) % 10;
  const onuncu = onuncuRaw < 0 ? onuncuRaw + 10 : onuncuRaw;
  if (onuncu !== d[9]) return false;

  // 11. hane kontrolü: İlk 10 hanenin toplamı % 10
  const onbirinci = (d[0] + d[1] + d[2] + d[3] + d[4] + d[5] + d[6] + d[7] + d[8] + d[9]) % 10;
  if (onbirinci !== d[10]) return false;

  return true;
}

export const tcKimlikSchema = z
  .string({ message: "TC Kimlik No zorunludur." })
  .trim()
  .refine((val) => /^\d{11}$/.test(val), {
    message: "TC Kimlik No 11 haneli sayı olmalıdır.",
  })
  .refine((val) => val[0] !== "0", {
    message: "TC Kimlik No 0 ile başlayamaz.",
  })
  .refine(isValidTCKN, {
    message: "Geçersiz TC Kimlik No algoritması.",
  });

// ─── 2. VKN (Vergi Kimlik No) & TCKN Doğrulama ──────────────────────────────
export function isValidVKN(vkn: string): boolean {
  const s = vkn?.trim() ?? "";
  if (!/^\d{10}$/.test(s)) return false;

  const d = s.split("").map(Number);
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    const v1 = (d[i] + (9 - i)) % 10;
    const v2 = (v1 * Math.pow(2, 9 - i)) % 9;
    const v3 = v1 !== 0 && v2 === 0 ? 9 : v2;
    sum += v3;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === d[9];
}

export const vknOrTcknSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true; // Opsiyonel durumlarda boş geçilebilir
      const clean = val.replace(/\D/g, "");
      if (clean.length === 10) return isValidVKN(clean);
      if (clean.length === 11) return isValidTCKN(clean);
      return false;
    },
    {
      message: "Geçerli bir 10 haneli VKN veya 11 haneli TCKN giriniz.",
    }
  );

// ─── 3. TR IBAN Doğrulama (ISO 7064 Modulo 97) ──────────────────────────────
export function isValidIBAN(iban: string): boolean {
  const clean = iban?.replace(/\s+/g, "").toUpperCase() ?? "";
  if (!/^TR\d{24}$/.test(clean)) return false;

  // Harfleri sayıya çevir (T=29, R=27) -> TR00... => ...292700
  const rearranged = clean.slice(4) + "2927" + clean.slice(2, 4);

  // BigInt ile Modulo 97 kontrolü
  try {
    const num = BigInt(rearranged);
    return num % BigInt(97) === BigInt(1);
  } catch {
    return false;
  }
}

export const ibanSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/\s+/g, "").toUpperCase())
  .refine(
    (val) => {
      if (!val) return true;
      return isValidIBAN(val);
    },
    {
      message: "Geçerli bir Türkiye IBAN numarası giriniz (TR ile başlayan 26 karakter).",
    }
  );

// ─── 4. Türkiye GSM Telefon Doğrulama ───────────────────────────────────────
export function normalizeTelefon(tel: string): string {
  let clean = tel?.replace(/\D/g, "") ?? "";
  if (clean.startsWith("90") && clean.length === 12) {
    clean = clean.slice(2);
  }
  if (clean.startsWith("0") && clean.length === 11) {
    clean = clean.slice(1);
  }
  return clean;
}

export const telefonGsmSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true;
      const clean = normalizeTelefon(val);
      return clean.length === 10 && clean.startsWith("5");
    },
    {
      message: "Geçerli bir Türkiye GSM cep telefonu numarası giriniz (Örn: 05XX XXX XX XX).",
    }
  )
  .transform((val) => {
    if (!val) return null;
    const clean = normalizeTelefon(val);
    return clean ? `0${clean}` : null;
  });

// ─── 5. E-posta Doğrulama ───────────────────────────────────────────────────
export const emailSchema = (zorunlu = false) => {
  const base = z
    .string()
    .trim()
    .toLowerCase();

  if (zorunlu) {
    return base
      .min(1, "E-posta adresi zorunludur.")
      .email("Geçerli bir e-posta adresi giriniz.");
  }

  return base.refine(
    (val) => {
      if (!val) return true;
      return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);
    },
    {
      message: "Geçerli bir e-posta adresi giriniz.",
    }
  ).transform((val) => val || null);
};

// ─── 6. Para / Tutar Doğrulayıcı (Pozitif, Max 10 Ondalık) ───────────────────
export const paraTutariSchema = z
  .union([z.number(), z.string()])
  .transform((val) => {
    if (typeof val === "string") {
      const clean = val.replace(",", ".").trim();
      return Number(clean);
    }
    return val;
  })
  .refine((val) => !isNaN(val) && isFinite(val), {
    message: "Geçerli bir sayısal tutar giriniz.",
  })
  .refine((val) => val > 0, {
    message: "Tutar 0'dan büyük pozitif bir değer olmalıdır.",
  })
  .refine(
    (val) => {
      const str = val.toString();
      const parts = str.split(".");
      return parts.length === 1 || parts[1].length <= 10;
    },
    {
      message: "Tutar en fazla 10 ondalık basamak içerebilir.",
    }
  );

// ─── 7. Güvenli Metin & XSS Filtreleme ───────────────────────────────────────
export function sanitizeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export const guvenliMetinSchema = (min = 1, max = 256, zorunlu = true) => {
  let schema = z
    .string()
    .transform((val) => sanitizeHtml(val));

  if (zorunlu) {
    schema = schema.refine((val) => val.length >= min, {
      message: `Bu alan en az ${min} karakter olmalıdır.`,
    });
  }

  return schema.refine((val) => val.length <= max, {
    message: `Bu alan en fazla ${max} karakter olabilir.`,
  });
};

// ─── 8. Türkçe İsim / Soyisim (Emoji, Sayı & Özel Sembol Yasak) ─────────────
export const turkceIsimSchema = (alanAdi: string, min = 2, max = 50) =>
  z
    .string({ message: `${alanAdi} alanı zorunludur.` })
    .transform((val) => sanitizeHtml(val))
    .refine((val) => val.length >= min, {
      message: `${alanAdi} en az ${min} karakter olmalıdır.`,
    })
    .refine((val) => val.length <= max, {
      message: `${alanAdi} en fazla ${max} karakter olabilir.`,
    })
    .refine(
      (val) => /^[a-zA-ZçÇğĞıİöÖşŞüÜ\s'-]+$/.test(val),
      {
        message: `${alanAdi} yalnızca harf içerebilir (sayı, emoji ve özel sembol girilemez).`,
      }
    );

// ─── 9. Doğum Tarihi & İşe Başlama Tarihi Doğrulama ─────────────────────────
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
}

export const dogumTarihiSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true;
      if (!isValidDateString(val)) return false;

      const birthDate = new Date(val);
      const today = new Date();

      if (birthDate > today) return false; // Gelecek tarih yasak

      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      return age >= 14 && age <= 95;
    },
    {
      message: "Doğum tarihi geçerli bir takvim günü olmalı ve yaş 14 ile 95 arasında olmalıdır (gelecek tarih girilemez).",
    }
  )
  .transform((val) => val || null);

export const iseBaslamaTarihiSchema = z
  .string({ message: "İşe başlama tarihi zorunludur." })
  .trim()
  .refine(isValidDateString, {
    message: "Geçerli bir işe başlama tarihi giriniz (YYYY-MM-DD).",
  })
  .refine(
    (val) => {
      const year = parseInt(val.split("-")[0], 10);
      return year >= 1970 && year <= new Date().getFullYear() + 1;
    },
    {
      message: "İşe başlama tarihi mantıksal bir takvim yılı olmalıdır.",
    }
  );
