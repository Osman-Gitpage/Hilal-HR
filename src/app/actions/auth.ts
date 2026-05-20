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
