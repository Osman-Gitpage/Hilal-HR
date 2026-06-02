"use server";

import { createClient } from "@/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  MaasBordroInsert,
  BankaOdemeInsert,
} from "@/supabase/app-types";

// ─────────────────────────────────────────────────────────────────────────────
// Yardımcı: Aktif kullanıcı + aktif şirket
// T2.1: Cookie'den aktif şirket ID'si okunur ve DB'de doğrulanır.
//       Birden fazla şirkete erişimi olan kullanıcıda doğru şirket seçilir.
// ─────────────────────────────────────────────────────────────────────────────
async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/giris");

  // Cookie'den aktif şirket ID'si
  const cookieStore = await cookies();
  const cookieSirketId = cookieStore.get("aktif_sirket_id")?.value;

  // Kullanıcının erişebildiği tüm şirket kayıtları
  const { data: sirketler, error: ksError } = await supabase
    .from("kullanici_sirket")
    .select("sirket_id, rol")
    .eq("kullanici_id", user.id);

  if (ksError) throw new Error(`Şirket sorgusu başarısız: ${ksError.message}`);
  if (!sirketler?.length) throw new Error("Bu kullanıcıya ait şirket kaydı bulunamadı.");

  // Cookie'deki şirketi doğrula; geçersizse ilk şirketi al
  const cookieMatch = cookieSirketId
    ? sirketler.find((s) => s.sirket_id === cookieSirketId)
    : undefined;
  const ks = cookieMatch ?? sirketler[0];

  return {
    supabase,
    user,
    sirketId: ks.sirket_id,
    rol: ks.rol,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Ayarlar getir (aylık çalışma saati vb.)
// ─────────────────────────────────────────────────────────────────────────────
export async function ayarlariGetir() {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("ayarlar")
    .select("*")
    .eq("sirket_id", sirketId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dönem personel listesi (employment_periods'a göre)
// ─────────────────────────────────────────────────────────────────────────────
export async function donemPersonelleriniGetir(yil: number, ay: number) {
  const { supabase, sirketId } = await getAuthContext();

  const ayBaslangic = `${yil}-${String(ay).padStart(2, "0")}-01`;
  const ayBitis = new Date(yil, ay, 0).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("personel")
    .select(
      `
      id, ad, soyad, gorev_unvan, banka_adi, iban,
      employment_periods!inner (
        baslangic_tarihi, bitis_tarihi
      ),
      maas_gecmisi (
        maas_net, gecerlilik_baslangic, gecerlilik_bitis
      )
    `
    )
    .eq("sirket_id", sirketId)
    .lte("employment_periods.baslangic_tarihi", ayBitis)
    .or(
      `bitis_tarihi.is.null,bitis_tarihi.gte.${ayBaslangic}`,
      { referencedTable: "employment_periods" }
    );

  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as any[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Dönem bordro listesi (maaş listesi sayfası)
// ─────────────────────────────────────────────────────────────────────────────
export async function donemBordrolariGetir(yil: number, ay: number) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("maas_bordro")
    .select(
      `
      *,
      personel (
        id, ad, soyad, gorev_unvan
      )
    `
    )
    .eq("sirket_id", sirketId)
    .eq("donem_yil", yil)
    .eq("donem_ay", ay)
    .eq("is_active_version", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as any[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Tekil bordro getir
// ─────────────────────────────────────────────────────────────────────────────
export async function bordroGetir(bordroId: string) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("maas_bordro")
    .select(`*, personel (id, ad, soyad, gorev_unvan, banka_adi, iban)`)
    .eq("id", bordroId)
    .eq("sirket_id", sirketId)
    .single();

  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Personele ait dönem bordroso + ek kalemleri getir (tek aktif)
// T2.2: bordroKaydet'ten ek_kalemler ayrıldı; artık buradan join ile geliyor
// ─────────────────────────────────────────────────────────────────────────────
export async function personelDonemBordrosuGetir(
  personelId: string,
  yil: number,
  ay: number
) {
  const { supabase, sirketId } = await getAuthContext();

  const { data, error } = await supabase
    .from("maas_bordro")
    .select(`
      *,
      bordro_ek_kalem (
        id, tip, ad, tutar, sira
      )
    `)
    .eq("personel_id", personelId)
    .eq("sirket_id", sirketId)
    .eq("donem_yil", yil)
    .eq("donem_ay", ay)
    .eq("is_active_version", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Geçen ay devredilen iç avans tutarını getir
// ─────────────────────────────────────────────────────────────────────────────
export async function gecenAyAvansDeviriGetir(
  personelId: string,
  yil: number,
  ay: number
) {
  const { supabase, sirketId } = await getAuthContext();

  const gecenAyDate = new Date(yil, ay - 2, 1);
  const gecenYil = gecenAyDate.getFullYear();
  const gecenAy = gecenAyDate.getMonth() + 1;

  const { data } = await supabase
    .from("maas_bordro")
    .select("iceri_avans_devir, iceri_avans_verilen, iceri_avans_kesinti")
    .eq("personel_id", personelId)
    .eq("sirket_id", sirketId)
    .eq("donem_yil", gecenYil)
    .eq("donem_ay", gecenAy)
    .eq("is_active_version", true)
    .maybeSingle();

  if (!data) return 0;

  // Devredilecek = (devredilen + verilen) - kesilen
  const devir    = (data as { iceri_avans_devir: number }).iceri_avans_devir ?? 0;
  const verilen  = (data as { iceri_avans_verilen: number }).iceri_avans_verilen ?? 0;
  const kesinti  = (data as { iceri_avans_kesinti: number }).iceri_avans_kesinti ?? 0;
  return Math.max(0, devir + verilen - kesinti);
}

// ─────────────────────────────────────────────────────────────────────────────
// T2.2 — Bordro Kaydet / Güncelle (Upsert)
// ek_odemeler/ek_kesintiler artık bu action'a gelmiyor — ekKalemKaydet ayrı
// ─────────────────────────────────────────────────────────────────────────────
export async function bordroKaydet(
  veri: Omit<MaasBordroInsert, "sirket_id" | "ek_odemeler" | "ek_kesintiler">
) {
  const { supabase, sirketId } = await getAuthContext();

  // Mevcut aktif versiyon var mı?
  const { data: mevcut } = await supabase
    .from("maas_bordro")
    .select("id, durum")
    .eq("personel_id", veri.personel_id!)
    .eq("sirket_id", sirketId)
    .eq("donem_yil", veri.donem_yil)
    .eq("donem_ay", veri.donem_ay)
    .eq("is_active_version", true)
    .maybeSingle();

  if (mevcut) {
    // Kilitliyse düzenleme yapılamaz
    if (mevcut.durum === "kilitlendi") {
      return { hata: "Bu dönem kilitli. Düzenleme yapılamaz." };
    }
    if (mevcut.durum === "onaylandi") {
      return { hata: "Onaylanmış bordro düzenlenemez. Revizyon başlatın." };
    }

    const { error } = await supabase
      .from("maas_bordro")
      .update({
        ...veri,
        sirket_id: sirketId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", mevcut.id)
      .eq("sirket_id", sirketId);

    if (error) return { hata: error.message };
    revalidatePath("/bordro");
    return { basarili: true, bordroId: mevcut.id };
  }

  // Yeni kayıt
  const { data: yeni, error } = await supabase
    .from("maas_bordro")
    .insert({ ...veri, sirket_id: sirketId } as MaasBordroInsert)
    .select("id")
    .single();

  if (error) return { hata: error.message };
  revalidatePath("/bordro");
  return { basarili: true, bordroId: yeni.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// T2.3 — Ek Kalem Kaydet (idempotent)
// Gelen id'lerin dışındaki satırları siler, yoksa insert, varsa update yapar
// ─────────────────────────────────────────────────────────────────────────────
export async function ekKalemKaydet(
  bordroId: string,
  tip: "odeme" | "kesinti",
  kalemler: { id?: string; ad: string; tutar: number; sira: number }[]
) {
  const { supabase, sirketId } = await getAuthContext();

  // 1. Gelen id'lerin dışındakileri sil
  const gelenIdler = kalemler.filter((k) => k.id).map((k) => k.id!);

  if (gelenIdler.length > 0) {
    const { error: delErr } = await supabase
      .from("bordro_ek_kalem")
      .delete()
      .eq("bordro_id", bordroId)
      .eq("tip", tip)
      .eq("sirket_id", sirketId)
      .not("id", "in", `(${gelenIdler.join(",")})`);

    if (delErr) return { hata: delErr.message };
  } else {
    // Tüm kalemleri sil (hepsi yeni veya liste boşaltıldı)
    const { error: delAllErr } = await supabase
      .from("bordro_ek_kalem")
      .delete()
      .eq("bordro_id", bordroId)
      .eq("tip", tip)
      .eq("sirket_id", sirketId);

    if (delAllErr) return { hata: delAllErr.message };
  }

  // 2. Insert (yeni) / Update (mevcut)
  for (const k of kalemler) {
    if (!k.id) {
      // Yeni kalem
      const { error } = await supabase.from("bordro_ek_kalem").insert({
        bordro_id: bordroId,
        sirket_id: sirketId,
        tip,
        ad: k.ad,
        tutar: k.tutar,
        sira: k.sira,
      });
      if (error) return { hata: error.message };
    } else {
      // Mevcut → güncelle
      const { error } = await supabase
        .from("bordro_ek_kalem")
        .update({ ad: k.ad, tutar: k.tutar, sira: k.sira })
        .eq("id", k.id)
        .eq("sirket_id", sirketId);
      if (error) return { hata: error.message };
    }
  }

  return { basarili: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Bordro Durumu Güncelle
// ─────────────────────────────────────────────────────────────────────────────
export async function bordroDurumGuncelle(
  bordroId: string,
  yeniDurum: "kontrol_bekliyor" | "onaylandi" | "kilitlendi" | "taslak"
) {
  const { supabase, sirketId } = await getAuthContext();

  const { data: mevcut, error: fetchErr } = await supabase
    .from("maas_bordro")
    .select("durum")
    .eq("id", bordroId)
    .eq("sirket_id", sirketId)
    .single();

  if (fetchErr || !mevcut) return { hata: "Bordro bulunamadı." };

  const mevcutDurum = mevcut.durum;

  // Durum geçiş kuralları
  const gecerliGecisler: Record<string, string[]> = {
    taslak: ["kontrol_bekliyor"],
    kontrol_bekliyor: ["onaylandi", "taslak"],
    onaylandi: ["kilitlendi"],
    kilitlendi: [], // Sadece revizyon ile açılabilir
  };

  if (!gecerliGecisler[mevcutDurum]?.includes(yeniDurum)) {
    return {
      hata: `'${mevcutDurum}' durumundan '${yeniDurum}' durumuna geçiş yapılamaz.`,
    };
  }

  const { error } = await supabase
    .from("maas_bordro")
    .update({ durum: yeniDurum, updated_at: new Date().toISOString() })
    .eq("id", bordroId)
    .eq("sirket_id", sirketId);

  if (error) return { hata: error.message };

  revalidatePath("/bordro");
  return { basarili: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// T2.5 — Revizyon Başlat
// Yeni bordro oluşturulurken bordro_ek_kalem kayıtları da kopyalanıyor
// ─────────────────────────────────────────────────────────────────────────────
export async function revizyonBaslat(
  bordroId: string,
  revizyon_nedeni: string
) {
  const { supabase, sirketId, user } = await getAuthContext();

  if (!revizyon_nedeni?.trim()) {
    return { hata: "Revizyon nedeni zorunludur." };
  }

  // Mevcut bordronu + ek kalemlerini getir
  const { data: mevcut, error: fetchErr } = await supabase
    .from("maas_bordro")
    .select(`
      *,
      bordro_ek_kalem ( id, tip, ad, tutar, sira )
    `)
    .eq("id", bordroId)
    .eq("sirket_id", sirketId)
    .single();

  if (fetchErr || !mevcut) return { hata: "Bordro bulunamadı." };

  // ── Guard: Sadece kilitli ve aktif versiyon revize edilebilir ──
  if (mevcut.durum !== "kilitlendi") {
    return { hata: `Bu bordro '${mevcut.durum}' durumunda. Sadece kilitli bordrolar revize edilebilir.` };
  }
  if (!mevcut.is_active_version) {
    return { hata: "Bu bordro zaten revize edilmiş (pasif versiyon). Lütfen aktif bordroya gidin." };
  }

  // Eski versiyonu pasife al
  const { error: passifErr } = await supabase
    .from("maas_bordro")
    .update({ is_active_version: false })
    .eq("id", bordroId)
    .eq("sirket_id", sirketId);

  if (passifErr) {
    console.error("[revizyonBaslat] pasife alma hatası:", passifErr);
    return { hata: `Versiyon pasife alınamadı: ${passifErr.message}` };
  }

  // Yeni versiyon oluştur (eski veriyi kopyala, taslak)
  // NOT: Supabase numeric alanları string olarak döndürebilir — Number() ile cast et
  const { data: yeni, error: insertErr } = await supabase
    .from("maas_bordro")
    .insert({
      personel_id:         mevcut.personel_id,
      sirket_id:           sirketId,
      donem_yil:           Number(mevcut.donem_yil),
      donem_ay:            Number(mevcut.donem_ay),
      maas_net:            Number(mevcut.maas_net),
      calisma_saati:       Number(mevcut.calisma_saati),
      mesai_saati:         Number(mevcut.mesai_saati),
      yol:                 Number(mevcut.yol),
      yemek:               Number(mevcut.yemek),
      prim:                Number(mevcut.prim),
      tazminat:            Number(mevcut.tazminat),
      senelik_izin:        Number(mevcut.senelik_izin),
      banka:               Number(mevcut.banka),
      bes:                 Number(mevcut.bes),
      avans:               Number(mevcut.avans),
      icra:                Number(mevcut.icra),
      iceri_avans_kesinti: Number(mevcut.iceri_avans_kesinti),
      iceri_avans_devir:   Number(mevcut.iceri_avans_devir),
      iceri_avans_verilen: Number(mevcut.iceri_avans_verilen),
      yillik_izin_gun:     Number(mevcut.yillik_izin_gun),
      toplam_odeme:        Number(mevcut.toplam_odeme),
      toplam_kesinti:      Number(mevcut.toplam_kesinti),
      elden:               Number(mevcut.elden),
      aciklama:            mevcut.aciklama ?? null,
      notlar:              mevcut.notlar ?? [],
      durum:               "taslak" as const,
      version_no:          (Number(mevcut.version_no) || 1) + 1,
      parent_bordro_id:    mevcut.parent_bordro_id ?? bordroId,
      revision_reason:     revizyon_nedeni.trim(),
      revised_by:          user.id,
      revised_at:          new Date().toISOString(),
      is_active_version:   true,
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("[revizyonBaslat] insert hatası:", insertErr);
    // Rollback: eski bordronu tekrar aktife al
    await supabase
      .from("maas_bordro")
      .update({ is_active_version: true })
      .eq("id", bordroId)
      .eq("sirket_id", sirketId);
    return { hata: `Yeni bordro oluşturulamadı: ${insertErr.message}` };
  }

  const yeniBordroId = yeni.id;

  // T2.5: Ek kalemleri yeni bordroya kopyala
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eskiKalemler = (mevcut as any).bordro_ek_kalem as {
    id: string;
    tip: string;
    ad: string;
    tutar: number;
    sira: number | null;
  }[];

  if (eskiKalemler?.length > 0) {
    const { error: kalemErr } = await supabase.from("bordro_ek_kalem").insert(
      eskiKalemler.map((k) => ({
        bordro_id: yeniBordroId,
        sirket_id: sirketId,
        tip: k.tip,
        ad: k.ad,
        tutar: Number(k.tutar),
        sira: k.sira,
      }))
    );
    if (kalemErr) {
      console.error("[revizyonBaslat] ek kalem kopyalama hatası:", kalemErr);
      return { hata: `Ek kalemler kopyalanamadı: ${kalemErr.message}` };
    }
  }

  revalidatePath("/bordro");
  return { basarili: true, yeniBordroId };
}

// ─────────────────────────────────────────────────────────────────────────────
// T2.6 — Banka Ödeme — Dönem verisi getir (banka_odeme + maas_bordro JOIN)
// Mevcut banka_odeme kayıtları gösterilir; yoksa bordrodaki ham değerler
// ─────────────────────────────────────────────────────────────────────────────
export async function donemBankaOdemeGetir(yil: number, ay: number) {
  const { supabase, sirketId } = await getAuthContext();

  // Önce dönem bordrolarını al (aktif versiyonlar)
  const { data: bordrolar, error: bordroErr } = await supabase
    .from("maas_bordro")
    .select(`
      id, personel_id, banka, bes, tazminat, avans, toplam_odeme, elden,
      personel ( id, ad, soyad, gorev_unvan )
    `)
    .eq("sirket_id", sirketId)
    .eq("donem_yil", yil)
    .eq("donem_ay", ay)
    .eq("is_active_version", true);

  if (bordroErr) throw new Error(bordroErr.message);

  // Mevcut banka_odeme kayıtlarını al
  const { data: odemelar, error: odemeErr } = await supabase
    .from("banka_odeme")
    .select("*")
    .eq("sirket_id", sirketId)
    .eq("donem_yil", yil)
    .eq("donem_ay", ay);

  if (odemeErr) throw new Error(odemeErr.message);

  // banka_odeme kayıtlarını bordro_id'ye göre map'e al
  const odemeMap = new Map(
    (odemelar ?? []).map((o) => [o.bordro_id, o])
  );

  // Her bordro için banka_odeme varsa onunla, yoksa bordro ham değerleriyle birleştir
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (bordrolar ?? []).map((b: any) => {
    const odeme = odemeMap.get(b.id);
    return {
      bordro_id: b.id,
      personel_id: b.personel_id,
      personel: b.personel,
      // Banka_odeme kayıtlıysa oradan, yoksa bordrodan
      banka:     odeme?.banka     ?? b.banka,
      bes:       odeme?.bes       ?? b.bes,
      tazminat:  odeme?.tazminat  ?? b.tazminat,
      avans:     odeme?.avans     ?? b.avans,
      elden_banka: odeme?.elden_banka ?? b.elden,
      odeme_not: odeme?.odeme_not ?? null,
      // Bordroya ait ham değerler (hesaplama için)
      toplam_odeme: b.toplam_odeme,
      bes_bordro: b.bes,
      // Kaydedilmiş mi?
      kayitli: !!odeme,
      bordro_elden: Number(b.elden ?? 0),
      bordro_banka: Number(b.banka ?? 0),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// T2.4 — Banka Ödeme — Satır kaydet (N+1 loop → tek upsert)
// ─────────────────────────────────────────────────────────────────────────────
export async function bankaOdemeKaydet(
  yil: number,
  ay: number,
  satirlar: {
    bordro_id: string;
    personel_id: string;
    banka: number;
    tazminat: number;
    avans: number;
    odeme_not: string | null;
    toplam_odeme: number;
    bes_bordro: number;
    elden_banka?: number;
  }[]
) {
  const { supabase, sirketId } = await getAuthContext();

  const upsertVeri: BankaOdemeInsert[] = satirlar.map((s) => ({
    bordro_id: s.bordro_id,
    personel_id: s.personel_id,
    sirket_id: sirketId,
    donem_yil: yil,
    donem_ay: ay,
    banka: s.banka,
    bes: s.bes_bordro,
    tazminat: s.tazminat,
    avans: s.avans,
    elden_banka: s.elden_banka !== undefined ? s.elden_banka : s.toplam_odeme - (s.banka + s.bes_bordro + s.tazminat + s.avans),
    odeme_not: s.odeme_not,
  }));

  const { error } = await supabase
    .from("banka_odeme")
    .upsert(upsertVeri, { onConflict: "bordro_id" });

  if (error) return { hata: error.message };

  revalidatePath("/bordro/banka");
  return { basarili: true };
}
