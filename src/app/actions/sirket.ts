"use server";

import { cookies } from "next/headers";
import { createClient } from "@/supabase/server";
import { createAdminClient } from "@/supabase/admin";
import { redirect } from "next/navigation";

export async function sirketKur(
  _prevState: { hata?: string } | undefined,
  formData: FormData
) {
  // 1. Oturum doğrulama — normal (RLS'li) istemciyle
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/giris");

  const ad = (formData.get("sirket_adi") as string)?.trim();
  const vergi_no = (formData.get("vergi_no") as string)?.trim() || null;
  const telefon = (formData.get("telefon") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;

  if (!ad) {
    return { hata: "Şirket adı zorunludur." };
  }

  // Admin istemci: RLS'yi atlar, ilk şirket kaydını güvenle açar
  const admin = createAdminClient();

  // 2. Şirket oluştur (RLS bypass)
  const { data: sirket, error: sirketError } = await admin
    .from("sirketler")
    .insert({ ad, vergi_no, telefon, email })
    .select("id")
    .single();

  if (sirketError || !sirket) {
    return { hata: sirketError?.message ?? "Şirket oluşturulamadı." };
  }

  // 3. Kullanıcı-şirket bağlantısı — admin rolüyle (RLS bypass)
  const { error: ksError } = await admin.from("kullanici_sirket").insert({
    kullanici_id: user.id,
    sirket_id: sirket.id,
    rol: "admin",
  });

  if (ksError) {
    // Şirketi geri al (rollback benzeri)
    await admin.from("sirketler").delete().eq("id", sirket.id);
    return { hata: ksError.message };
  }

  redirect("/dashboard");
}

// ─────────────────────────────────────────────────────────────────────────────
// T2.1 — Aktif şirketi cookie'ye yaz (multi-company desteği)
// Client-side store değişince çağrılır; getAuthContext cookie'den okur.
// ─────────────────────────────────────────────────────────────────────────────

export async function sirketAyarla(sirketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return; // Redirect yerine sessiz çık — Topbar'dan çağrılır

  // Güvenlik: kullanıcının bu şirkete gerçekten erişimi var mı?
  const { data: ks } = await supabase
    .from("kullanici_sirket")
    .select("sirket_id")
    .eq("kullanici_id", user.id)
    .eq("sirket_id", sirketId)
    .maybeSingle();

  if (!ks) return; // Yetkisiz — sessizce çık

  const cookieStore = await cookies();
  cookieStore.set("aktif_sirket_id", sirketId, {
    httpOnly: false, // Zustand sync için client JS'den okunabilsin
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 yıl
  });
}
