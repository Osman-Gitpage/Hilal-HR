"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DollarSign,
  TrendingUp,
  ArrowLeft,
  Check,
  Search,
  Calculator,
  Percent,
  Calendar,
  Users,
  Loader2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AYLAR = [
  { value: "1", label: "Ocak" },
  { value: "2", label: "Şubat" },
  { value: "3", label: "Mart" },
  { value: "4", label: "Nisan" },
  { value: "5", label: "Mayıs" },
  { value: "6", label: "Haziran" },
  { value: "7", label: "Temmuz" },
  { value: "8", label: "Ağustos" },
  { value: "9", label: "Eylül" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },
  { value: "12", label: "Aralık" },
];
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  usePersonelList,
  useInvalidatePersonelList,
  getAktifMaas,
  type PersonelListeItem,
} from "@/hooks/usePersonelList";
import { maasZammiYap, topluMaasZammiYap } from "@/app/actions/personel";
import { formatPara, formatAdSoyad } from "@/lib/utils/index";

export function MaasZamView() {
  const router = useRouter();
  const invalidate = useInvalidatePersonelList();
  const [isPending, startTransition] = useTransition();

  const { data: personelList = [], isLoading } = usePersonelList();

  // Sadece aktif çalışanlar
  const aktifPersoneller = useMemo(() => {
    return personelList.filter((p) =>
      p.employment_periods.some((ep) => ep.bitis_tarihi === null)
    );
  }, [personelList]);

  // Filtreler & Yürürlük Dönemi Kontrolleri (Ay & Yıl Seçimi)
  const [arama, setArama] = useState("");
  const simdi = useMemo(() => new Date(), []);
  const [seciliAy, setSeciliAy] = useState<string>(String(simdi.getMonth() + 1));
  const [seciliYil, setSeciliYil] = useState<string>(String(simdi.getFullYear()));

  const gecerlilikTarihi = `${seciliYil}-${seciliAy.padStart(2, "0")}-01`;

  // Her personel için yeni maaş tutarları haritası (personelId -> yeniMaasNet)
  const [yeniMaaslar, setYeniMaaslar] = useState<Record<string, number>>({});
  // Zam oranları haritası (personelId -> oran%)
  const [zamOranlari, setZamOranlari] = useState<Record<string, number>>({});

  // Seçili personel ID'leri
  const [seciliIds, setSeciliIds] = useState<string[]>([]);

  // Filtrelenmiş liste
  const filtrelenmisList = useMemo(() => {
    if (!arama.trim()) return aktifPersoneller;
    const q = arama.toLowerCase();
    return aktifPersoneller.filter(
      (p) =>
        p.ad.toLowerCase().includes(q) ||
        p.soyad.toLowerCase().includes(q) ||
        p.tc.includes(q) ||
        (p.gorev_unvan && p.gorev_unvan.toLowerCase().includes(q))
    );
  }, [aktifPersoneller, arama]);

  // Mevcut maaş bulucu
  function getMevcutMaas(p: PersonelListeItem): number {
    return getAktifMaas(p.maas_gecmisi) ?? 0;
  }

  // Yeni maaş bulucu (override varsa veya varsayılan mevcut)
  function getYeniMaas(p: PersonelListeItem): number {
    return yeniMaaslar[p.id] ?? getMevcutMaas(p);
  }

  // Tekil personel için oran değiştiginde
  function handleOranChange(p: PersonelListeItem, oranStr: string) {
    const oran = parseFloat(oranStr);
    const mevcut = getMevcutMaas(p);
    if (isNaN(oran) || oran < 0) {
      const copyZam = { ...zamOranlari };
      delete copyZam[p.id];
      setZamOranlari(copyZam);

      const copyMaas = { ...yeniMaaslar };
      delete copyMaas[p.id];
      setYeniMaaslar(copyMaas);
      return;
    }

    setZamOranlari((prev) => ({ ...prev, [p.id]: oran }));
    const yeni = Math.round(mevcut * (1 + oran / 100));
    setYeniMaaslar((prev) => ({ ...prev, [p.id]: yeni }));
  }

  // Tekil personel için doğrudan yeni maaş tutarı girildiğinde
  function handleTutarChange(p: PersonelListeItem, tutarStr: string) {
    const yeniTutar = parseFloat(tutarStr);
    const mevcut = getMevcutMaas(p);
    if (isNaN(yeniTutar) || yeniTutar <= 0) {
      const copy = { ...yeniMaaslar };
      delete copy[p.id];
      setYeniMaaslar(copy);

      const copyZam = { ...zamOranlari };
      delete copyZam[p.id];
      setZamOranlari(copyZam);
      return;
    }

    setYeniMaaslar((prev) => ({ ...prev, [p.id]: yeniTutar }));
    if (mevcut > 0) {
      const oran = Math.round(((yeniTutar - mevcut) / mevcut) * 100 * 10) / 10;
      setZamOranlari((prev) => ({ ...prev, [p.id]: oran }));
    }
  }

  // Toplu Oran Zammı Uygula (%)
  function applyGlobalPercent(percent: number) {
    const newMaaslar: Record<string, number> = {};
    const newOranlar: Record<string, number> = {};

    aktifPersoneller.forEach((p) => {
      const mevcut = getMevcutMaas(p);
      if (mevcut > 0) {
        const yeni = Math.round(mevcut * (1 + percent / 100));
        newMaaslar[p.id] = yeni;
        newOranlar[p.id] = percent;
      }
    });

    setYeniMaaslar(newMaaslar);
    setZamOranlari(newOranlar);
    toast.info(`Tüm personele %${percent} zam oranı uygulandı (Önizleme).`);
  }

  // Toplu Sabit Tutar Zammı Uygula (+₺)
  function applyGlobalAmount(amount: number) {
    const newMaaslar: Record<string, number> = {};
    const newOranlar: Record<string, number> = {};

    aktifPersoneller.forEach((p) => {
      const mevcut = getMevcutMaas(p);
      const yeni = mevcut + amount;
      newMaaslar[p.id] = yeni;
      if (mevcut > 0) {
        const oran = Math.round(((yeni - mevcut) / mevcut) * 100 * 10) / 10;
        newOranlar[p.id] = oran;
      }
    });

    setYeniMaaslar(newMaaslar);
    setZamOranlari(newOranlar);
    toast.info(`Tüm personele +${formatPara(amount)} zam tutarı eklendi (Önizleme).`);
  }

  // Sıfırla
  function handleReset() {
    setYeniMaaslar({});
    setZamOranlari({});
    setSeciliIds([]);
    toast.info("Zam değişiklikleri sıfırlandı.");
  }

  // Toplam Bütçe Hesapları
  const { mevcutToplam, yeniToplam, toplamFark, zamliKisiSayisi } = useMemo(() => {
    let mTop = 0;
    let yTop = 0;
    let count = 0;

    aktifPersoneller.forEach((p) => {
      const m = getMevcutMaas(p);
      const y = getYeniMaas(p);
      mTop += m;
      yTop += y;
      if (y > m) count++;
    });

    return {
      mevcutToplam: mTop,
      yeniToplam: yTop,
      toplamFark: yTop - mTop,
      zamliKisiSayisi: count,
    };
  }, [aktifPersoneller, yeniMaaslar]);

  // Tekli Zam Kaydet
  function handleTekliKaydet(p: PersonelListeItem) {
    const yeni = getYeniMaas(p);
    const mevcut = getMevcutMaas(p);

    if (yeni <= 0 || yeni === mevcut) {
      toast.error("Lütfen mevcut maaştan farklı ve geçerli bir tutar girin.");
      return;
    }

    startTransition(async () => {
      const res = await maasZammiYap(p.id, yeni, gecerlilikTarihi);
      if (res?.hata) {
        toast.error(res.hata);
        return;
      }
      toast.success(`${formatAdSoyad(p.ad, p.soyad)} için maaş güncellemesi kaydedildi!`);
      invalidate();
    });
  }

  // Toplu / Değişen Zamları Kaydet
  function handleTopluKaydet() {
    const degisenler = Object.entries(yeniMaaslar)
      .map(([id, yeniMaasNet]) => ({ personelId: id, yeniMaasNet }))
      .filter((item) => {
        const p = aktifPersoneller.find((x) => x.id === item.personelId);
        return p && item.yeniMaasNet > 0 && item.yeniMaasNet !== getMevcutMaas(p);
      });

    if (degisenler.length === 0) {
      toast.error("Kaydedilecek herhangi bir maaş değişikliği tespit edilmedi.");
      return;
    }

    startTransition(async () => {
      const res = await topluMaasZammiYap(degisenler, gecerlilikTarihi);
      if (res?.hata) {
        toast.error(res.hata);
        return;
      }
      toast.success(`${degisenler.length} personelin maaş zammı başarıyla uygulandı!`);
      invalidate();
      setYeniMaaslar({});
      setZamOranlari({});
    });
  }

  // Hepsini seç / kaldır
  function toggleTumunuSec() {
    if (seciliIds.length === filtrelenmisList.length) {
      setSeciliIds([]);
    } else {
      setSeciliIds(filtrelenmisList.map((p) => p.id));
    }
  }

  if (isLoading) {
    return (
      <div className="w-full bg-[#f8fafc] dark:bg-zinc-950 min-h-screen p-6 space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 py-6 px-4 sm:px-6 lg:px-8 font-sans space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Header Bar ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => router.push("/personel")}
              id="btn-geri-personel"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-sm shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1 sm:flex-initial">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                  Maaş Zam Yönetimi
                </h1>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] sm:text-[11px]">
                  Aktif: {aktifPersoneller.length}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate sm:whitespace-normal">
                Çalışanların maaşlarını oran (%) veya tutar (₺) üzerinden anında güncelleyin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isPending || Object.keys(yeniMaaslar).length === 0}
              className="h-9 px-3 rounded-xl text-xs font-medium cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Sıfırla
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleTopluKaydet}
              disabled={isPending || Object.keys(yeniMaaslar).length === 0}
              id="btn-zam-toplu-kaydet"
              className="h-9 px-4 sm:px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm cursor-pointer whitespace-nowrap"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-1.5" />
              )}
              Zamları Kaydet ({zamliKisiSayisi})
            </Button>
          </div>
        </div>

        {/* ── KPI Özet Kartları ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Mevcut Toplam Aylık Maaş
                </p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                  {formatPara(mevcutToplam)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                <DollarSign className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Yeni Toplam Aylık Maaş
                </p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {formatPara(yeniToplam)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Calculator className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 shadow-sm bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Toplam Aylık Ek Bütçe Yükü (Zam)
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatPara(toplamFark)}
                  </p>
                  {mevcutToplam > 0 && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      (%{((toplamFark / mevcutToplam) * 100).toFixed(1)})
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500 text-white shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Toplu Zam Kontrol Paneli ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Hızlı Toplu Zam Araçları
              </h2>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 shrink-0">
                  Yürürlük Dönemi (Ay/Yıl):
                </Label>
                <div className="flex items-center gap-1.5">
                  <Select value={seciliAy} onValueChange={(val) => val && setSeciliAy(val)}>
                    <SelectTrigger className="w-32 h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700 font-medium">
                      <SelectValue placeholder="Ay Seçin" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {AYLAR.map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={seciliYil} onValueChange={(val) => val && setSeciliYil(val)}>
                    <SelectTrigger className="w-24 h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700 font-medium">
                      <SelectValue placeholder="Yıl" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
              Toplu Yüzde (%):
            </span>
            {[10, 15, 20, 25, 30, 40, 50].map((pct) => (
              <Button
                key={pct}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyGlobalPercent(pct)}
                className="h-8 rounded-lg text-xs font-medium border-zinc-200 dark:border-zinc-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:border-emerald-300 transition-colors cursor-pointer"
              >
                +%{pct}
              </Button>
            ))}

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-2 hidden sm:block" />

            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
              Sabit Tutar (+₺):
            </span>
            {[2500, 5000, 7500, 10000].map((amt) => (
              <Button
                key={amt}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyGlobalAmount(amt)}
                className="h-8 rounded-lg text-xs font-medium border-zinc-200 dark:border-zinc-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 transition-colors cursor-pointer"
              >
                +{formatPara(amt)}
              </Button>
            ))}
          </div>
        </div>

        {/* ── Personel Zam Tablosu ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Tablo Arama Barı */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="Personel adı, unvan veya TC ara..."
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                className="rounded-xl h-9 text-xs pl-9 border-zinc-200 dark:border-zinc-700"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <p className="text-xs text-zinc-400">
              Görüntülenen: <strong>{filtrelenmisList.length}</strong> çalışan
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader className="bg-zinc-50/70 dark:bg-zinc-800/40">
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead className="font-semibold text-xs">Personel</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Eski Maaş (Mevcut Net)</TableHead>
                  <TableHead className="font-semibold text-xs text-center w-32">Zam Oranı (%)</TableHead>
                  <TableHead className="font-semibold text-xs text-right w-44">Yeni Maaş (Net ₺)</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Artış Miktarı</TableHead>
                  <TableHead className="w-28 text-center font-semibold text-xs">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrelenmisList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-zinc-400 text-sm">
                      Kayıtlı aktif personel bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrelenmisList.map((p, idx) => {
                    const mevcut = getMevcutMaas(p);
                    const yeni = getYeniMaas(p);
                    const fark = yeni - mevcut;
                    const oran = zamOranlari[p.id] ?? (mevcut > 0 ? ((fark) / mevcut) * 100 : 0);
                    const degisti = yeni !== mevcut && yeni > 0;

                    return (
                      <TableRow
                        key={p.id}
                        className={
                          degisti
                            ? "bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors"
                            : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                        }
                      >
                        <TableCell className="text-center text-xs text-zinc-400 font-mono">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
                              {formatAdSoyad(p.ad, p.soyad)}
                            </p>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              {p.gorev_unvan || "Unvan Belirtilmedi"} · TC: {p.tc}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm text-zinc-600 dark:text-zinc-300">
                          {formatPara(mevcut)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="relative inline-block w-24">
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="0"
                              value={zamOranlari[p.id] ?? (degisti ? oran.toFixed(1) : "")}
                              onChange={(e) => handleOranChange(p, e.target.value)}
                              className="rounded-lg h-8 text-xs text-center pr-6 font-semibold border-zinc-200 dark:border-zinc-700"
                            />
                            <span className="absolute right-2 top-2 text-[11px] text-zinc-400 font-bold pointer-events-none">
                              %
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="relative inline-block w-36">
                            <Input
                              type="number"
                              step="100"
                              value={yeniMaaslar[p.id] ?? (degisti ? yeni : "")}
                              placeholder={mevcut.toString()}
                              onChange={(e) => handleTutarChange(p, e.target.value)}
                              className={`rounded-lg h-8 text-xs text-right pr-3 font-bold border-zinc-200 dark:border-zinc-700 ${
                                degisti
                                  ? "text-emerald-600 dark:text-emerald-400 border-emerald-400 focus-visible:ring-emerald-500"
                                  : ""
                              }`}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {degisti ? (
                            <div>
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                                +{formatPara(fark)}
                              </span>
                              <span className="text-[10px] text-emerald-600/80 font-medium">
                                (%{oran.toFixed(1)} artış)
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-300 dark:text-zinc-600">–</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            size="sm"
                            variant={degisti ? "default" : "ghost"}
                            disabled={!degisti || isPending}
                            onClick={() => handleTekliKaydet(p)}
                            className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              degisti
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                : "text-zinc-400 hover:text-zinc-600"
                            }`}
                          >
                            {isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1" /> Kaydet
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
