"use client";

import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  CalendarCheck,
  Clock,
  FileX,
  TrendingUp,
  RefreshCw,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Building,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  FileText,
  LayoutGrid,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePersonelPuantaj } from "@/hooks/usePuantaj";
import type { Personel } from "@/supabase/app-types";
import { formatTarih } from "@/lib/utils/index";

const AY_LISTESI = [
  { id: 1, label: "Ocak" },
  { id: 2, label: "Şubat" },
  { id: 3, label: "Mart" },
  { id: 4, label: "Nisan" },
  { id: 5, label: "Mayıs" },
  { id: 6, label: "Haziran" },
  { id: 7, label: "Temmuz" },
  { id: 8, label: "Ağustos" },
  { id: 9, label: "Eylül" },
  { id: 10, label: "Ekim" },
  { id: 11, label: "Kasım" },
  { id: 12, label: "Aralık" },
];

const HAFTANIN_GUNLERI = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

const HAFTA_GUNLERI_KISA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

// Odaklanılan 3 izin/durum ve normal çalışma stilleri
const DURUM_STILLERI: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    label: string;
    icon: string;
    dotColor: string;
  }
> = {
  YI: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
    badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200",
    label: "Yıllık İzin",
    icon: "📅",
    dotColor: "bg-blue-500",
  },
  UI: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
    badgeBg: "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200",
    label: "Ücretsiz İzin",
    icon: "⏳",
    dotColor: "bg-orange-500",
  },
  CY: {
    bg: "bg-zinc-100 dark:bg-zinc-800/60",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-300 dark:border-zinc-700",
    badgeBg: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200",
    label: "Çalışma Yok",
    icon: "⚪",
    dotColor: "bg-zinc-400",
  },
  RP: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
    label: "Raporlu",
    icon: "🩺",
    dotColor: "bg-emerald-500",
  },
  RT: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
    badgeBg: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200",
    label: "Resmi Tatil",
    icon: "🎉",
    dotColor: "bg-purple-500",
  },
  PM: {
    bg: "bg-pink-50 dark:bg-pink-950/40",
    text: "text-pink-700 dark:text-pink-300",
    border: "border-pink-200 dark:border-pink-800",
    badgeBg: "bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-200",
    label: "Pazar Mesaisi",
    icon: "⚡",
    dotColor: "bg-pink-500",
  },
  IK: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200",
    label: "İş Kazası",
    icon: "🚨",
    dotColor: "bg-rose-500",
  },
};

// Takvim günlerini hesaplayan yardımcı fonksiyon
function buildMonthCalendarDays(
  year: number,
  month: number,
  recordsByDate: Map<string, any>,
  todayStr: string
) {
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  // Pazartesi bazlı başlangıç (Pazartesi=0, ..., Pazar=6)
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset === -1) startOffset = 6;

  const days: ({
    dayNumber: number;
    dateStr: string;
    isWeekend: boolean;
    isToday: boolean;
    record?: any;
  } | null)[] = [];

  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday = dateStr === todayStr;
    const record = recordsByDate.get(dateStr);

    days.push({
      dayNumber: d,
      dateStr,
      isWeekend,
      isToday,
      record,
    });
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

interface PersonelPuantajTabProps {
  personelId: string;
  personel?: Personel | null;
}

export function PersonelPuantajTab({
  personelId,
  personel,
}: PersonelPuantajTabProps) {
  const bugun = new Date();
  const [seciliYil, setSeciliYil] = useState<number>(bugun.getFullYear());
  const [seciliAy, setSeciliAy] = useState<number>(bugun.getMonth() + 1); // 1-12
  const [gorunumModu, setGorunumModu] = useState<"aylik" | "yillik">("aylik");
  const [seciliGunKayit, setSeciliGunKayit] = useState<{
    tarih: string;
    dayNumber: number;
    record?: any;
  } | null>(null);

  // Tüm yılın verisini çek (hem aylık takvim hem yıllık döküm için)
  const {
    data: puantajVerisi,
    isLoading,
    isRefetching,
    refetch,
  } = usePersonelPuantaj(personelId, seciliYil, null);

  const bugunStr = `${bugun.getFullYear()}-${String(bugun.getMonth() + 1).padStart(2, "0")}-${String(bugun.getDate()).padStart(2, "0")}`;

  // Yıllık İzin Hakkı Hesabı
  const yillikIzinHakki =
    (personel as any)?.yillik_izin_gun ??
    (personel as any)?.senelik_izin ??
    14;

  // Tarihe göre map oluştur
  const recordsByDate = useMemo(() => {
    const map = new Map<string, any>();
    if (puantajVerisi?.kayitlar) {
      for (const k of puantajVerisi.kayitlar) {
        map.set(k.tarih, k);
      }
    }
    return map;
  }, [puantajVerisi?.kayitlar]);

  // Seçili ayın kayıtları ve aylık istatistikleri
  const ayKayitlari = useMemo(() => {
    if (!puantajVerisi?.kayitlar) return [];
    const ayStr = String(seciliAy).padStart(2, "0");
    return puantajVerisi.kayitlar.filter((k) => k.tarih.slice(5, 7) === ayStr);
  }, [puantajVerisi?.kayitlar, seciliAy]);

  const seciliAyOzet = useMemo(() => {
    const defaultOzet = {
      calisilanGun: 0,
      calismaSaati: 0,
      mesaiSaati: 0,
      yillikIzin: 0,
      raporlu: 0,
      ucretsizIzin: 0,
      calismaYok: 0,
    };
    if (!puantajVerisi?.aylikOzetler) return defaultOzet;
    const ozet = puantajVerisi.aylikOzetler.find((m) => m.ay === seciliAy);
    return ozet || defaultOzet;
  }, [puantajVerisi?.aylikOzetler, seciliAy]);

  // Yıllık Toplam İstatistikler
  const yillikStats = puantajVerisi ?? {
    toplamCalisilanGun: 0,
    toplamCalismaSaati: 0,
    toplamMesaiSaati: 0,
    ozelDurumSayilari: { YI: 0, UI: 0, CY: 0 },
    aylikOzetler: [],
    kayitlar: [],
  };

  const yillikYI = yillikStats.ozelDurumSayilari["YI"] || 0;
  const yillikYIKalan = Math.max(0, yillikIzinHakki - yillikYI);
  const yillikUI = yillikStats.ozelDurumSayilari["UI"] || 0;
  const yillikCY = yillikStats.ozelDurumSayilari["CY"] || 0;

  // Seçili Ayın 7 Sütunlu Takvim Günleri
  const seciliAyTakvimGunleri = useMemo(() => {
    return buildMonthCalendarDays(seciliYil, seciliAy, recordsByDate, bugunStr);
  }, [seciliYil, seciliAy, recordsByDate, bugunStr]);

  // Ay geçişleri
  function oncekiAy() {
    if (seciliAy === 1) {
      setSeciliYil((y) => y - 1);
      setSeciliAy(12);
    } else {
      setSeciliAy((m) => m - 1);
    }
  }

  function sonrakiAy() {
    if (seciliAy === 12) {
      setSeciliYil((y) => y + 1);
      setSeciliAy(1);
    } else {
      setSeciliAy((m) => m + 1);
    }
  }

  return (
    <div className="space-y-6 text-xs animate-in fade-in duration-200">
      {/* ── Üst Başlık, Görünüm Seçici ve Dönem Çubuğu ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/80 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#7c3aed]" />
            Puantaj ve İzin Takibi
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
            Yıllık İzin, Ücretsiz İzin ve Çalışma Olmayan günlerin takibi
          </p>
        </div>

        {/* Kontroller: Görünüm Modu, Ay/Yıl ve Yenileme */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Görünüm Modu Switcher: Aylık / Yıllık */}
          <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5">
            <button
              onClick={() => setGorunumModu("aylik")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                gorunumModu === "aylik"
                  ? "bg-[#7c3aed] text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Aylık Takvim
            </button>
            <button
              onClick={() => setGorunumModu("yillik")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                gorunumModu === "yillik"
                  ? "bg-[#7c3aed] text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Yıllık Görünüm
            </button>
          </div>

          {/* Aylık Modda Ay Seçici */}
          {gorunumModu === "aylik" && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={oncekiAy}
                className="h-8 w-8 cursor-pointer"
                title="Önceki Ay"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <select
                value={seciliAy}
                onChange={(e) => setSeciliAy(Number(e.target.value))}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#7c3aed]"
              >
                {AY_LISTESI.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="icon"
                onClick={sonrakiAy}
                className="h-8 w-8 cursor-pointer"
                title="Sonraki Ay"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Yıl Seçimi */}
          <select
            value={seciliYil}
            onChange={(e) => setSeciliYil(Number(e.target.value))}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#7c3aed]"
          >
            {[seciliYil - 2, seciliYil - 1, seciliYil, seciliYil + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Yenile */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="h-8 w-8 cursor-pointer"
            title="Yenile"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefetching ? "animate-spin text-[#7c3aed]" : "text-zinc-500"
              }`}
            />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : (
        <>
          {/* ── 1. KPI Kartları (Yıllık veya Aylık moda göre) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Kart 1: Yıllık İzin (Yİ) */}
            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 flex flex-col justify-between shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <CalendarCheck className="w-4 h-4 text-blue-600" />
                    Yıllık İzin (Yİ)
                  </span>
                  <h3 className="text-2xl font-bold text-blue-950 dark:text-blue-100 mt-1">
                    {gorunumModu === "aylik" ? seciliAyOzet.yillikIzin : yillikYI}{" "}
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Gün {gorunumModu === "aylik" ? "Bu Ay" : "Kullanıldı"}
                    </span>
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-300 shrink-0">
                  <CalendarCheck className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-[11px] font-medium text-blue-800 dark:text-blue-300">
                <span>Yıllık Hak: {yillikIzinHakki} Gün</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  Kalan: {yillikYIKalan} Gün
                </span>
              </div>
            </div>

            {/* Kart 2: Ücretsiz İzin (Üİ) */}
            <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40 flex flex-col justify-between shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-orange-600" />
                    Ücretsiz İzin (Üİ)
                  </span>
                  <h3 className="text-2xl font-bold text-orange-950 dark:text-orange-100 mt-1">
                    {gorunumModu === "aylik" ? seciliAyOzet.ucretsizIzin : yillikUI}{" "}
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                      Gün {gorunumModu === "aylik" ? "Bu Ay" : "Toplam"}
                    </span>
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-300 shrink-0">
                  <AlertCircle className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-orange-200/60 dark:border-orange-900/40 text-[11px] text-orange-700 dark:text-orange-400 font-medium">
                Maaştan kesinti yapılan günler
              </div>
            </div>

            {/* Kart 3: Çalışma Olmayan Günler (ÇY) */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 flex flex-col justify-between shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <FileX className="w-4 h-4 text-zinc-500" />
                    Çalışma Olmayan (ÇY)
                  </span>
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                    {gorunumModu === "aylik" ? seciliAyOzet.calismaYok : yillikCY}{" "}
                    <span className="text-xs font-semibold text-zinc-500">
                      Gün {gorunumModu === "aylik" ? "Bu Ay" : "Toplam"}
                    </span>
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
                  <FileX className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Çalışma yapılmayan / tatil günleri
              </div>
            </div>

            {/* Kart 4: Normal Çalışma & Mesai */}
            <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/40 flex flex-col justify-between shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#7c3aed] dark:text-purple-300 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-[#7c3aed]" />
                    Normal Çalışma
                  </span>
                  <h3 className="text-2xl font-bold text-purple-950 dark:text-purple-100 mt-1">
                    {gorunumModu === "aylik" ? seciliAyOzet.calisilanGun : yillikStats.toplamCalisilanGun}{" "}
                    <span className="text-xs font-semibold text-[#7c3aed]">
                      Gün {gorunumModu === "aylik" ? "Bu Ay" : "Yıl Toplamı"}
                    </span>
                  </h3>
                </div>
                <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-[#7c3aed] dark:text-purple-300 shrink-0">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between text-[11px] font-semibold text-purple-800 dark:text-purple-300">
                <span>
                  {gorunumModu === "aylik" ? seciliAyOzet.calismaSaati : yillikStats.toplamCalismaSaati}s Normal
                </span>
                {(gorunumModu === "aylik" ? seciliAyOzet.mesaiSaati : yillikStats.toplamMesaiSaati) > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    +{gorunumModu === "aylik" ? seciliAyOzet.mesaiSaati : yillikStats.toplamMesaiSaati}s Mesai
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── 2. GÖRÜNÜM 1: AYLIK 7 SÜTUNLU TAKVİM ── */}
          {gorunumModu === "aylik" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
              {/* Takvim Başlığı ve Lejant */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#7c3aed]" />
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                    {AY_LISTESI[seciliAy - 1]?.label} {seciliYil} Puantaj Takvimi
                  </h3>
                </div>

                {/* Renk Lejantı */}
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Yıllık İzin (Yİ)
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Ücretsiz İzin (Üİ)
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-zinc-400" />
                    Çalışma Yok (ÇY)
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Çalışma
                  </span>
                  <span className="flex items-center gap-1 text-zinc-400 ml-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Not Var
                  </span>
                </div>
              </div>

              {/* 7 Sütunlu Grid */}
              <div className="w-full">
                {/* Gün Başlıkları */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
                  {HAFTA_GUNLERI_KISA.map((gunKisa, index) => {
                    const isHaftaSonu = index === 5 || index === 6;
                    return (
                      <div
                        key={gunKisa}
                        className={`py-2 rounded-lg text-xs font-bold ${
                          isHaftaSonu
                            ? "bg-amber-50/80 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                            : "bg-zinc-100/80 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300"
                        }`}
                      >
                        <span className="hidden sm:inline">{HAFTANIN_GUNLERI[index]}</span>
                        <span className="sm:hidden">{gunKisa}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Gün Hücreleri */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {seciliAyTakvimGunleri.map((item, idx) => {
                    if (!item) {
                      return (
                        <div
                          key={`empty-${idx}`}
                          className="min-h-[88px] sm:min-h-[105px] rounded-xl bg-zinc-50/30 dark:bg-zinc-900/30 border border-dashed border-zinc-200/50 dark:border-zinc-800/40 opacity-40"
                        />
                      );
                    }

                    const { dayNumber, dateStr, isWeekend, isToday, record } = item;
                    const ozelDurum = record?.ozel_durum;
                    const durumStili = ozelDurum ? DURUM_STILLERI[ozelDurum] : null;
                    const hasNote = Boolean(record?.aciklama && record.aciklama.trim().length > 0);
                    const isCalisma = Boolean(!ozelDurum && record?.calisma_saati && record.calisma_saati > 0);

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSeciliGunKayit({ tarih: dateStr, dayNumber, record })}
                        className={`min-h-[88px] sm:min-h-[105px] p-2 sm:p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                          isToday
                            ? "ring-2 ring-[#7c3aed] ring-offset-1 dark:ring-offset-zinc-900"
                            : ""
                        } ${
                          durumStili
                            ? `${durumStili.bg} ${durumStili.border} hover:border-[#7c3aed] shadow-xs`
                            : isCalisma
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 hover:border-emerald-400"
                            : isWeekend
                            ? "bg-amber-50/20 dark:bg-amber-950/10 border-zinc-200/70 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                            : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-[#7c3aed] hover:shadow-xs"
                        }`}
                      >
                        {/* Üst Kısım: Gün Numarası ve Not İndikatörü */}
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs sm:text-sm font-bold flex items-center justify-center ${
                              isToday
                                ? "w-6 h-6 rounded-full bg-[#7c3aed] text-white"
                                : isWeekend
                                ? "text-amber-700 dark:text-amber-400"
                                : "text-zinc-800 dark:text-zinc-200"
                            }`}
                          >
                            {dayNumber}
                          </span>

                          <div className="flex items-center gap-1">
                            {hasNote && (
                              <span
                                className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"
                                title="Not var (tıklayıp okuyun)"
                              />
                            )}
                            {record?.kapali && (
                              <span title="Kilitli">
                                <Lock className="w-3 h-3 text-zinc-400" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Orta/Alt Kısım: Durum Rozeti */}
                        <div className="mt-1.5 space-y-1 w-full">
                          {durumStili ? (
                            <div
                              className={`px-1.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-bold text-center truncate ${durumStili.badgeBg}`}
                              title={durumStili.label}
                            >
                              <span className="mr-0.5">{durumStili.icon}</span>
                              <span className="hidden sm:inline">{durumStili.label}</span>
                              <span className="sm:hidden">{ozelDurum}</span>
                            </div>
                          ) : isCalisma ? (
                            <div className="px-1.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 text-center truncate">
                              <span>{record.calisma_saati} Saat</span>
                            </div>
                          ) : (
                            <div className="text-center text-zinc-300 dark:text-zinc-700 text-xs py-1">
                              —
                            </div>
                          )}

                          {record?.mesai_saati && record.mesai_saati > 0 && (
                            <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 text-center">
                              +{record.mesai_saati}s Mesai
                            </div>
                          )}
                        </div>

                        <span className="text-[9px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity self-end mt-1">
                          Detay ↵
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── 3. GÖRÜNÜM 2: YILLIK 12 AY DÖKÜMÜ VE MİNİ TAKVİMLERİ ── */}
          {gorunumModu === "yillik" && (
            <div className="space-y-6">
              {/* 12 Ayın Özet Kartları Matrisi */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm sm:text-base text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-[#7c3aed]" />
                    {seciliYil} Yılı 12 Aylık İzin ve Çalışma Dökümü
                  </span>
                  <span className="text-xs text-zinc-400">
                    Aya tıklayarak detaylı takvime geçebilirsiniz
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {AY_LISTESI.map((m) => {
                    const ozet = yillikStats.aylikOzetler.find((o) => o.ay === m.id) || {
                      calisilanGun: 0,
                      calismaSaati: 0,
                      mesaiSaati: 0,
                      yillikIzin: 0,
                      ucretsizIzin: 0,
                      calismaYok: 0,
                      toplamKayit: 0,
                    };
                    const hasActivity = ozet.toplamKayit > 0;

                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSeciliAy(m.id);
                          setGorunumModu("aylik");
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 group ${
                          hasActivity
                            ? "bg-zinc-50/80 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-[#7c3aed] hover:shadow-xs"
                            : "bg-zinc-50/30 dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-[#7c3aed] transition-colors">
                            {m.label}
                          </span>
                          <span className="text-[10px] text-zinc-400 group-hover:text-[#7c3aed] flex items-center gap-0.5">
                            Takvimi Aç <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>

                        <div className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                          <div className="flex justify-between">
                            <span>Çalışma:</span>
                            <strong className="text-zinc-900 dark:text-white">
                              {ozet.calisilanGun} Gün ({ozet.calismaSaati}s)
                            </strong>
                          </div>
                          {ozet.yillikIzin > 0 && (
                            <div className="flex justify-between text-blue-600 dark:text-blue-400 font-medium">
                              <span>Yıllık İzin:</span>
                              <strong>{ozet.yillikIzin} Gün</strong>
                            </div>
                          )}
                          {ozet.ucretsizIzin > 0 && (
                            <div className="flex justify-between text-orange-600 dark:text-orange-400 font-medium">
                              <span>Ücretsiz İzin:</span>
                              <strong>{ozet.ucretsizIzin} Gün</strong>
                            </div>
                          )}
                          {ozet.calismaYok > 0 && (
                            <div className="flex justify-between text-zinc-600 dark:text-zinc-400 font-medium">
                              <span>Çalışma Yok:</span>
                              <strong>{ozet.calismaYok} Gün</strong>
                            </div>
                          )}
                          {ozet.mesaiSaati > 0 && (
                            <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                              <span>Fazla Mesai:</span>
                              <strong>+{ozet.mesaiSaati}s</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 12 Ayın 7 Sütunlu Mini Takvimleri */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="font-bold text-sm sm:text-base text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[#7c3aed]" />
                    {seciliYil} Yılı Tüm Aylar Takvim Matrisi
                  </span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Yİ
                    </span>
                    <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                      <span className="w-2 h-2 rounded-full bg-orange-500" /> Üİ
                    </span>
                    <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                      <span className="w-2 h-2 rounded-full bg-zinc-400" /> ÇY
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Çalışma
                    </span>
                  </div>
                </div>

                {/* 12 Ay Mini Takvim Grid (3x4) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {AY_LISTESI.map((m) => {
                    const mDays = buildMonthCalendarDays(seciliYil, m.id, recordsByDate, bugunStr);

                    return (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/40 dark:bg-zinc-800/20 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-zinc-900 dark:text-white">
                            {m.label} {seciliYil}
                          </span>
                          <button
                            onClick={() => {
                              setSeciliAy(m.id);
                              setGorunumModu("aylik");
                            }}
                            className="text-[10px] text-[#7c3aed] font-semibold hover:underline cursor-pointer"
                          >
                            Büyüt ↗
                          </button>
                        </div>

                        {/* Mini Takvim Gün Başlıkları */}
                        <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-semibold text-zinc-400">
                          {HAFTA_GUNLERI_KISA.map((k) => (
                            <span key={k}>{k.slice(0, 1)}</span>
                          ))}
                        </div>

                        {/* Mini Takvim Günleri */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                          {mDays.map((item, idx) => {
                            if (!item) {
                              return <div key={`mini-empty-${idx}`} className="h-6" />;
                            }

                            const { dayNumber, dateStr, isToday, record } = item;
                            const ozelDurum = record?.ozel_durum;
                            const durumStili = ozelDurum ? DURUM_STILLERI[ozelDurum] : null;
                            const isCalisma = Boolean(!ozelDurum && record?.calisma_saati && record.calisma_saati > 0);
                            const hasNote = Boolean(record?.aciklama && record.aciklama.trim().length > 0);

                            return (
                              <button
                                key={dateStr}
                                onClick={() => setSeciliGunKayit({ tarih: dateStr, dayNumber, record })}
                                className={`h-6 rounded flex items-center justify-center font-semibold transition-all cursor-pointer relative ${
                                  isToday ? "ring-1 ring-[#7c3aed] font-bold" : ""
                                } ${
                                  durumStili
                                    ? `${durumStili.badgeBg} font-bold`
                                    : isCalisma
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                }`}
                                title={`${dayNumber} ${m.label} ${seciliYil} ${
                                  durumStili ? `(${durumStili.label})` : isCalisma ? `(${record.calisma_saati}s)` : ""
                                }`}
                              >
                                <span>{dayNumber}</span>
                                {hasNote && (
                                  <span className="w-1 h-1 rounded-full bg-amber-400 absolute top-0.5 right-0.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── 4. Gün Detayı & Not Görüntüleme Dialog / Modal ── */}
          <Dialog
            open={!!seciliGunKayit}
            onOpenChange={(open) => !open && setSeciliGunKayit(null)}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-white">
                  <CalendarIcon className="w-5 h-5 text-[#7c3aed]" />
                  {seciliGunKayit && formatTarih(seciliGunKayit.tarih)} Tarihli Puantaj Detayı
                </DialogTitle>
              </DialogHeader>

              {seciliGunKayit && (
                <div className="space-y-4 pt-2 text-xs">
                  {/* Durum Rozeti */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                    <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                      Günün Durumu:
                    </span>
                    {seciliGunKayit.record?.ozel_durum ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                          DURUM_STILLERI[seciliGunKayit.record.ozel_durum]?.badgeBg ||
                          "bg-zinc-200 text-zinc-800"
                        }`}
                      >
                        <span>
                          {DURUM_STILLERI[seciliGunKayit.record.ozel_durum]?.icon || "📌"}
                        </span>
                        <span>
                          {DURUM_STILLERI[seciliGunKayit.record.ozel_durum]?.label ||
                            seciliGunKayit.record.ozel_durum}
                        </span>
                        <span className="opacity-70">
                          ({seciliGunKayit.record.ozel_durum})
                        </span>
                      </span>
                    ) : seciliGunKayit.record?.calisma_saati &&
                      seciliGunKayit.record.calisma_saati > 0 ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Normal Çalışma ({seciliGunKayit.record.calisma_saati} Saat)
                      </span>
                    ) : (
                      <span className="text-zinc-500 font-medium italic">
                        Kayıt girilmemiş / Boş gün
                      </span>
                    )}
                  </div>

                  {/* Çalışma ve Saat Bilgileri */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                      <span className="text-[11px] text-zinc-400 block">Giriş - Çıkış</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5 block">
                        {seciliGunKayit.record?.giris_saati && seciliGunKayit.record?.cikis_saati
                          ? `${seciliGunKayit.record.giris_saati.slice(0, 5)} - ${seciliGunKayit.record.cikis_saati.slice(0, 5)}`
                          : seciliGunKayit.record?.giris_saati
                          ? seciliGunKayit.record.giris_saati.slice(0, 5)
                          : "—"}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                      <span className="text-[11px] text-zinc-400 block">Çalışma / Mesai</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5 block">
                        {seciliGunKayit.record?.calisma_saati != null
                          ? `${seciliGunKayit.record.calisma_saati}s`
                          : "0s"}
                        {seciliGunKayit.record?.mesai_saati
                          ? ` (+${seciliGunKayit.record.mesai_saati}s Mesai)`
                          : ""}
                      </span>
                    </div>
                  </div>

                  {/* Projeler varsa listele */}
                  {seciliGunKayit.record?.projeler &&
                    seciliGunKayit.record.projeler.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          Çalışılan Projeler:
                        </span>
                        <div className="space-y-1">
                          {seciliGunKayit.record.projeler.map((p: any, idx: number) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between"
                            >
                              <span className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                <Building className="w-3.5 h-3.5 text-[#7c3aed]" />
                                {p.projeAdi}
                              </span>
                              <span className="font-bold text-zinc-900 dark:text-white">
                                {p.saat} Saat
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* AÇIKLAMA / NOT ALANI (Öne çıkan kısım) */}
                  <div className="space-y-1.5">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-500" />
                      Açıklama ve Not:
                    </span>
                    {seciliGunKayit.record?.aciklama &&
                    seciliGunKayit.record.aciklama.trim().length > 0 ? (
                      <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs leading-relaxed font-medium">
                        {seciliGunKayit.record.aciklama}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400 italic">
                        Bu güne ait herhangi bir not veya açıklama girilmemiş.
                      </div>
                    )}
                  </div>

                  {/* Kilit Durumu Bilgisi */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400">
                    <span>Ay Durumu:</span>
                    {seciliGunKayit.record?.kapali ? (
                      <span className="text-zinc-500 font-semibold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Kilitli Dönem
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <Unlock className="w-3.5 h-3.5" /> Açık Dönem
                      </span>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
