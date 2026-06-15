"use server";

// ─── Dosya Yükleme/İndirme Server Actions ─────────────────────────────────────
// Presigned URL üretme ve B2 dosya silme işlemleri

import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import {
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
  deleteB2Object,
} from "@/lib/storage/b2";

// ─── Auth Context ─────────────────────────────────────────────────────────────

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/giris");

  const { data: ks, error: ksError } = await supabase
    .from("kullanici_sirket")
    .select("sirket_id")
    .eq("kullanici_id", user.id)
    .limit(1)
    .maybeSingle();

  if (ksError) throw new Error(`Şirket sorgusu başarısız: ${ksError.message}`);
  if (!ks) throw new Error("Bu kullanıcıya ait şirket kaydı bulunamadı.");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { supabase, user, sirketId: (ks as any).sirket_id as string };
}

// ─── Upload URL ───────────────────────────────────────────────────────────────

/**
 * Dosya yükleme için presigned PUT URL üretir.
 * Client, bu URL'e doğrudan PUT request yaparak dosyayı B2'ye yükler.
 */
export async function uploadUrlOlustur(params: {
  objectKey: string;
  contentType: string;
}): Promise<{ url: string } | { error: string }> {
  try {
    await getAuthContext(); // Auth kontrolü
    const url = await getUploadPresignedUrl(params.objectKey, params.contentType);
    return { url };
  } catch (err) {
    console.error("Upload URL oluşturma hatası:", err);
    return { error: "Yükleme URL'si oluşturulamadı." };
  }
}

// ─── Download URL ─────────────────────────────────────────────────────────────

/**
 * Dosya görüntüleme/indirme için presigned GET URL üretir.
 * 1 saat geçerli.
 */
export async function downloadUrlOlustur(params: {
  objectKey: string;
}): Promise<{ url: string } | { error: string }> {
  try {
    await getAuthContext(); // Auth kontrolü
    const url = await getDownloadPresignedUrl(params.objectKey);
    return { url };
  } catch (err) {
    console.error("Download URL oluşturma hatası:", err);
    return { error: "İndirme URL'si oluşturulamadı." };
  }
}

// ─── Dosya Silme ──────────────────────────────────────────────────────────────

/**
 * B2'den dosya siler. Auth kontrolü yapar.
 */
export async function dosyaSil(params: {
  objectKey: string;
}): Promise<{ success: true } | { error: string }> {
  try {
    await getAuthContext(); // Auth kontrolü
    await deleteB2Object(params.objectKey);
    return { success: true };
  } catch (err) {
    console.error("Dosya silme hatası:", err);
    return { error: "Dosya silinemedi." };
  }
}
