import { z } from "zod";
import {
  guvenliMetinSchema,
  vknOrTcknSchema,
  telefonGsmSchema,
  emailSchema,
  ibanSchema,
} from "./core";

/**
 * src/lib/validations/sirket.ts
 * Şirket & Ayarlar Modülü Zod Doğrulama Şemaları
 */

export const sirketGuncelleSchema = z.object({
  unvan: guvenliMetinSchema(2, 200, true),
  vkn: vknOrTcknSchema.optional(),
  vergi_dairesi: guvenliMetinSchema(1, 100, false).nullable().optional(),
  adres: guvenliMetinSchema(1, 255, false).nullable().optional(),
  telefon: telefonGsmSchema.optional(),
  email: emailSchema(false).optional(),
  ticaret_sicil_no: guvenliMetinSchema(1, 50, false).nullable().optional(),
  sgk_isyeri_no: guvenliMetinSchema(1, 50, false).nullable().optional(),
});

export const sirketBankaHesapSchema = z.object({
  banka_adi: guvenliMetinSchema(2, 100, true),
  hesap_adi: guvenliMetinSchema(2, 100, true),
  iban: ibanSchema,
  para_birimi: z.enum(["TRY", "EUR", "USD", "GBP"]).default("TRY"),
  sube_kodu: guvenliMetinSchema(1, 20, false).nullable().optional(),
  hesap_no: guvenliMetinSchema(1, 30, false).nullable().optional(),
});

export const sirketKurSchema = z.object({
  sirket_adi: guvenliMetinSchema(2, 200, true),
  vergi_no: vknOrTcknSchema.optional(),
  telefon: telefonGsmSchema.optional(),
  email: emailSchema(false).optional(),
});

export const ayarlarGuncelleSchema = z.object({
  aylik_calisma_saati: z.number().min(100).max(300).default(225),
  gunluk_calisma_saati: z.number().min(4).max(12).default(8),
  fazla_mesai_carpani: z.number().min(1).max(3).default(1.5),
  pazar_mesai_carpani: z.number().min(1).max(4).default(2),
  resmi_tatil_carpani: z.number().min(1).max(4).default(2),
});

export type SirketGuncelleInput = z.infer<typeof sirketGuncelleSchema>;
export type SirketBankaHesapInput = z.infer<typeof sirketBankaHesapSchema>;
export type SirketKurInput = z.infer<typeof sirketKurSchema>;
export type AyarlarGuncelleInput = z.infer<typeof ayarlarGuncelleSchema>;

