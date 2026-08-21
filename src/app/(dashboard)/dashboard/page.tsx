import type { Metadata } from "next";
import Link from "next/link";
import { getAuthContext } from "@/lib/auth/context";
import {
  Users,
  Banknote,
  Receipt,
  FolderGit2,
  Plus,
  FilePlus2,
  CalendarCheck,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Genel Bakış — Hilal Office",
  description: "Hilal Office sade ve iş odaklı yönetim paneli",
};

const AY_ADLARI = [
  "",
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function formatPara(n: number, currency: string = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatTarih(isoDate?: string | null) {
  if (!isoDate) return "-";
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

function unifyToTRY(amount: number, currency: string) {
  const rates: Record<string, number> = {
    TRY: 1,
    USD: 33,
    EUR: 36,
  };
  return amount * (rates[currency] ?? 1);
}

export default async function DashboardPage() {
  const { supabase, user, sirketId } = await getAuthContext();

  const now = new Date();
  const yil = now.getFullYear();
  const ay = now.getMonth() + 1;

  const {
    data: { user: fullUser },
  } = await supabase.auth.getUser();

  const adSoyad =
    (fullUser as any)?.user_metadata?.ad_soyad ||
    (fullUser as any)?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Yönetici";

  // Tarih aralıkları
  const buAyBaslangic = `${yil}-${String(ay).padStart(2, "0")}-01`;
  const buAySonGun = new Date(yil, ay, 0).getDate();
  const buAyBitis = `${yil}-${String(ay).padStart(2, "0")}-${String(buAySonGun).padStart(2, "0")}`;

  // Paralel Veri Sorguları
  const [
    aktifPersonelRes,
    buAyGirisRes,
    bordroBuAyRes,
    bekleyenBordroRes,
    buAyBelgelerRes,
    aktifProjelerRes,
    sonBelgelerRes,
    sonPersonellerRes,
    sonBordrolarRes,
  ] = await Promise.all([
    // 1. Aktif Personel Sayısı
    supabase
      .from("employment_periods")
      .select("personel_id", { count: "exact", head: true })
      .eq("sirket_id", sirketId)
      .is("bitis_tarihi", null),

    // 2. Bu Ay İşe Başlayanlar
    supabase
      .from("employment_periods")
      .select("personel_id", { count: "exact", head: true })
      .eq("sirket_id", sirketId)
      .gte("baslangic_tarihi", buAyBaslangic)
      .lte("baslangic_tarihi", buAyBitis),

    // 3. Bu Ayki Maaş Bordroları
    supabase
      .from("maas_bordro")
      .select("toplam_odeme, maas_net, durum")
      .eq("sirket_id", sirketId)
      .eq("donem_yil", yil)
      .eq("donem_ay", ay),

    // 4. Bekleyen Bordro Onayı Sayısı
    supabase
      .from("maas_bordro")
      .select("id", { count: "exact", head: true })
      .eq("sirket_id", sirketId)
      .eq("durum", "kontrol_bekliyor"),

    // 5. Bu Ayki Cari Belgeler / Faturalar
    supabase
      .from("belge")
      .select("tutar, kur, para_birimi, tur")
      .eq("sirket_id", sirketId)
      .gte("tarih", buAyBaslangic)
      .lte("tarih", buAyBitis),

    // 6. Aktif Projeler
    supabase
      .from("proje")
      .select("id, ad, kod", { count: "exact" })
      .eq("sirket_id", sirketId)
      .eq("durum", "aktif"),

    // 7. Son Cari Belgeler (7 Kayıt)
    supabase
      .from("belge")
      .select(`
        id, belge_no, tur, tutar, para_birimi, tarih,
        firma:firma_id(ad)
      `)
      .eq("sirket_id", sirketId)
      .order("tarih", { ascending: false })
      .limit(7),

    // 8. Son Eklenen Personeller (7 Kayıt)
    supabase
      .from("personel")
      .select(`
        id, ad, soyad, created_at,
        unvan:unvan_id(ad),
        employment_periods(baslangic_tarihi, bitis_tarihi)
      `)
      .eq("sirket_id", sirketId)
      .order("created_at", { ascending: false })
      .limit(7),

    // 9. Son Bordro Hareketleri (7 Kayıt)
    supabase
      .from("maas_bordro")
      .select(`
        id, toplam_odeme, maas_net, durum, donem_yil, donem_ay, created_at,
        personel:personel_id(ad, soyad)
      `)
      .eq("sirket_id", sirketId)
      .order("created_at", { ascending: false })
      .limit(7),
  ]);

  // KPI Metrikleri
  const aktifPersonelSayisi = aktifPersonelRes.count ?? 0;
  const buAyGirisSayisi = buAyGirisRes.count ?? 0;

  const bordroListesi = bordroBuAyRes.data ?? [];
  const onayliBordrolar = bordroListesi.filter((b) => b.durum === "onaylandi" || b.durum === "kilitlendi");
  const toplamBordroTutar = onayliBordrolar.reduce((sum, b) => sum + (b.toplam_odeme ?? 0), 0);
  const bekleyenBordroSayisi = bekleyenBordroRes.count ?? 0;

  const buAyFaturalar = buAyBelgelerRes.data ?? [];
  const buAyFinansHacmi = buAyFaturalar.reduce((sum, b) => {
    return sum + unifyToTRY(Number(b.tutar ?? 0) * Number(b.kur ?? 1), b.para_birimi);
  }, 0);

  const aktifProjeSayisi = aktifProjelerRes.count ?? 0;

  // Veri Listeleri
  const sonBelgeler = (sonBelgelerRes.data ?? []).map((b: any) => ({
    id: b.id,
    belge_no: b.belge_no || "-",
    tur: b.tur || "Fatura",
    tutar: Number(b.tutar ?? 0),
    para_birimi: b.para_birimi || "TRY",
    tarih: b.tarih,
    firma_ad: b.firma?.ad || "-",
  }));

  const sonPersoneller = (sonPersonellerRes.data ?? []).map((p: any) => {
    const ep = (p.employment_periods ?? []).find((e: any) => e.bitis_tarihi === null);
    return {
      id: p.id,
      ad: p.ad,
      soyad: p.soyad,
      unvan: p.unvan?.ad || "Genel Kadro",
      ise_giris: ep?.baslangic_tarihi || p.created_at,
    };
  });

  const sonBordrolar = (sonBordrolarRes.data ?? []).map((b: any) => ({
    id: b.id,
    personel_ad: b.personel ? `${b.personel.ad} ${b.personel.soyad}` : "-",
    donem: `${AY_ADLARI[b.donem_ay] || b.donem_ay} ${b.donem_yil}`,
    toplam_odeme: Number(b.toplam_odeme ?? b.maas_net ?? 0),
    durum: b.durum || "taslak",
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* ── ÜST BAŞLIK & HIZLI EYLEMLER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Genel Bakış
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {AY_ADLARI[ay]} {yil} dönemi operasyonel ve finansal durum
          </p>
        </div>

        {/* Hızlı Butonlar */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/personel/yeni"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Personel Ekle
          </Link>
          <Link
            href="/cari"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground border border-border/70 transition-colors"
          >
            <FilePlus2 className="h-3.5 w-3.5 text-muted-foreground" />
            Belge Ekle
          </Link>
          <Link
            href="/puantaj"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground border border-border/70 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            Puantaj
          </Link>
          <Link
            href="/bordro"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 text-foreground border border-border/70 transition-colors"
          >
            <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
            Bordro Dönemi
          </Link>
        </div>
      </div>

      {/* ── 4 YENİ VE SADE KPI KARTI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Aktif Kadro */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Aktif Personel</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {aktifPersonelSayisi}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {buAyGirisSayisi > 0 ? `+${buAyGirisSayisi} bu ay işe giriş` : "Mevcut aktif çalışan"}
          </p>
        </div>

        {/* 2. Aylık Maaş Tahakkuku */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">{AY_ADLARI[ay]} Maaş Gideri</span>
            <Banknote className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {formatPara(toplamBordroTutar)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {bekleyenBordroSayisi > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {bekleyenBordroSayisi} bordro onay bekliyor
              </span>
            ) : (
              "Onaylı toplam ödeme"
            )}
          </p>
        </div>

        {/* 3. Bu Ayki Cari Fatura Hacmi */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">{AY_ADLARI[ay]} Belge / Fatura</span>
            <Receipt className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {formatPara(buAyFinansHacmi)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {buAyFaturalar.length} adet işlem kaydı
          </p>
        </div>

        {/* 4. Saha & Projeler */}
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Aktif Projeler</span>
            <FolderGit2 className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {aktifProjeSayisi}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Devam eden aktif şantiye/proje
          </p>
        </div>
      </div>

      {/* ── ANA VERİ TABLOLARI (2 KOLONLU DÜZEN) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TABLO 1: Son Cari Belgeler / Faturalar */}
        <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Son Cari Belgeler & Faturalar</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">En son girilen fatura ve makbuzlar</p>
              </div>
              <Link
                href="/cari"
                className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                Tümü <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground font-medium">
                    <th className="py-2.5 px-3">Belge No</th>
                    <th className="py-2.5 px-3">Firma</th>
                    <th className="py-2.5 px-3">Tür</th>
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {sonBelgeler.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Henüz fatura veya belge kaydı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    sonBelgeler.map((b) => (
                      <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-foreground">{b.belge_no}</td>
                        <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[150px]">
                          {b.firma_ad}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground uppercase border border-border/50">
                            {b.tur}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{formatTarih(b.tarih)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-foreground">
                          {formatPara(b.tutar, b.para_birimi)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* TABLO 2: Personel Kadro Listesi */}
        <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Son Personel Kayıtları</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Kadroya en son eklenen çalışanlar</p>
              </div>
              <Link
                href="/personel"
                className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                Tümü <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground font-medium">
                    <th className="py-2.5 px-3">Ad Soyad</th>
                    <th className="py-2.5 px-3">Unvan / Görev</th>
                    <th className="py-2.5 px-3">İşe Giriş</th>
                    <th className="py-2.5 px-3 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {sonPersoneller.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        Henüz kayıtlı personel bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    sonPersoneller.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          {p.ad} {p.soyad}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{p.unvan}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{formatTarih(p.ise_giris)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Aktif
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABLO 3: SON BORDRO HAREKETLERİ ── */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Son Bordro İşlemleri</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sistemdeki son maaş hesaplama ve onay hareketleri</p>
          </div>
          <Link
            href="/bordro"
            className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
          >
            Bordro Yönetimi <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground font-medium">
                <th className="py-2.5 px-3">Personel</th>
                <th className="py-2.5 px-3">Dönem</th>
                <th className="py-2.5 px-3">Ödeme Tutarı</th>
                <th className="py-2.5 px-3 text-right">Onay Durumu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {sonBordrolar.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    Henüz bordro hareketi bulunmuyor.
                  </td>
                </tr>
              ) : (
                sonBordrolar.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-foreground">{b.personel_ad}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{b.donem}</td>
                    <td className="py-2.5 px-3 font-semibold text-foreground">
                      {formatPara(b.toplam_odeme)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {b.durum === "onaylandi" || b.durum === "kilitlendi" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Onaylandı
                        </span>
                      ) : b.durum === "kontrol_bekliyor" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock className="h-3 w-3" />
                          Onay Bekliyor
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border/50">
                          Taslak
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
