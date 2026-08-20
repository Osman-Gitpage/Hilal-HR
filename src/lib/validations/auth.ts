import { z } from "zod";
import { emailSchema, turkceIsimSchema } from "./core";

/**
 * src/lib/validations/auth.ts
 * Auth Modülü Zod Doğrulama Şemaları
 */

export const loginSchema = z.object({
  email: emailSchema(true),
  password: z.string().min(1, "Şifre girilmelidir."),
});

export const kayitSchema = z.object({
  adSoyad: turkceIsimSchema("Ad Soyad", 2, 60),
  email: emailSchema(true),
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır."),
});

export const sifreSifirlaSchema = z.object({
  email: emailSchema(true),
});

export const sifreGuncelleSchema = z.object({
  password: z.string().min(8, "Şifre en az 8 karakter olmalıdır."),
});

export const profilGuncelleSchema = z.object({
  ad_soyad: turkceIsimSchema("Ad Soyad", 2, 60),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type KayitInput = z.infer<typeof kayitSchema>;
export type SifreSifirlaInput = z.infer<typeof sifreSifirlaSchema>;
export type SifreGuncelleInput = z.infer<typeof sifreGuncelleSchema>;
export type ProfilGuncelleInput = z.infer<typeof profilGuncelleSchema>;
