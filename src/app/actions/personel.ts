"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/supabase/server";
import { createAdminClient } from "@/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PersonelInsert, PersonelUpdate } from "@/supabase/app-types";
import { tcKimlikDogrula } from "@/lib/utils/index";
import { getAuthContext } from "@/lib/auth/context";

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
// ─────────────────────────────────────────────
// Personel Ekle
// ─────────────────────────────────────────────
import {
  personelEkleSchema,
  personelGuncelleSchema,
} from "@/lib/validations/personel";

export async function personelEkle(formData: FormData) {
  const { supabase, sirketId } = await getAuthContext();

  const rawData = {
    ad: formData.get("ad"),
    soyad: formData.get("soyad"),
    tc: formData.get("tc"),
    dogum_tarihi: formData.get("dogum_tarihi") || undefined,
    cinsiyet: formData.get("cinsiyet") || undefined,
    ise_baslama_tarihi: formData.get("ise_baslama_tarihi"),
    maas_net: formData.get("maas_net"),
    sgk_sicil: formData.get("sgk_sicil") || undefined,
    gorev_unvan: formData.get("gorev_unvan") || undefined,
    telefon: formData.get("telefon") || undefined,
    email: formData.get("email") || undefined,
    adres: formData.get("adres") || undefined,
    banka_adi: formData.get("banka_adi") || undefined,
    sube_kodu: formData.get("sube_kodu") || undefined,
    hesap_no: formData.get("hesap_no") || undefined,
    iban: formData.get("iban") || undefined,
    ise_baslama_nedeni: formData.get("ise_baslama_nedeni") || undefined,
  };

  const parsed = personelEkleSchema.safeParse(rawData);
  if (!parsed.success) {
    return { hata: parsed.error.issues[0]?.message ?? "Geçersiz form verisi" };
  }

  const data = parsed.data;

  // Şirket içi mükerrer TC kontrolü
  const { data: existingTc } = await supabase
    .from("personel")
    .select("id")
    .eq("sirket_id", sirketId)
    .eq("tc", data.tc)
    .maybeSingle();

  if (existingTc) {
    return { hata: "Bu TC Kimlik Numarası ile kayıtlı bir çalışan zaten mevcut." };
  }

  const personelVeri: PersonelInsert = {
    sirket_id: sirketId,
    ad: data.ad,
    soyad: data.soyad,
    tc: data.tc,
    dogum_tarihi: data.dogum_tarihi || null,
    cinsiyet: data.cinsiyet || null,
    sgk_sicil: data.sgk_sicil || null,
    gorev_unvan: data.gorev_unvan || null,
    telefon: data.telefon || null,
    email: data.email || null,
    adres: data.adres || null,
    banka_adi: data.banka_adi || null,
    sube_kodu: data.sube_kodu || null,
    hesap_no: data.hesap_no || null,
    iban: data.iban || null,
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
    baslangic_tarihi: data.ise_baslama_tarihi,
    bitis_tarihi: null,
    ise_baslama_nedeni: data.ise_baslama_nedeni || null,
  } as any);

  if (epRes.error) {
    await supabase.from("personel").delete().eq("id", yeniPersonelId);
    return { hata: epRes.error.message };
  }

  // Maaş geçmişi
  const maasRes = await supabase.from("maas_gecmisi").insert({
    personel_id: yeniPersonelId,
    sirket_id: sirketId,
    maas_net: data.maas_net,
    gecerlilik_baslangic: data.ise_baslama_tarihi,
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

  const rawData = {
    ad: formData.get("ad"),
    soyad: formData.get("soyad"),
    tc: formData.get("tc"),
    dogum_tarihi: formData.get("dogum_tarihi") || undefined,
    cinsiyet: formData.get("cinsiyet") || undefined,
    maas_net: formData.get("maas_net") ? formData.get("maas_net") : undefined,
    sgk_sicil: formData.get("sgk_sicil") || undefined,
    gorev_unvan: formData.get("gorev_unvan") || undefined,
    telefon: formData.get("telefon") || undefined,
    email: formData.get("email") || undefined,
    adres: formData.get("adres") || undefined,
    banka_adi: formData.get("banka_adi") || undefined,
    sube_kodu: formData.get("sube_kodu") || undefined,
    hesap_no: formData.get("hesap_no") || undefined,
    iban: formData.get("iban") || undefined,
  };

  const parsed = personelGuncelleSchema.safeParse(rawData);
  if (!parsed.success) {
    return { hata: parsed.error.issues[0]?.message ?? "Geçersiz form verisi" };
  }

  const data = parsed.data;

  // Başka bir personelde aynı TC var mı kontrolü
  const { data: existingTc } = await supabase
    .from("personel")
    .select("id")
    .eq("sirket_id", sirketId)
    .eq("tc", data.tc)
    .neq("id", personelId)
    .maybeSingle();

  if (existingTc) {
    return { hata: "Bu TC Kimlik Numarası başka bir çalışan kaydında mevcut." };
  }

  const updateVeri: PersonelUpdate = {
    ad: data.ad,
    soyad: data.soyad,
    tc: data.tc,
    dogum_tarihi: data.dogum_tarihi || null,
    cinsiyet: data.cinsiyet || null,
    sgk_sicil: data.sgk_sicil || null,
    gorev_unvan: data.gorev_unvan || null,
    telefon: data.telefon || null,
    email: data.email || null,
    adres: data.adres || null,
    banka_adi: data.banka_adi || null,
    sube_kodu: data.sube_kodu || null,
    hesap_no: data.hesap_no || null,
    iban: data.iban || null,
    updated_at: new Date().toISOString(),
  };

  const updateRes = await supabase
    .from("personel")
    .update(updateVeri)
    .eq("id", personelId)
    .eq("sirket_id", sirketId);

  if (updateRes.error) return { hata: updateRes.error.message };

  // Maaş girildiyse veya değiştiyse yeni kayıt
  if (data.maas_net && data.maas_net > 0) {
    const { data: maasRows } = await supabase
      .from("maas_gecmisi")
      .select("id, maas_net")
      .eq("personel_id", personelId)
      .eq("sirket_id", sirketId)
      .order("gecerlilik_baslangic", { ascending: false })
      .limit(1);

    const mevcutMaas = maasRows?.[0] ?? null;

    if (!mevcutMaas || Number(mevcutMaas.maas_net) !== data.maas_net) {
      const bugun = new Date().toISOString().split("T")[0];

      await supabase
        .from("maas_gecmisi")
        .update({ gecerlilik_bitis: bugun })
        .eq("personel_id", personelId)
        .eq("sirket_id", sirketId)
        .is("gecerlilik_bitis", null);

      await supabase.from("maas_gecmisi").insert({
        personel_id: personelId,
        sirket_id: sirketId,
        maas_net: data.maas_net,
        gecerlilik_baslangic: bugun,
        gecerlilik_bitis: null,
      } as any);
    }
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

  // Çıkış yapan personelin aktif evraklarını arşivle
  try {
    const { data: personelRow } = await admin
      .from("personel")
      .select("sirket_id")
      .eq("id", personelId)
      .single();

    if (personelRow) {
      await admin
        .from("evrak")
        .update({ durum: "arsiv" })
        .eq("personel_id", personelId)
        .eq("sirket_id", personelRow.sirket_id)
        .eq("durum", "aktif");
    }
  } catch {
    // Non-fatal — evrak arşivleme başarısız olsa bile çıkış işlemi tamamlandı
  }

  revalidatePath("/personel");
  revalidatePath(`/personel/${personelId}`);
  revalidatePath("/evrak");
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

// ─────────────────────────────────────────────
// Maaş Zammı Yap (Tekli)
// ─────────────────────────────────────────────
export async function maasZammiYap(
  personelId: string,
  yeniMaasNet: number,
  gecerlilikBaslangic?: string
) {
  const { supabase, sirketId } = await getAuthContext();

  if (!yeniMaasNet || yeniMaasNet <= 0) {
    return { hata: "Lütfen geçerli bir yeni maaş tutarı girin." };
  }

  const baslangicTarihi =
    gecerlilikBaslangic || new Date().toISOString().split("T")[0];

  const eskiBitisDate = new Date(baslangicTarihi);
  eskiBitisDate.setDate(eskiBitisDate.getDate() - 1);
  const eskiBitisStr = eskiBitisDate.toISOString().split("T")[0];

  // Eski tüm açık maaş kayıtlarını yeni zam tarihinden 1 gün önceki tarihle kapat
  await supabase
    .from("maas_gecmisi")
    .update({ gecerlilik_bitis: eskiBitisStr })
    .eq("personel_id", personelId)
    .eq("sirket_id", sirketId)
    .is("gecerlilik_bitis", null);

  // Yeni maaş kaydı oluştur
  const { error: insErr } = await supabase.from("maas_gecmisi").insert({
    personel_id: personelId,
    sirket_id: sirketId,
    maas_net: yeniMaasNet,
    gecerlilik_baslangic: baslangicTarihi,
    gecerlilik_bitis: null,
  } as any);

  if (insErr) return { hata: insErr.message };

  revalidatePath("/personel");
  revalidatePath("/bordro");
  revalidatePath(`/personel/${personelId}`);
  return { basarili: true };
}

// ─────────────────────────────────────────────
// Toplu Maaş Zammı Yap
// ─────────────────────────────────────────────
export async function topluMaasZammiYap(
  zamlar: Array<{ personelId: string; yeniMaasNet: number }>,
  gecerlilikBaslangic?: string
) {
  const { supabase, sirketId } = await getAuthContext();

  if (!zamlar || zamlar.length === 0) {
    return { hata: "Zam yapılacak personel seçilmedi." };
  }

  const baslangicTarihi =
    gecerlilikBaslangic || new Date().toISOString().split("T")[0];

  const eskiBitisDate = new Date(baslangicTarihi);
  eskiBitisDate.setDate(eskiBitisDate.getDate() - 1);
  const eskiBitisStr = eskiBitisDate.toISOString().split("T")[0];

  for (const item of zamlar) {
    if (item.yeniMaasNet <= 0) continue;

    // Önceki tüm açık maaş kayıtlarını kapat
    await supabase
      .from("maas_gecmisi")
      .update({ gecerlilik_bitis: eskiBitisStr })
      .eq("personel_id", item.personelId)
      .eq("sirket_id", sirketId)
      .is("gecerlilik_bitis", null);

    // Yeni maaş ekle
    await supabase.from("maas_gecmisi").insert({
      personel_id: item.personelId,
      sirket_id: sirketId,
      maas_net: item.yeniMaasNet,
      gecerlilik_baslangic: baslangicTarihi,
      gecerlilik_bitis: null,
    } as any);
  }

  revalidatePath("/personel");
  revalidatePath("/bordro");
  return { basarili: true };
}
