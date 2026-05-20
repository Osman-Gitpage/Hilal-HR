import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/supabase/server";
import {
  Users,
  Banknote,
  Clock,
  FolderOpen,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard — Hilal HR",
  description: "Hilal İK yönetim paneli ana sayfası",
};

const AY_ADLARI = [
  "", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function formatPara(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
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

const MODULLER = [
  {
    baslik: "Personel",
    aciklama: "Personel kayıtları, işe giriş/çıkış ve bilgi yönetimi",
    href: "/personel",
    gradyan: "from-blue-500 to-blue-700",
    ikon: "👥",
    aktif: true,
  },
  {
    baslik: "Maaş Bordrosu",
    aciklama: "Aylık bordro girişi, hesaplama ve banka ödeme takibi",
    href: "/bordro",
    gradyan: "from-emerald-500 to-emerald-700",
    ikon: "💰",
    aktif: true,
  },
  {
    baslik: "Puantaj",
    aciklama: "Günlük çalışma takibi, proje bazlı saat girişi",
    href: "/puantaj",
    gradyan: "from-violet-500 to-violet-700",
    ikon: "📅",
    aktif: true,
  },
  {
    baslik: "Cari / Fatura",
    aciklama: "Cari hesap ve fatura yönetimi",
    href: "/cari",
    gradyan: "from-purple-500 to-purple-700",
    ikon: "🧾",
    aktif: true,
  },
  {
    baslik: "Zimmet",
    aciklama: "Personel zimmet takibi ve devir işlemleri",
    href: "#",
    gradyan: "from-amber-500 to-amber-700",
    ikon: "📋",
    aktif: false,
  },
  {
    baslik: "Ayarlar",
    aciklama: "Şirket ayarları, çalışma saatleri ve tatil takvimi",
    href: "/ayarlar",
    gradyan: "from-slate-500 to-slate-700",
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

  // Paralel KPI sorguları — tümü any cast ile
  const [aktifPersonelRes, bordroRes, bekleyenRes, projeRes] = await Promise.all([
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
  ]);

  const aktifPersonel: number = aktifPersonelRes.count ?? 0;
  const toplamBordro: number = ((bordroRes.data ?? []) as { toplam_odeme: number | null }[])
    .reduce((s, b) => s + (b.toplam_odeme ?? 0), 0);
  const bekleyenOnay: number = bekleyenRes.count ?? 0;
  const aktifProje: number = projeRes.count ?? 0;

  const bugun = formatTarih(now);

  const KPI_KARTLARI = [
    {
      baslik: "Aktif Personel",
      deger: aktifPersonel.toString(),
      alt: "çalışan",
      ikon: Users,
      renk: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      baslik: `${AY_ADLARI[ay]} Bordrosu`,
      deger: formatPara(toplamBordro),
      alt: "onaylı toplam",
      ikon: Banknote,
      renk: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      baslik: "Bekleyen Onay",
      deger: bekleyenOnay.toString(),
      alt: "bordro kaydı",
      ikon: Clock,
      renk: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      baslik: "Aktif Proje",
      deger: aktifProje.toString(),
      alt: "süren proje",
      ikon: FolderOpen,
      renk: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/40",
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* ── Karşılama ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            {bugun}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Hoş geldiniz,{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {adSoyad}
            </span>{" "}
            👋
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Hilal HR yönetim paneline hoş geldiniz. Aşağıdan modüllere ulaşabilirsiniz.
          </p>
        </div>
      </div>

      {/* ── KPI Kartları ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_KARTLARI.map(({ baslik, deger, alt, ikon: Ikon, renk, bg }) => (
          <div
            key={baslik}
            className="rounded-2xl border bg-card p-5 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2 mb-4">
              <p className="text-sm font-medium text-muted-foreground leading-tight">
                {baslik}
              </p>
              <div className={`rounded-xl p-2 shrink-0 ${bg}`}>
                <Ikon className={`h-4 w-4 ${renk}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold tracking-tight ${renk}`}>
              {deger}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{alt}</p>
          </div>
        ))}
      </div>

      {/* ── Modüller ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Modüller
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULLER.map((modul) => {
            const isLink = modul.aktif && modul.href !== "#";
            const cardClass = [
              "group relative rounded-2xl border bg-card p-6 transition-all duration-200",
              isLink
                ? "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                : "opacity-55 cursor-default",
            ].join(" ");
            return isLink ? (
              <Link
                key={modul.baslik}
                href={modul.href}
                className={cardClass}
              >
                {/* Gradient sol kenar vurgusu */}
                <div
                  className={`absolute left-0 top-4 bottom-4 w-1 rounded-full bg-gradient-to-b ${modul.gradyan} opacity-0 group-hover:opacity-100 transition-opacity`}
                />

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`h-11 w-11 rounded-xl bg-gradient-to-br ${modul.gradyan} flex items-center justify-center text-xl shadow-md`}
                  >
                    {modul.ikon}
                  </div>

                  {isLink ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                  ) : (
                    <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full shrink-0 mt-1">
                      YAKINDA
                    </span>
                  )}
                </div>

                <p className="font-semibold text-sm mb-1">{modul.baslik}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {modul.aciklama}
                </p>
              </Link>
            ) : (
              <div
                key={modul.baslik}
                className={cardClass}
              >
                {/* Gradient sol kenar vurgusu */}
                <div
                  className={`absolute left-0 top-4 bottom-4 w-1 rounded-full bg-gradient-to-b ${modul.gradyan} opacity-0 group-hover:opacity-100 transition-opacity`}
                />

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`h-11 w-11 rounded-xl bg-gradient-to-br ${modul.gradyan} flex items-center justify-center text-xl shadow-md`}
                  >
                    {modul.ikon}
                  </div>
                  <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full shrink-0 mt-1">
                    YAKINDA
                  </span>
                </div>

                <p className="font-semibold text-sm mb-1">{modul.baslik}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {modul.aciklama}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
