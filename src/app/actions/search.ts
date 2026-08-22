"use server";

import { createClient } from "@/supabase/server";
import { getAuthContext } from "@/lib/auth/context";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  type: "personel" | "cari" | "firma" | "proje" | "evrak" | "sayfa";
  url: string;
  badge?: string;
  meta?: string;
}

export async function globalAra(query: string): Promise<{ basarili: boolean; sonuclar: SearchResultItem[]; hata?: string }> {
  const temiz = query?.trim();
  if (!temiz || temiz.length < 1) {
    return { basarili: true, sonuclar: [] };
  }

  try {
    const { supabase, sirketId } = await getAuthContext();
    const pattern = `%${temiz}%`;
    const sonuclar: SearchResultItem[] = [];

    // 1. Personel Arama (Tablo: personel)
    const personelQuery = supabase
      .from("personel")
      .select("id, ad, soyad, tc, gorev_unvan, telefon")
      .or(`ad.ilike.${pattern},soyad.ilike.${pattern},tc.ilike.${pattern},gorev_unvan.ilike.${pattern},telefon.ilike.${pattern}`)
      .limit(8);

    if (sirketId) {
      personelQuery.eq("sirket_id", sirketId);
    }

    // 2. Cari Belgeler / Faturalar Arama (Tablo: belge)
    const belgeQuery = supabase
      .from("belge")
      .select("id, belge_no, aciklama, gemi_adi, tutar, para_birimi, tur")
      .or(`belge_no.ilike.${pattern},aciklama.ilike.${pattern},gemi_adi.ilike.${pattern}`)
      .limit(8);

    if (sirketId) {
      belgeQuery.eq("sirket_id", sirketId);
    }

    // 3. Cari Firmalar Arama (Tablo: firma)
    const firmaQuery = supabase
      .from("firma")
      .select("id, ad, vergi_no, email, telefon, notlar")
      .or(`ad.ilike.${pattern},vergi_no.ilike.${pattern},email.ilike.${pattern},telefon.ilike.${pattern}`)
      .limit(6);

    if (sirketId) {
      firmaQuery.eq("sirket_id", sirketId);
    }

    // 4. Projeler & Gemiler / Tersaneler (Tablo: proje)
    const projeQuery = supabase
      .from("proje")
      .select("id, ad, tersane_adi, firma_adi, durum")
      .or(`ad.ilike.${pattern},tersane_adi.ilike.${pattern},firma_adi.ilike.${pattern}`)
      .limit(6);

    if (sirketId) {
      projeQuery.eq("sirket_id", sirketId);
    }

    // 5. Evrak Arşivi (Tablo: evrak)
    const evrakQuery = supabase
      .from("evrak")
      .select("id, dosya_adi, dosya_tipi, durum, personel_id")
      .ilike("dosya_adi", pattern)
      .limit(6);

    if (sirketId) {
      evrakQuery.eq("sirket_id", sirketId);
    }

    const [pRes, bRes, fRes, prRes, eRes] = await Promise.all([
      personelQuery,
      belgeQuery,
      firmaQuery,
      projeQuery,
      evrakQuery,
    ]);

    // Personeller
    if (pRes.data) {
      pRes.data.forEach((p) => {
        sonuclar.push({
          id: `personel-${p.id}`,
          title: `${p.ad} ${p.soyad}`,
          subtitle: [p.gorev_unvan, p.telefon].filter(Boolean).join(" • "),
          type: "personel",
          url: `/personel/${p.id}`,
          badge: "Personel",
          meta: p.tc ? `TC: ${p.tc}` : undefined,
        });
      });
    }

    // Cari Belgeler / Faturalar
    if (bRes.data) {
      bRes.data.forEach((b) => {
        sonuclar.push({
          id: `cari-${b.id}`,
          title: b.belge_no || "İsimsiz Belge",
          subtitle: [b.gemi_adi ? `🚢 ${b.gemi_adi}` : null, b.aciklama].filter(Boolean).join(" — "),
          type: "cari",
          url: `/cari/belge/${b.id}`,
          badge: (b.tur || "FATURA").toUpperCase(),
          meta: b.tutar ? `${Number(b.tutar).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${b.para_birimi || "TRY"}` : undefined,
        });
      });
    }

    // Firmalar
    if (fRes.data) {
      fRes.data.forEach((f) => {
        sonuclar.push({
          id: `firma-${f.id}`,
          title: f.ad,
          subtitle: [f.vergi_no ? `VN: ${f.vergi_no}` : null, f.email || f.telefon].filter(Boolean).join(" • "),
          type: "firma",
          url: `/cari/firma`,
          badge: "Firma",
        });
      });
    }

    // Projeler & Gemiler
    if (prRes.data) {
      prRes.data.forEach((pr) => {
        sonuclar.push({
          id: `proje-${pr.id}`,
          title: pr.ad,
          subtitle: [pr.tersane_adi ? `⚓ ${pr.tersane_adi}` : null, pr.firma_adi].filter(Boolean).join(" • "),
          type: "proje",
          url: `/puantaj/projeler/${pr.id}`,
          badge: "Proje",
          meta: pr.durum || undefined,
        });
      });
    }

    // Evrak Arşivi
    if (eRes.data) {
      eRes.data.forEach((e) => {
        sonuclar.push({
          id: `evrak-${e.id}`,
          title: e.dosya_adi,
          subtitle: e.dosya_tipi || "Evrak Dosyası",
          type: "evrak",
          url: `/evrak`,
          badge: "Evrak",
        });
      });
    }

    return { basarili: true, sonuclar };
  } catch (err) {
    console.error("Global search error:", err);
    return { basarili: false, sonuclar: [], hata: String(err) };
  }
}
