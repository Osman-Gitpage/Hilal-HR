import { z } from "zod";
import { guvenliMetinSchema, isValidDateString } from "./core";

/**
 * src/lib/validations/evrak.ts
 * Evrak Modülü Zod Doğrulama Şemaları
 */

export const evrakKategoriTipEnum = z.enum(["personel", "sirket", "tersane"], {
  message: "Geçerli bir kategori tipi seçiniz (personel, sirket, tersane).",
});

export const evrakKategoriSchema = z.object({
  ad: guvenliMetinSchema(2, 100, true),
  tip: evrakKategoriTipEnum,
  zorunlu: z.boolean().default(false),
  sureli: z.boolean().default(false),
  varsayilan_sure: z.number().int().positive().nullable().optional(),
  sira: z.number().int().nonnegative().optional(),
});

export const evrakYukleSchema = z.object({
  kategori_id: z.string().min(1, "Kategori seçilmelidir."),
  personel_id: z.string().uuid().optional(),
  employment_period_id: z.string().uuid().optional(),
  dosya_url: z.string().min(1, "Dosya URL/ObjectKey zorunludur."),
  dosya_adi: guvenliMetinSchema(1, 255, true),
  dosya_boyut: z.number().nonnegative().optional().default(0),
  dosya_tipi: z.string().optional().default("application/octet-stream"),
  baslangic_tarihi: z
    .string()
    .refine(isValidDateString, { message: "Geçerli bir başlangıç tarihi giriniz (YYYY-MM-DD)." })
    .optional(),
  bitis_tarihi: z
    .string()
    .refine(isValidDateString, { message: "Geçerli bir bitiş tarihi giriniz (YYYY-MM-DD)." })
    .optional(),
  tetenoz_iceriyor: z.boolean().optional().default(false),
});

export const evrakGuncelleSchema = z.object({
  evrak_id: z.string().uuid("Geçerli bir evrak seçiniz."),
  baslangic_tarihi: z
    .string()
    .refine(isValidDateString, { message: "Geçerli bir başlangıç tarihi giriniz (YYYY-MM-DD)." })
    .nullable()
    .optional(),
  bitis_tarihi: z
    .string()
    .refine(isValidDateString, { message: "Geçerli bir bitiş tarihi giriniz (YYYY-MM-DD)." })
    .nullable()
    .optional(),
  tetenoz_iceriyor: z.boolean().optional(),
  notlar: guvenliMetinSchema(1, 500, false).nullable().optional(),
});

export const evrakOnaySchema = z.object({
  evrak_id: z.string().uuid("Geçerli bir evrak seçiniz."),
  onay_durum: z.enum(["onaylandi", "reddedildi"], {
    message: "Onay durumu onaylandi veya reddedildi olmalıdır.",
  }),
  red_nedeni: guvenliMetinSchema(2, 500, false).nullable().optional(),
});

export type EvrakKategoriInput = z.infer<typeof evrakKategoriSchema>;
export type EvrakYukleInput = z.infer<typeof evrakYukleSchema>;
export type EvrakGuncelleInput = z.infer<typeof evrakGuncelleSchema>;
export type EvrakOnayInput = z.infer<typeof evrakOnaySchema>;
