import { z } from "zod";
import {
  turkceIsimSchema,
  tcKimlikSchema,
  dogumTarihiSchema,
  iseBaslamaTarihiSchema,
  paraTutariSchema,
  telefonGsmSchema,
  emailSchema,
  ibanSchema,
  guvenliMetinSchema,
} from "./core";

/**
 * src/lib/validations/personel.ts
 * Personel Modülü Zod Doğrulama Şemaları
 */

export const personelEkleSchema = z.object({
  ad: turkceIsimSchema("Ad", 2, 50),
  soyad: turkceIsimSchema("Soyad", 2, 50),
  tc: tcKimlikSchema,
  dogum_tarihi: dogumTarihiSchema.optional(),
  cinsiyet: z
    .union([z.enum(["erkek", "kadin"]), z.literal(""), z.null()])
    .optional()
    .transform((val) => (!val ? null : (val as "erkek" | "kadin"))),
  ise_baslama_tarihi: iseBaslamaTarihiSchema,
  maas_net: paraTutariSchema,
  sgk_sicil: guvenliMetinSchema(1, 50, false).nullable().optional(),
  gorev_unvan: guvenliMetinSchema(1, 100, false).nullable().optional(),
  telefon: telefonGsmSchema.optional(),
  email: emailSchema(false).optional(),
  adres: guvenliMetinSchema(1, 255, false).nullable().optional(),
  banka_adi: guvenliMetinSchema(1, 100, false).nullable().optional(),
  sube_kodu: guvenliMetinSchema(1, 20, false).nullable().optional(),
  hesap_no: guvenliMetinSchema(1, 30, false).nullable().optional(),
  iban: ibanSchema.optional(),
  ise_baslama_nedeni: guvenliMetinSchema(1, 200, false).nullable().optional(),
});

export const personelGuncelleSchema = z.object({
  ad: turkceIsimSchema("Ad", 2, 50),
  soyad: turkceIsimSchema("Soyad", 2, 50),
  tc: tcKimlikSchema,
  dogum_tarihi: dogumTarihiSchema.optional(),
  cinsiyet: z
    .union([z.enum(["erkek", "kadin"]), z.literal(""), z.null()])
    .optional()
    .transform((val) => (!val ? null : (val as "erkek" | "kadin"))),
  maas_net: paraTutariSchema.optional(),
  sgk_sicil: guvenliMetinSchema(1, 50, false).nullable().optional(),
  gorev_unvan: guvenliMetinSchema(1, 100, false).nullable().optional(),
  telefon: telefonGsmSchema.optional(),
  email: emailSchema(false).optional(),
  adres: guvenliMetinSchema(1, 255, false).nullable().optional(),
  banka_adi: guvenliMetinSchema(1, 100, false).nullable().optional(),
  sube_kodu: guvenliMetinSchema(1, 20, false).nullable().optional(),
  hesap_no: guvenliMetinSchema(1, 30, false).nullable().optional(),
  iban: ibanSchema.optional(),
});

export const hizliPersonelEkleSchema = z.object({
  ad: turkceIsimSchema("Ad", 2, 50),
  soyad: turkceIsimSchema("Soyad", 2, 50),
  tc: tcKimlikSchema,
  gorev_unvan: guvenliMetinSchema(1, 100, false).nullable().optional(),
  ise_baslama_tarihi: iseBaslamaTarihiSchema,
  maas_net: paraTutariSchema,
  telefon: telefonGsmSchema.optional(),
  iban: ibanSchema.optional(),
});

export const istenAyrilmaSchema = z.object({
  personel_id: z.string().uuid("Geçerli bir personel seçiniz."),
  isten_ayrilis_tarihi: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: "Geçerli bir ayrılış tarihi giriniz (YYYY-MM-DD).",
  }),
  isten_ayrilis_nedeni: guvenliMetinSchema(2, 255, true),
});

export type PersonelEkleInput = z.infer<typeof personelEkleSchema>;
export type PersonelGuncelleInput = z.infer<typeof personelGuncelleSchema>;
export type HizliPersonelEkleInput = z.infer<typeof hizliPersonelEkleSchema>;
export type IstenAyrilmaInput = z.infer<typeof istenAyrilmaSchema>;

