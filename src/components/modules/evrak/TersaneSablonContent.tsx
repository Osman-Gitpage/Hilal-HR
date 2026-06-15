"use client";

// ─── Tersane Şablon İçerik Bileşeni ──────────────────────────────────────────
// Şablon CRUD, özel belge yönetimi, özlük hazırlama wizard tetikleme

import { useState } from "react";
import Link from "next/link";
import {
  useTersaneSablonlar,
  useTersaneSablonMutations,
  useOzelBelgeMutations,
} from "@/hooks/useTersane";
import { useEvrakKategorileri } from "@/hooks/useEvrak";
import type { EvrakKategori } from "@/types/evrak";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
  Plus,
  Pencil,
  Trash2,
  FileStack,
  PackageOpen,
  FileText,
  ChevronDown,
  Layers,
  ArrowLeft,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { OzlukHazirlaWizard } from "@/components/modules/evrak/OzlukHazirlaWizard";

// ═══════════════════════════════════════════════════════════════════════════════
// ANA BİLEŞEN
// ═══════════════════════════════════════════════════════════════════════════════

export function TersaneSablonContent() {
  const { data: sablonlar, isLoading } = useTersaneSablonlar();
  const { data: kategoriler } = useEvrakKategorileri("personel");
  const { olustur, guncelle, sil } = useTersaneSablonMutations();
  const ozelBelge = useOzelBelgeMutations();

  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenecek, setDuzenlenecek] = useState<string | null>(null);
  const [silinecek, setSilinecek] = useState<string | null>(null);
  const [wizardSablonId, setWizardSablonId] = useState<string | null>(null);

  // Form state
  const [formAd, setFormAd] = useState("");
  const [formKategoriler, setFormKategoriler] = useState<string[]>([]);

  const typedKategoriler = (kategoriler ?? []) as unknown as EvrakKategori[];

  const handleYeniSablon = () => {
    setDuzenlenecek(null);
    setFormAd("");
    setFormKategoriler([]);
    setFormAcik(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDuzenle = (sablon: any) => {
    setDuzenlenecek(sablon.id);
    setFormAd(sablon.ad);
    setFormKategoriler(sablon.standart_kategoriler ?? []);
    setFormAcik(true);
  };

  const handleKaydet = async () => {
    if (duzenlenecek) {
      await guncelle.mutateAsync({
        id: duzenlenecek,
        params: { ad: formAd, standart_kategoriler: formKategoriler },
      });
    } else {
      await olustur.mutateAsync({ ad: formAd, standart_kategoriler: formKategoriler });
    }
    setFormAcik(false);
  };

  const handleKategoriToggle = (katId: string) => {
    setFormKategoriler((prev) =>
      prev.includes(katId) ? prev.filter((id) => id !== katId) : [...prev, katId]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72 mt-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/evrak" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="h-3.5 w-3.5" />
            Evrak Yönetimi
          </Link>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileStack className="h-6 w-6 text-indigo-500" />
            Tersane Şablonları
          </h1>
          <p className="text-muted-foreground mt-1">
            Farklı tersaneler için özlük paketi şablonları tanımlayın.
          </p>
        </div>
        <Button onClick={handleYeniSablon} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Yeni Şablon
        </Button>
      </div>

      {/* Şablon Kartları */}
      {(!sablonlar || sablonlar.length === 0) ? (
        <div className="text-center py-12 text-muted-foreground">
          <PackageOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Henüz şablon yok</p>
          <p className="text-sm mt-1">İlk tersane şablonunuzu oluşturun.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {sablonlar.map((sablon: any) => (
            <SablonKart
              key={sablon.id}
              sablon={sablon}
              kategoriler={typedKategoriler}
              onDuzenle={() => handleDuzenle(sablon)}
              onSil={() => setSilinecek(sablon.id)}
              onOzlukHazirla={() => setWizardSablonId(sablon.id)}
            />
          ))}
        </div>
      )}

      {/* Yeni/Düzenle Dialog */}
      <Dialog open={formAcik} onOpenChange={(open) => !open && setFormAcik(false)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{duzenlenecek ? "Şablonu Düzenle" : "Yeni Şablon"}</DialogTitle>
            <DialogDescription>
              Tersane için hangi evrakların gerekli olduğunu tanımlayın.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="sablon-ad">Şablon Adı</Label>
              <Input
                id="sablon-ad"
                value={formAd}
                onChange={(e) => setFormAd(e.target.value)}
                placeholder="ör. TUZLA Tersanesi"
              />
            </div>

            <div className="space-y-2">
              <Label>Gerekli Evrak Kategorileri</Label>
              <p className="text-xs text-muted-foreground">
                Bu tersane için gerekli olan personel evraklarını seçin.
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border rounded-lg p-3">
                {typedKategoriler.map((kat) => (
                  <label key={kat.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-1">
                    <Checkbox
                      checked={formKategoriler.includes(kat.id)}
                      onCheckedChange={() => handleKategoriToggle(kat.id)}
                    />
                    <span className="text-sm">{kat.ad}</span>
                    {kat.zorunlu && (
                      <Badge variant="destructive" className="text-[9px] px-1 py-0">zorunlu</Badge>
                    )}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {formKategoriler.length} kategori seçili
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormAcik(false)}>İptal</Button>
            <Button onClick={handleKaydet} disabled={!formAd.trim()}>
              {duzenlenecek ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme Dialog */}
      <AlertDialog open={!!silinecek} onOpenChange={(open) => !open && setSilinecek(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Şablon Silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu şablon ve bağlı tüm özel belgeler kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (silinecek) sil.mutate(silinecek);
                setSilinecek(null);
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Özlük Hazırlama Wizard */}
      {wizardSablonId && (
        <OzlukHazirlaWizard
          acik={!!wizardSablonId}
          onKapat={() => setWizardSablonId(null)}
          sablonId={wizardSablonId}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ŞABLON KARTI
// ═══════════════════════════════════════════════════════════════════════════════

function SablonKart({
  sablon,
  kategoriler,
  onDuzenle,
  onSil,
  onOzlukHazirla,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sablon: any;
  kategoriler: EvrakKategori[];
  onDuzenle: () => void;
  onSil: () => void;
  onOzlukHazirla: () => void;
}) {
  const [detayAcik, setDetayAcik] = useState(false);
  const secilenKategoriler = (sablon.standart_kategoriler as string[]) ?? [];
  const ozelBelgeSayisi = sablon.tersane_ozel_belge?.length ?? 0;

  // Kategori adlarını bul
  const kategoriAdlari = secilenKategoriler
    .map((id: string) => kategoriler.find((k) => k.id === id)?.ad)
    .filter(Boolean);

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-500/10">
            <Layers className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">{sablon.ad}</CardTitle>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px]">
                {secilenKategoriler.length} kategori
              </Badge>
              {ozelBelgeSayisi > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {ozelBelgeSayisi} özel belge
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuzenle}>
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
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Kategori listesi (collapsible) */}
        <Collapsible open={detayAcik} onOpenChange={setDetayAcik}>
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${detayAcik ? "rotate-180" : ""}`} />
            Gerekli evraklar
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1">
            {kategoriAdlari.length === 0 ? (
              <p className="text-xs text-muted-foreground">Kategori seçilmemiş.</p>
            ) : (
              kategoriAdlari.map((ad, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  {ad}
                </div>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Özlük Hazırla Butonu */}
        <Button
          onClick={onOzlukHazirla}
          variant="default"
          size="sm"
          className="w-full gap-1.5"
        >
          <PackageOpen className="h-4 w-4" />
          Özlük Paketi Hazırla
        </Button>
      </CardContent>
    </Card>
  );
}
