"use client";

// ─── Evrak Kategori Ayarları (Modern Premium UI) ─────────────────────────────

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  useEvrakKategorileri,
  useEvrakKategoriMutations,
} from "@/hooks/useEvrak";
import type { EvrakKategori, EvrakKategoriTip } from "@/types/evrak";
import { sureEtiketi } from "@/lib/utils/evrak-utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  FileText,
  Building2,
  Clock,
  Shield,
  FolderTree,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export function EvrakKategoriAyarlar() {
  const { data: kategoriler, isLoading } = useEvrakKategorileri();
  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenecek, setDuzenlenecek] = useState<EvrakKategori | null>(null);
  const [silinecek, setSilinecek] = useState<EvrakKategori | null>(null);

  const personelKategorileri = useMemo(
    () => (kategoriler?.filter((k) => k.tip === "personel") ?? []) as unknown as EvrakKategori[],
    [kategoriler]
  );

  const sirketKategorileri = useMemo(
    () => (kategoriler?.filter((k) => k.tip === "sirket") ?? []) as unknown as EvrakKategori[],
    [kategoriler]
  );

  const stats = useMemo(() => {
    const list = (kategoriler ?? []) as unknown as EvrakKategori[];
    const toplam = list.length;
    const zorunlu = list.filter((k) => k.zorunlu).length;
    const sureli = list.filter((k) => k.sureli).length;
    return { toplam, zorunlu, sureli };
  }, [kategoriler]);

  const handleDuzenle = (kategori: EvrakKategori) => {
    setDuzenlenecek(kategori);
    setFormAcik(true);
  };

  const handleFormKapat = () => {
    setFormAcik(false);
    setDuzenlenecek(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Üst Başlık & Ekle Butonu ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/10 text-[#7c3aed] flex items-center justify-center border border-[#7c3aed]/20 shadow-2xs shrink-0">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Evrak Kategorileri
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Personel özlük dosyası ve şirket resmi evrak tiplerini yönetin.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setFormAcik(true)}
          className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold rounded-xl h-9 px-4 gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Yeni Kategori Ekle
        </Button>
      </div>

      {/* ── 3 Özet İstatistik Kartı ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Toplam Kategori
            </span>
            <h4 className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
              {stats.toplam}
            </h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-[#7c3aed] flex items-center justify-center">
            <FolderTree className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Zorunlu Evraklar
            </span>
            <h4 className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
              {stats.zorunlu}
            </h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Süreli Evraklar
            </span>
            <h4 className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">
              {stats.sureli}
            </h4>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── Personel Evrak Kategorileri Grubu ── */}
      <KategoriGrubu
        baslik="Personel Evrak Kategorileri"
        aciklama="Personel özlük dosyası ve yasal çalışma belgeleri kategorileri."
        icon={<FileText className="h-5 w-5 text-[#7c3aed]" />}
        kategoriler={personelKategorileri}
        onDuzenle={handleDuzenle}
        onSil={setSilinecek}
      />

      {/* ── Şirket Evrak Kategorileri Grubu ── */}
      <KategoriGrubu
        baslik="Şirket Resmi Evrak Kategorileri"
        aciklama="Şirket geneli resmi belgeler, ruhsat ve vergi levhaları."
        icon={<Building2 className="h-5 w-5 text-emerald-500" />}
        kategoriler={sirketKategorileri}
        onDuzenle={handleDuzenle}
        onSil={setSilinecek}
      />

      {/* Ekle/Düzenle Dialog */}
      <KategoriFormDialog
        acik={formAcik}
        onKapat={handleFormKapat}
        kategori={duzenlenecek}
      />

      {/* Silme Onay Dialog */}
      <KategoriSilDialog
        kategori={silinecek}
        onKapat={() => setSilinecek(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Kategori Grubu Bileşeni
// ─────────────────────────────────────────────
function KategoriGrubu({
  baslik,
  aciklama,
  icon,
  kategoriler,
  onDuzenle,
  onSil,
}: {
  baslik: string;
  aciklama: string;
  icon: React.ReactNode;
  kategoriler: EvrakKategori[];
  onDuzenle: (k: EvrakKategori) => void;
  onSil: (k: EvrakKategori) => void;
}) {
  return (
    <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-800/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-zinc-900 dark:text-white">
                {baslik}
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                {aciklama}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            {kategoriler.length} Kategori
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-3">
        {kategoriler.length === 0 ? (
          <p className="text-xs text-zinc-400 py-6 text-center">
            Henüz kategori tanımlanmamış.
          </p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {kategoriler.map((kategori) => (
              <KategoriSatir
                key={kategori.id}
                kategori={kategori}
                onDuzenle={() => onDuzenle(kategori)}
                onSil={() => onSil(kategori)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Kategori Satırı Bileşeni
// ─────────────────────────────────────────────
function KategoriSatir({
  kategori,
  onDuzenle,
  onSil,
}: {
  kategori: EvrakKategori;
  onDuzenle: () => void;
  onSil: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <GripVertical className="h-4 w-4 text-zinc-300 dark:text-zinc-600 cursor-grab shrink-0" />
        <span className="text-xs font-mono font-bold text-zinc-400 w-5">
          #{kategori.sira}
        </span>
        <span className="font-semibold text-xs text-zinc-900 dark:text-white truncate">
          {kategori.ad}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Badges */}
        <div className="flex items-center gap-1.5">
          {kategori.zorunlu && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-[10px] font-semibold">
              <Shield className="h-3 w-3" />
              Zorunlu
            </span>
          )}
          {kategori.sureli ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 text-[10px] font-semibold">
              <Clock className="h-3 w-3" />
              {sureEtiketi(kategori.varsayilan_sure)}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-medium">
              Süresiz
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onDuzenle}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer"
            title="Düzenle"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onSil}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Sil"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Kategori Form Dialog (Ekle / Düzenle)
// ─────────────────────────────────────────────
const SURE_SECENEKLERI = [
  { label: "3 Ay (Min)", gun: 90 },
  { label: "6 Ay (Max/Standart)", gun: 180 },
  { label: "1 Yıl", gun: 365 },
  { label: "2 Yıl", gun: 730 },
  { label: "Özel", gun: -1 },
];

function KategoriFormDialog({
  acik,
  onKapat,
  kategori,
}: {
  acik: boolean;
  onKapat: () => void;
  kategori: EvrakKategori | null;
}) {
  const { olustur, guncelle } = useEvrakKategoriMutations();
  const duzenleModu = !!kategori;

  const [ad, setAd] = useState(kategori?.ad ?? "");
  const [tip, setTip] = useState<EvrakKategoriTip>(kategori?.tip ?? "personel");
  const [zorunlu, setZorunlu] = useState(kategori?.zorunlu ?? false);
  const [sureli, setSureli] = useState(kategori?.sureli ?? false);
  const [sureSecim, setSureSecim] = useState<number>(() => {
    const sure = kategori?.varsayilan_sure;
    if (!sure) return 365;
    const bulundu = SURE_SECENEKLERI.find((s) => s.gun === sure);
    return bulundu ? bulundu.gun : -1;
  });
  const [ozelGun, setOzelGun] = useState(kategori?.varsayilan_sure ?? 90);

  const resetForm = useCallback(() => {
    setAd(kategori?.ad ?? "");
    setTip(kategori?.tip ?? "personel");
    setZorunlu(kategori?.zorunlu ?? false);
    setSureli(kategori?.sureli ?? false);
    const sure = kategori?.varsayilan_sure;
    if (!sure) {
      setSureSecim(365);
      setOzelGun(90);
    } else {
      const bulundu = SURE_SECENEKLERI.find((s) => s.gun === sure);
      setSureSecim(bulundu ? bulundu.gun : -1);
      setOzelGun(sure);
    }
  }, [kategori]);

  useEffect(() => {
    if (acik) {
      resetForm();
    }
  }, [acik, resetForm]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      resetForm();
    } else {
      onKapat();
    }
  };

  const varsayilanSure = sureli
    ? sureSecim === -1
      ? ozelGun
      : sureSecim
    : null;

  const handleKaydet = async () => {
    if (!ad.trim()) return;

    if (duzenleModu && kategori) {
      await guncelle.mutateAsync({
        id: kategori.id,
        params: {
          ad: ad.trim(),
          zorunlu,
          sureli,
          varsayilan_sure: varsayilanSure,
        },
      });
    } else {
      await olustur.mutateAsync({
        ad: ad.trim(),
        tip,
        zorunlu,
        sureli,
        varsayilan_sure: varsayilanSure,
      });
    }

    onKapat();
  };

  const isLoading = olustur.isPending || guncelle.isPending;

  return (
    <Dialog open={acik} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-purple-50/40 via-white to-indigo-50/40 dark:from-zinc-900 dark:to-zinc-900">
          <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[#7c3aed]" />
            {duzenleModu ? "Kategori Düzenle" : "Yeni Evrak Kategorisi Ekle"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 mt-0.5">
            {duzenleModu
              ? "Kategori tanımını ve geçerlilik şartlarını güncelleyin."
              : "Evrak klasörleme sistemi için yeni bir kategori oluşturun."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Ad */}
          <div className="space-y-1.5">
            <Label htmlFor="kategori-ad" className="text-xs font-bold text-zinc-900 dark:text-white">
              Kategori Adı *
            </Label>
            <Input
              id="kategori-ad"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder="örn: Adli Sicil Kaydı, SGK İşe Giriş"
              className="text-xs h-10 rounded-xl border-zinc-200 dark:border-zinc-700"
            />
          </div>

          {/* Tip */}
          {!duzenleModu && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-900 dark:text-white">Kategori Tipi</Label>
              <Select
                value={tip}
                onValueChange={(v) => setTip(v as EvrakKategoriTip)}
              >
                <SelectTrigger className="h-10 text-xs rounded-xl border-zinc-200 dark:border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <SelectItem value="personel" className="text-xs">
                    Personel Evrakı
                  </SelectItem>
                  <SelectItem value="sirket" className="text-xs">
                    Şirket Evrakı
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Switches */}
          <div className="pt-2 space-y-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
              <div className="space-y-0.5">
                <Label htmlFor="zorunlu" className="text-xs font-bold text-zinc-900 dark:text-white cursor-pointer">
                  Zorunlu Evrak
                </Label>
                <p className="text-[11px] text-zinc-400">
                  Eksik olduğunda uyarı verir.
                </p>
              </div>
              <Switch
                id="zorunlu"
                checked={zorunlu}
                onCheckedChange={setZorunlu}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60">
              <div className="space-y-0.5">
                <Label htmlFor="sureli" className="text-xs font-bold text-zinc-900 dark:text-white cursor-pointer">
                  Süreli Evrak
                </Label>
                <p className="text-[11px] text-zinc-400">
                  Son geçerlilik tarihi bulunur.
                </p>
              </div>
              <Switch
                id="sureli"
                checked={sureli}
                onCheckedChange={setSureli}
              />
            </div>
          </div>

          {/* Varsayılan Süre Seçimi */}
          {sureli && (
            <div className="p-3.5 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 space-y-2.5">
              <Label className="text-xs font-bold text-purple-950 dark:text-purple-200">
                Varsayılan Geçerlilik Süresi
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {SURE_SECENEKLERI.map((secenek) => (
                  <Button
                    key={secenek.gun}
                    type="button"
                    variant={sureSecim === secenek.gun ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSureSecim(secenek.gun)}
                    className={`h-7 px-3 text-xs rounded-lg transition-all cursor-pointer ${
                      sureSecim === secenek.gun
                        ? "bg-[#7c3aed] text-white"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    {secenek.label}
                  </Button>
                ))}
              </div>
              {sureSecim === -1 && (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    type="number"
                    min={1}
                    max={3650}
                    value={ozelGun}
                    onChange={(e) => setOzelGun(Number(e.target.value))}
                    className="w-24 h-8 text-xs rounded-lg"
                  />
                  <span className="text-xs text-zinc-400">gün</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onKapat}
            disabled={isLoading}
            className="h-9 px-4 text-xs font-medium rounded-xl border-zinc-200 dark:border-zinc-700 cursor-pointer"
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleKaydet}
            disabled={!ad.trim() || isLoading}
            className="h-9 px-5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            {isLoading
              ? "Kaydediliyor…"
              : duzenleModu
              ? "Güncelle"
              : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Kategori Silme Onay Dialog
// ─────────────────────────────────────────────
function KategoriSilDialog({
  kategori,
  onKapat,
}: {
  kategori: EvrakKategori | null;
  onKapat: () => void;
}) {
  const { sil } = useEvrakKategoriMutations();
  const [hataMesaji, setHataMesaji] = useState<string | null>(null);

  const handleSil = async (force: boolean = false) => {
    if (!kategori) return;
    setHataMesaji(null);
    const res = await sil.mutateAsync({ id: kategori.id, force });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (res && (res as any).error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setHataMesaji((res as any).error);
    } else {
      handleKapat();
    }
  };

  const handleKapat = () => {
    setHataMesaji(null);
    onKapat();
  };

  return (
    <AlertDialog open={!!kategori} onOpenChange={(open) => !open && handleKapat()}>
      <AlertDialogContent className="sm:max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
            Kategori Silinsin mi?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-zinc-400 mt-1">
            "{kategori?.ad}" kategorisi silinecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hataMesaji && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs space-y-1 my-2">
            <span className="font-semibold block">⚠️ İlişkili Kayıt Uyarısı:</span>
            <span className="text-[11px] block">{hataMesaji}</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 block">
              B2 nesneleri olmasa dahi veritabanındaki ilişkili evrak kayıtları temizlenerek kategori silinebilir.
            </span>
          </div>
        )}

        <AlertDialogFooter className="mt-4 gap-2 flex-col sm:flex-row">
          <AlertDialogCancel
            onClick={handleKapat}
            disabled={sil.isPending}
            className="h-9 text-xs rounded-xl border-zinc-200 dark:border-zinc-700 cursor-pointer"
          >
            İptal
          </AlertDialogCancel>

          {hataMesaji ? (
            <Button
              type="button"
              onClick={() => handleSil(true)}
              disabled={sil.isPending}
              className="h-9 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer gap-1.5 shadow-2xs"
            >
              {sil.isPending ? "Temizleniyor…" : "İlişkili Kayıtlarla Birlikte Sil"}
            </Button>
          ) : (
            <AlertDialogAction
              onClick={() => handleSil(false)}
              disabled={sil.isPending}
              className="h-9 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
            >
              {sil.isPending ? "Siliniyor…" : "Kategoriyi Sil"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
