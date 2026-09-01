"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Car,
  Info,
  Eye,
  FileText,
  Cpu,
  GitCommitHorizontal,
  Wrench,
  ShieldCheck,
  Umbrella,
  ArrowLeft,
  Shield,
  Calendar,
  FileSpreadsheet,
  Plus,
  Trash2,
  Fuel,
  Coins,
  Receipt,
  CheckCircle2,
  Wind,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Arac,
  Police,
  TrafikCezasi,
  AylikYakitKaydi,
  ServisKaydi,
  MuayeneBilgileri,
} from "./types";
import { cn } from "@/lib/utils";
import { RuhsatModal } from "./RuhsatModal";
import { PoliceEkleModal } from "./PoliceEkleModal";
import { CezaEkleModal } from "./CezaEkleModal";
import { MuayeneGuncelleModal } from "./MuayeneGuncelleModal";
import { YakitGirisModal } from "./YakitGirisModal";
import { YakitRaporPdfModal } from "./YakitRaporPdfModal";
import { ServisKayitModal } from "./ServisKayitModal";
import { ServisRaporPdfModal } from "./ServisRaporPdfModal";
import { ServisDetayModal } from "./ServisDetayModal";
import {
  policeSilAction,
  cezaSilAction,
  yakitKaydiSilAction,
  servisKaydiSilAction,
} from "@/app/actions/garaj";
import { toast } from "sonner";

function CarBatteryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 6V4h4v2" />
      <path d="M6 6V4h4v2" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
      <path d="M6 13h4" />
      <path d="M14 13h4" />
      <path d="M16 11v4" />
    </svg>
  );
}

const SATIR_LIMITI = 15;

interface GarajDetayEkraniProps {
  arac: Arac;
}

type DetayTabTipi = "genel" | "bilgi" | "masraf";

export function GarajDetayEkrani({ arac }: GarajDetayEkraniProps) {
  const router = useRouter();
  const [aktifTab, setAktifTab] = useState<DetayTabTipi>("genel");
  const [secilenYil, setSecilenYil] = useState<number>(2026);

  // Tablo Sayfalama State'leri (Max 15 satır)
  const [sayfaYakit, setSayfaYakit] = useState<number>(1);
  const [sayfaServis, setSayfaServis] = useState<number>(1);

  // Modal Açılış State'leri
  const [ruhsatModalAcik, setRuhsatModalAcik] = useState(false);
  const [policeModalAcik, setPoliceModalAcik] = useState(false);
  const [cezaModalAcik, setCezaModalAcik] = useState(false);
  const [muayeneModalAcik, setMuayeneModalAcik] = useState(false);
  const [yakitModalAcik, setYakitModalAcik] = useState(false);
  const [yakitPdfModalAcik, setYakitPdfModalAcik] = useState(false);
  const [servisModalAcik, setServisModalAcik] = useState(false);
  const [servisPdfModalAcik, setServisPdfModalAcik] = useState(false);

  // Satıra tıklanınca açılan detay modalı
  const [secilenServisDetay, setSecilenServisDetay] = useState<ServisKaydi | null>(null);
  const [servisDetayModalAcik, setServisDetayModalAcik] = useState(false);

  // Canlı Veri Listeleri
  const policeler = arac.policeler || [];
  const cezalar = arac.cezalar || [];
  const muayene = arac.muayene || {
    muayeneTarihi: "18.06.2026",
    kalanGun: 126,
    muayeneUcreti: 2620,
    istasyon: "TÜVTÜRK Maslak İstasyonu",
    raporNo: "TUV-2024-991840",
    sonuc: "Kusursuz Geçti",
    egzozEmisyonTarihi: "18.06.2026",
  };

  const tumYakitlar = arac.yakitKayitlari || [];
  const tumServisler = arac.servisKayitlari || [];

  const yillikYakitlar = useMemo(
    () => tumYakitlar.filter((y) => y.yil === secilenYil),
    [tumYakitlar, secilenYil]
  );

  const yillikServisler = useMemo(
    () => tumServisler.filter((s) => s.yil === secilenYil),
    [tumServisler, secilenYil]
  );

  // Finansal KPI Hesaplamaları
  const toplamCezaTutari = useMemo(
    () => cezalar.reduce((acc, c) => acc + (c.tutar || 0), 0),
    [cezalar]
  );
  const toplamYakitMiktar = useMemo(
    () => yillikYakitlar.reduce((acc, y) => acc + (y.miktar || 0), 0),
    [yillikYakitlar]
  );
  const toplamYakitTutar = useMemo(
    () => yillikYakitlar.reduce((acc, y) => acc + (y.toplamTutar || 0), 0),
    [yillikYakitlar]
  );
  const toplamServisTutar = useMemo(
    () => yillikServisler.reduce((acc, s) => acc + (s.tutar || 0), 0),
    [yillikServisler]
  );

  // TÜVTÜRK Muayene masrafı (O yıla aitse toplama eklenir)
  const muayeneMasrafi = secilenYil === 2026 ? (muayene.muayeneUcreti || 0) : 0;
  const yillikGenelToplamGider = toplamYakitTutar + toplamServisTutar + muayeneMasrafi;

  // 15 Satır Sayfalama Dilimleri
  const toplamSayfaYakit = Math.max(1, Math.ceil(yillikYakitlar.length / SATIR_LIMITI));
  const sayfalamaYakitlar = useMemo(() => {
    const baslangic = (sayfaYakit - 1) * SATIR_LIMITI;
    return yillikYakitlar.slice(baslangic, baslangic + SATIR_LIMITI);
  }, [yillikYakitlar, sayfaYakit]);

  const toplamSayfaServis = Math.max(1, Math.ceil(yillikServisler.length / SATIR_LIMITI));
  const sayfalamaServisler = useMemo(() => {
    const baslangic = (sayfaServis - 1) * SATIR_LIMITI;
    return yillikServisler.slice(baslangic, baslangic + SATIR_LIMITI);
  }, [yillikServisler, sayfaServis]);

  // ── Tab 1 (Genel Bakış) Canlı Eşleşmeleri ──
  // 1. Kasko poliçesi bul
  const kaskoPolice = useMemo(
    () => policeler.find((p) => p.tur.toLowerCase().includes("kasko")) || policeler[0],
    [policeler]
  );

  // 2. Son 3 Ay Yakıt Verisi
  const son3AyYakitlar = useMemo(() => {
    if (yillikYakitlar.length > 0) {
      return yillikYakitlar.slice(0, 3).map((y) => ({
        ay: y.ay,
        miktar: `${y.miktar} ${arac.yakitTipi === "Elektrik" ? "kWh" : "LT"}`,
      }));
    }
    return [
      { ay: "Ocak", miktar: "0 LT" },
      { ay: "Şubat", miktar: "0 LT" },
      { ay: "Mart", miktar: "0 LT" },
    ];
  }, [yillikYakitlar, arac.yakitTipi]);

  // Silme Aksiyonları
  const handlePoliceSil = async (policeId: string) => {
    const res = await policeSilAction(arac.id, policeId);
    if (res.basarili) {
      toast.success("Poliçe silindi.");
      router.refresh();
    } else {
      toast.error(res.hata || "Silinemedi.");
    }
  };

  const handleCezaSil = async (cezaId: string) => {
    const res = await cezaSilAction(arac.id, cezaId);
    if (res.basarili) {
      toast.success("Ceza kaydı silindi.");
      router.refresh();
    } else {
      toast.error(res.hata || "Silinemedi.");
    }
  };

  const handleYakitSil = async (kayitId: string) => {
    const res = await yakitKaydiSilAction(arac.id, kayitId);
    if (res.basarili) {
      toast.success("Yakıt kaydı silindi.");
      router.refresh();
    } else {
      toast.error(res.hata || "Silinemedi.");
    }
  };

  const handleServisSil = async (kayitId: string) => {
    const res = await servisKaydiSilAction(arac.id, kayitId);
    if (res.basarili) {
      toast.success("Servis kaydı silindi.");
      router.refresh();
    } else {
      toast.error(res.hata || "Silinemedi.");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-5 pb-8">
      {/* ── Geri Dön Butonu ── */}
      <div>
        <Link
          href="/garaj"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Filo Araçlarına Dön
        </Link>
      </div>

      {/* ── Ana Kart Konteyner ── */}
      <div className="relative rounded-[28px] sm:rounded-[40px] bg-[#f7f7f8] dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800/80 p-5 sm:p-10 md:p-12 shadow-sm overflow-hidden min-h-[620px]">
        {/* ── MOBİL TAB SWITCHER ── */}
        <div className="flex sm:hidden items-center justify-between p-1 rounded-2xl bg-zinc-200/70 dark:bg-zinc-850 mb-5 gap-1">
          <button
            type="button"
            onClick={() => setAktifTab("genel")}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              aktifTab === "genel"
                ? "bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            )}
          >
            <Car className="w-3.5 h-3.5" />
            Genel
          </button>
          <button
            type="button"
            onClick={() => setAktifTab("bilgi")}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              aktifTab === "bilgi"
                ? "bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            )}
          >
            <Info className="w-3.5 h-3.5" />
            Bilgi
          </button>
          <button
            type="button"
            onClick={() => setAktifTab("masraf")}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              aktifTab === "masraf"
                ? "bg-white text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            )}
          >
            <CarBatteryIcon className="w-3.5 h-3.5" />
            Masraf
          </button>
        </div>

        {/* ── MASAÜSTÜ SAĞ DİKEY MENÜ BUTONLARI ── */}
        <div className="hidden sm:flex absolute right-6 sm:right-10 md:right-12 top-6 sm:top-10 md:top-12 z-30 flex-col gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setAktifTab("genel")}
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer",
              aktifTab === "genel"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-md scale-105"
                : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            )}
            title="Araç Görünümü"
          >
            <Car className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={() => setAktifTab("bilgi")}
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer",
              aktifTab === "bilgi"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-md scale-105"
                : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            )}
            title="Sigorta, Muayene & Ceza Bilgileri"
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={() => setAktifTab("masraf")}
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer",
              aktifTab === "masraf"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-md scale-105"
                : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            )}
            title="Yakıt & Servis Masrafları"
          >
            <CarBatteryIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ── TAB 1: GENEL BAKIŞ (CANLI VERİ ENTEGRE REFERANS EKRANI) ── */}
        {/* ══════════════════════════════════════════════════════════ */}
        {aktifTab === "genel" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Üst Başlık & Araç Görseli */}
            <div className="relative flex flex-col justify-between min-h-[260px] sm:min-h-[380px] md:min-h-[440px]">
              <div className="space-y-1 z-10 max-w-full sm:max-w-[calc(100%-80px)]">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {arac.marka} {arac.model}
                </h1>
                <p className="text-xs sm:text-sm md:text-base font-normal text-zinc-500 dark:text-zinc-400">
                  {arac.altBaslik || `${arac.yakitTipi} • ${arac.vites}`}
                </p>
              </div>

              {/* Merkez Araç Görseli */}
              <div className="relative w-full max-w-4xl mx-auto h-[180px] sm:h-[300px] md:h-[380px] lg:h-[420px] my-auto flex items-center justify-center">
                <Image
                  src={arac.gorsel}
                  alt={`${arac.marka} ${arac.model}`}
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                  unoptimized={arac.gorsel.startsWith("http")}
                />
              </div>
            </div>

            {/* Alt 3 Kart Izgarası */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-6 pt-2 sm:pt-4">
              {/* 1. KART: Ruhsat Bilgileri */}
              <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/80 p-5 sm:p-7 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                    Ruhsat Bilgileri
                  </h3>
                  <button
                    type="button"
                    onClick={() => setRuhsatModalAcik(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ruhsat Görüntüle
                  </button>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5 text-zinc-500 dark:text-zinc-400">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span>Ruhsat Seri No:</span>
                    </div>
                    <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100 text-sm">
                      {arac.ruhsat?.ruhsatSeriNo || "GI 431226"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5 text-zinc-500 dark:text-zinc-400">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <span>Motor No:</span>
                    </div>
                    <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100 text-sm">
                      {arac.ruhsat?.motorNo || "463460201136131"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5 text-zinc-500 dark:text-zinc-400">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <GitCommitHorizontal className="w-4 h-4" />
                      </div>
                      <span>Şase No:</span>
                    </div>
                    <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none text-right">
                      {arac.ruhsat?.saseNo || "NM426300006Y60210"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. KART: Yakıt Tüketimi (Canlı Veritabanı Eşleşmesi) */}
              <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/80 p-5 sm:p-7 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                    Yakıt Tüketimi
                  </h3>
                  <div className="text-right">
                    <p className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                      {secilenYil} Yılı Toplam
                    </p>
                    <p className="font-bold text-base sm:text-lg text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
                      {toplamYakitMiktar.toLocaleString("tr-TR")} {arac.yakitTipi === "Elektrik" ? "kWh" : "LT"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mb-1">
                    Son Dönem Tüketimleri
                  </p>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {son3AyYakitlar.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-2.5"
                      >
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                          {t.ay}
                        </span>
                        <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100">
                          {t.miktar}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. KART: Servis ve Koruma Durumu (Canlı Muayene, Kasko ve Servis Eşleşmesi) */}
              <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/80 p-5 sm:p-7 shadow-sm flex flex-col justify-between space-y-4 md:col-span-2 lg:col-span-1">
                <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                  Servis ve Koruma Durumu
                </h3>

                <div className="space-y-3 pt-1">
                  {/* Bakım */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                          Bakım Durumu
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {yillikServisler[0]?.tarih ? `Son Bakım: ${yillikServisler[0].tarih}` : "Periyodik Takvimde"}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-xs tracking-tight text-emerald-600 dark:text-emerald-400">
                      Güncel
                    </span>
                  </div>

                  {/* Muayene (Canlı Muayene Tablosu) */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                          TÜVTÜRK Muayene
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          Son tarih: {muayene.muayeneTarihi}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "font-bold text-xs tracking-tight",
                        muayene.kalanGun < 90
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {muayene.kalanGun} gün
                    </span>
                  </div>

                  {/* Kasko (Canlı Poliçeler Tablosu) */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Umbrella className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                          Kasko Poliçesi
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {kaskoPolice?.bitisTarihi ? `Bitiş: ${kaskoPolice.bitisTarihi}` : "Aktif Teminat"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "font-bold text-xs tracking-tight",
                        (kaskoPolice?.kalanGun ?? 180) < 90
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {kaskoPolice?.kalanGun ?? 180} gün
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ── TAB 2: INFO (3 EŞİT SÜTUNLU KART DÜZENİ) ── */}
        {/* ══════════════════════════════════════════════════════════ */}
        {aktifTab === "bilgi" && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in-50 duration-300">
            {/* ── ÜST BAŞLIK ── */}
            <div className="space-y-0.5 pr-0 sm:pr-16 md:pr-20">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Sigorta, Muayene & Ceza Kayıtları
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {arac.plaka} • Resmi poliçe teminatları, TÜVTÜRK muayene ve trafik ceza dökümü
              </p>
            </div>

            {/* ── ÜST 3 KPI KARTI ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 pr-0 sm:pr-16 md:pr-20">
              {/* KPI 1: Sigorta & Kasko */}
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Sigorta & Kasko
                  </h4>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {policeler.length} aktif poliçe
                  </p>
                </div>
              </div>

              {/* KPI 2: TÜVTÜRK Muayene */}
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    TÜVTÜRK Muayene
                  </h4>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {muayene.kalanGun} gün kaldı ({muayene.muayeneTarihi})
                  </p>
                </div>
              </div>

              {/* KPI 3: Trafik Cezası */}
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Trafik Cezası
                  </h4>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {cezalar.length > 0
                      ? `${cezalar.length} kayıt (${toplamCezaTutari.toLocaleString("tr-TR")} ₺)`
                      : "Tebliğ edilen ceza yok"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── ALT 3 EŞİT SÜTUNLU KARTLAR ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 pt-2">
              {/* ── 1. KART: Sigorta & Kasko Poliçeleri ── */}
              <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">
                          Poliçeler
                        </h3>
                        <p className="text-[11px] text-zinc-400">Aktif Kasko & Trafik</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPoliceModalAcik(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Poliçe Ekle
                    </button>
                  </div>

                  <div className="space-y-3">
                    {policeler.length === 0 ? (
                      <p className="text-xs text-zinc-400 text-center py-4">Kayıtlı poliçe bulunmuyor.</p>
                    ) : (
                      policeler.map((pol) => (
                        <div
                          key={pol.id}
                          className="p-3.5 rounded-2xl bg-[#fafafa] dark:bg-zinc-850/60 border border-zinc-200/60 dark:border-zinc-800 space-y-2 relative group"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                              {pol.tur}
                            </h4>
                            <button
                              type="button"
                              onClick={() => handlePoliceSil(pol.id)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 p-0.5 transition-opacity"
                              title="Poliçeyi Sil"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span>{pol.sirket}</span>
                            {pol.tutar && (
                              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                {pol.tutar.toLocaleString("tr-TR")} ₺
                              </span>
                            )}
                          </div>

                          <div className="flex items-end justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800 text-[11px]">
                            <div>
                              <span className="text-[9px] uppercase font-semibold text-zinc-400 block">
                                POLİÇE NO
                              </span>
                              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                                {pol.policeNo}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[9px] uppercase font-semibold text-zinc-400 block">
                                BİTİŞ TARİHİ
                              </span>
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                {pol.bitisTarihi}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                                {pol.kalanGun} gün kaldı
                              </span>
                            </div>
                          </div>

                          {pol.belgeAdi && (
                            <div className="pt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200/50 dark:border-blue-800/40">
                                <FileText className="w-3 h-3" />
                                {pol.belgeAdi}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <span>Toplam: {policeler.length} Poliçe</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Teminat Altında</span>
                </div>
              </div>

              {/* ── 2. KART: TÜVTÜRK Muayene & Egzoz Emisyonu ── */}
              <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">
                          Muayene & Emisyon
                        </h3>
                        <p className="text-[11px] text-zinc-400">TÜVTÜRK Resmi Kayıtları</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMuayeneModalAcik(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      Güncelle
                    </button>
                  </div>

                  {/* Muayene Durumu Kutusu */}
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200">
                          TÜVTÜRK Periyodik Muayene
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {muayene.sonuc || "Kusursuz Geçti"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-[9px] uppercase font-semibold text-zinc-400 block">
                            GEÇERLİLİK TARİHİ
                          </span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {muayene.muayeneTarihi}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-semibold text-zinc-400 block">
                            KALAN SÜRE
                          </span>
                          <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {muayene.kalanGun} gün
                          </span>
                        </div>
                      </div>

                      <div className="pt-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 border-t border-indigo-100/80 dark:border-indigo-900/40 flex items-center justify-between">
                        <span>{muayene.istasyon || "TÜVTÜRK Maslak"}</span>
                        {muayene.muayeneUcreti ? (
                          <span className="font-bold font-mono text-indigo-900 dark:text-indigo-200">
                            {muayene.muayeneUcreti.toLocaleString("tr-TR")} ₺
                          </span>
                        ) : (
                          <span className="font-mono">{muayene.raporNo || "RAP-991840"}</span>
                        )}
                      </div>
                    </div>

                    {/* Egzoz Gazı Emisyon Kutusu */}
                    <div className="p-3.5 rounded-2xl bg-[#fafafa] dark:bg-zinc-850/60 border border-zinc-200/60 dark:border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-semibold text-xs">
                          <Wind className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Egzoz Gazı Emisyonu</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Geçerli
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                        <span>Son Geçerlilik:</span>
                        <span className="font-bold font-mono text-zinc-800 dark:text-zinc-200">
                          {muayene.egzozEmisyonTarihi || muayene.muayeneTarihi}
                        </span>
                      </div>
                    </div>

                    {muayene.belgeAdi && (
                      <div className="pt-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200/50 dark:border-indigo-800/40">
                          <FileText className="w-3 h-3" />
                          {muayene.belgeAdi}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <span>Yasal Uyumluluk</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Trafiğe Uygun</span>
                </div>
              </div>

              {/* ── 3. KART: Trafik Cezaları & Hukuki Durum ── */}
              <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">
                          Trafik Cezaları
                        </h3>
                        <p className="text-[11px] text-zinc-400">Tebliğ Edilen Kayıtlar</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCezaModalAcik(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ceza Ekle
                    </button>
                  </div>

                  {/* Ceza Listesi Tablosu */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-[10px] font-semibold text-zinc-400 uppercase border-b border-zinc-100 dark:border-zinc-800">
                          <th className="pb-2 font-semibold">TARİH</th>
                          <th className="pb-2 px-2 font-semibold">TÜR</th>
                          <th className="pb-2 text-right font-semibold">TUTAR</th>
                          <th className="pb-2 pl-1 w-5"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                        {cezalar.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-zinc-400 text-xs">
                              Kayıtlı ceza bulunmuyor.
                            </td>
                          </tr>
                        ) : (
                          cezalar.map((c) => (
                            <tr
                              key={c.id}
                              className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40 transition-colors group"
                            >
                              <td className="py-2.5 font-medium text-zinc-700 dark:text-zinc-300 text-[11px]">
                                {c.tarih}
                              </td>
                              <td className="py-2.5 px-2 font-semibold text-zinc-900 dark:text-zinc-100 text-[11px] truncate max-w-[90px]">
                                {c.cezaTuru}
                              </td>
                              <td className="py-2.5 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">
                                {c.tutar.toLocaleString("tr-TR")} ₺
                              </td>
                              <td className="py-2.5 pl-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleCezaSil(c.id)}
                                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 p-0.5 transition-opacity"
                                  title="Cezayı Sil"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Toplam Satırı */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t-2 border-zinc-100 dark:border-zinc-800">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      TOPLAM CEZA
                    </span>
                    <span className="font-mono font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                      {toplamCezaTutari.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <span>EGM / GİB Kaydı</span>
                  <span className="font-mono">0 Ceza Puanı</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ── TAB 3: YAKIT, SERVİS & TAMİR MASRAFLARI (15 SATIR SAYFALAMA) ── */}
        {/* ══════════════════════════════════════════════════════════ */}
        {aktifTab === "masraf" && (
          <div className="space-y-5 sm:space-y-6 animate-in fade-in-50 duration-300">
            {/* ── ÜST BAŞLIK & YIL SEÇİCİ & 4 MASRAF KPI KARTI ── */}
            <div className="space-y-4 pr-0 sm:pr-16 md:pr-20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Yakıt, Servis & Tamir Masrafları
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {arac.plaka} • Yıllık akaryakıt ekstresi, periyodik servis ve TÜVTÜRK masrafları
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    İnceleme Yılı:
                  </span>
                  <Select
                    value={String(secilenYil)}
                    onValueChange={(v) => {
                      if (v) {
                        setSecilenYil(Number(v));
                        setSayfaYakit(1);
                        setSayfaServis(1);
                      }
                    }}
                  >
                    <SelectTrigger className="w-28 h-8 rounded-xl text-xs font-bold font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026">2026 Yılı</SelectItem>
                      <SelectItem value="2025">2025 Yılı</SelectItem>
                      <SelectItem value="2024">2024 Yılı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 4 Finansal KPI Kartı */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
                {/* KPI 1: Toplam Yakıt Miktarı */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Fuel className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Toplam Yakıt
                    </h4>
                    <p className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                      {toplamYakitMiktar.toLocaleString("tr-TR", { minimumFractionDigits: 1 })} {arac.yakitTipi === "Elektrik" ? "kWh" : "LT"}
                    </p>
                  </div>
                </div>

                {/* KPI 2: Toplam Yakıt Masrafı */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Yakıt Harcaması
                    </h4>
                    <p className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {toplamYakitTutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </p>
                  </div>
                </div>

                {/* KPI 3: Toplam Servis/Tamir Masrafı (TÜVTÜRK Dahil) */}
                <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Servis & Muayene
                    </h4>
                    <p className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                      {(toplamServisTutar + muayeneMasrafi).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </p>
                  </div>
                </div>

                {/* KPI 4: Yıllık Genel Toplam Araç Gideri */}
                <div className="rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-zinc-900/10 flex items-center justify-center shrink-0">
                    <Coins className="w-5 h-5 text-amber-400 dark:text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-300 dark:text-zinc-600">
                      Yıllık Toplam Gider
                    </h4>
                    <p className="text-sm font-extrabold font-mono mt-0.5">
                      {yillikGenelToplamGider.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── İKİ ANA BLOK: YAKIT TABLOSU (SOL) & SERVİS / TAMİR TABLOSU (SAĞ) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 pt-2">
              {/* ── SOL BLOK (6 Kolon): Aylık Yakıt Tablosu (Maks 15 Satır + Sayfalama) ── */}
              <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-5 sm:p-7 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3 gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Fuel className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 leading-tight">
                          Aylık Akaryakıt / Enerji Dökümü
                        </h3>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          {secilenYil} Yılı Anlaşmalı Ekstre Girişleri
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setYakitPdfModalAcik(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
                        title="PDF Raporu Görüntüle & İndir"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        PDF Raporu
                      </button>
                      <button
                        type="button"
                        onClick={() => setYakitModalAcik(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Yakıt Ekle
                      </button>
                    </div>
                  </div>

                  {/* Yakıt Tablosu */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-[11px] font-semibold text-zinc-400 uppercase border-b border-zinc-100 dark:border-zinc-800">
                          <th className="pb-3 pr-2 font-semibold">AY</th>
                          <th className="pb-3 px-2 text-right font-semibold">MİKTAR</th>
                          <th className="pb-3 px-2 text-right font-semibold">BİRİM FİYAT</th>
                          <th className="pb-3 pl-2 text-right font-semibold">TUTAR</th>
                          <th className="pb-3 pl-1 w-6"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                        {yillikYakitlar.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-zinc-400 text-xs">
                              {secilenYil} yılına ait yakıt kaydı bulunmuyor.
                            </td>
                          </tr>
                        ) : (
                          sayfalamaYakitlar.map((y) => (
                            <tr
                              key={y.id}
                              className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40 transition-colors group"
                            >
                              <td className="py-2.5 pr-2 font-bold text-zinc-900 dark:text-zinc-100">
                                {y.ay}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                                {y.miktar} {arac.yakitTipi === "Elektrik" ? "kWh" : "LT"}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono text-zinc-500 dark:text-zinc-400">
                                {y.birimFiyat.toFixed(2)} ₺
                              </td>
                              <td className="py-2.5 pl-2 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                {y.toplamTutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                              </td>
                              <td className="py-2.5 pl-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleYakitSil(y.id)}
                                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 p-0.5 transition-opacity"
                                  title="Kaydı Sil"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 15 Satır Sayfalama Kontrolleri */}
                  {toplamSayfaYakit > 1 && (
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                      <span className="text-[11px] text-zinc-400">
                        Sayfa {sayfaYakit} / {toplamSayfaYakit} ({yillikYakitlar.length} Kayıt)
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={sayfaYakit <= 1}
                          onClick={() => setSayfaYakit((p) => Math.max(1, p - 1))}
                          className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={sayfaYakit >= toplamSayfaYakit}
                          onClick={() => setSayfaYakit((p) => Math.min(toplamSayfaYakit, p + 1))}
                          className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Yakıt Toplam Satırı */}
                  <div className="flex items-center justify-between pt-4 mt-2 border-t-2 border-zinc-100 dark:border-zinc-800">
                    <span className="font-bold text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      YILLIK YAKIT TOPLAMI
                    </span>
                    <span className="font-mono font-extrabold text-base text-amber-600 dark:text-amber-400">
                      {toplamYakitTutar.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <span>Toplam Kayıt: {yillikYakitlar.length} Ay</span>
                  <span>Ort. Tüketim: {(toplamYakitMiktar / Math.max(1, yillikYakitlar.length)).toFixed(1)} {arac.yakitTipi === "Elektrik" ? "kWh" : "LT"}/Ay</span>
                </div>
              </div>

              {/* ── SAĞ BLOK (6 Kolon): Servis, Tamir & Muayene Tablosu (Maks 15 Satır + Sayfalama) ── */}
              <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 p-5 sm:p-7 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3 gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 leading-tight">
                          Servis, Bakım & Muayene Masrafları
                        </h3>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          Satıra tıklayarak işlem detayını inceleyebilirsiniz
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setServisPdfModalAcik(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
                        title="Servis PDF Raporu Görüntüle & İndir"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        PDF Raporu
                      </button>
                      <button
                        type="button"
                        onClick={() => setServisModalAcik(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Servis Ekle
                      </button>
                    </div>
                  </div>

                  {/* Kompakt Satır Tablosu */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-[11px] font-semibold text-zinc-400 uppercase border-b border-zinc-100 dark:border-zinc-800">
                          <th className="pb-3 pr-2 font-semibold">TARİH & KM</th>
                          <th className="pb-3 px-2 font-semibold">SERVİS / AÇIKLAMA</th>
                          <th className="pb-3 pl-2 text-right font-semibold">TUTAR</th>
                          <th className="pb-3 pl-1 w-6"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                        {/* TÜVTÜRK Muayene Masrafı Satırı */}
                        {secilenYil === 2026 && muayene.muayeneUcreti && (
                          <tr className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors bg-indigo-50/15 dark:bg-indigo-950/10">
                            <td className="py-2.5 pr-2 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                              <div className="font-bold">{muayene.muayeneTarihi}</div>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">TÜVTÜRK</span>
                            </td>
                            <td className="py-2.5 px-2 text-zinc-700 dark:text-zinc-300">
                              <p className="truncate max-w-[220px] font-medium">TÜVTÜRK Muayene & Egzoz Emisyonu</p>
                              <span className="text-[10px] text-zinc-400">{muayene.istasyon || "TÜVTÜRK Maslak"} • {muayene.sonuc || "Kusursuz"}</span>
                            </td>
                            <td className="py-2.5 pl-2 text-right font-mono font-bold text-indigo-900 dark:text-indigo-200 whitespace-nowrap">
                              {muayene.muayeneUcreti.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                            </td>
                            <td className="py-2.5 pl-1 text-right">
                              <span className="text-[10px] text-indigo-400 font-semibold">Sabit</span>
                            </td>
                          </tr>
                        )}

                        {/* Servis & Tamir Satırları */}
                        {yillikServisler.length === 0 && (!muayene.muayeneUcreti || secilenYil !== 2026) ? (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-zinc-400 text-xs">
                              {secilenYil} yılına ait servis/tamir masraf kaydı bulunmuyor.
                            </td>
                          </tr>
                        ) : (
                          sayfalamaServisler.map((s) => (
                            <tr
                              key={s.id}
                              onClick={() => {
                                setSecilenServisDetay(s);
                                setServisDetayModalAcik(true);
                              }}
                              className="hover:bg-zinc-100/70 dark:hover:bg-zinc-850/60 transition-colors group cursor-pointer"
                              title="Detay fişini görüntülemek için tıklayın"
                            >
                              <td className="py-2.5 pr-2 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                                <div className="font-bold">{s.tarih}</div>
                                <span className="text-[10px] text-zinc-400 font-mono">{s.km.toLocaleString("tr-TR")} KM</span>
                              </td>
                              <td className="py-2.5 px-2 text-zinc-700 dark:text-zinc-300">
                                <p className="truncate max-w-[220px] font-medium">{s.aciklama}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                                  <span>{s.servisAdi}</span>
                                  {s.faturaDosyaAdi && (
                                    <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-medium">
                                      • <FileText className="w-2.5 h-2.5" /> Fatura
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 pl-2 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                                {s.tutar.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                              </td>
                              <td className="py-2.5 pl-1 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleServisSil(s.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 p-0.5 transition-opacity"
                                  title="Kaydı Sil"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* 15 Satır Sayfalama Kontrolleri */}
                  {toplamSayfaServis > 1 && (
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                      <span className="text-[11px] text-zinc-400">
                        Sayfa {sayfaServis} / {toplamSayfaServis} ({yillikServisler.length} Kayıt)
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={sayfaServis <= 1}
                          onClick={() => setSayfaServis((p) => Math.max(1, p - 1))}
                          className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={sayfaServis >= toplamSayfaServis}
                          onClick={() => setSayfaServis((p) => Math.min(toplamSayfaServis, p + 1))}
                          className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Servis & Muayene Toplam Satırı */}
                  <div className="flex items-center justify-between pt-4 mt-2 border-t-2 border-zinc-100 dark:border-zinc-800">
                    <span className="font-bold text-xs uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      YILLIK SERVİS & MUAYENE TOPLAMI
                    </span>
                    <span className="font-mono font-extrabold text-base text-blue-600 dark:text-blue-400">
                      {(toplamServisTutar + muayeneMasrafi).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <span>Toplam: {yillikServisler.length + (muayeneMasrafi > 0 ? 1 : 0)} İşlem</span>
                  <span>Son İşlem: {yillikServisler[0]?.tarih || muayene.muayeneTarihi}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Ruhsat Görüntüleme Modalı ── */}
      <RuhsatModal
        arac={arac}
        open={ruhsatModalAcik}
        onOpenChange={setRuhsatModalAcik}
      />

      {/* ── Sigorta & Kasko Poliçesi Ekleme Modalı ── */}
      <PoliceEkleModal
        open={policeModalAcik}
        onOpenChange={setPoliceModalAcik}
        aracId={arac.id}
        plaka={arac.plaka}
      />

      {/* ── Trafik Cezası Ekleme Modalı ── */}
      <CezaEkleModal
        open={cezaModalAcik}
        onOpenChange={setCezaModalAcik}
        aracId={arac.id}
        plaka={arac.plaka}
      />

      {/* ── TÜVTÜRK Muayene & Emisyon Güncelleme Modalı ── */}
      <MuayeneGuncelleModal
        open={muayeneModalAcik}
        onOpenChange={setMuayeneModalAcik}
        aracId={arac.id}
        plaka={arac.plaka}
        mevcutMuayene={muayene}
      />

      {/* ── Aylık Yakıt Girişi Modalı ── */}
      <YakitGirisModal
        open={yakitModalAcik}
        onOpenChange={setYakitModalAcik}
        aracId={arac.id}
        plaka={arac.plaka}
        varsayilanYil={secilenYil}
      />

      {/* ── Servis & Tamir Kaydı Ekleme Modalı ── */}
      <ServisKayitModal
        open={servisModalAcik}
        onOpenChange={setServisModalAcik}
        aracId={arac.id}
        plaka={arac.plaka}
        varsayilanYil={secilenYil}
      />

      {/* ── Servis Kaydı Tıklanınca Açılan Detay Modalı ── */}
      <ServisDetayModal
        open={servisDetayModalAcik}
        onOpenChange={setServisDetayModalAcik}
        servis={secilenServisDetay}
        plaka={arac.plaka}
      />

      {/* ── Akaryakıt Tüketim & Harcama PDF Rapor Modalı ── */}
      <YakitRaporPdfModal
        open={yakitPdfModalAcik}
        onOpenChange={setYakitPdfModalAcik}
        arac={arac}
        secilenYil={secilenYil}
        yakitKayitlari={yillikYakitlar}
      />

      {/* ── Servis, Bakım & Muayene PDF Rapor Modalı ── */}
      <ServisRaporPdfModal
        open={servisPdfModalAcik}
        onOpenChange={setServisPdfModalAcik}
        arac={arac}
        secilenYil={secilenYil}
        servisKayitlari={yillikServisler}
        muayene={muayene}
      />
    </div>
  );
}
