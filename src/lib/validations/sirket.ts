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

export type SirketGuncelleInput = z.infer<typeof sirketGuncelleSchema>;
export type SirketBankaHesapInput = z.infer<typeof sirketBankaHesapSchema>;
