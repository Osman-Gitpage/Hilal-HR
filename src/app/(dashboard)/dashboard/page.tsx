import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/supabase/server";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import {
  Users,
  Banknote,
  Clock,
  FolderOpen,
  TrendingUp,
  ChevronRight,
  Plus,
  FileText,
  Calendar,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard — Hilal HR",
  description: "Hilal İK yönetim paneli ana sayfası",
};

const AY_ADLARI = [
  "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function formatPara(n: number, currency: string = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatTarih(d: Date) {
  return d.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function unifyToTRY(amount: number, currency: string) {
  const rates: Record<string, number> = {
    TRY: 1,
    USD: 33,
    EUR: 36,
  };
  return amount * (rates[currency] ?? 1);
}

const MODULLER = [
  {
    baslik: "Personel",
    aciklama: "Personel kayıtları, işe giriş/çıkış ve bilgi yönetimi",
    href: "/personel",
    gradyan: "from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10",
    ikon: "👥",
    aktif: true,
  },
  {
    baslik: "Maaş Bordrosu",
    aciklama: "Aylık bordro girişi, hesaplama ve banka ödeme takibi",
    href: "/bordro",
    gradyan: "from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10",
    ikon: "💰",
    aktif: true,
  },
  {
    baslik: "Puantaj",
    aciklama: "Günlük çalışma takibi, proje bazlı saat girişi",
    href: "/puantaj",
    gradyan: "from-violet-500/10 to-violet-600/5 dark:from-violet-500/20 dark:to-violet-600/10",
    ikon: "📅",
    aktif: true,
  },
  {
    baslik: "Cari / Fatura",
    aciklama: "Cari hesap ve fatura yönetimi",
    href: "/cari",
    gradyan: "from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10",
    ikon: "🧾",
    aktif: true,
  },
  {
    baslik: "Evrak Yönetimi",
    aciklama: "Personel özlük dosyaları, şirket evrakları ve tersane şablonları",
    href: "/evrak",
    gradyan: "from-rose-500/10 to-rose-600/5 dark:from-rose-500/20 dark:to-rose-600/10",
    ikon: "📁",
    aktif: true,
  },
  {
    baslik: "Zimmet",
    aciklama: "Personel zimmet takibi ve devir işlemleri",
    href: "#",
    gradyan: "from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10",
    ikon: "📋",
    aktif: false,
  },
  {
    baslik: "Ayarlar",
    aciklama: "Şirket ayarları, çalışma saatleri ve tatil takvimi",
    href: "/ayarlar",
    gradyan: "from-slate-500/10 to-slate-600/5 dark:from-slate-500/20 dark:to-slate-600/10",
    ikon: "⚙️",
    aktif: true,
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adSoyad =
    user?.user_metadata?.ad_soyad ?? user?.email ?? "Kullanıcı";

  // Şirket ID bul
  const { data: ks } = await supabase
    .from("kullanici_sirket")
    .select("sirket_id")
    .eq("kullanici_id", user?.id ?? "")
    .maybeSingle();

  const sirketId = (ks as any)?.sirket_id as string | undefined;

  const now = new Date();
  const yil = now.getFullYear();
  const ay = now.getMonth() + 1;

  // 1. Paralel KPI + checklist sorguları
  const [aktifPersonelRes, bordroRes, bekleyenRes, projeRes, toplamPersonelRes, ayarlarRes, toplamBordroRes, evrakYaklasanRes] = await Promise.all([
    supabase
      .from("employment_periods")
      .select("personel_id", { count: "exact", head: true })
      .eq("sirket_id", sirketId ?? "")
      .is("bitis_tarihi", null) as any,

    supabase
      .from("maas_bordro")
      .select("toplam_odeme")
      .eq("sirket_id", sirketId ?? "")
      .eq("donem_yil", yil)
      .eq("donem_ay", ay)
      .in("durum", ["onaylandi", "kilitlendi"]) as any,

    supabase
      .from("maas_bordro")
      .select("id", { count: "exact", head: true })
      .eq("sirket_id", sirketId ?? "")
      .eq("durum", "kontrol_bekliyor") as any,

    supabase
      .from("proje")
      .select("id", { count: "exact", head: true })
      .eq("sirket_id", sirketId ?? "")
      .eq("durum", "aktif") as any,

    // Checklist: toplam personel (aktif + çıkmış)
    supabase
      .from("employment_periods")
      .select("personel_id", { count: "exact", head: true })
      .eq("sirket_id", sirketId ?? "") as any,

    // Checklist: ayarlar var mı?
    supabase
      .from("ayarlar")
      .select("id", { count: "exact", head: true })
      .eq("sirket_id", sirketId ?? "") as any,

    // Checklist: herhangi bir bordro var mı?
    supabase
      .from("maas_bordro")
      .select("id", { count: "exact", head: true })
      .eq("sirket_id", sirketId ?? "") as any,

    // KPI: Süresi yaklaşan evraklar (30 gün içinde)
    supabase
      .from("evrak")
      .select("id", { count: "exact", head: true })
      .eq("sirket_id", sirketId ?? "")
      .eq("durum", "aktif")
      .lte("bitis_tarihi", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .gte("bitis_tarihi", new Date().toISOString().split("T")[0]) as any,
  ]);

  const aktifPersonel: number = aktifPersonelRes.count ?? 0;
  const toplamBordro: number = ((bordroRes.data ?? []) as { toplam_odeme: number | null }[])
    .reduce((s, b) => s + (b.toplam_odeme ?? 0), 0);
  const bekleyenOnay: number = bekleyenRes.count ?? 0;
  const aktifProje: number = projeRes.count ?? 0;
  const yaklasanEvrak: number = evrakYaklasanRes.count ?? 0;

  // Checklist verileri
  const herhangiPersonelVar: boolean = (toplamPersonelRes.count ?? 0) > 0;
  const ayarlarVar: boolean = (ayarlarRes.count ?? 0) > 0;
  const herhanigBordroVar: boolean = (toplamBordroRes.count ?? 0) > 0;

  const checklistItems = [
    {
      id: "sirket",
      label: "Şirket kuruldu",
      desc: "Tamamlandı",
      done: true,
    },
    {
      id: "ayarlar",
      label: "Çalışma ayarları yapıldı",
      desc: "Günlük ve aylık çalışma saatlerini belirleyin",
      done: ayarlarVar,
      href: "/ayarlar",
    },
    {
      id: "personel",
      label: "İlk personel eklendi",
      desc: "Çalışanlarınızı sisteme kaydedin",
      done: herhangiPersonelVar,
      href: "/personel/yeni",
    },
    {
      id: "bordro",
      label: "İlk bordro hesaplandı",
      desc: "Aylık bordro işlemlerinizi başlatın",
      done: herhanigBordroVar,
      href: "/bordro",
    },
  ];

  const bugun = formatTarih(now);

  // 2. Grafikler İçin Tarihçe Sorguları (Son 6 Ay)
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push({
      yil: d.getFullYear(),
      ay: d.getMonth() + 1,
      etiket: d.toLocaleDateString("tr-TR", { month: "short" }),
    });
  }

  // Maaş Bordroları Geçmişi
  const { data: bordroTarihce } = await supabase
    .from("maas_bordro")
    .select("donem_yil, donem_ay, toplam_odeme")
    .eq("sirket_id", sirketId ?? "")
    .in("durum", ["onaylandi", "kilitlendi"])
    .eq("is_active_version", true);

  const payrollData = last6Months.map((m) => {
    const toplam = (bordroTarihce ?? [])
      .filter((b) => Number(b.donem_yil) === m.yil && Number(b.donem_ay) === m.ay)
      .reduce((sum, b) => sum + Number(b.toplam_odeme ?? 0), 0);
    return {
      donem: m.etiket,
      tutar: toplam,
    };
  });

  // Cari Gelir/Gider Geçmişi
  const altinAltiAyDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const altinAltiAyString = altinAltiAyDate.toISOString().split("T")[0];

  const { data: belgeTarihce } = await supabase
    .from("belge")
    .select("tarih, tur, tutar, kur, para_birimi")
    .eq("sirket_id", sirketId ?? "")
    .gte("tarih", altinAltiAyString);

  const financeData = last6Months.map((m) => {
    const filtered = (belgeTarihce ?? []).filter((b) => {
      if (!b.tarih) return false;
      const d = new Date(b.tarih);
      return d.getFullYear() === m.yil && (d.getMonth() + 1) === m.ay;
    });

    // Yeni şemada gelir/gider ayrımı yok — faturaları gelir, proformaları nötr say
    const gelir = filtered
      .filter((b) => b.tur === "fatura" || b.tur === "hesap_bilgisi")
      .reduce((sum, b) => sum + unifyToTRY(Number(b.tutar ?? 0) * Number(b.kur ?? 1), b.para_birimi), 0);

    const gider = filtered
      .filter((b) => b.tur === "proforma")
      .reduce((sum, b) => sum + unifyToTRY(Number(b.tutar ?? 0) * Number(b.kur ?? 1), b.para_birimi), 0);

    return {
      donem: m.etiket,
      gelir,
      gider,
    };
  });



  const KPI_KARTLARI = [
    {
      baslik: "Aktif Çalışan",
      deger: aktifPersonel.toString(),
      alt: `${aktifPersonel > 0 ? "+1 bu ay" : "aktif çalışan"}`,
      ikon: Users,
      renk: "text-blue-600 dark:text-blue-400 border-blue-500/20 bg-blue-500/[0.02]",
      bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      baslik: `${AY_ADLARI[ay]} Maaş Gideri`,
      deger: formatPara(toplamBordro),
      alt: "onaylı toplam ödeme",
      ikon: Banknote,
      renk: "text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/[0.02]",
      bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      baslik: "Bekleyen Onay",
      deger: bekleyenOnay.toString(),
      alt: `${bekleyenOnay > 0 ? "onay bekleyen bordro var" : "hepsi onaylı"}`,
      ikon: Clock,
      renk: "text-amber-600 dark:text-amber-400 border-amber-500/20 bg-amber-500/[0.02]",
      bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      baslik: "Aktif Projeler",
      deger: aktifProje.toString(),
      alt: "devam eden çalışma",
      ikon: FolderOpen,
      renk: "text-violet-600 dark:text-violet-400 border-violet-500/20 bg-violet-500/[0.02]",
      bg: "bg-violet-600/10 text-violet-600 dark:text-violet-400",
    },
    {
      baslik: "Yaklaşan Evrak",
      deger: yaklasanEvrak.toString(),
      alt: `${yaklasanEvrak > 0 ? "süresi dolacak evrak" : "tüm evraklar güncel"}`,
      ikon: AlertTriangle,
      renk: "text-rose-600 dark:text-rose-400 border-rose-500/20 bg-rose-500/[0.02]",
      bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* ── Başlangıç Rehberi Checklist ── */}
      <OnboardingChecklist items={checklistItems} sirketId={sirketId ?? ""} />

      {/* ── Üst Başlık & Hızlı İşlemler ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2">
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1.5 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            {bugun}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Hoş geldiniz,{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {adSoyad}
            </span>{" "}
            👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Hilal HR & Muhasebe yönetim paneline hoş geldiniz. Şirketinizin güncel finansal ve operasyonel durumunu aşağıdan takip edebilirsiniz.
          </p>
        </div>

        {/* Hızlı İşlemler */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/personel/yeni"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5"
            id="quick-add-personel"
          >
            <Plus className="h-3.5 w-3.5" />
            Yeni Personel Ekle
          </Link>
          <Link
            href="/cari"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5"
            id="quick-add-invoice"
          >
            <FileText className="h-3.5 w-3.5" />
            Yeni Belge Gir
          </Link>
          <Link
            href="/bordro"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5"
            id="quick-calculate-payroll"
          >
            <Calendar className="h-3.5 w-3.5" />
            Bordro Hesapla
          </Link>
        </div>
      </div>

      {/* ── KPI Kartları ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {KPI_KARTLARI.map(({ baslik, deger, alt, ikon: Ikon, renk, bg }) => (
          <div
            key={baslik}
            className={`rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${renk}`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider leading-tight">
                {baslik}
              </p>
              <div className={`rounded-xl p-2 shrink-0 ${bg}`}>
                <Ikon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold tracking-tight mb-1">
              {deger}
            </p>
            <p className="text-xs text-muted-foreground/80 font-medium">{alt}</p>
          </div>
        ))}
      </div>

      {/* ── Recharts Grafikler ── */}
      <div className="pt-2">
        <DashboardCharts payrollData={payrollData} financeData={financeData} />
      </div>


      {/* ── Modüller Kılavuzu ── */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Sistem Modülleri
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULLER.map((modul) => {
            const isLink = modul.aktif && modul.href !== "#";
            const cardClass = [
              "group relative rounded-2xl border bg-card p-6 transition-all duration-300",
              isLink
                ? "hover:shadow-lg hover:-translate-y-1 cursor-pointer hover:border-primary/20"
                : "opacity-55 cursor-default",
            ].join(" ");

            const content = (
              <>
                {/* Sol kenar gradyan vurgusu */}
                {isLink && (
                  <div className={`absolute left-0 top-5 bottom-5 w-1 rounded-r-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                )}

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`h-11 w-11 rounded-xl bg-gradient-to-br ${modul.gradyan} flex items-center justify-center text-xl shadow-xs group-hover:scale-105 transition-transform duration-300`}
                  >
                    {modul.ikon}
                  </div>

                  {isLink ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                  ) : (
                    <span className="text-[9px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full shrink-0 mt-1 border border-border/60">
                      YAKINDA
                    </span>
                  )}
                </div>

                <p className="font-bold text-sm mb-1 group-hover:text-primary transition-colors duration-200">{modul.baslik}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {modul.aciklama}
                </p>
              </>
            );

            return isLink ? (
              <Link
                key={modul.baslik}
                href={modul.href}
                className={cardClass}
              >
                {content}
              </Link>
            ) : (
              <div
                key={modul.baslik}
                className={cardClass}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
