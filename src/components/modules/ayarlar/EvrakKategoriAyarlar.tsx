"use client";

// ─── Evrak Kategori Ayarları ──────────────────────────────────────────────────
// Evrak kategorilerini yönetme: listeleme, ekleme, düzenleme, silme, sıralama

import { useState, useCallback } from "react";
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
import { Separator } from "@/components/ui/separator";
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
  ArrowUpDown,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
// ANA BİLEŞEN
// ═══════════════════════════════════════════════════════════════════════════════

export function EvrakKategoriAyarlar() {
  const { data: kategoriler, isLoading } = useEvrakKategorileri();
  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenecek, setDuzenlenecek] = useState<EvrakKategori | null>(null);
  const [silinecek, setSilinecek] = useState<EvrakKategori | null>(null);

  const personelKategorileri = (kategoriler?.filter((k) => k.tip === "personel") ?? []) as unknown as EvrakKategori[];
  const sirketKategorileri = (kategoriler?.filter((k) => k.tip === "sirket") ?? []) as unknown as EvrakKategori[];

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
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Başlık ve Ekle Butonu */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Evrak Kategorileri</h3>
          <p className="text-sm text-muted-foreground">
            Personel ve şirket evrakları için kategori tanımları.
          </p>
        </div>
        <Button onClick={() => setFormAcik(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Kategori
        </Button>
      </div>

      {/* Personel Kategorileri */}
      <KategoriGrubu
        baslik="Personel Evrakları"
        aciklama="Personel özlük dosyasında bulunan evrak tipleri."
        icon={<FileText className="h-5 w-5 text-blue-500" />}
        kategoriler={personelKategorileri}
        onDuzenle={handleDuzenle}
        onSil={setSilinecek}
      />

      {/* Şirket Kategorileri */}
      <KategoriGrubu
        baslik="Şirket Evrakları"
        aciklama="Şirket genelindeki resmi belgeler."
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

// ═══════════════════════════════════════════════════════════════════════════════
// KATEGORİ GRUBU
// ═══════════════════════════════════════════════════════════════════════════════

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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{baslik}</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            {kategoriler.length}
          </Badge>
        </div>
        <CardDescription>{aciklama}</CardDescription>
      </CardHeader>
      <CardContent>
        {kategoriler.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Henüz kategori tanımlanmamış.
          </p>
        ) : (
          <div className="space-y-1">
            {kategoriler.map((kategori, index) => (
              <div key={kategori.id}>
                {index > 0 && <Separator className="my-1" />}
                <KategoriSatir
                  kategori={kategori}
                  onDuzenle={() => onDuzenle(kategori)}
                  onSil={() => onSil(kategori)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KATEGORİ SATIRI
// ═══════════════════════════════════════════════════════════════════════════════

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
    <div className="flex items-center gap-3 py-2 px-1 rounded-md hover:bg-muted/50 transition-colors group">
      {/* Sıralama tutamacı */}
      <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />

      {/* Sıra numarası */}
      <span className="text-xs text-muted-foreground w-5 text-center font-mono">
        {kategori.sira}
      </span>

      {/* Kategori adı */}
      <span className="font-medium text-sm flex-1">{kategori.ad}</span>

      {/* Etiketler */}
      <div className="flex items-center gap-1.5">
        {kategori.zorunlu && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 gap-1">
            <Shield className="h-3 w-3" />
            Zorunlu
          </Badge>
        )}
        {kategori.sureli ? (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1">
            <Clock className="h-3 w-3" />
            {sureEtiketi(kategori.varsayilan_sure)}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
            Süresiz
          </Badge>
        )}
        {!kategori.aktif && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 opacity-60">
            Pasif
          </Badge>
        )}
      </div>

      {/* Aksiyonlar */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onDuzenle}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onSil}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KATEGORİ FORM DİALOG (Ekle/Düzenle)
// ═══════════════════════════════════════════════════════════════════════════════

const SURE_SECENEKLERI = [
  { label: "6 Ay", gun: 180 },
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

  // Dialog açıldığında formu resetle
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

  // Dialog state değiştiğinde resetle
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {duzenleModu ? "Kategori Düzenle" : "Yeni Kategori Ekle"}
          </DialogTitle>
          <DialogDescription>
            {duzenleModu
              ? "Kategori bilgilerini güncelleyin."
              : "Yeni bir evrak kategorisi tanımlayın."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Ad */}
          <div className="space-y-2">
            <Label htmlFor="kategori-ad">Kategori Adı</Label>
            <Input
              id="kategori-ad"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder="örn: Adli Sicil, Sağlık Raporu"
            />
          </div>

          {/* Tip (sadece yeni ekleme modunda) */}
          {!duzenleModu && (
            <div className="space-y-2">
              <Label>Kategori Tipi</Label>
              <Select
                value={tip}
                onValueChange={(v) => setTip(v as EvrakKategoriTip)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personel">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Personel Evrakı
                    </div>
                  </SelectItem>
                  <SelectItem value="sirket">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Şirket Evrakı
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Zorunlu */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="zorunlu">Zorunlu Evrak</Label>
              <p className="text-xs text-muted-foreground">
                Bu evrak yüklenmemiş personeller eksik olarak işaretlenir.
              </p>
            </div>
            <Switch
              id="zorunlu"
              checked={zorunlu}
              onCheckedChange={setZorunlu}
            />
          </div>

          {/* Süreli */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sureli">Süreli Evrak</Label>
              <p className="text-xs text-muted-foreground">
                Geçerlilik süresi olan evraklar (sağlık raporu, vergi levhası vb.)
              </p>
            </div>
            <Switch
              id="sureli"
              checked={sureli}
              onCheckedChange={setSureli}
            />
          </div>

          {/* Süre seçimi */}
          {sureli && (
            <div className="space-y-3 pl-1 border-l-2 border-primary/20 ml-2">
              <Label className="text-xs text-muted-foreground ml-3">
                Varsayılan Geçerlilik Süresi
              </Label>
              <div className="flex flex-wrap gap-2 ml-3">
                {SURE_SECENEKLERI.map((secenek) => (
                  <Button
                    key={secenek.gun}
                    type="button"
                    variant={sureSecim === secenek.gun ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSureSecim(secenek.gun)}
                  >
                    {secenek.label}
                  </Button>
                ))}
              </div>
              {sureSecim === -1 && (
                <div className="flex items-center gap-2 ml-3">
                  <Input
                    type="number"
                    min={1}
                    max={3650}
                    value={ozelGun}
                    onChange={(e) => setOzelGun(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">gün</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onKapat} disabled={isLoading}>
            İptal
          </Button>
          <Button
            onClick={handleKaydet}
            disabled={!ad.trim() || isLoading}
          >
            {isLoading
              ? "Kaydediliyor…"
              : duzenleModu
              ? "Güncelle"
              : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// KATEGORİ SİLME ONAY DİALOG
// ═══════════════════════════════════════════════════════════════════════════════

function KategoriSilDialog({
  kategori,
  onKapat,
}: {
  kategori: EvrakKategori | null;
  onKapat: () => void;
}) {
  const { sil } = useEvrakKategoriMutations();

  const handleSil = async () => {
    if (!kategori) return;
    await sil.mutateAsync(kategori.id);
    onKapat();
  };

  return (
    <AlertDialog open={!!kategori} onOpenChange={(open) => !open && onKapat()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kategori Silinsin mi?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-semibold">&quot;{kategori?.ad}&quot;</span>{" "}
            kategorisi kalıcı olarak silinecek. Bu kategoriye bağlı evrak
            varsa silme işlemi engellenecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={sil.isPending}>İptal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSil}
            disabled={sil.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {sil.isPending ? "Siliniyor…" : "Sil"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
