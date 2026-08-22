"use server";

import { createClient } from "@/supabase/server";
import { aktifSirketIdAl } from "@/lib/auth/context";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  type: "personel" | "cari" | "firma" | "gemi" | "sayfa";
  url: string;
  badge?: string;
  meta?: string;
}

export async function globalAra(query: string): Promise<{ basarili: boolean; sonuclar: SearchResultItem[]; hata?: string }> {
  const temiz = query?.trim();
  if (!temiz || temiz.length < 2) {
    return { basarili: true, sonuclar: [] };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { basarili: false, sonuclar: [], hata: "Oturum bulunamadı" };

    const sirketId = await aktifSirketIdAl();
    const pattern = `%${temiz}%`;

    const sonuclar: SearchResultItem[] = [];

    // 1. Personel Arama
    const personelQuery = supabase
      .from("personel")
      .select("id, ad, soyad, unvan, tc_no, telefon, aktif")
      .or(`ad.ilike.${pattern},soyad.ilike.${pattern},tc_no.ilike.${pattern},telefon.ilike.${pattern},unvan.ilike.${pattern}`)
      .limit(6);

    if (sirketId) {
      personelQuery.eq("sirket_id", sirketId);
    }

    // 2. Cari Belgeler Arama
    const cariQuery = supabase
      .from("cari_belgeler")
      .select("id, belge_no, aciklama, gemi_adi, tutar, para_birimi, tur, odeme_durumu")
      .or(`belge_no.ilike.${pattern},aciklama.ilike.${pattern},gemi_adi.ilike.${pattern}`)
      .limit(6);

    if (sirketId) {
      cariQuery.eq("sirket_id", sirketId);
    }

    // 3. Firmalar Arama
    const firmaQuery = supabase
      .from("cari_firmalar")
      .select("id, ad, vergi_no, yetkili, telefon")
      .or(`ad.ilike.${pattern},vergi_no.ilike.${pattern},yetkili.ilike.${pattern}`)
      .limit(5);

    if (sirketId) {
      firmaQuery.eq("sirket_id", sirketId);
    }

    const [pRes, cRes, fRes] = await Promise.all([personelQuery, cariQuery, firmaQuery]);

    // Personel mapping
    if (pRes.data) {
      pRes.data.forEach((p) => {
        sonuclar.push({
          id: `personel-${p.id}`,
          title: `${p.ad} ${p.soyad}`,
          subtitle: [p.unvan, p.telefon].filter(Boolean).join(" • "),
          type: "personel",
          url: `/personel/${p.id}`,
          badge: p.aktif === false ? "Ayrıldı" : undefined,
          meta: p.tc_no ? `TC: ${p.tc_no}` : undefined,
        });
      });
    }

    // Cari belgeler mapping
    if (cRes.data) {
      cRes.data.forEach((b) => {
        sonuclar.push({
          id: `cari-${b.id}`,
          title: b.belge_no || "İsimsiz Belge",
          subtitle: [b.gemi_adi ? `🚢 ${b.gemi_adi}` : null, b.aciklama].filter(Boolean).join(" — "),
          type: "cari",
          url: `/cari/belge/${b.id}`,
          badge: b.tur?.toUpperCase(),
          meta: `${Number(b.tutar).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${b.para_birimi || "TRY"}`,
        });
      });
    }

    // Firma mapping
    if (fRes.data) {
      fRes.data.forEach((f) => {
        sonuclar.push({
          id: `firma-${f.id}`,
          title: f.ad,
          subtitle: [f.yetkili ? `Yetkili: ${f.yetkili}` : null, f.telefon].filter(Boolean).join(" • "),
          type: "firma",
          url: `/cari/firma`,
          badge: "Firma",
          meta: f.vergi_no ? `VN: ${f.vergi_no}` : undefined,
        });
      });
    }

    return { basarili: true, sonuclar };
  } catch (err) {
    console.error("Global search error:", err);
    return { basarili: false, sonuclar: [], hata: String(err) };
  }
}
