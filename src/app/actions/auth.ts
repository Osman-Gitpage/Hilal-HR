"use server";

import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";

export async function login(
  _prevState: { hata?: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { hata: "E-posta veya şifre hatalı." };
  }

  redirect("/dashboard");
}

export async function kayitOl(
  _prevState: { hata?: string; basarili?: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const adSoyad = formData.get("adSoyad") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { ad_soyad: adSoyad },
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
  const supabase = await createClient();
  const email = (formData.get("email") as string)?.trim();
  if (!email) return { hata: "E-posta adresi gereklidir." };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/sifre-guncelle`,
  });

  if (error) return { hata: error.message };
  return { basarili: true };
}

export async function sifreGuncelle(
  _prevState: { hata?: string; basarili?: boolean } | undefined,
  formData: FormData
): Promise<{ hata?: string; basarili?: boolean }> {
  const supabase = await createClient();
  const password = (formData.get("password") as string)?.trim();
  if (!password || password.length < 8) return { hata: "Şifre en az 8 karakter olmalıdır." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { hata: error.message };
  return { basarili: true };
}

export async function profilGuncelle(
  _prevState: { hata?: string; basarili?: boolean } | undefined,
  formData: FormData
): Promise<{ hata?: string; basarili?: boolean }> {
  const supabase = await createClient();
  const adSoyad = (formData.get("ad_soyad") as string)?.trim();
  if (!adSoyad) return { hata: "Ad Soyad boş olamaz." };

  const { error } = await supabase.auth.updateUser({
    data: { ad_soyad: adSoyad },
  });
  if (error) return { hata: error.message };
  return { basarili: true };
}
