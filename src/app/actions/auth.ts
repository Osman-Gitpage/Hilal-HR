"use server";

import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import {
  loginSchema,
  kayitSchema,
  sifreSifirlaSchema,
  sifreGuncelleSchema,
  profilGuncelleSchema,
} from "@/lib/validations/auth";

export async function login(
  _prevState: { hata?: string } | undefined,
  formData: FormData
) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email") as string ?? "",
    password: formData.get("password") as string ?? "",
  });

  if (!parsed.success) {
    return { hata: parsed.error.issues[0]?.message ?? "Geçersiz giriş bilgileri." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email!,
    password: parsed.data.password,
  });

  if (error) {
    return { hata: "E-posta veya şifre hatalı." };
  }

  redirect("/dashboard");
}

export async function kayitOl(
  _prevState: { hata?: string; basarili?: string } | undefined,
  formData: FormData
) {
  const parsed = kayitSchema.safeParse({
    adSoyad: formData.get("adSoyad") as string ?? "",
    email: formData.get("email") as string ?? "",
    password: formData.get("password") as string ?? "",
  });

  if (!parsed.success) {
    return { hata: parsed.error.issues[0]?.message ?? "Geçersiz kayıt bilgileri." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email!,
    password: parsed.data.password,
    options: {
      data: { ad_soyad: parsed.data.adSoyad },
    },
  });

  if (error) {
    return { hata: error.message };
  }

  return { basarili: "Kayıt başarılı! E-postanızı kontrol edin." };
}

export async function cikisYap() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/giris");
}

export async function sifreSifirla(
  _prevState: { hata?: string; basarili?: boolean } | undefined,
  formData: FormData
): Promise<{ hata?: string; basarili?: boolean }> {
  const parsed = sifreSifirlaSchema.safeParse({
    email: formData.get("email") as string ?? "",
  });

  if (!parsed.success) {
    return { hata: parsed.error.issues[0]?.message ?? "Geçersiz e-posta adresi." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email!, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/sifre-guncelle`,
  });

  if (error) return { hata: error.message };
  return { basarili: true };
}

export async function sifreGuncelle(
  _prevState: { hata?: string; basarili?: boolean } | undefined,
  formData: FormData
): Promise<{ hata?: string; basarili?: boolean }> {
  const parsed = sifreGuncelleSchema.safeParse({
    password: formData.get("password") as string ?? "",
  });

  if (!parsed.success) {
    return { hata: parsed.error.issues[0]?.message ?? "Şifre en az 8 karakter olmalıdır." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { hata: error.message };
  return { basarili: true };
}

export async function profilGuncelle(
  _prevState: { hata?: string; basarili?: boolean } | undefined,
  formData: FormData
): Promise<{ hata?: string; basarili?: boolean }> {
  const parsed = profilGuncelleSchema.safeParse({
    ad_soyad: formData.get("ad_soyad") as string ?? "",
  });

  if (!parsed.success) {
    return { hata: parsed.error.issues[0]?.message ?? "Geçersiz ad soyad." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { ad_soyad: parsed.data.ad_soyad },
  });
  if (error) return { hata: error.message };
  return { basarili: true };
}
