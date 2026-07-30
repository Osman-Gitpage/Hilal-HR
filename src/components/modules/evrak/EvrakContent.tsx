"use client";

// ─── Evrak Ana Liste (Sade & Kurumsal - Apple/Stripe Style + Tam Evrak İşlemleri) ─────────
// Önizleme, İndirme, Değiştirme (Versiyon Yükleme) ve Silme İşlemleri Entegreli

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEvrakOzeti, useSuresiYaklasanlar, useEvrakMutations } from "@/hooks/useEvrak";
import { storageGetDownloadUrl } from "@/app/actions/storage";
import { gecerlilikDurumuHesapla, kalanGun, kalanGunEtiketi } from "@/lib/utils/evrak-utils";
import type { EvrakKategori, EvrakGecerlilikDurumu, EvrakListeFiltre } from "@/types/evrak";
import { EvrakYukleDialog } from "@/components/modules/evrak/EvrakYukleDialog";
import { DosyaGoruntule } from "@/components/ui/DosyaGoruntule";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  LayoutGrid,
  LayoutList,
  GitCompare,
  FileText,
  Clock,
  Building2,
  FileStack,
  Plus,
  ArrowUpRight,
  Check,
  AlertCircle,
  XCircle,
  Minus,
  Eye,
  Download,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export function EvrakContent() {
  const { data: ozet, isLoading } = useEvrakOzeti();
  const { data: yaklasanlar } = useSuresiYaklasanlar();
  const { sil: evrakSilMutation } = useEvrakMutations();

  const [filtre, setFiltre] = useState<EvrakListeFiltre>({});
  const [gorunum, setGorunum] = useState<"liste" | "grid">("liste");
  const [seciliPersoneller, setSeciliPersoneller] = useState<string[]>([]);
  const [karsilastirmaAcik, setKarsilastirmaAcik] = useState(false);

  // Evrak Yükleme Dialog State
  const [yukleDialogAcik, setYukleDialogAcik] = useState(false);
  const [seciliPersonelId, setSeciliPersonelId] = useState<string | undefined>(undefined);
  const [seciliKategoriObj, setSeciliKategoriObj] = useState<EvrakKategori | null>(null);

  // Dosya Önizleme State
  const [onizlemeUrl, setOnizlemeUrl] = useState<string | null>(null);
  const [onizlemeDosyaAdi, setOnizlemeDosyaAdi] = useState<string>("");

  // Evrak Silme Dialog State
  const [silinecekEvrakId, setSilinecekEvrakId] = useState<string | null>(null);

  // Hesaplanmış matris
  const matris = useMemo(() => {
    if (!ozet) return [];
    return hesaplaMatris(ozet, filtre);
  }, [ozet, filtre]);

  const kpiVerisi = useMemo(() => {
    if (!matris.length || !ozet?.kategoriler?.length) return { eksik: 0, yaklasan: 0, tamam: 0, toplam: 0 };
    let eksik = 0, yaklasan = 0, tamam = 0;
    matris.forEach((satir) => {
      satir.durumlar.forEach((d) => {
        if (d === "eksik" || d === "gecersiz") eksik++;
        else if (d === "yaklasan") yaklasan++;
        else tamam++;
      });
    });
    return { eksik, yaklasan, tamam, toplam: matris.length };
  }, [matris, ozet?.kategoriler]);

  const handlePersonelSec = (id: string) => {
    setSeciliPersoneller((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  // 1. Evrak Önizle
  const handleOnizle = async (objectKey: string) => {
    try {
      const res = await storageGetDownloadUrl({ objectKey });
      if (res.success) {
        const dosyaAdi = objectKey.split("/").pop() || "Evrak";
        setOnizlemeDosyaAdi(dosyaAdi);
        setOnizlemeUrl(res.url);
      } else {
        toast.error(res.error || "Önizleme bağlantısı oluşturulamadı.");
      }
    } catch {
      toast.error("Önizleme hatası oluştu.");
    }
  };

  // 2. Evrak İndir
  const handleIndir = async (objectKey: string) => {
    try {
      const res = await storageGetDownloadUrl({ objectKey });
      if (res.success) {
        const a = document.createElement("a");
        a.href = res.url;
        a.download = objectKey.split("/").pop() || "evrak";
        a.click();
        toast.success("İndirme başlatıldı.");
      } else {
        toast.error("Dosya indirme bağlantısı alınamadı.");
      }
    } catch {
      toast.error("İndirme hatası oluştu.");
    }
  };

  // 3. Evrak Değiştir / Yenisini Yükle
  const handleDegistir = (personelId?: string, kategori?: EvrakKategori) => {
    setSeciliPersonelId(personelId);
    setSeciliKategoriObj(kategori ?? null);
    setYukleDialogAcik(true);
  };

  // 4. Evrak Sil
  const handleSilOnayla = async () => {
    if (!silinecekEvrakId) return;
    const res = await evrakSilMutation.mutateAsync(silinecekEvrakId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (res && (res as any).error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((res as any).error);
    } else {
      toast.success("Evrak silindi.");
      setSilinecekEvrakId(null);
    }
  };

  if (isLoading) return <EvrakSkeleton />;

  const kategoriler = (ozet?.kategoriler ?? []) as EvrakKategori[];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* ── 1. Header (Apple Style Clean Typography) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Evrak Yönetimi
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Personellerin özlük evrakları, geçerlilik süreleri ve uyumluluk matrisi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/evrak/sirket">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs font-medium rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 gap-1.5 transition-colors cursor-pointer"
            >
              <Building2 className="h-3.5 w-3.5 text-zinc-500" />
              Şirket Evrakları
            </Button>
          </Link>
          <Link href="/evrak/tersane">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs font-medium rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 gap-1.5 transition-colors cursor-pointer"
            >
              <FileStack className="h-3.5 w-3.5 text-zinc-500" />
              Tersane Şablonları
            </Button>
          </Link>

          {seciliPersoneller.length >= 2 && (
            <Button
              onClick={() => setKarsilastirmaAcik(true)}
              variant="outline"
              size="sm"
              className="h-9 text-xs font-medium rounded-lg border-purple-200 text-[#7c3aed] bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 gap-1.5 transition-colors cursor-pointer"
            >
              <GitCompare className="h-3.5 w-3.5" />
              Karşılaştır ({seciliPersoneller.length})
            </Button>
          )}

          <Button
            onClick={() => handleDegistir()}
            size="sm"
            className="h-9 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 gap-1.5 transition-colors cursor-pointer px-4 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Evrak Yükle
          </Button>
        </div>
      </div>

      {/* ── 2. Metric Strip (Stripe Style Minimal Stats) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-1">
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Aktif Personel
          </span>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {kpiVerisi.toplam} Personel
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-1">
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Geçerli Belgeler
          </span>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {kpiVerisi.tamam} Kayıt
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-1">
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            Süresi Yaklaşan
          </span>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {yaklasanlar?.length ?? kpiVerisi.yaklasan} Evrak
          </p>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-1">
          <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
            Eksik / Süresi Geçmiş
          </span>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {kpiVerisi.eksik} Evrak
          </p>
        </div>
      </div>

      {/* ── 3. Filter Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <Input
              placeholder="Personel adıyla hızlı ara..."
              className="pl-8 h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-400"
              value={filtre.arama ?? ""}
              onChange={(e) => setFiltre((f) => ({ ...f, arama: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Switch
              id="eksik-filtre"
              checked={filtre.sadece_eksik ?? false}
              onCheckedChange={(v) => setFiltre((f) => ({ ...f, sadece_eksik: v }))}
            />
            <Label htmlFor="eksik-filtre" className="text-xs font-normal text-zinc-600 dark:text-zinc-300 cursor-pointer">
              Sadece eksikler
            </Label>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Switch
              id="yaklasan-filtre"
              checked={filtre.sadece_yaklasan ?? false}
              onCheckedChange={(v) => setFiltre((f) => ({ ...f, sadece_yaklasan: v }))}
            />
            <Label htmlFor="yaklasan-filtre" className="text-xs font-normal text-zinc-600 dark:text-zinc-300 cursor-pointer">
              Süresi yaklaşanlar
            </Label>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 rounded-lg">
          <button
            onClick={() => setGorunum("liste")}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              gorunum === "liste"
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" />
            <span>Matris</span>
          </button>
          <button
            onClick={() => setGorunum("grid")}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              gorunum === "grid"
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Kartlar</span>
          </button>
        </div>
      </div>

      {/* ── 4. Main Matrix Table ── */}
      {matris.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
          <FileText className="h-10 w-10 mx-auto text-zinc-300 dark:text-zinc-700" />
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Filtrelere uygun personel kaydı bulunamadı.
          </p>
        </div>
      ) : gorunum === "liste" ? (
        <MatrisTablo
          matris={matris}
          kategoriler={kategoriler}
          seciliPersoneller={seciliPersoneller}
          onPersonelSec={handlePersonelSec}
          onOnizle={handleOnizle}
          onIndir={handleIndir}
          onDegistir={handleDegistir}
          onSilModalAc={setSilinecekEvrakId}
        />
      ) : (
        <GridGorunum
          matris={matris}
          kategoriler={kategoriler}
          onOnizle={handleOnizle}
          onIndir={handleIndir}
          onDegistir={handleDegistir}
          onSilModalAc={setSilinecekEvrakId}
        />
      )}

      {/* Karşılaştırma Dialog */}
      <KarsilastirmaDialog
        acik={karsilastirmaAcik}
        onKapat={() => {
          setKarsilastirmaAcik(false);
          setSeciliPersoneller([]);
        }}
        matris={matris}
        kategoriler={kategoriler}
        seciliIdler={seciliPersoneller}
      />

      {/* Evrak Yükle Dialog */}
      <EvrakYukleDialog
        acik={yukleDialogAcik}
        onKapat={() => {
          setYukleDialogAcik(false);
          setSeciliPersonelId(undefined);
          setSeciliKategoriObj(null);
        }}
        personelId={seciliPersonelId}
        kategori={seciliKategoriObj}
      />

      {/* Dosya Görüntüle Modal */}
      <DosyaGoruntule
        url={onizlemeUrl}
        dosyaAdi={onizlemeDosyaAdi}
        onKapat={() => setOnizlemeUrl(null)}
      />

      {/* Evrak Silme Onay Modal */}
      <AlertDialog open={!!silinecekEvrakId} onOpenChange={(open) => !open && setSilinecekEvrakId(null)}>
        <AlertDialogContent className="sm:max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Evrağı Sil?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-400 mt-1">
              Bu evrak veritabanından ve bulut depolamadan kalıcı olarak silinecektir. Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700 cursor-pointer">
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSilOnayla}
              className="h-9 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
            >
              Kalıcı Olarak Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─────────────────────────────────────────────
// MATRİS HESAPLAMA
// ─────────────────────────────────────────────
interface EvrakDetayPill {
  durum: EvrakGecerlilikDurumu;
  bitisTarihi: string | null;
  dosyaUrl: string | null;
  evrakId: string | null;
}

interface MatrisSatir {
  personelId: string;
  ad: string;
  soyad: string;
  durumlar: EvrakGecerlilikDurumu[];
  detaylar: EvrakDetayPill[];
  eksikSayisi: number;
  yaklasanSayisi: number;
}

function hesaplaMatris(
  ozet: NonNullable<ReturnType<typeof useEvrakOzeti>["data"]>,
  filtre: EvrakListeFiltre
): MatrisSatir[] {
  const { kategoriler, personeller, evraklar } = ozet;
  const typedKategoriler = kategoriler as unknown as EvrakKategori[];

  let sonuc: MatrisSatir[] = personeller.map((p) => {
    const detaylar: EvrakDetayPill[] = [];
    const durumlar = typedKategoriler.map((kat) => {
      const isTetenozKat =
        kat.id === "kat-tetenoz" ||
        kat.ad.toLowerCase().includes("tetenoz") ||
        kat.ad.toLowerCase().includes("aşı");

      const personelEvraklari = evraklar.filter(
        (e) =>
          e.personel_id === p.id &&
          (e.kategori_id === kat.id ||
            (isTetenozKat &&
              (e.dosya_adi?.includes("Sağlık Raporu") ||
                e.dosya_adi?.includes("[Sağlık") ||
                e.dosya_adi?.includes("saglik"))))
      );
      const evrak = personelEvraklari.length > 0 ? personelEvraklari[0] : null;

      const d = gecerlilikDurumuHesapla(
        evrak
          ? {
              id: evrak.id,
              sirket_id: "",
              kategori_id: evrak.kategori_id,
              personel_id: evrak.personel_id,
              employment_period_id: null,
              dosya_url: evrak.dosya_url,
              dosya_adi: "",
              dosya_boyut: null,
              dosya_tipi: null,
              versiyon: evrak.versiyon,
              baslangic_tarihi: null,
              bitis_tarihi: evrak.bitis_tarihi,
              durum: "aktif",
              onay_durumu: "beklemede",
              yuklenme_tarihi: "",
              created_at: "",
              updated_at: "",
            }
          : null,
        kat
      );

      detaylar.push({
        durum: d,
        bitisTarihi: evrak?.bitis_tarihi ?? null,
        dosyaUrl: evrak?.dosya_url ?? null,
        evrakId: evrak?.id ?? null,
      });

      return d;
    });

    return {
      personelId: p.id,
      ad: p.ad,
      soyad: p.soyad,
      durumlar,
      detaylar,
      eksikSayisi: durumlar.filter((d) => d === "eksik" || d === "gecersiz").length,
      yaklasanSayisi: durumlar.filter((d) => d === "yaklasan").length,
    };
  });

  if (filtre.arama) {
    const q = filtre.arama.toLowerCase();
    sonuc = sonuc.filter(
      (s) =>
        s.ad.toLowerCase().includes(q) || s.soyad.toLowerCase().includes(q)
    );
  }
  if (filtre.sadece_eksik) {
    sonuc = sonuc.filter((s) => s.eksikSayisi > 0);
  }
  if (filtre.sadece_yaklasan) {
    sonuc = sonuc.filter((s) => s.yaklasanSayisi > 0);
  }

  return sonuc;
}

// ─────────────────────────────────────────────
// MATRİS TABLOSU (Apple/Stripe Style)
// ─────────────────────────────────────────────
function MatrisTablo({
  matris,
  kategoriler,
  seciliPersoneller,
  onPersonelSec,
  onOnizle,
  onIndir,
  onDegistir,
  onSilModalAc,
}: {
  matris: MatrisSatir[];
  kategoriler: EvrakKategori[];
  seciliPersoneller: string[];
  onPersonelSec: (id: string) => void;
  onOnizle: (dosyaUrl: string) => void;
  onIndir: (dosyaUrl: string) => void;
  onDegistir: (personelId?: string, kategori?: EvrakKategori) => void;
  onSilModalAc: (evrakId: string) => void;
}) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 text-zinc-500 font-medium">
              <th className="p-3 w-8 text-center">
                {/* Select Checkbox */}
              </th>
              <th className="p-3 sticky left-0 z-20 bg-zinc-50 dark:bg-zinc-800/90 font-semibold text-zinc-800 dark:text-zinc-200 min-w-[200px] border-r border-zinc-200 dark:border-zinc-800">
                Personel
              </th>

              {kategoriler.map((kat) => (
                <th
                  key={kat.id}
                  className="p-3 text-center min-w-[125px] border-r border-zinc-100 dark:border-zinc-800/50 last:border-r-0"
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[115px]">
                      {kat.ad}
                    </span>
                    {kat.zorunlu ? (
                      <span className="text-[9.5px] text-rose-600 dark:text-rose-400 font-medium">
                        Zorunlu
                      </span>
                    ) : (
                      <span className="text-[9.5px] text-zinc-400">İsteğe Bağlı</span>
                    )}
                  </div>
                </th>
              ))}

              <th className="p-3 text-center min-w-[110px] font-semibold text-zinc-800 dark:text-zinc-200">
                Durum Özet
              </th>
              <th className="p-3 text-center w-14">
                Detay
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
            {matris.map((satir) => {
              const secili = seciliPersoneller.includes(satir.personelId);
              return (
                <tr
                  key={satir.personelId}
                  className={`group transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 ${
                    secili ? "bg-purple-50/30 dark:bg-purple-950/20" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={secili}
                      onChange={() => onPersonelSec(satir.personelId)}
                      className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-[#7c3aed] focus:ring-0 cursor-pointer"
                      disabled={!secili && seciliPersoneller.length >= 3}
                    />
                  </td>

                  {/* Sticky Personel Column */}
                  <td
                    className="p-3 font-medium text-zinc-900 dark:text-zinc-100 sticky left-0 z-10 bg-white dark:bg-zinc-900 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800/80 border-r border-zinc-200 dark:border-zinc-800 cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(`/personel/${satir.personelId}?tab=evraklar`)
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold flex items-center justify-center text-[10.5px] shrink-0 border border-zinc-200 dark:border-zinc-700">
                        {satir.ad[0]}{satir.soyad[0]}
                      </div>
                      <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#7c3aed] transition-colors">
                        {satir.ad} {satir.soyad}
                      </span>
                    </div>
                  </td>

                  {/* Kategori Durum Hücreleri */}
                  {satir.detaylar.map((detay, i) => (
                    <KurumsalDurumHucre
                      key={kategoriler[i]?.id ?? i}
                      personelId={satir.personelId}
                      detay={detay}
                      kategori={kategoriler[i]}
                      onOnizle={onOnizle}
                      onIndir={onIndir}
                      onDegistir={onDegistir}
                      onSilModalAc={onSilModalAc}
                    />
                  ))}

                  {/* Durum Özet */}
                  <td className="p-3 text-center">
                    {satir.eksikSayisi > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 font-medium text-[10.5px] border border-rose-200/60 dark:border-rose-900/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {satir.eksikSayisi} Eksik
                      </span>
                    ) : satir.yaklasanSayisi > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-medium text-[10.5px] border border-amber-200/60 dark:border-amber-900/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {satir.yaklasanSayisi} Yaklaşan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium text-[10.5px] border border-emerald-200/60 dark:border-emerald-900/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Tamam
                      </span>
                    )}
                  </td>

                  {/* Action Link */}
                  <td className="p-3 text-center">
                    <button
                      onClick={() => router.push(`/personel/${satir.personelId}?tab=evraklar`)}
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      title="Evrak Detayına Git"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// KURUMSAL DURUM HÜCRESİ (Full Action Dropdown Menu)
// ─────────────────────────────────────────────
function KurumsalDurumHucre({
  personelId,
  detay,
  kategori,
  onOnizle,
  onIndir,
  onDegistir,
  onSilModalAc,
}: {
  personelId: string;
  detay: EvrakDetayPill;
  kategori: EvrakKategori;
  onOnizle: (dosyaUrl: string) => void;
  onIndir: (dosyaUrl: string) => void;
  onDegistir: (personelId?: string, kategori?: EvrakKategori) => void;
  onSilModalAc: (evrakId: string) => void;
}) {
  const { durum, bitisTarihi, dosyaUrl, evrakId } = detay;
  const gunKalan = kalanGun(bitisTarihi);

  // Eğer dosya yüklüyse DropdownMenu ile Önizle, İndir, Değiştir, Sil seçeneklerini sun
  if (dosyaUrl && evrakId) {
    return (
      <td className="p-2.5 text-center border-r border-zinc-100 dark:border-zinc-800/50">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-[11px] transition-all cursor-pointer shadow-2xs hover:scale-105 ${
              durum === "gecerli"
                ? "bg-emerald-50/70 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40"
                : durum === "yaklasan"
                ? "bg-amber-50/80 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/50"
                : "bg-rose-50/80 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/50"
            }`}
          >
              {durum === "gecerli" ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Tamam</span>
                </>
              ) : durum === "yaklasan" ? (
                <>
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span>{gunKalan} Gün</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-rose-600" />
                  <span>Doldu</span>
                </>
              )}
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1 z-50">
            <div className="px-2.5 py-1.5 text-[10.5px] font-semibold text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 truncate">
              {kategori.ad}
            </div>

            {/* 1. Görüntüle / Önizle */}
            <DropdownMenuItem
              onClick={() => onOnizle(dosyaUrl)}
              className="text-xs py-2 px-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-2 text-zinc-700 dark:text-zinc-200"
            >
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>Görüntüle / Önizle</span>
            </DropdownMenuItem>

            {/* 2. İndir */}
            <DropdownMenuItem
              onClick={() => onIndir(dosyaUrl)}
              className="text-xs py-2 px-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-2 text-zinc-700 dark:text-zinc-200"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Dosyayı İndir</span>
            </DropdownMenuItem>

            {/* 3. Değiştir / Yenisini Yükle */}
            <DropdownMenuItem
              onClick={() => onDegistir(personelId, kategori)}
              className="text-xs py-2 px-2.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer flex items-center gap-2 text-[#7c3aed]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Değiştir / Yenile</span>
            </DropdownMenuItem>

            {/* 4. Sil */}
            <DropdownMenuItem
              onClick={() => onSilModalAc(evrakId)}
              className="text-xs py-2 px-2.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer flex items-center gap-2 text-rose-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Evrağı Sil</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    );
  }

  // Eksik Evrak (Tıklandığında Yükle)
  return (
    <td className="p-2.5 text-center border-r border-zinc-100 dark:border-zinc-800/50">
      <button
        onClick={() => onDegistir(personelId, kategori)}
        className="inline-flex items-center justify-center px-2 py-0.5 rounded text-zinc-400 hover:text-[#7c3aed] hover:bg-purple-50 dark:hover:bg-purple-950/40 text-[11px] font-normal transition-colors cursor-pointer gap-1"
        title={`${kategori.ad} yükle`}
      >
        <Minus className="w-3 h-3 text-zinc-300" />
        <span>Eksik</span>
      </button>
    </td>
  );
}

// ─────────────────────────────────────────────
// GRID GÖRÜNÜM BİLEŞENİ
// ─────────────────────────────────────────────
function GridGorunum({
  matris,
  kategoriler,
  onOnizle,
  onIndir,
  onDegistir,
  onSilModalAc,
}: {
  matris: MatrisSatir[];
  kategoriler: EvrakKategori[];
  onOnizle: (dosyaUrl: string) => void;
  onIndir: (dosyaUrl: string) => void;
  onDegistir: (personelId?: string, kategori?: EvrakKategori) => void;
  onSilModalAc: (evrakId: string) => void;
}) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {matris.map((satir) => (
        <div
          key={satir.personelId}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => router.push(`/personel/${satir.personelId}?tab=evraklar`)}
            >
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold flex items-center justify-center text-xs border border-zinc-200 dark:border-zinc-700">
                {satir.ad[0]}{satir.soyad[0]}
              </div>
              <div>
                <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                  {satir.ad} {satir.soyad}
                </h4>
                <span className="text-[10px] text-zinc-400">Personel Evrakları</span>
              </div>
            </div>

            {satir.eksikSayisi > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10.5px] font-medium border border-rose-200/60">
                {satir.eksikSayisi} Eksik
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10.5px] font-medium border border-emerald-200/60">
                Tamam
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {satir.detaylar.map((detay, i) => {
              const d = detay.durum;
              const kat = kategoriler[i];
              return (
                <TooltipProvider key={kat?.id ?? i} delay={150}>
                  <Tooltip>
                    <TooltipTrigger
                      onClick={() => {
                        if (detay.dosyaUrl) {
                          onOnizle(detay.dosyaUrl);
                        } else {
                          onDegistir(satir.personelId, kat);
                        }
                      }}
                      className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-semibold transition-colors cursor-pointer ${
                        d === "gecerli"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : d === "yaklasan"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          : d === "gecersiz"
                          ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                          : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                      }`}
                    >
                      {d === "gecerli" ? "✓" : d === "yaklasan" ? "!" : d === "gecersiz" ? "✕" : "—"}
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs p-2 rounded-lg">
                      <p className="font-semibold">{kat?.ad}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// KARŞILAŞTIRMA DİALOG
// ─────────────────────────────────────────────
function KarsilastirmaDialog({
  acik,
  onKapat,
  matris,
  kategoriler,
  seciliIdler,
}: {
  acik: boolean;
  onKapat: () => void;
  matris: MatrisSatir[];
  kategoriler: EvrakKategori[];
  seciliIdler: string[];
}) {
  const seciliPersoneller = matris.filter((s) =>
    seciliIdler.includes(s.personelId)
  );

  return (
    <Dialog open={acik} onOpenChange={(open) => !open && onKapat()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <DialogTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-zinc-500" />
            Personel Evrak Karşılaştırması
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b bg-zinc-50 dark:bg-zinc-800/50 font-semibold text-zinc-600 dark:text-zinc-300">
                  <th className="p-3 min-w-[140px]">Evrak Kategori</th>
                  {seciliPersoneller.map((p) => (
                    <th key={p.personelId} className="p-3 text-center min-w-[120px]">
                      {p.ad} {p.soyad}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {kategoriler.map((kat, i) => (
                  <tr key={kat.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="p-3 font-medium text-zinc-800 dark:text-zinc-200">
                      <span>{kat.ad}</span>
                      {kat.zorunlu && (
                        <span className="ml-1.5 text-[9.5px] text-rose-600 font-medium">Zorunlu</span>
                      )}
                    </td>
                    {seciliPersoneller.map((p) => {
                      const durum = p.durumlar[i];
                      return (
                        <td key={p.personelId} className="p-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-medium ${
                              durum === "gecerli"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : durum === "yaklasan"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                : durum === "gecersiz"
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                            }`}
                          >
                            {durum === "gecerli"
                              ? "✓ Tamam"
                              : durum === "yaklasan"
                              ? "⚠️ Yaklaşıyor"
                              : durum === "gecersiz"
                              ? "❌ Doldu"
                              : "— Eksik"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────
function EvrakSkeleton() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
