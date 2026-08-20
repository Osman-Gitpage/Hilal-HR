"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSirketStore } from "@/stores/sirketStore";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  CalendarCheck,
  Clock,
  AlertCircle,
  FileText,
  User,
  Briefcase,
  Building2,
  History,
  DollarSign,
  ClipboardList,
  ChevronDown,
  Pencil,
  LogOut,
  UserPlus,
  Loader2,
  Filter,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Download,
  MoreHorizontal,
  Check,
  Info,
  Search,
  LayoutGrid,
  List,
  Trash2,
  RefreshCw,
  ShieldCheck,
  FileX,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePersonelDetay,
  useEmploymentPeriods,
  useMaasGecmisi,
} from "@/hooks/usePersonelDetay";
import { usePersonelList } from "@/hooks/usePersonelList";
import {
  useEvrakKategorileri,
  usePersonelEvraklar,
  useEvrakMutations,
} from "@/hooks/useEvrak";
import { storageGetDownloadUrl } from "@/app/actions/storage";
import { gecerlilikDurumuHesapla, kalanGunEtiketi } from "@/lib/utils/evrak-utils";
import type { EvrakKategori } from "@/types/evrak";
import { EvrakYukleDialog } from "@/components/modules/evrak/EvrakYukleDialog";
import { DosyaGoruntule } from "@/components/ui/DosyaGoruntule";
import { personelCikisYap, personelYenidenIseAl } from "@/app/actions/personel";
import { formatTarih, formatPara, formatAdSoyad, maskTc } from "@/lib/utils/index";
import { QUERY_KEYS } from "@/lib/constants";
import {
  PersonelEvrakFormDialog,
  type SablonTipi,
} from "@/components/modules/personel/PersonelEvrakFormDialog";
import { PersonelPuantajTab } from "@/components/modules/personel/PersonelPuantajTab";

// ─────────────────────────────────────────────
// Dialog: Yeniden İşe Al
// ─────────────────────────────────────────────
function YenidenIseAlDialog({
  personelId,
  acik,
  onKapat,
}: {
  personelId: string;
  acik: boolean;
  onKapat: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const tarih = fd.get("baslama_tarihi") as string;
    const maasStr = fd.get("yeni_maas") as string;
    const yeniMaas = maasStr ? Number(maasStr) : undefined;

    startTransition(async () => {
      const sonuc = await personelYenidenIseAl(personelId, tarih, yeniMaas);
      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PERSONEL(personelId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYMENT_PERIODS(personelId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MAAS_GECMISI(personelId) });
      if (sirketId) {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PERSONEL_LIST(sirketId) });
      }
      toast.success("Personel yeniden işe alındı.");
      onKapat();
      router.refresh();
    });
  }

  return (
    <Dialog open={acik} onOpenChange={onKapat}>
      <DialogContent className="sm:max-w-sm" id="dialog-yeniden-ise-al">
        <DialogHeader>
          <DialogTitle>Yeniden İşe Al</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="baslama-tarih">Başlama Tarihi *</Label>
            <Input
              id="baslama-tarih"
              name="baslama_tarihi"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="yeni-maas">Yeni Maaş Net (₺)</Label>
            <Input
              id="yeni-maas"
              name="yeni_maas"
              type="number"
              min="0"
              step="0.01"
              placeholder="Boş bırakılırsa mevcut maaş korunur"
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onKapat} disabled={isPending}>
              İptal
            </Button>
            <Button type="submit" disabled={isPending} id="btn-yeniden-ise-al-onayla">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              İşe Al
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Dialog: İşten Çıkar
// ─────────────────────────────────────────────
function IstenCikarDialog({
  personelId,
  acik,
  onKapat,
}: {
  personelId: string;
  acik: boolean;
  onKapat: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sirketId = useSirketStore((s) => s.aktifSirketId);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const tarih = fd.get("bitis_tarihi") as string;
    const neden = (fd.get("ayrilma_nedeni") as string).trim();

    if (!tarih) {
      toast.error("Çıkış tarihi zorunludur.");
      return;
    }

    startTransition(async () => {
      const sonuc = await personelCikisYap(personelId, tarih, neden || undefined);
      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PERSONEL(personelId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYMENT_PERIODS(personelId) });
      if (sirketId) {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PERSONEL_LIST(sirketId) });
      }
      toast.success("Personel çıkışı başarıyla kaydedildi.");
      onKapat();
      router.push("/personel");
      router.refresh();
    });
  }

  return (
    <Dialog open={acik} onOpenChange={onKapat}>
      <DialogContent className="sm:max-w-sm" id="dialog-isten-cikar">
        <DialogHeader>
          <DialogTitle>İşten Çıkış Kaydı</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cikis-tarih">Çıkış Tarihi *</Label>
            <Input
              id="cikis-tarih"
              name="bitis_tarihi"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cikis-neden">Ayrılma Nedeni</Label>
            <Input
              id="cikis-neden"
              name="ayrilma_nedeni"
              placeholder="İstifa, emeklilik, fesih vb."
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onKapat} disabled={isPending}>
              İptal
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
              id="btn-cikis-onayla"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Çıkışı Onayla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Evrak Document Micro SVG Thumbnail Previews
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Evrak Document Micro SVG Thumbnail Previews
// ─────────────────────────────────────────────
function MicroDocThumbnail({ type }: { type: string }) {
  if (type === "photo") {
    return (
      <div className="w-16 h-20 bg-gradient-to-b from-sky-100 to-indigo-100 dark:from-zinc-800 dark:to-zinc-700 rounded border border-zinc-200 dark:border-zinc-600 flex flex-col items-center justify-end overflow-hidden shadow-xs relative p-1">
        <div className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-600 mb-1 border border-zinc-400 dark:border-zinc-500 overflow-hidden flex items-center justify-center">
          <User className="w-5 h-5 text-zinc-500 dark:text-zinc-300" />
        </div>
        <div className="w-12 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-t-full" />
      </div>
    );
  }

  if (type === "idcard") {
    return (
      <div className="w-20 h-14 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-700 rounded-md border border-zinc-300 dark:border-zinc-600 p-1.5 shadow-xs flex items-center gap-1.5 relative">
        <div className="w-5 h-6 bg-zinc-200 dark:bg-zinc-600 rounded flex items-center justify-center border border-zinc-300">
          <User className="w-3.5 h-3.5 text-zinc-500" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="w-8 h-1 bg-zinc-400 dark:bg-zinc-500 rounded-full" />
          <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
          <div className="w-6 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
        </div>
        <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-red-400 bg-red-100 flex items-center justify-center text-[6px] font-bold text-red-600">
          TR
        </div>
      </div>
    );
  }

  if (type === "certificate" || type === "diploma") {
    return (
      <div className="w-16 h-20 bg-amber-50/80 dark:bg-zinc-800 border-2 border-amber-300 dark:border-amber-600/60 rounded p-1.5 shadow-xs flex flex-col justify-between items-center relative">
        <div className="w-full border-t border-b border-amber-200 dark:border-amber-700/50 py-0.5 text-center">
          <div className="w-8 h-1 bg-amber-600 dark:bg-amber-400 mx-auto rounded-full" />
        </div>
        <div className="w-full space-y-1">
          <div className="w-10 h-0.5 bg-zinc-400 mx-auto rounded" />
          <div className="w-12 h-0.5 bg-zinc-300 mx-auto rounded" />
          <div className="w-8 h-0.5 bg-zinc-300 mx-auto rounded" />
        </div>
        <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[7px] font-bold shadow-xs">
          ★
        </div>
      </div>
    );
  }

  if (type === "health") {
    return (
      <div className="w-16 h-20 bg-white dark:bg-zinc-800 rounded border border-rose-200 dark:border-rose-900 p-1.5 shadow-xs flex flex-col justify-between relative">
        <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-950 pb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] font-bold">
            +
          </div>
          <div className="w-6 h-1 bg-zinc-400 dark:bg-zinc-500 rounded" />
        </div>
        <div className="space-y-1">
          <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-600 rounded" />
          <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="w-8 h-1 bg-zinc-200 dark:bg-zinc-700 rounded" />
        </div>
        <div className="w-full border-t border-zinc-100 pt-0.5 text-right">
          <div className="w-4 h-1 bg-rose-400 ml-auto rounded" />
        </div>
      </div>
    );
  }

  // Standard Document preview
  return (
    <div className="w-16 h-20 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 p-1.5 shadow-xs flex flex-col justify-between relative">
      <div className="w-full border-b border-zinc-100 dark:border-zinc-700 pb-1 flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <div className="w-8 h-1 bg-zinc-400 dark:bg-zinc-500 rounded" />
      </div>
      <div className="space-y-1">
        <div className="w-11 h-1 bg-zinc-300 dark:bg-zinc-600 rounded" />
        <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-700 rounded" />
        <div className="w-9 h-1 bg-zinc-200 dark:bg-zinc-700 rounded" />
        <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded" />
      </div>
      <div className="w-full pt-1 border-t border-zinc-100 dark:border-zinc-700 flex justify-between">
        <div className="w-3 h-1 bg-zinc-300 rounded" />
        <div className="w-4 h-1 bg-indigo-400 rounded" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Evrak Kontrol Real Component (100% Real Supabase Data)
// ─────────────────────────────────────────────
function EvrakKontrolReal({
  personelId,
  aktifDonemId,
  personel,
}: {
  personelId: string;
  aktifDonemId: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  personel?: Record<string, any>;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [yukleDialogAcik, setYukleDialogAcik] = useState(false);
  const [seciliKategori, setSeciliKategori] = useState<EvrakKategori | null>(null);

  // Şablon Form Dialog State
  const [formDialogAcik, setFormDialogAcik] = useState(false);
  const [formSablonTip, setFormSablonTip] = useState<SablonTipi>("gorevlendirme");

  // Preview, download, and delete states
  const [onizlemeUrl, setOnizlemeUrl] = useState<string | null>(null);
  const [onizlemeDosyaAdi, setOnizlemeDosyaAdi] = useState<string>("");
  const [silinecekId, setSilinecekId] = useState<string | null>(null);

  const { data: kategoriler, isLoading: katLoading } = useEvrakKategorileri();
  const { data: yuklenenEvraklar, isLoading: evrakLoading } = usePersonelEvraklar(
    personelId,
    aktifDonemId ?? undefined
  );
  const { sil: evrakSilMutation } = useEvrakMutations();

  // Real Evrak & Category mapping
  const evrakListesi = useMemo(() => {
    if (!kategoriler) return [];
    const typedKats = kategoriler as unknown as EvrakKategori[];
    const personelKats = typedKats.filter((k) => k.tip === "personel");

    return personelKats.map((kat) => {
      const evrak = yuklenenEvraklar?.find((e) => {
        if (e.kategori_id === kat.id) return true;
        const isTetenozKat =
          kat.id === "kat-tetenoz" ||
          kat.ad.toLowerCase().includes("tetenoz") ||
          kat.ad.toLowerCase().includes("aşı");
        if (
          isTetenozKat &&
          (e.dosya_adi?.includes("Sağlık Raporu") ||
            e.dosya_adi?.includes("[Sağlık") ||
            e.dosya_adi?.includes("saglik"))
        ) {
          return true;
        }
        return false;
      });
      const durum = gecerlilikDurumuHesapla(
        evrak
          ? {
              id: evrak.id,
              sirket_id: "",
              kategori_id: evrak.kategori_id,
              personel_id: evrak.personel_id,
              employment_period_id: null,
              dosya_url: evrak.dosya_url,
              dosya_adi: evrak.dosya_adi ?? "",
              dosya_boyut: evrak.dosya_boyut ?? null,
              dosya_tipi: evrak.dosya_tipi ?? null,
              versiyon: evrak.versiyon,
              baslangic_tarihi: evrak.baslangic_tarihi ?? null,
              bitis_tarihi: evrak.bitis_tarihi ?? null,
              durum: "aktif",
              onay_durumu: "beklemede",
              yuklenme_tarihi: "",
              created_at: "",
              updated_at: "",
            }
          : null,
        kat
      );

      const ext = evrak?.dosya_adi
        ? evrak.dosya_adi.split(".").pop()?.toUpperCase() ?? "PDF"
        : "PDF";

      const thumbnailType = kat.ad.toLowerCase().includes("foto")
        ? "photo"
        : kat.ad.toLowerCase().includes("nüfus") || kat.ad.toLowerCase().includes("kimlik")
        ? "idcard"
        : kat.ad.toLowerCase().includes("diploma")
        ? "diploma"
        : kat.ad.toLowerCase().includes("sertifika")
        ? "certificate"
        : kat.ad.toLowerCase().includes("sağlık")
        ? "health"
        : "document";

      return {
        id: evrak?.id ?? null,
        kategori: kat,
        evrak,
        ad: kat.ad,
        dosyaAdi: evrak?.dosya_adi ?? null,
        ext,
        boyut: evrak?.dosya_boyut
          ? `${(evrak.dosya_boyut / (1024 * 1024)).toFixed(1)} MB`
          : "–",
        bitisTarihi: evrak?.bitis_tarihi ?? null,
        kalanGun: evrak?.bitis_tarihi
          ? kalanGunEtiketi(evrak.bitis_tarihi)
          : kat.sureli
          ? "Süre Belirtilmedi"
          : "Süresiz",
        durum,
        thumbnailType,
      };
    });
  }, [kategoriler, yuklenenEvraklar]);

  const filteredEvraklar = useMemo(() => {
    if (!searchQuery.trim()) return evrakListesi;
    const q = searchQuery.toLowerCase();
    return evrakListesi.filter(
      (e) =>
        e.ad.toLowerCase().includes(q) ||
        (e.dosyaAdi && e.dosyaAdi.toLowerCase().includes(q))
    );
  }, [evrakListesi, searchQuery]);

  const stats = useMemo(() => {
    const toplam = evrakListesi.length;
    const tamam = evrakListesi.filter((e) => e.durum === "gecerli").length;
    const yaklasan = evrakListesi.filter((e) => e.durum === "yaklasan").length;
    const eksik = evrakListesi.filter((e) => e.durum === "eksik" || e.durum === "gecersiz").length;
    const tamamOran = toplam > 0 ? ((tamam / toplam) * 100).toFixed(1) : "0";
    return { toplam, tamam, yaklasan, eksik, tamamOran };
  }, [evrakListesi]);

  const handleOnizle = async (objectKey: string) => {
    try {
      const res = await storageGetDownloadUrl({ objectKey });
      if (res.success) {
        const dosyaAdi = objectKey.split("/").pop() || "Evrak";
        setOnizlemeDosyaAdi(dosyaAdi);
        setOnizlemeUrl(res.url);
      } else {
        toast.error("Önizleme bağlantısı üretilemedi.");
      }
    } catch {
      toast.error("Önizleme hatası oluştu.");
    }
  };

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
        toast.error("İndirme bağlantısı alınamadı.");
      }
    } catch {
      toast.error("İndirme hatası oluştu.");
    }
  };

  const handleYukleTetikle = (kat?: EvrakKategori) => {
    setSeciliKategori(kat ?? null);
    setYukleDialogAcik(true);
  };

  const handleSilOnayla = async () => {
    if (!silinecekId) return;
    const res = await evrakSilMutation.mutateAsync(silinecekId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (res && (res as any).error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error((res as any).error);
    } else {
      toast.success("Evrak silindi.");
      setSilinecekId(null);
    }
  };

  if (katLoading || evrakLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Üst Başlık ve Butonlar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Evrak Durum Özeti
            </h2>
            <Info className="w-3.5 h-3.5 text-zinc-400 cursor-pointer hover:text-zinc-600" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleYukleTetikle()}
            className="px-4 py-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Evrak Yükle
          </button>
        </div>
      </div>

      {/* ── 4 Gerçek Özet Kartı Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Evrak Kategorisi */}
        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Toplam Kategori
            </span>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">
              {stats.toplam}
            </h3>
            <span className="text-[11px] text-zinc-400 block mt-0.5">
              Tüm Yasal Kayıtlar
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Tamamlanan */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Geçerli Belgeler
            </span>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">
              {stats.tamam}
            </h3>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5 font-semibold">
              %{stats.tamamOran} Tamam
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Yaklaşan Süre */}
        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Yaklaşan Süre
            </span>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">
              {stats.yaklasan}
            </h3>
            <span className="text-[11px] text-zinc-400 block mt-0.5">
              30 Gün İçinde
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Eksik / Süresi Geçmiş */}
        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Eksik / Süresi Dolmuş
            </span>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">
              {stats.eksik}
            </h3>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 block mt-0.5 font-semibold">
              Yükleme Bekliyor
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Şablon İle Hızlı Belge Üret & İndir Barı ── */}
      <div className="p-4 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Şablon İle Hızlı Belge Üret & İndir
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Personel verileri pre-fill dolar. Dilediğiniz değişkenleri düzenleyip doğrudan indirebilirsiniz (Arşive kaydolmaz).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-white dark:bg-zinc-900 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium shadow-2xs cursor-pointer"
            onClick={() => {
              setFormSablonTip("gorevlendirme");
              setFormDialogAcik(true);
            }}
          >
            <FileText className="w-3.5 h-3.5 mr-1 text-purple-500" />
            Görevlendirme
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-white dark:bg-zinc-900 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium shadow-2xs cursor-pointer"
            onClick={() => {
              setFormSablonTip("kkd_zimmet");
              setFormDialogAcik(true);
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-indigo-500" />
            KKD Zimmet
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-white dark:bg-zinc-900 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium shadow-2xs cursor-pointer"
            onClick={() => {
              setFormSablonTip("izin_formu");
              setFormDialogAcik(true);
            }}
          >
            <Calendar className="w-3.5 h-3.5 mr-1 text-blue-500" />
            İzin Formu
          </Button>
        </div>
      </div>

      {/* ── Arama ve Görünüm Seçici Bar ── */}
      <div className="flex items-center justify-between gap-4 pt-1">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Evrak adına göre ara..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] transition-all placeholder:text-zinc-400"
          />
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer ${
              viewMode === "grid"
                ? "bg-white dark:bg-zinc-900 text-[#7c3aed] shadow-2xs font-semibold"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
            title="Izgara Görünümü"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-white dark:bg-zinc-900 text-[#7c3aed] shadow-2xs font-semibold"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
            title="Liste Görünümü"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Ana İçerik: Evrak Kartları ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-9">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {filteredEvraklar.map((item) => (
                <div
                  key={item.kategori.id}
                  className={`bg-white dark:bg-zinc-900 border rounded-2xl overflow-hidden shadow-2xs transition-all flex flex-col justify-between group ${
                    item.durum === "gecerli"
                      ? "border-zinc-200/80 dark:border-zinc-800"
                      : item.durum === "yaklasan"
                      ? "border-amber-300/80 dark:border-amber-900/60"
                      : "border-rose-200/80 dark:border-rose-900/60"
                  }`}
                >
                  {/* Thumbnail Üst Alanı */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/40 relative h-32 flex items-center justify-center border-b border-zinc-100 dark:border-zinc-800/80 p-2">
                    <span
                      className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold text-white shadow-2xs ${
                        item.ext === "PDF" ? "bg-rose-500" : "bg-sky-500"
                      }`}
                    >
                      {item.ext}
                    </span>

                    {/* Micro Document Graphic */}
                    <MicroDocThumbnail type={item.thumbnailType} />
                  </div>

                  {/* Orta Bilgi Alanı */}
                  <div className="p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className="font-bold text-xs text-zinc-900 dark:text-white truncate"
                        title={item.ad}
                      >
                        {item.ad}
                      </h4>
                    </div>

                    <p className="text-[10px] text-zinc-400 truncate">
                      {item.dosyaAdi ?? (item.kategori.zorunlu ? "Zorunlu Evrak" : "İsteğe Bağlı")}
                    </p>

                    <div className="text-[10px] pt-0.5 leading-tight">
                      {item.durum === "gecerli" ? (
                        <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Geçerli ({item.kalanGun})
                        </span>
                      ) : item.durum === "yaklasan" ? (
                        <span className="text-amber-600 font-semibold inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          {item.kalanGun}
                        </span>
                      ) : item.durum === "gecersiz" ? (
                        <span className="text-rose-600 font-semibold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          Süresi Doldu
                        </span>
                      ) : (
                        <span className="text-zinc-400 font-medium inline-flex items-center gap-1">
                          <FileX className="w-3 h-3 text-zinc-400" />
                          Yüklenmedi (Eksik)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Alt Aksiyon Çubuğu */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800/80 px-2 py-1.5 flex items-center justify-between text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/20">
                    {item.evrak ? (
                      <>
                        <button
                          onClick={() => handleOnizle(item.evrak!.dosya_url)}
                          className="p-1 hover:text-[#7c3aed] transition-colors cursor-pointer"
                          title="Önizle"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleIndir(item.evrak!.dosya_url)}
                          className="p-1 hover:text-emerald-600 transition-colors cursor-pointer"
                          title="İndir"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleYukleTetikle(item.kategori)}
                          className="p-1 hover:text-[#7c3aed] transition-colors cursor-pointer"
                          title="Değiştir / Yenisini Yükle"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSilinecekId(item.evrak!.id)}
                          className="p-1 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleYukleTetikle(item.kategori)}
                        className="w-full py-0.5 text-[11px] font-semibold text-[#7c3aed] hover:underline flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Evrak Yükle
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Liste Görünümü Tablosu */
            <div className="overflow-x-auto rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-semibold border-b border-zinc-200/80 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Evrak Adı</th>
                    <th className="py-3 px-4">Zorunluluk</th>
                    <th className="py-3 px-4">Dosya / Boyut</th>
                    <th className="py-3 px-4">Geçerlilik Tarihi</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4 text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {filteredEvraklar.map((item) => (
                    <tr
                      key={item.kategori.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-white">
                        {item.ad}
                      </td>
                      <td className="py-3 px-4">
                        {item.kategori.zorunlu ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            Zorunlu
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-500">
                            İsteğe Bağlı
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {item.dosyaAdi ? `${item.dosyaAdi} (${item.boyut})` : "–"}
                      </td>
                      <td className="py-3 px-4">{item.bitisTarihi ?? "–"}</td>
                      <td className="py-3 px-4">
                        {item.durum === "gecerli" ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-semibold text-[11px]">
                            ✓ Geçerli ({item.kalanGun})
                          </span>
                        ) : item.durum === "yaklasan" ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-semibold text-[11px]">
                            ⚠️ {item.kalanGun}
                          </span>
                        ) : item.durum === "gecersiz" ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-semibold text-[11px]">
                            ❌ Süresi Doldu
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 font-medium text-[11px]">
                            📄 Yüklenmedi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.evrak ? (
                          <div className="flex items-center justify-center gap-2 text-zinc-400">
                            <button
                              onClick={() => handleOnizle(item.evrak!.dosya_url)}
                              className="p-1 hover:text-[#7c3aed] transition-colors cursor-pointer"
                              title="Önizle"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleIndir(item.evrak!.dosya_url)}
                              className="p-1 hover:text-emerald-600 transition-colors cursor-pointer"
                              title="İndir"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleYukleTetikle(item.kategori)}
                              className="p-1 hover:text-[#7c3aed] transition-colors cursor-pointer"
                              title="Değiştir"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSilinecekId(item.evrak!.id)}
                              className="p-1 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleYukleTetikle(item.kategori)}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 text-[#7c3aed] border border-purple-200 font-semibold text-[11px] hover:bg-purple-100 transition-colors cursor-pointer"
                          >
                            + Yükle
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sağ Kolon: Belge Yükleme Dropzone */}
        <div className="xl:col-span-3 space-y-4">
          <div
            onClick={() => handleYukleTetikle()}
            className="p-5 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 text-center space-y-2.5 cursor-pointer hover:bg-purple-50/80 dark:hover:bg-purple-950/40 transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-[#7c3aed] mx-auto shadow-2xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Belge Yükleme
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Dosya seçmek için{" "}
                <span className="text-[#7c3aed] font-semibold underline">tıklayın</span>
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                PDF, JPG, PNG (Max. 10MB)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Evrak Yükle Modal Dialog */}
      <EvrakYukleDialog
        acik={yukleDialogAcik}
        onKapat={() => {
          setYukleDialogAcik(false);
          setSeciliKategori(null);
        }}
        personelId={personelId}
        kategori={seciliKategori}
        donemId={aktifDonemId ?? undefined}
      />

      {/* Şablon İle Belge Doldur & İndir Dialog (Anında İndirir, DB'ye Kayıt Yapmaz) */}
      <PersonelEvrakFormDialog
        acik={formDialogAcik}
        onKapat={() => setFormDialogAcik(false)}
        sablonTip={formSablonTip}
        personel={personel ?? { id: personelId }}
      />

      {/* Dosya Görüntüle Modal */}
      <DosyaGoruntule
        url={onizlemeUrl}
        dosyaAdi={onizlemeDosyaAdi}
        onKapat={() => setOnizlemeUrl(null)}
      />

      {/* Evrak Silme Onay Dialog */}
      <AlertDialog open={!!silinecekId} onOpenChange={(open) => !open && setSilinecekId(null)}>
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
// PersonelDetayView Main Component
// ─────────────────────────────────────────────
export function PersonelDetayView({ personelId }: { personelId: string }) {
  const router = useRouter();
  const { data: personel, isLoading, isError } = usePersonelDetay(personelId);
  const { data: periods = [] } = useEmploymentPeriods(personelId);
  const { data: maaslar = [] } = useMaasGecmisi(personelId);
  const { data: personelList = [] } = usePersonelList();

  const currentIndex = useMemo(() => {
    return personelList.findIndex((p) => p.id === personelId);
  }, [personelList, personelId]);

  const prevPersonel = currentIndex > 0 ? personelList[currentIndex - 1] : null;
  const nextPersonel =
    currentIndex >= 0 && currentIndex < personelList.length - 1
      ? personelList[currentIndex + 1]
      : null;

  const [activeTab, setActiveTab] = useState<
    "calisma" | "maas" | "izin" | "puantaj" | "evrak"
  >("evrak");
  const [cikisDialogAcik, setCikisDialogAcik] = useState(false);
  const [yenidenIseAlAcik, setYenidenIseAlAcik] = useState(false);

  // Status & salary calculations
  const isAktif = periods.some((ep) => ep.bitis_tarihi === null);
  const aktifDonemId = periods.find((ep) => ep.bitis_tarihi === null)?.id ?? null;
  const sortedMaaslar = useMemo(() => {
    return [...maaslar].sort((a, b) =>
      (b.gecerlilik_baslangic ?? "").localeCompare(a.gecerlilik_baslangic ?? "")
    );
  }, [maaslar]);
  const aktifMaas = sortedMaaslar.find((m) => m.gecerlilik_bitis === null) ?? sortedMaaslar[0];

  const ilkGiris =
    periods.length > 0
      ? periods.reduce((en, ep) => (ep.baslangic_tarihi < en.baslangic_tarihi ? ep : en))
      : null;
  const sonCikis = !isAktif && periods.length > 0 ? periods[0] : null;

  if (isLoading) {
    return (
      <div className="w-full bg-[#f8fafc] dark:bg-zinc-950 min-h-screen p-6 space-y-6">
        <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-3 h-80 rounded-xl" />
          <Skeleton className="lg:col-span-9 h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !personel) {
    return (
      <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-12 text-center shadow-sm my-6">
        <p className="text-zinc-500 mb-4 text-sm">Personel bulunamadı.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/personel")}>
          Listeye Dön
        </Button>
      </div>
    );
  }

  const adSoyad = formatAdSoyad(personel.ad, personel.soyad);
  const initials = `${personel.ad[0] ?? ""}${personel.soyad[0] ?? ""}`.toUpperCase();

  return (
    <div className="w-full bg-[#f8fafc] dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 min-h-screen font-sans">
      {/* ── Top Header Navigation Bar ── */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Back + Avatar + Personel Info */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => router.push("/personel")}
            id="btn-geri-liste"
            className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* User Avatar */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
            {initials}
          </div>

          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
              {adSoyad}
            </h1>
            <p className="text-xs text-zinc-400 font-normal mt-0.5">
              T.C. Kimlik No: {personel.tc ? maskTc(personel.tc) : "–"}
            </p>
          </div>
        </div>

        {/* Right Actions: Pagination Arrows, Düzenle, İşten Çıkar / Yeniden İşe Al */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
            <button
              onClick={() => prevPersonel && router.push(`/personel/${prevPersonel.id}`)}
              disabled={!prevPersonel}
              title={
                prevPersonel
                  ? `Önceki Personel: ${prevPersonel.ad} ${prevPersonel.soyad}`
                  : "Önceki personel yok"
              }
              id="btn-onceki-personel"
              className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => nextPersonel && router.push(`/personel/${nextPersonel.id}`)}
              disabled={!nextPersonel}
              title={
                nextPersonel
                  ? `Sonraki Personel: ${nextPersonel.ad} ${nextPersonel.soyad}`
                  : "Sonraki personel yok"
              }
              id="btn-sonraki-personel"
              className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/personel/zam")}
            id="btn-zam-yap"
            className="h-9 gap-1.5 text-xs font-medium border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Zam Yap
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/personel/${personelId}/duzenle`)}
            id="btn-duzenle"
            className="h-9 gap-1.5 text-xs font-medium border-zinc-200 dark:border-zinc-700 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            Düzenle
          </Button>

          {isAktif ? (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/50 cursor-pointer"
              onClick={() => setCikisDialogAcik(true)}
              id="btn-isten-cikar"
            >
              <LogOut className="w-3.5 h-3.5" />
              İşten Çıkar
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs font-medium text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/50 cursor-pointer"
              onClick={() => setYenidenIseAlAcik(true)}
              id="btn-yeniden-ise-al"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Yeniden İşe Al
            </Button>
          )}
        </div>
      </div>

      {/* ── Main Layout: Left Sidebar + Right Tab Content ── */}
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Sol Kolon: Kişisel Bilgiler / Çalışma Bilgileri / Banka Bilgileri ── */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 space-y-6 shadow-sm self-start">
          {/* Section 1: Kişisel Bilgiler */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 font-semibold text-sm">
              <User className="w-4 h-4 text-zinc-500" />
              <span>Kişisel Bilgiler</span>
            </div>
            <div className="text-xs space-y-2.5 pt-1">
              <div className="grid grid-cols-[110px_10px_1fr] items-center">
                <span className="text-zinc-400">T.C. Kimlik No</span>
                <span className="text-zinc-400">:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {personel.tc || "–"}
                </span>
              </div>
              <div className="grid grid-cols-[110px_10px_1fr] items-center">
                <span className="text-zinc-400">SGK Sicil No</span>
                <span className="text-zinc-400">:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {personel.sgk_sicil || "–"}
                </span>
              </div>
              <div className="grid grid-cols-[110px_10px_1fr] items-center">
                <span className="text-zinc-400">Doğum Tarihi</span>
                <span className="text-zinc-400">:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {formatTarih(personel.dogum_tarihi)}
                </span>
              </div>
              <div className="grid grid-cols-[110px_10px_1fr] items-center">
                <span className="text-zinc-400">Görev/Unvan</span>
                <span className="text-zinc-400">:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {personel.gorev_unvan || "–"}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Section 2: Çalışma Bilgileri */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 font-semibold text-sm">
              <Briefcase className="w-4 h-4 text-zinc-500" />
              <span>Çalışma Bilgileri</span>
            </div>
            <div className="text-xs space-y-2.5 pt-1">
              <div className="grid grid-cols-[110px_10px_1fr] items-center">
                <span className="text-zinc-400">Maaş (Net)</span>
                <span className="text-zinc-400">:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {aktifMaas ? formatPara(aktifMaas.maas_net) : "–"}
                </span>
              </div>
              <div className="grid grid-cols-[110px_10px_1fr] items-center">
                <span className="text-zinc-400">İşe Giriş Tarihi</span>
                <span className="text-zinc-400">:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {ilkGiris ? formatTarih(ilkGiris.baslangic_tarihi) : "–"}
                </span>
              </div>
              <div className="grid grid-cols-[110px_10px_1fr] items-center">
                <span className="text-zinc-400">İşten Çıkış Tarihi</span>
                <span className="text-zinc-400">:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {!isAktif && sonCikis ? formatTarih(sonCikis.bitis_tarihi) : "–"}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />

          {/* Section 3: Banka Bilgileri */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200 font-semibold text-sm">
              <Building2 className="w-4 h-4 text-zinc-500" />
              <span>Banka Bilgileri</span>
            </div>
            <div className="text-xs space-y-2.5 pt-1">
              <div className="grid grid-cols-[110px_10px_1fr] items-center">
                <span className="text-zinc-400">Banka Adı</span>
                <span className="text-zinc-400">:</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {personel.banka_adi || "–"}
                </span>
              </div>
              {personel.iban ? (
                <div className="grid grid-cols-[110px_10px_1fr] items-start">
                  <span className="text-zinc-400 pt-0.5">IBAN No</span>
                  <span className="text-zinc-400 pt-0.5">:</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 break-all">
                    {personel.iban}
                  </span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[110px_10px_1fr] items-center">
                    <span className="text-zinc-400">Şube Kodu</span>
                    <span className="text-zinc-400">:</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {personel.sube_kodu || "–"}
                    </span>
                  </div>
                  <div className="grid grid-cols-[110px_10px_1fr] items-center">
                    <span className="text-zinc-400">Hesap Numarası</span>
                    <span className="text-zinc-400">:</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {personel.hesap_no || "–"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <hr className="border-zinc-100 dark:border-zinc-800" />
        </div>

        {/* ── Sağ Kolon: Main Tabs & Tab Content ── */}
        <div className="lg:col-span-9 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-6">
          {/* Main Top Tab Header */}
          <div className="border-b border-zinc-200/80 dark:border-zinc-800 pb-0 overflow-x-auto">
            <div className="flex gap-6 min-w-max">
              {[
                { id: "calisma", label: "Çalışma Geçmişi", icon: History },
                { id: "maas", label: "Maaş Geçmişi", icon: DollarSign },
                { id: "izin", label: "İzin Takip", icon: Calendar },
                { id: "puantaj", label: "Puantaj Listesi", icon: ClipboardList },
                { id: "evrak", label: "Evrak Kontrol", icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 pb-3 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer ${isActive
                        ? "border-[#7c3aed] text-[#7c3aed]"
                        : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── TAB 1: Çalışma Geçmişi ── */}
          {activeTab === "calisma" && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Çalışma Geçmişi
              </h2>
              {periods.length === 0 ? (
                <p className="text-sm text-zinc-400 py-8 text-center">
                  Çalışma geçmişi bulunamadı.
                </p>
              ) : (
                <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-semibold border-b border-zinc-200/80 dark:border-zinc-800">
                      <tr>
                        <th className="py-3 px-4">İşe Giriş Tarihi</th>
                        <th className="py-3 px-4">İşten Çıkış Tarihi</th>
                        <th className="py-3 px-4">Durum</th>
                        <th className="py-3 px-4">Ayrılma Nedeni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {periods.map((ep) => (
                        <tr key={ep.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="py-3 px-4 font-medium">
                            {formatTarih(ep.baslangic_tarihi)}
                          </td>
                          <td className="py-3 px-4 text-zinc-500">
                            {ep.bitis_tarihi ? formatTarih(ep.bitis_tarihi) : "–"}
                          </td>
                          <td className="py-3 px-4">
                            {ep.bitis_tarihi === null ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium text-[11px]">
                                Aktif
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 font-medium text-[11px]">
                                Çıkış
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-zinc-400">
                            {ep.ayrilma_nedeni ?? "–"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: Maaş Geçmişi ── */}
          {activeTab === "maas" && (
            <div className="space-y-4 text-xs">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Maaş Geçmişi
              </h2>
              {maaslar.length === 0 ? (
                <p className="text-sm text-zinc-400 py-8 text-center">
                  Maaş geçmişi bulunamadı.
                </p>
              ) : (
                <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-semibold border-b border-zinc-200/80 dark:border-zinc-800">
                      <tr>
                        <th className="py-3 px-4">Geçerlilik Başlangıç</th>
                        <th className="py-3 px-4">Geçerlilik Bitiş</th>
                        <th className="py-3 px-4">Maaş Net</th>
                        <th className="py-3 px-4">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {maaslar.map((m) => (
                        <tr key={m.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                          <td className="py-3 px-4 font-medium">
                            {formatTarih(m.gecerlilik_baslangic)}
                          </td>
                          <td className="py-3 px-4 text-zinc-500">
                            {m.gecerlilik_bitis ? formatTarih(m.gecerlilik_bitis) : "–"}
                          </td>
                          <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">
                            {formatPara(m.maas_net)}
                          </td>
                          <td className="py-3 px-4">
                            {(() => {
                              const bugun = new Date().toISOString().split("T")[0];
                              const isGelecek = m.gecerlilik_baslangic > bugun;
                              const isGecerli =
                                m.gecerlilik_baslangic <= bugun &&
                                (m.gecerlilik_bitis === null || m.gecerlilik_bitis >= bugun);

                              if (isGelecek) {
                                return (
                                  <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold text-[11px] inline-flex items-center gap-1">
                                    Gelecek Zam
                                  </span>
                                );
                              }
                              if (isGecerli) {
                                return (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold text-[11px] inline-flex items-center gap-1">
                                    Geçerli (Aktif)
                                  </span>
                                );
                              }
                              return (
                                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-medium text-[11px]">
                                  Geçmiş
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: İzin Takip Content ── */}
          {activeTab === "izin" && (
            <div className="space-y-6">
              {/* Header + Action Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                    İzin Takip
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    İzin haklarınız, kullanım durumunuz ve geçmiş izinleriniz.
                  </p>
                </div>
                <button className="px-4 py-2 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto cursor-pointer">
                  <Plus className="w-4 h-4" />
                  Yeni İzin Talebi
                </button>
              </div>

              {/* 4 Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat 1: Yıllık İzin Hakkı */}
                <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      Yıllık İzin Hakkı
                    </span>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                      20 Gün
                    </h3>
                    <span className="text-[11px] text-zinc-400 mt-0.5 block">
                      Toplam hak
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>

                {/* Stat 2: Kullanılan İzin */}
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      Kullanılan İzin
                    </span>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                      7 Gün
                    </h3>
                    <span className="text-[11px] text-zinc-400 mt-0.5 block">
                      Bu yıl
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>

                {/* Stat 3: Kalan İzin */}
                <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      Kalan İzin
                    </span>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                      13 Gün
                    </h3>
                    <span className="text-[11px] text-zinc-400 mt-0.5 block">
                      Kalan hak
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>

                {/* Stat 4: Bekleyen İzin */}
                <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      Bekleyen İzin
                    </span>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                      2 Gün
                    </h3>
                    <span className="text-[11px] text-zinc-400 mt-0.5 block">
                      Onay bekliyor
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Sub Tabs */}
              <div className="border-b border-zinc-200/80 dark:border-zinc-800">
                <div className="flex gap-6 text-xs font-semibold">
                  <button className="pb-2.5 text-[#7c3aed] border-b-2 border-[#7c3aed] cursor-pointer">
                    İzin Geçmişi
                  </button>
                  <button className="pb-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer">
                    Bekleyen Talepler
                  </button>
                  <button className="pb-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer">
                    Takvim Görünümü
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 font-semibold border-b border-zinc-200/80 dark:border-zinc-800">
                    <tr>
                      <th className="py-3 px-4">İzin Türü</th>
                      <th className="py-3 px-4">Başlangıç Tarihi</th>
                      <th className="py-3 px-4">Bitiş Tarihi</th>
                      <th className="py-3 px-4">Gün</th>
                      <th className="py-3 px-4">Durum</th>
                      <th className="py-3 px-4">Açıklama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-4 font-medium flex items-center gap-2">
                        <span className="text-emerald-500">📅</span>
                        <span>Yıllık İzin</span>
                      </td>
                      <td className="py-3 px-4">10.06.2025</td>
                      <td className="py-3 px-4">14.06.2025</td>
                      <td className="py-3 px-4">5 Gün</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium text-[11px]">
                          Onaylandı
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500">Yaz tatili izni</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-4 font-medium flex items-center gap-2">
                        <span className="text-emerald-500">📅</span>
                        <span>Yıllık İzin</span>
                      </td>
                      <td className="py-3 px-4">15.04.2025</td>
                      <td className="py-3 px-4">16.04.2025</td>
                      <td className="py-3 px-4">2 Gün</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium text-[11px]">
                          Onaylandı
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500">Kişisel nedenler</td>
                    </tr>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="py-3 px-4 font-medium flex items-center gap-2">
                        <span className="text-rose-500">🧡</span>
                        <span>Hastalık İzni</span>
                      </td>
                      <td className="py-3 px-4">05.03.2025</td>
                      <td className="py-3 px-4">07.03.2025</td>
                      <td className="py-3 px-4">3 Gün</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-medium text-[11px]">
                          Onaylandı
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-500">Grip rahatsızlığı</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table Footer / Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400 pt-1">
                <span>Toplam 3 kayıt</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 rounded bg-[#7c3aed] text-white font-semibold flex items-center justify-center">
                      1
                    </button>
                    <button className="w-7 h-7 rounded border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded text-zinc-600 dark:text-zinc-300">
                    <span>10 / sayfa</span>
                    <ChevronDown className="w-3 h-3 text-zinc-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4: Evrak Kontrol (Real Integrated System) ── */}
          {activeTab === "evrak" && (
            <EvrakKontrolReal
              personelId={personelId}
              aktifDonemId={aktifDonemId}
              personel={personel}
            />
          )}

          {/* ── TAB 5: Puantaj Listesi ── */}
          {activeTab === "puantaj" && (
            <PersonelPuantajTab
              personelId={personelId}
              personel={personel}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <IstenCikarDialog
        personelId={personelId}
        acik={cikisDialogAcik}
        onKapat={() => setCikisDialogAcik(false)}
      />
      <YenidenIseAlDialog
        personelId={personelId}
        acik={yenidenIseAlAcik}
        onKapat={() => setYenidenIseAlAcik(false)}
      />
    </div>
  );
}
