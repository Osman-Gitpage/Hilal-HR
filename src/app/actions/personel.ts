"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/supabase/server";
import { createAdminClient } from "@/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PersonelInsert, PersonelUpdate } from "@/supabase/app-types";
import { tcKimlikDogrula } from "@/lib/utils/index";


// ─────────────────────────────────────────────
// Yardımcı: Aktif kullanıcı + aktif şirket
// ─────────────────────────────────────────────
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
  if (!ks) throw new Error("Bu kullanıcıya ait şirket kaydı bulunamadı. Lütfen yöneticinize başvurun.");

  return { supabase, user, sirketId: (ks as any).sirket_id as string };
}

// ─────────────────────────────────────────────
// Personel Listesi
// ─────────────────────────────────────────────
export async function personelListesiGetir() {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("personel")
    .select(
      `
      id, ad, soyad, tc, gorev_unvan, created_at,
      employment_periods (
        id, baslangic_tarihi, bitis_tarihi, ayrilma_nedeni
      ),
      maas_gecmisi (
        maas_net, gecerlilik_baslangic, gecerlilik_bitis
      )
    `
    )
    .eq("sirket_id", sirketId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}

// ─────────────────────────────────────────────
// Personel Detay
// ─────────────────────────────────────────────
export async function personelDetayGetir(personelId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("personel")
    .select("*")
    .eq("id", personelId)
    .eq("sirket_id", sirketId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─────────────────────────────────────────────
// Employment Periods
// ─────────────────────────────────────────────
export async function employmentiGetir(personelId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("employment_periods")
    .select("*")
    .eq("personel_id", personelId)
    .eq("sirket_id", sirketId)
    .order("baslangic_tarihi", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}

// ─────────────────────────────────────────────
// Maaş Geçmişi
// ─────────────────────────────────────────────
export async function maasGecmisiniGetir(personelId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("maas_gecmisi")
    .select("*")
    .eq("personel_id", personelId)
    .eq("sirket_id", sirketId)
    .order("gecerlilik_baslangic", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as any[];
}

// ─────────────────────────────────────────────
// Personel Ekle
// ─────────────────────────────────────────────
export async function personelEkle(formData: FormData) {
  const { supabase, sirketId } = await getAuthContext();

  const ad = formData.get("ad") as string;
  const soyad = formData.get("soyad") as string;
  const tc = formData.get("tc") as string;
  const ise_baslama = formData.get("ise_baslama_tarihi") as string;
  const maas_net = Number(formData.get("maas_net"));

  if (!ad || !soyad || !tc || !ise_baslama || !maas_net) {
    return { hata: "Zorunlu alanlar eksik" };
  }

  const tcHata = tcKimlikDogrula(tc);
  if (tcHata) return { hata: tcHata };

  const personelVeri: PersonelInsert = {
    sirket_id: sirketId,
    ad: ad.trim(),
    soyad: soyad.trim(),
    tc: tc.trim(),
    dogum_tarihi: (formData.get("dogum_tarihi") as string) || null,
    cinsiyet: (formData.get("cinsiyet") as "erkek" | "kadin") || null,
    sgk_sicil: (formData.get("sgk_sicil") as string) || null,
    gorev_unvan: (formData.get("gorev_unvan") as string) || null,
    telefon: (formData.get("telefon") as string) || null,
    email: (formData.get("email") as string) || null,
    adres: (formData.get("adres") as string) || null,
    banka_adi: (formData.get("banka_adi") as string) || null,
    sube_kodu: (formData.get("sube_kodu") as string) || null,
    hesap_no: (formData.get("hesap_no") as string) || null,
    iban: (formData.get("iban") as string) || null,
  };

  // Personel kaydı
  const personelRes = await supabase
    .from("personel")
    .insert(personelVeri as any)
    .select("id")
    .single();

  if (personelRes.error || !personelRes.data) {
    return { hata: personelRes.error?.message ?? "Personel oluşturulamadı" };
  }

  const yeniPersonelId = personelRes.data.id;

  // Employment period
  const epRes = await supabase.from("employment_periods").insert({
    personel_id: yeniPersonelId,
    sirket_id: sirketId,
    baslangic_tarihi: ise_baslama,
    bitis_tarihi: null,
    ise_baslama_nedeni: (formData.get("ise_baslama_nedeni") as string) || null,
  } as any);

  if (epRes.error) {
    await supabase.from("personel").delete().eq("id", yeniPersonelId);
    return { hata: epRes.error.message };
  }

  // Maaş geçmişi
  const maasRes = await supabase.from("maas_gecmisi").insert({
    personel_id: yeniPersonelId,
    sirket_id: sirketId,
    maas_net,
    gecerlilik_baslangic: ise_baslama,
    gecerlilik_bitis: null,
  } as any);

  if (maasRes.error) {
    return { hata: maasRes.error.message };
  }

  revalidatePath("/personel");
  return { basarili: true, personelId: yeniPersonelId };
}

// ─────────────────────────────────────────────
// Personel Güncelle
// ─────────────────────────────────────────────
export async function personelGuncelle(
  personelId: string,
  formData: FormData
) {
  const { supabase, sirketId } = await getAuthContext();

  const yeniMaasNet = Number(formData.get("maas_net"));

  // Mevcut aktif maaş
  const maasRes = await supabase
    .from("maas_gecmisi")
    .select("id, maas_net")
    .eq("personel_id", personelId)
    .eq("sirket_id", sirketId)
    .is("gecerlilik_bitis", null)
    .single();

  const mevcutMaas = maasRes.data as any;

  const tc = (formData.get("tc") as string)?.trim();
  const tcHata = tcKimlikDogrula(tc);
  if (tcHata) return { hata: tcHata };

  const updateVeri: PersonelUpdate = {
    ad: (formData.get("ad") as string).trim(),
    soyad: (formData.get("soyad") as string).trim(),
    tc: (formData.get("tc") as string).trim(),
    dogum_tarihi: (formData.get("dogum_tarihi") as string) || null,
    cinsiyet: (formData.get("cinsiyet") as "erkek" | "kadin") || null,
    sgk_sicil: (formData.get("sgk_sicil") as string) || null,
    gorev_unvan: (formData.get("gorev_unvan") as string) || null,
    telefon: (formData.get("telefon") as string) || null,
    email: (formData.get("email") as string) || null,
    adres: (formData.get("adres") as string) || null,
    banka_adi: (formData.get("banka_adi") as string) || null,
    sube_kodu: (formData.get("sube_kodu") as string) || null,
    hesap_no: (formData.get("hesap_no") as string) || null,
    iban: (formData.get("iban") as string) || null,
    updated_at: new Date().toISOString(),
  };

  const updateRes = await supabase
    .from("personel")
    .update(updateVeri)
    .eq("id", personelId)
    .eq("sirket_id", sirketId);

  if (updateRes.error) return { hata: updateRes.error.message };

  // Maaş değiştiyse yeni kayıt
  if (mevcutMaas && mevcutMaas.maas_net !== yeniMaasNet) {
    const bugun = new Date().toISOString().split("T")[0];

    await supabase
      .from("maas_gecmisi")
      .update({ gecerlilik_bitis: bugun })
      .eq("id", mevcutMaas.id);

    await supabase.from("maas_gecmisi").insert({
      personel_id: personelId,
      sirket_id: sirketId,
      maas_net: yeniMaasNet,
      gecerlilik_baslangic: bugun,
      gecerlilik_bitis: null,
    } as any);
  }

  revalidatePath("/personel");
  revalidatePath(`/personel/${personelId}`);
  return { basarili: true };
}

// ─────────────────────────────────────────────
// Personel Çıkış (Arşivleme)
// ─────────────────────────────────────────────
export async function personelCikisYap(
  personelId: string,
  bitisTarihi: string,
  ayrilmaNedeni?: string
) {
  // Oturum doğrulama — SADECE yetkisi olan kullanıcı yapabilsin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  if (!bitisTarihi) return { hata: "Çıkış tarihi zorunludur." };

  // Admin client: RLS'yi atlayarak UPDATE gerçekleştir
  const admin = createAdminClient();

  const cikisRes = await admin
    .from("employment_periods")
    .update({
      bitis_tarihi: bitisTarihi,
      ayrilma_nedeni: ayrilmaNedeni ?? null,
    })
    .eq("personel_id", personelId)
    .is("bitis_tarihi", null);

  if (cikisRes.error) return { hata: cikisRes.error.message };

  revalidatePath("/personel");
  revalidatePath(`/personel/${personelId}`);
  return { basarili: true };
}

// ─────────────────────────────────────────────
// Personel Yeniden İşe Al
// ─────────────────────────────────────────────
export async function personelYenidenIseAl(
  personelId: string,
  baslamaTarihi: string,
  yeniMaasNet?: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  if (!baslamaTarihi) return { hata: "Başlama tarihi zorunludur." };

  const admin = createAdminClient();

  // Zaten aktif period varsa engelle
  const { data: mevcutAktif } = await admin
    .from("employment_periods")
    .select("id")
    .eq("personel_id", personelId)
    .is("bitis_tarihi", null)
    .maybeSingle();

  if (mevcutAktif) return { hata: "Bu personel zaten aktif çalışıyor." };

  // Personelin sirket_id'sini al
  const { data: personelRow, error: personelErr } = await admin
    .from("personel")
    .select("sirket_id")
    .eq("id", personelId)
    .single();

  if (personelErr || !personelRow)
    return { hata: "Personel bulunamadı." };

  const sirketId = personelRow.sirket_id;

  // Yeni employment period
  const { error: epError } = await admin.from("employment_periods").insert({
    personel_id: personelId,
    sirket_id: sirketId,
    baslangic_tarihi: baslamaTarihi,
    bitis_tarihi: null,
    ise_baslama_nedeni: "Yeniden işe alım",
  } as any);

  if (epError) return { hata: epError.message };

  // Maaş girilmişse:
  // 1. Eski açık maaş kaydını kapat
  // 2. Yeni maaş kaydı ekle
  if (yeniMaasNet && yeniMaasNet > 0) {
    // Başlama tarihinden bir gün öncesi = eski maaşın bitiş tarihi
    const eskiBitisTarihi = new Date(baslamaTarihi);
    eskiBitisTarihi.setDate(eskiBitisTarihi.getDate() - 1);
    const eskiBitisStr = eskiBitisTarihi.toISOString().split("T")[0];

    // Tüm açık maaş kayıtlarını kapat
    await admin
      .from("maas_gecmisi")
      .update({ gecerlilik_bitis: eskiBitisStr })
      .eq("personel_id", personelId)
      .is("gecerlilik_bitis", null);

    // Yeni maaş kaydı
    await admin.from("maas_gecmisi").insert({
      personel_id: personelId,
      sirket_id: sirketId,
      maas_net: yeniMaasNet,
      gecerlilik_baslangic: baslamaTarihi,
      gecerlilik_bitis: null,
    } as any);
  }

  revalidatePath("/personel");
  revalidatePath(`/personel/${personelId}`);
  return { basarili: true };
}
