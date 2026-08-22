import { z } from "zod";
import {
  guvenliMetinSchema,
  paraTutariSchema,
  vknOrTcknSchema,
  telefonGsmSchema,
  emailSchema,
  isValidDateString,
} from "./core";

/**
 * src/lib/validations/cari.ts
 * Cari & Finans Modülü Zod Doğrulama Şemaları
 */

export const firmaSchema = z.object({
  ad: guvenliMetinSchema(2, 150, true),
  notlar: guvenliMetinSchema(1, 500, false).nullable().optional(),
  vkn: vknOrTcknSchema.optional(),
  vergi_dairesi: guvenliMetinSchema(1, 100, false).nullable().optional(),
  telefon: telefonGsmSchema.optional(),
  email: emailSchema(false).optional(),
  adres: guvenliMetinSchema(1, 255, false).nullable().optional(),
});

export const belgeSchema = z.object({
  firma_id: z.string().uuid().nullable().optional(),
  tur: z.enum(["fatura", "proforma", "hesap_bilgisi", "makbuz", "dekont", "diger"], {
    message: "Geçerli bir belge türü seçiniz (fatura, proforma, hesap_bilgisi).",
  }),
  belge_no: guvenliMetinSchema(1, 50, true),
  tarih: z.string().refine(isValidDateString, {
    message: "Geçerli bir belge tarihi giriniz (YYYY-MM-DD).",
  }),
  aciklama: guvenliMetinSchema(1, 255, true),
  gemi_adi: guvenliMetinSchema(1, 100, false).nullable().optional(),
  tutar: paraTutariSchema,
  para_birimi: z.enum(["TRY", "EUR", "USD"], {
    message: "Para birimi TRY, EUR veya USD olmalıdır.",
  }),
  kur: paraTutariSchema,
  notlar: guvenliMetinSchema(1, 500, false).nullable().optional(),
});

export const odemeSchema = z.object({
  belge_id: z.string().uuid("Geçerli bir belge seçiniz."),
  tarih: z.string().refine(isValidDateString, {
    message: "Geçerli bir ödeme tarihi giriniz (YYYY-MM-DD).",
  }),
  tutar: paraTutariSchema,
  para_birimi: z.enum(["TRY", "EUR", "USD"], {
    message: "Para birimi TRY, EUR veya USD olmalıdır.",
  }),
  kur: paraTutariSchema,
  yontem: z
    .enum(["banka", "elden", "cek", "nakit", "kasa", "diger"], {
      message: "Geçerli bir ödeme yöntemi seçiniz (banka, elden, cek).",
    })
    .transform((val) => (val === "nakit" || val === "kasa" ? "elden" : val)),
  aciklama: guvenliMetinSchema(1, 255, false).nullable().optional(),
});

export const belgeDosyaSchema = z.object({
  belge_id: z.string().uuid("Geçerli bir belge ID gereklidir."),
  dosya_url: z.string().min(1, "Dosya URL/ObjectKey zorunludur."),
  dosya_adi: guvenliMetinSchema(1, 255, true),
  dosya_tipi: z.enum(["PDF", "Word", "Excel", "Resim", "Diger"]).default("Diger"),
  boyut_byte: z.number().nonnegative().optional().default(0),
  kategori: z.enum(["belge", "dekont", "diger"]).default("belge"),
  cift_no: z.number().int().positive().optional().default(1),
});

export const topluOdemeSchema = z.object({
  belge_ids: z.array(z.string().uuid()).min(1, "En az bir belge seçilmelidir."),
  tarih: z.string().refine(isValidDateString, {
    message: "Geçerli bir ödeme tarihi giriniz (YYYY-MM-DD).",
  }),
  yontem: z
    .enum(["banka", "elden", "cek", "nakit", "kasa", "diger"])
    .transform((val) => (val === "nakit" || val === "kasa" ? "elden" : val)),
  aciklama: guvenliMetinSchema(1, 255, false).nullable().optional(),
});

export type FirmaInput = z.infer<typeof firmaSchema>;
export type BelgeInput = z.infer<typeof belgeSchema>;
export type OdemeInput = z.infer<typeof odemeSchema>;
export type BelgeDosyaInput = z.infer<typeof belgeDosyaSchema>;
export type TopluOdemeInput = z.infer<typeof topluOdemeSchema>;

