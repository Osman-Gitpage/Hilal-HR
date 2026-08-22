import { z } from "zod";
import { guvenliMetinSchema } from "./core";

/**
 * src/lib/validations/puantaj.ts
 * Puantaj Modülü Zod Doğrulama Şemaları
 */

export const GECERLI_PUANTAJ_KODLARI = [
  "X",
  "R",
  "Y",
  "H",
  "D",
  "0.5",
  "S",
  "Ü",
  "Yİ",
  "İ",
  "Rİ",
  "RT",
  "RP",
  "ÇY",
  "CY",
  "Üİ",
  "UI",
  "PM",
  "İK",
  "IK",
  "x",
  "r",
  "y",
  "h",
  "d",
  "s",
  "ü",
  "yi",
  "i",
  "ri",
  "rt",
  "rp",
  "çy",
  "cy",
  "üi",
  "ui",
  "pm",
  "ik",
] as const;

export const puantajHucreSchema = z.object({
  personel_id: z.string().uuid("Geçerli bir personel seçiniz."),
  tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih giriniz (YYYY-MM-DD)."),
  kod: z
    .enum(GECERLI_PUANTAJ_KODLARI, {
      message: "Geçersiz puantaj kodu.",
    })
    .nullable()
    .optional(),
  saat: z
    .number({ message: "Mesai saati sayısal olmalıdır." })
    .min(0, "Mesai saati negatif olamaz.")
    .max(256, "Fazla mesai en fazla 256 saat olabilir.")
    .default(0),
  ozel_durum: guvenliMetinSchema(1, 100, false).nullable().optional(),
});

export const projeSchema = z.object({
  ad: guvenliMetinSchema(2, 100, true),
  kod: guvenliMetinSchema(1, 50, false).nullable().optional(),
  aciklama: guvenliMetinSchema(1, 256, false).nullable().optional(),
  durum: z.enum(["aktif", "tamamlandi", "iptal", "arsiv"]).default("aktif"),
});

export const projeSaatSchema = z.object({
  personel_id: z.string().uuid("Geçerli bir personel seçiniz."),
  proje_id: z.string().uuid("Geçerli bir proje seçiniz."),
  tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih giriniz (YYYY-MM-DD)."),
  saat: z.number().min(0.5, "En az 0.5 saat girilmelidir.").max(24, "Bir gün için en fazla 24 saat girilebilir."),
  aciklama: guvenliMetinSchema(1, 256, false).nullable().optional(),
});

export const puantajKilitAcmaSchema = z.object({
  yil: z.number().min(2020).max(2040),
  ay: z.number().min(1).max(12),
  neden: guvenliMetinSchema(5, 256, true),
});

export type PuantajHucreInput = z.infer<typeof puantajHucreSchema>;
export type ProjeInput = z.infer<typeof projeSchema>;
export type ProjeSaatInput = z.infer<typeof projeSaatSchema>;
export type PuantajKilitAcmaInput = z.infer<typeof puantajKilitAcmaSchema>;
