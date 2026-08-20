import { z } from "zod";
import { paraTutariSchema, guvenliMetinSchema } from "./core";

/**
 * src/lib/validations/maas.ts
 * Bordro & Maaş Modülü Zod Doğrulama Şemaları
 */

export const bordroOlusturSchema = z.object({
  donem_yil: z.number().min(2020, "Geçerli bir yıl seçiniz.").max(2040, "Geçerli bir yıl seçiniz."),
  donem_ay: z.number().min(1, "Geçerli bir ay seçiniz.").max(12, "Geçerli bir ay seçiniz."),
});

export const avansEkleSchema = z.object({
  personel_id: z.string().uuid("Geçerli bir çalışan seçiniz."),
  tutar: paraTutariSchema,
  aciklama: guvenliMetinSchema(1, 256, false).nullable().optional(),
  donem_yil: z.number().min(2020).max(2040).optional(),
  donem_ay: z.number().min(1).max(12).optional(),
});

export const primEkleSchema = z.object({
  personel_id: z.string().uuid("Geçerli bir çalışan seçiniz."),
  tutar: paraTutariSchema,
  aciklama: guvenliMetinSchema(1, 256, false).nullable().optional(),
  donem_yil: z.number().min(2020).max(2040).optional(),
  donem_ay: z.number().min(1).max(12).optional(),
});

export const kesintiEkleSchema = z.object({
  personel_id: z.string().uuid("Geçerli bir çalışan seçiniz."),
  tutar: paraTutariSchema,
  tur: z.enum(["icra", "bes", "diger"]).default("diger"),
  aciklama: guvenliMetinSchema(1, 256, false).nullable().optional(),
});

export const zamUygulaSchema = z.object({
  personel_id: z.string().uuid("Geçerli bir çalışan seçiniz."),
  yeni_maas_net: paraTutariSchema,
  gecerlilik_baslangic: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih giriniz (YYYY-MM-DD)."),
  aciklama: guvenliMetinSchema(1, 256, false).nullable().optional(),
});

export type BordroOlusturInput = z.infer<typeof bordroOlusturSchema>;
export type AvansEkleInput = z.infer<typeof avansEkleSchema>;
export type PrimEkleInput = z.infer<typeof primEkleSchema>;
export type KesintiEkleInput = z.infer<typeof kesintiEkleSchema>;
export type ZamUygulaInput = z.infer<typeof zamUygulaSchema>;
