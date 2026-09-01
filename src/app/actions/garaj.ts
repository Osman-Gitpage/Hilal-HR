"use server";

import { getAuthContext } from "@/lib/auth/context";
import { revalidatePath } from "next/cache";
import {
  Arac,
  Police,
  TrafikCezasi,
  MuayeneBilgileri,
  AylikYakitKaydi,
  ServisKaydi,
} from "@/components/garaj/types";

export type ActionResult<T = undefined> =
  | (T extends undefined ? { basarili: true } : { basarili: true; veri: T })
  | { basarili: false; hata: string };

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ARAÇ LİSTESİ & DETAYI GETİRME
// ═══════════════════════════════════════════════════════════════════════════════

/** Şirkete ait tüm araçları listeler */
export async function aracListesiGetir(): Promise<Arac[]> {
  const { supabase, sirketId } = await getAuthContext();

  const { data: aracRows, error } = await supabase
    .from("araclar")
    .select("*")
    .eq("sirket_id", sirketId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("aracListesiGetir hatası:", error);
    return [];
  }

  if (!aracRows || aracRows.length === 0) return [];

  return aracRows.map((r: any) => ({
    id: r.id,
    marka: r.marka,
    model: r.model,
    altBaslik: r.alt_baslik || undefined,
    paket: r.paket || undefined,
    yil: r.yil,
    plaka: r.plaka,
    yakitTipi: r.yakit_tipi as Arac["yakitTipi"],
    vites: r.vites as Arac["vites"],
    gorsel: r.gorsel || "/cars.png",
    km: r.km || 0,
    ruhsat: {
      ruhsatSeriNo: r.ruhsat_seri_no || "",
      motorNo: r.motor_no || "",
      saseNo: r.sase_no || "",
    },
  }));
}

/** Tek bir aracın tüm detaylarını (poliçeler, cezalar, muayene, yakıt ve servisler) getirir */
export async function aracDetayGetir(aracId: string): Promise<Arac | null> {
  const { supabase, sirketId } = await getAuthContext();

  const { data: aracRow, error: aracErr } = await supabase
    .from("araclar")
    .select("*")
    .eq("id", aracId)
    .eq("sirket_id", sirketId)
    .single();

  if (aracErr || !aracRow) {
    console.error("aracDetayGetir araç hatası:", aracErr);
    return null;
  }

  // 1. Poliçeleri çek
  const { data: policeRows } = await supabase
    .from("arac_policeler")
    .select("*")
    .eq("arac_id", aracId)
    .eq("sirket_id", sirketId)
    .order("created_at", { ascending: false });

  const policeler: Police[] = (policeRows || []).map((p: any) => {
    const bitis = new Date(p.bitis_tarihi);
    const bugun = new Date();
    const diff = Math.max(0, Math.ceil((bitis.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24)));
    return {
      id: p.id,
      tur: p.tur,
      sirket: p.sirket,
      policeNo: p.police_no,
      bitisTarihi: bitis.toLocaleDateString("tr-TR"),
      kalanGun: diff,
      tutar: p.tutar ? Number(p.tutar) : undefined,
      belgeAdi: p.belge_adi || undefined,
      belgeUrl: p.belge_url || undefined,
    };
  });

  // 2. Cezaları çek
  const { data: cezaRows } = await supabase
    .from("arac_cezalar")
    .select("*")
    .eq("arac_id", aracId)
    .eq("sirket_id", sirketId)
    .order("tarih", { ascending: false });

  const cezalar: TrafikCezasi[] = (cezaRows || []).map((c: any) => ({
    id: c.id,
    tarih: new Date(c.tarih).toLocaleDateString("tr-TR"),
    cezaTuru: c.ceza_turu,
    aciklama: c.aciklama || "",
    tutar: Number(c.tutar),
  }));

  // 3. Muayene bilgisini çek
  const { data: muayeneRow } = await supabase
    .from("arac_muayene")
    .select("*")
    .eq("arac_id", aracId)
    .eq("sirket_id", sirketId)
    .single();

  let muayene: MuayeneBilgileri = {
    muayeneTarihi: "18.06.2026",
    kalanGun: 126,
    muayeneUcreti: 2620,
    istasyon: "TÜVTÜRK Maslak İstasyonu",
    raporNo: "TUV-2024-991840",
    sonuc: "Kusursuz Geçti",
    egzozEmisyonTarihi: "18.06.2026",
  };

  if (muayeneRow) {
    const bitis = new Date(muayeneRow.muayene_tarihi);
    const bugun = new Date();
    const diff = Math.max(0, Math.ceil((bitis.getTime() - bugun.getTime()) / (1000 * 60 * 60 * 24)));
    muayene = {
      muayeneTarihi: bitis.toLocaleDateString("tr-TR"),
      kalanGun: diff,
      muayeneUcreti: muayeneRow.muayene_ucreti ? Number(muayeneRow.muayene_ucreti) : undefined,
      istasyon: muayeneRow.istasyon || undefined,
      raporNo: muayeneRow.rapor_no || undefined,
      sonuc: muayeneRow.sonuc || "Kusursuz Geçti",
      egzozEmisyonTarihi: muayeneRow.egzoz_emisyon_tarihi
        ? new Date(muayeneRow.egzoz_emisyon_tarihi).toLocaleDateString("tr-TR")
        : undefined,
      belgeAdi: muayeneRow.belge_adi || undefined,
      belgeUrl: muayeneRow.belge_url || undefined,
    };
  }

  // 4. Yakıt kayıtlarını çek
  const { data: yakitRows } = await supabase
    .from("arac_yakit_kayitlari")
    .select("*")
    .eq("arac_id", aracId)
    .eq("sirket_id", sirketId)
    .order("yil", { ascending: false });

  const yakitKayitlari: AylikYakitKaydi[] = (yakitRows || []).map((y: any) => ({
    id: y.id,
    yil: y.yil,
    ay: y.ay,
    yakitTuru: y.yakit_turu,
    miktar: Number(y.miktar),
    birimFiyat: Number(y.birim_fiyat),
    toplamTutar: Number(y.toplam_tutar),
    belgeNo: y.belge_no || undefined,
  }));

  // 5. Servis kayıtlarını çek
  const { data: servisRows } = await supabase
    .from("arac_servis_kayitlari")
    .select("*")
    .eq("arac_id", aracId)
    .eq("sirket_id", sirketId)
    .order("tarih", { ascending: false });

  const servisKayitlari: ServisKaydi[] = (servisRows || []).map((s: any) => ({
    id: s.id,
    yil: s.yil,
    tarih: new Date(s.tarih).toLocaleDateString("tr-TR"),
    km: s.km,
    islemTuru: s.islem_turu,
    servisAdi: s.servis_adi,
    aciklama: s.aciklama,
    faturaNo: s.fatura_no || undefined,
    faturaDosyaAdi: s.fatura_dosya_adi || undefined,
    faturaDosyaUrl: s.fatura_dosya_url || undefined,
    tutar: Number(s.tutar),
  }));

  return {
    id: aracRow.id,
    marka: aracRow.marka,
    model: aracRow.model,
    altBaslik: aracRow.alt_baslik || undefined,
    paket: aracRow.paket || undefined,
    yil: aracRow.yil,
    plaka: aracRow.plaka,
    yakitTipi: aracRow.yakit_tipi as Arac["yakitTipi"],
    vites: aracRow.vites as Arac["vites"],
    gorsel: aracRow.gorsel || "/cars.png",
    km: aracRow.km || 0,
    ruhsat: {
      ruhsatSeriNo: aracRow.ruhsat_seri_no || "",
      motorNo: aracRow.motor_no || "",
      saseNo: aracRow.sase_no || "",
    },
    policeler,
    cezalar,
    muayene,
    yakitKayitlari,
    servisKayitlari,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ARAÇ CRUD ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function aracEkleAction(payload: {
  marka: string;
  model: string;
  altBaslik?: string;
  paket?: string;
  yil: number;
  plaka: string;
  yakitTipi: string;
  vites: string;
  gorsel: string;
  km: number;
  ruhsatSeriNo?: string;
  motorNo?: string;
  saseNo?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, sirketId } = await getAuthContext();

    const { data, error } = await supabase
      .from("araclar")
      .insert({
        sirket_id: sirketId,
        marka: payload.marka,
        model: payload.model,
        alt_baslik: payload.altBaslik || null,
        paket: payload.paket || null,
        yil: payload.yil,
        plaka: payload.plaka.toUpperCase().trim(),
        yakit_tipi: payload.yakitTipi,
        vites: payload.vites,
        gorsel: payload.gorsel,
        km: payload.km || 0,
        ruhsat_seri_no: payload.ruhsatSeriNo || null,
        motor_no: payload.motorNo || null,
        sase_no: payload.saseNo || null,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/garaj");
    return { basarili: true, veri: { id: data.id } };
  } catch (err: any) {
    return { basarili: false, hata: err.message || "Araç eklenemedi." };
  }
}

export async function aracGuncelleAction(
  id: string,
  payload: Partial<Arac>
): Promise<ActionResult> {
  try {
    const { supabase, sirketId } = await getAuthContext();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (payload.marka !== undefined) updateData.marka = payload.marka;
    if (payload.model !== undefined) updateData.model = payload.model;
    if (payload.altBaslik !== undefined) updateData.alt_baslik = payload.altBaslik;
    if (payload.paket !== undefined) updateData.paket = payload.paket;
    if (payload.yil !== undefined) updateData.yil = payload.yil;
    if (payload.plaka !== undefined) updateData.plaka = payload.plaka.toUpperCase().trim();
    if (payload.yakitTipi !== undefined) updateData.yakit_tipi = payload.yakitTipi;
    if (payload.vites !== undefined) updateData.vites = payload.vites;
    if (payload.gorsel !== undefined) updateData.gorsel = payload.gorsel;
    if (payload.km !== undefined) updateData.km = payload.km;
    if (payload.ruhsat?.ruhsatSeriNo !== undefined) updateData.ruhsat_seri_no = payload.ruhsat.ruhsatSeriNo;
    if (payload.ruhsat?.motorNo !== undefined) updateData.motor_no = payload.ruhsat.motorNo;
    if (payload.ruhsat?.saseNo !== undefined) updateData.sase_no = payload.ruhsat.saseNo;

    const { error } = await supabase
      .from("araclar")
      .update(updateData)
      .eq("id", id)
      .eq("sirket_id", sirketId);

    if (error) throw new Error(error.message);

    revalidatePath("/garaj");
    revalidatePath(`/garaj/${id}`);
    return { basarili: true };
  } catch (err: any) {
    return { basarili: false, hata: err.message || "Araç güncellenemedi." };
  }
}

export async function aracSilAction(id: string): Promise<ActionResult> {
  try {
    const { supabase, sirketId } = await getAuthContext();

    const { error } = await supabase
      .from("araclar")
      .delete()
      .eq("id", id)
      .eq("sirket_id", sirketId);

    if (error) throw new Error(error.message);

    revalidatePath("/garaj");
    return { basarili: true };
  } catch (err: any) {
    return { basarili: false, hata: err.message || "Araç silinemedi." };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. POLİÇE, CEZA & MUAYENE ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function policeEkleAction(
  aracId: string,
  payload: Omit<Police, "id" | "kalanGun">
): Promise<ActionResult> {
  try {
    const { supabase, sirketId } = await getAuthContext();

    // Tarih dönüştür: "01.11.2026" -> "2026-11-01" veya ISO
    let formattedDate = payload.bitisTarihi;
    if (payload.bitisTarihi.includes(".")) {
      const p = payload.bitisTarihi.split(".");
      formattedDate = `${p[2]}-${p[1]}-${p[0]}`;
    }

    const { error } = await supabase.from("arac_policeler").insert({
      arac_id: aracId,
      sirket_id: sirketId,
      tur: payload.tur,
      sirket: payload.sirket,
      police_no: payload.policeNo,
      bitis_tarihi: formattedDate,
      tutar: payload.tutar || null,
      belge_adi: payload.belgeAdi || null,
      belge_url: payload.belgeUrl || null,
    });

    if (error) throw new Error(error.message);

    revalidatePath(`/garaj/${aracId}`);
    return { basarili: true };
  } catch (err: any) {
    return { basarili: false, hata: err.message || "Poliçe eklenemedi." };
  }
}

export async function policeSilAction(
  aracId: string,
  policeId: string
): Promise<ActionResult> {
  try {
    const { supabase, sirketId } = await getAuthContext();

    const { error } = await supabase
      .from("arac_policeler")
      .delete()
      .eq("id", policeId)
      .eq("arac_id", aracId)
      .eq("sirket_id", sirketId);

    if (error) throw new Error(error.message);

    revalidatePath(`/garaj/${aracId}`);
    return { basarili: true };
  } catch (err: any) {
    return { basarili: false, hata: err.message || "Poliçe silinemedi." };
  }
}

export async function cezaEkleAction(
  aracId: string,
  payload: Omit<TrafikCezasi, "id">
): Promise<ActionResult> {
  try {
    const { supabase, sirketId } = await getAuthContext();

    let formattedDate = payload.tarih;
    if (payload.tarih.includes(".")) {
      const p = payload.tarih.split(".");
      formattedDate = `${p[2]}-${p[1]}-${p[0]}`;
    }

    const { error } = await supabase.from("arac_cezalar").insert({
      arac_id: aracId,
      sirket_id: sirketId,
      tarih: formattedDate,
      ceza_turu: payload.cezaTuru,
      aciklama: payload.aciklama,
      tutar: payload.tutar,
    });

    if (error) throw new Error(error.message);

    revalidatePath(`/garaj/${aracId}`);
    return { basarili: true };
  } catch (err: any) {
    return { basarili: false, hata: err.message || "Ceza eklenemedi." };
  }
}

export async function cezaSilAction(
  aracId: string,
  cezaId: string
): Promise<ActionResult> {
  try {
    const { supabase, sirketId } = await getAuthContext();

    const { error } = await supabase
      .from("arac_cezalar")
      .delete()
      .eq("id", cezaId)
      .eq("arac_id", aracId)
      .eq("sirket_id", sirketId);

    if (error) throw new Error(error.message);

    revalidatePath(`/garaj/${aracId}`);
    return { basarili: true };
  } catch (err: any) {
    return { basarili: false, hata: err.message || "Ceza silinemedi." };
  }
}

export async function muayeneGuncelleAction(
  aracId: string,
  payload: MuayeneBilgileri
): Promise<ActionResult> {
  try {
    const { supabase, sirketId } = await getAuthContext();

    let formattedMuayene = payload.muayeneTarihi;
    if (payload.muayeneTarihi.includes(".")) {
      const p = payload.muayeneTarihi.split(".");
      formattedMuayene = `${p[2]}-${p[1]}-${p[0]}`;
    }

    let formattedEgzoz = payload.egzozEmisyonTarihi || null;
    if (formattedEgzoz && formattedEgzoz.includes(".")) {
      const p = formattedEgzoz.split(".");
      formattedEgzoz = `${p[2]}-${p[1]}-${p[0]}`;
    }

    const { error } = await supabase.from("arac_muayene").upsert(
      {
        arac_id: aracId,
        sirket_id: sirketId,
        muayene_tarihi: formattedMuayene,
        muayene_ucreti: payload.muayeneUcreti || null,
        istasyon: payload.istasyon || null,
        rapor_no: payload.raporNo || null,
        sonuc: payload.sonuc || "Kusursuz Geçti",
        egzoz_emisyon_tarihi: formattedEgzoz,
        belge_adi: payload.belgeAdi || null,
        belge_url: payload.belgeUrl || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "arac_id" }
    );

    if (error) throw new Error(error.message);

    revalidatePath(`/garaj/${aracId}`);
    return { basarili: true };
  } catch (err: any) {
    return { basarili: false, hata: err.message || "Muayene kaydedilemedi." };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. YAKIT VE SERVİS MASRAF ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function yakitKaydiEkleAction(
  aracId: string,
  payload: Omit<AylikYakitKaydi, "id">
): Promise<ActionResult> {
  try {
    const { supabase, sirketId } = await getAuthContext();

    const { error } = await supabase.from("arac_yakit_kayitlari").insert({
      arac_id: aracId,
      sirket_id: sirketId,
      yil: payload.yil,
      ay: payload.ay,
      yakit_turu: payload.yakitTuru,
      miktar: payload.miktar,
      birim_fiyat: payload.birimFiyat,
      toplam_tutar: payload.toplamTutar,
      belge_no: payload.belgeNo || null,
    });

    if (error) throw new Error(error.message);

    revalidatePath(`/garaj/${aracId}`);
    return { basarili: true };
  } catch (err: any) {
    return { basarili: false, hata: err.message || "Yakıt kaydı eklenemedi." };
  }
}

export async function yakitKaydiSilAction(
  aracId: string,
  kayitId: string
): Promise<ActionResult> {
  try {
    const { supabase, sirketId } = await getAuthContext();

    const { error } = await supabase
      .from("arac_yakit_kayitlari")
      .delete()
      .eq("id", kayitId)
      .eq("arac_id", aracId)
      .eq("sirket_id", sirketId);

    if (error) throw new Error(error.message);

    revalidatePath(`/garaj/${aracId}`);
    return { basarili: true };
  } catch (err: any) {
    return { basarili: false, hata: err.message || "Yakıt kaydı silinemedi." };
  }
}

export async function servisKaydiEkleAction(
  aracId: string,
  payload: Omit<ServisKaydi, "id">
): Promise<ActionResult> {
  try {
    const { supabase, sirketId } = await getAuthContext();

    let formattedDate = payload.tarih;
    if (payload.tarih.includes(".")) {
      const p = payload.tarih.split(".");
      formattedDate = `${p[2]}-${p[1]}-${p[0]}`;
    }

    const { error } = await supabase.from("arac_servis_kayitlari").insert({
      arac_id: aracId,
      sirket_id: sirketId,
      yil: payload.yil,
      tarih: formattedDate,
      km: payload.km,
      islem_turu: payload.islemTuru,
      servis_adi: payload.servisAdi,
      aciklama: payload.aciklama,
      fatura_no: payload.faturaNo || null,
      fatura_dosya_adi: payload.faturaDosyaAdi || null,
      fatura_dosya_url: payload.faturaDosyaUrl || null,
      tutar: payload.tutar,
    });

    if (error) throw new Error(error.message);

    revalidatePath(`/garaj/${aracId}`);
    return { basarili: true };
  } catch (err: any) {
    return { basarili: false, hata: err.message || "Servis kaydı eklenemedi." };
  }
}

export async function servisKaydiSilAction(
  aracId: string,
  kayitId: string
): Promise<ActionResult> {
  try {
    const { supabase, sirketId } = await getAuthContext();

    const { error } = await supabase
      .from("arac_servis_kayitlari")
      .delete()
      .eq("id", kayitId)
      .eq("arac_id", aracId)
      .eq("sirket_id", sirketId);

    if (error) throw new Error(error.message);

    revalidatePath(`/garaj/${aracId}`);
    return { basarili: true };
  } catch (err: any) {
    return { basarili: false, hata: err.message || "Servis kaydı silinemedi." };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SUPABASE STORAGE DOSYA YÜKLEME
// ═══════════════════════════════════════════════════════════════════════════════

export async function garajDosyaYukleAction(
  formData: FormData
): Promise<ActionResult<{ url: string; dosyaAdi: string }>> {
  try {
    const { supabase, sirketId } = await getAuthContext();

    const file = formData.get("file") as File;
    if (!file) throw new Error("Dosya bulunamadı.");

    const dosyaAdi = file.name;
    const fileExt = dosyaAdi.split(".").pop();
    const safeName = `${sirketId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadErr } = await supabase.storage
      .from("garaj-evraklar")
      .upload(safeName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadErr) throw new Error(uploadErr.message);

    const { data: urlData } = supabase.storage
      .from("garaj-evraklar")
      .getPublicUrl(safeName);

    return {
      basarili: true,
      veri: {
        url: urlData.publicUrl,
        dosyaAdi,
      },
    };
  } catch (err: any) {
    return { basarili: false, hata: err.message || "Dosya yüklenemedi." };
  }
}
