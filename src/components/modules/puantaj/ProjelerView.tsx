"use client";

import React, { useState, useTransition, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Pencil, Archive, ArchiveRestore, FolderOpen, FolderCheck, CalendarDays, Loader2, Building2, Trash2, X, History, ChevronDown, ChevronUp, CheckCircle2, Circle, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { nextSort, compareValues, type SortState } from "@/lib/utils/sort";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { useProjeler, useProjeEkle, useProjeGuncelle, useProjeArsivle, useProjeAktivasyonu, useProjeSil, useProjeDonemLog, useProjeDonemLogEkle, useProjeDonemLogGuncelle, useProjeDonemLogSil, type DonemLog, } from "@/hooks/usePuantaj";
import type { Database } from "@/supabase/types";
type Proje = Database["public"]["Tables"]["proje"]["Row"];
import type { FaturaKodu } from "@/types";

// ─────────────────────────────────────────────
// Tarih Formatla
// ─────────────────────────────────────────────
function formatTarih(tarih: string | null | undefined): string {
  if (!tarih) return "—";
  const [yil, ay, gun] = tarih.split("-");
  return `${gun}.${ay}.${yil}`;
}

function bosForm() {
  return {
    ad: "",
    firma_adi: "",
    adres_1: "",
    adres_2: "",
    bolge: "",
    tersane_adi: "",
    aciklama: "",
    baslangic_tarihi: "",
    fatura_kodlari: [] as FaturaKodu[],
  };
}

function formFromProje(p: Proje) {
  return {
    ad: p.ad,
    firma_adi: p.firma_adi ?? "",
    adres_1: p.adres_1 ?? "",
    adres_2: p.adres_2 ?? "",
    bolge: p.bolge ?? "",
    tersane_adi: p.tersane_adi ?? "",
    aciklama: p.aciklama ?? "",
    baslangic_tarihi: p.baslangic_tarihi,
    fatura_kodlari: ((p.fatura_kodlari ?? []) as unknown as FaturaKodu[]),
  };
}

// ─────────────────────────────────────────────
// Fatura Kodları Editörü
// ─────────────────────────────────────────────
function FaturaKodlariEditor({
  kodlar,
  onChange,
}: {
  kodlar: FaturaKodu[];
  onChange: (k: FaturaKodu[]) => void;
}) {
  function ekle() {
    onChange([
      ...kodlar,
      { tip: "Fatura", kod: "", tarih: "" },
    ]);
  }

  function guncelle(i: number, alan: keyof FaturaKodu, deger: string) {
    const yeni = [...kodlar];
    yeni[i] = { ...yeni[i], [alan]: deger };
    onChange(yeni);
  }

  function sil(i: number) {
    onChange(kodlar.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Proforma / Fatura Kodları</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          id="btn-fatura-kodu-ekle"
          onClick={ekle}
          className="gap-1.5 h-7 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          Kod Ekle
        </Button>
      </div>

      {kodlar.length === 0 && (
        <p className="text-xs text-muted-foreground py-1">
          Henüz kod eklenmemiş.
        </p>
      )}

      <div className="space-y-2">
        {kodlar.map((k, i) => (
          <div key={i} className="flex items-center gap-2">
            {/* Tip */}
            <Select
              value={k.tip}
              onValueChange={(v) => v != null && guncelle(i, "tip", v)}
            >
              <SelectTrigger className="w-28 h-8 text-xs" id={`fatura-tip-${i}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fatura">Fatura</SelectItem>
                <SelectItem value="Proforma">Proforma</SelectItem>
              </SelectContent>
            </Select>

            {/* Kod */}
            <Input
              placeholder="Kod no"
              value={k.kod}
              onChange={(e) => guncelle(i, "kod", e.target.value)}
              className="flex-1 h-8 text-xs"
              id={`fatura-kod-${i}`}
              maxLength={60}
            />

            {/* Tarih */}
            <Input
              type="date"
              value={k.tarih}
              onChange={(e) => guncelle(i, "tarih", e.target.value)}
              className="w-36 h-8 text-xs"
              id={`fatura-tarih-${i}`}
            />

            {/* Sil */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive/70 hover:text-destructive"
              onClick={() => sil(i)}
              id={`btn-fatura-sil-${i}`}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Proje Form Dialogu (Ekle / Düzenle)
// ─────────────────────────────────────────────
interface ProjeFormDialogProps {
  acik: boolean;
  onKapat: () => void;
  duzenlenecekProje?: Proje | null;
}

function ProjeFormDialog({ acik, onKapat, duzenlenecekProje }: ProjeFormDialogProps) {
  const editMode = !!duzenlenecekProje;
  const ekle = useProjeEkle();
  const guncelle = useProjeGuncelle();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState(
    duzenlenecekProje ? formFromProje(duzenlenecekProje) : bosForm()
  );

  // Dialog açıldığında veya düzenlenen proje değiştiğinde formu resetle
  useEffect(() => {
    if (acik) {
      setForm(duzenlenecekProje ? formFromProje(duzenlenecekProje) : bosForm());
    }
  }, [acik, duzenlenecekProje]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAc = useCallback(() => {
    setForm(duzenlenecekProje ? formFromProje(duzenlenecekProje) : bosForm());
  }, [duzenlenecekProje]);

  function setField(alan: string, deger: string) {
    setForm((f) => ({ ...f, [alan]: deger }));
  }

  function handleKaydet() {
    if (!form.ad.trim()) {
      toast.error("Proje adı zorunludur.");
      return;
    }
    if (!form.baslangic_tarihi) {
      toast.error("Başlangıç tarihi zorunludur.");
      return;
    }

    // Fatura kodları validasyon
    for (const k of form.fatura_kodlari) {
      if (!k.kod.trim() || !k.tarih) {
        toast.error("Fatura kodu ve tarihi boş bırakılamaz.");
        return;
      }
    }

    startTransition(async () => {
      const veri = {
        ad: form.ad.trim(),
        baslangic_tarihi: form.baslangic_tarihi,
        firma_adi: form.firma_adi.trim() || null,
        adres_1: form.adres_1.trim() || null,
        adres_2: form.adres_2.trim() || null,
        bolge: form.bolge.trim() || null,
        tersane_adi: form.tersane_adi.trim() || null,
        aciklama: form.aciklama.trim() || null,
        fatura_kodlari: form.fatura_kodlari,
      };

      const sonuc = editMode && duzenlenecekProje
        ? await guncelle.mutateAsync({ id: duzenlenecekProje.id, veri })
        : await ekle.mutateAsync(veri);

      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }

      toast.success(editMode ? "Proje güncellendi." : "Proje eklendi.");
      onKapat();
    });
  }

  return (
    <Dialog
      open={acik}
      onOpenChange={(v) => {
        if (v) handleAc();
        else onKapat();
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" id="dialog-proje-form">
        <DialogHeader>
          <DialogTitle>{editMode ? "Projeyi Düzenle" : "Yeni Proje Ekle"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Proje Adı */}
          <div className="space-y-1.5">
            <Label htmlFor="proje-ad">
              Proje Adı <span className="text-destructive">*</span>
            </Label>
            <Input
              id="proje-ad"
              placeholder="Proje adını girin"
              value={form.ad}
              onChange={(e) => setField("ad", e.target.value)}
              maxLength={120}
            />
          </div>

          {/* Bağlı Olduğu Firma */}
          <div className="space-y-1.5">
            <Label htmlFor="proje-firma">Bağlı Olduğu Firma</Label>
            <Input
              id="proje-firma"
              placeholder="Firma adı"
              value={form.firma_adi}
              onChange={(e) => setField("firma_adi", e.target.value)}
              maxLength={120}
            />
          </div>

          {/* Adres */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="proje-adres1">Adres 1</Label>
              <Input
                id="proje-adres1"
                placeholder="Adres satırı 1"
                value={form.adres_1}
                onChange={(e) => setField("adres_1", e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proje-adres2">Adres 2</Label>
              <Input
                id="proje-adres2"
                placeholder="Adres satırı 2"
                value={form.adres_2}
                onChange={(e) => setField("adres_2", e.target.value)}
                maxLength={200}
              />
            </div>
          </div>

          {/* Bölge & Tersane */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="proje-bolge">Bölge</Label>
              <Input
                id="proje-bolge"
                placeholder="Bölge adı"
                value={form.bolge}
                onChange={(e) => setField("bolge", e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proje-tersane">Tersane Adı</Label>
              <Input
                id="proje-tersane"
                placeholder="Tersane adı"
                value={form.tersane_adi}
                onChange={(e) => setField("tersane_adi", e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          {/* Başlangıç Tarihi */}
          <div className="space-y-1.5">
            <Label htmlFor="proje-baslangic">
              Başlangıç Tarihi <span className="text-destructive">*</span>
            </Label>
            <Input
              id="proje-baslangic"
              type="date"
              value={form.baslangic_tarihi}
              onChange={(e) => setField("baslangic_tarihi", e.target.value)}
            />
          </div>

          {/* Açıklama */}
          <div className="space-y-1.5">
            <Label htmlFor="proje-aciklama">Açıklama</Label>
            <Textarea
              id="proje-aciklama"
              placeholder="Opsiyonel açıklama…"
              value={form.aciklama}
              onChange={(e) => setField("aciklama", e.target.value)}
              rows={2}
              maxLength={400}
            />
          </div>

          {/* Fatura Kodları */}
          <div className="pt-1 border-t">
            <FaturaKodlariEditor
              kodlar={form.fatura_kodlari}
              onChange={(k) => setForm((f) => ({ ...f, fatura_kodlari: k }))}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose
            render={
              <Button variant="outline" id="btn-proje-form-iptal" type="button" />
            }
          >
            İptal
          </DialogClose>
          <Button
            id="btn-proje-form-kaydet"
            onClick={handleKaydet}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editMode ? "Güncelle" : "Ekle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Arşive Al Dialogu — bitiş tarihi sorar
// ─────────────────────────────────────────────
interface ArsivDialogProps {
  proje: Proje | null;
  onKapat: () => void;
}

function ArsivDialog({ proje, onKapat }: ArsivDialogProps) {
  const arsivle = useProjeArsivle();
  const [isPending, startTransition] = useTransition();
  const [bitisTarihi, setBitisTarihi] = useState("");

  function handleOnayla() {
    if (!proje) return;
    if (!bitisTarihi) {
      toast.error("Bitiş tarihi zorunludur.");
      return;
    }
    startTransition(async () => {
      const sonuc = await arsivle.mutateAsync({
        id: proje.id,
        bitis_tarihi: bitisTarihi,
      });
      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(`"${proje.ad}" arşive alındı.`);
      setBitisTarihi("");
      onKapat();
    });
  }

  return (
    <AlertDialog
      open={!!proje}
      onOpenChange={(v) => {
        if (!v) {
          setBitisTarihi("");
          onKapat();
        }
      }}
    >
      <AlertDialogContent id="alertdialog-arsiv">
        <AlertDialogHeader>
          <AlertDialogTitle>Projeyi Arşive Al</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{proje?.ad}</strong> projesini arşive almak üzeresiniz.
            Proje Puantaj listesinde görünmeyecek. Bitiş tarihini girin.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Bitiş Tarihi */}
        <div className="space-y-1.5 py-2">
          <Label htmlFor="arsiv-bitis-tarihi">
            Bitiş Tarihi <span className="text-destructive">*</span>
          </Label>
          <Input
            id="arsiv-bitis-tarihi"
            type="date"
            value={bitisTarihi}
            onChange={(e) => setBitisTarihi(e.target.value)}
            min={proje?.baslangic_tarihi}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel id="btn-arsiv-iptal" disabled={isPending}>
            İptal
          </AlertDialogCancel>
          <AlertDialogAction
            id="btn-arsiv-onayla"
            onClick={handleOnayla}
            disabled={isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Arşive Al
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────
// Proje Sil Dialogu
// ─────────────────────────────────────────────
interface SilDialogProps {
  proje: Proje | null;
  onKapat: () => void;
}

function SilDialog({ proje, onKapat }: SilDialogProps) {
  const sil = useProjeSil();
  const [isPending, startTransition] = useTransition();
  const [onay, setOnay] = useState("");

  function handleSil() {
    if (!proje) return;
    startTransition(async () => {
      const sonuc = await sil.mutateAsync({ id: proje.id });
      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(`"${proje.ad}" kalıcı olarak silindi.`);
      setOnay("");
      onKapat();
    });
  }

  return (
    <AlertDialog
      open={!!proje}
      onOpenChange={(v) => {
        if (!v) {
          setOnay("");
          onKapat();
        }
      }}
    >
      <AlertDialogContent id="alertdialog-proje-sil">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Projeyi Kalıcı Olarak Sil</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{proje?.ad}</strong> projesi ve buna bağlı tüm puantaj kayıtları,
            dönem logları kalıcı olarak silinecek. Bu işlem{" "}
            <strong>geri alınamaz</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5 py-2">
          <Label htmlFor="sil-onay">
            Onaylamak için proje adını yazın:{" "}
            <span className="font-semibold text-foreground">{proje?.ad}</span>
          </Label>
          <Input
            id="sil-onay"
            value={onay}
            onChange={(e) => setOnay(e.target.value)}
            placeholder={proje?.ad ?? ""}
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel id="btn-sil-iptal" disabled={isPending}>
            İptal
          </AlertDialogCancel>
          <AlertDialogAction
            id="btn-sil-onayla"
            onClick={handleSil}
            disabled={isPending || onay !== proje?.ad}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kalıcı Olarak Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─────────────────────────────────────────────
// Dönem Log Paneli
// ─────────────────────────────────────────────
function DonemLogPanel({ proje }: { proje: Proje }) {
  const { data: loglar = [], isLoading } = useProjeDonemLog(proje.id);
  const ekle = useProjeDonemLogEkle(proje.id);
  const guncelle = useProjeDonemLogGuncelle(proje.id);
  const sil = useProjeDonemLogSil(proje.id);
  const [formAcik, setFormAcik] = useState(false);
  const [form, setForm] = useState({ baslangic: "", bitis: "", aciklama: "" });
  const [isPending, startTransition] = useTransition();
  const [duzenlenen, setDuzenlenen] = useState<DonemLog | null>(null);

  function handleEkle() {
    if (!form.baslangic) { toast.error("Başlangıç tarihi zorunludur."); return; }
    startTransition(async () => {
      const sonuc = await ekle.mutateAsync({
        baslangic: form.baslangic,
        bitis: form.bitis || null,
        aciklama: form.aciklama || null,
      });
      if (sonuc?.hata) { toast.error(sonuc.hata); return; }
      toast.success("Dönem eklendi.");
      setForm({ baslangic: "", bitis: "", aciklama: "" });
      setFormAcik(false);
    });
  }

  function handleGuncelle(log: DonemLog) {
    if (!duzenlenen) return;
    startTransition(async () => {
      const sonuc = await guncelle.mutateAsync({
        logId: log.id,
        bitis: duzenlenen.bitis,
        aciklama: duzenlenen.aciklama,
      });
      if (sonuc?.hata) { toast.error(sonuc.hata); return; }
      toast.success("Dönem güncellendi.");
      setDuzenlenen(null);
    });
  }

  function handleSil(logId: string) {
    startTransition(async () => {
      const sonuc = await sil.mutateAsync({ logId });
      if (sonuc?.hata) { toast.error(sonuc.hata); return; }
      toast.success("Dönem silindi.");
    });
  }

  return (
    <div className="px-4 py-3 bg-muted/20 border-t space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" />
          Çalışma Dönemleri
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => setFormAcik((v) => !v)}
          id={`btn-donem-ekle-${proje.id}`}
        >
          <Plus className="h-3.5 w-3.5" />
          Dönem Ekle
        </Button>
      </div>

      {/* Log listesi */}
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Yükleniyor…</div>
      ) : loglar.length === 0 ? (
        <div className="text-xs text-muted-foreground py-1">Henüz dönem kaydı yok.</div>
      ) : (
        <div className="space-y-1.5">
          {loglar.map((log) => {
            const aktif = !log.bitis;
            const isDuzenleniyor = duzenlenen?.id === log.id;
            return (
              <div key={log.id} className="flex items-start gap-2 group">
                {aktif ? (
                  <Circle className="h-3.5 w-3.5 mt-0.5 text-emerald-500 fill-emerald-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-muted-foreground/50 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {isDuzenleniyor ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input
                        type="date"
                        value={duzenlenen.bitis ?? ""}
                        onChange={(e) => setDuzenlenen({ ...duzenlenen, bitis: e.target.value || null })}
                        className="h-7 w-36 text-xs"
                      />
                      <Input
                        placeholder="Açıklama"
                        value={duzenlenen.aciklama ?? ""}
                        onChange={(e) => setDuzenlenen({ ...duzenlenen, aciklama: e.target.value })}
                        className="h-7 flex-1 text-xs"
                      />
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleGuncelle(log)} disabled={isPending}>
                        Kaydet
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDuzenlenen(null)}>
                        İptal
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs tabular-nums">
                        {formatTarih(log.baslangic)}
                        <span className="text-muted-foreground mx-1">→</span>
                        {log.bitis ? formatTarih(log.bitis) : (
                          <span className="text-emerald-600 font-medium">devam ediyor</span>
                        )}
                      </span>
                      {log.aciklama && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{log.aciklama}</span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          title="Düzenle"
                          onClick={() => setDuzenlenen({ ...log })}
                          id={`btn-donem-duzenle-${log.id}`}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          title="Sil"
                          onClick={() => handleSil(log.id)}
                          disabled={isPending}
                          id={`btn-donem-sil-${log.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dönem Ekle Formu */}
      {formAcik && (
        <div className="border rounded-lg p-3 space-y-2 bg-background">
          <p className="text-xs font-medium">Yeni Dönem</p>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Başlangıç *</Label>
              <Input
                type="date"
                value={form.baslangic}
                onChange={(e) => setForm((f) => ({ ...f, baslangic: e.target.value }))}
                className="h-7 w-36 text-xs"
                id={`input-donem-baslangic-${proje.id}`}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Bitiş (boş = devam ediyor)</Label>
              <Input
                type="date"
                value={form.bitis}
                onChange={(e) => setForm((f) => ({ ...f, bitis: e.target.value }))}
                className="h-7 w-36 text-xs"
                id={`input-donem-bitis-${proje.id}`}
              />
            </div>
            <div className="space-y-1 flex-1 min-w-[140px]">
              <Label className="text-[10px] text-muted-foreground">Açıklama</Label>
              <Input
                placeholder="Opsiyonel…"
                value={form.aciklama}
                onChange={(e) => setForm((f) => ({ ...f, aciklama: e.target.value }))}
                className="h-7 text-xs"
                id={`input-donem-aciklama-${proje.id}`}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs gap-1" onClick={handleEkle} disabled={isPending}>
              {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Ekle
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setFormAcik(false)}>
              İptal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Proje Tablosu
// ─────────────────────────────────────────────
interface ProjeTablosuProps {
  projeler: Proje[];
  yukleniyor: boolean;
  onDuzenle: (proje: Proje) => void;
  onArsivle: (proje: Proje) => void;
  onSil: (proje: Proje) => void;
  onAktivasyonu?: (proje: Proje) => void;
  arsiv?: boolean;
}

type ProjeSortField = "ad" | "firma";

function ProjeTablosu({
  projeler,
  yukleniyor,
  onDuzenle,
  onArsivle,
  onSil,
  onAktivasyonu,
  arsiv = false,
}: ProjeTablosuProps) {
  const COL = arsiv ? 6 : 7;
  const [acikProjeId, setAcikProjeId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState<ProjeSortField>>({ field: "ad", dir: "asc" });

  const siraliProjeler = useMemo(() => {
    if (!sort.field) return projeler;
    return [...projeler].sort((a, b) => {
      switch (sort.field) {
        case "ad": return compareValues(a.ad, b.ad, sort.dir);
        case "firma": return compareValues(a.firma_adi, b.firma_adi, sort.dir);
        default: return 0;
      }
    });
  }, [projeler, sort]);

  function handleSort(field: ProjeSortField) {
    setSort((s) => nextSort(s, field));
  }

  function toggleDonemler(projeId: string) {
    setAcikProjeId((prev) => (prev === projeId ? null : projeId));
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="text-xs bg-muted/40">
            <TableHead className="w-8">#</TableHead>
            <TableHead className="min-w-[140px]">
              <button onClick={() => handleSort("ad")} className="flex items-center hover:text-foreground transition-colors">
                Proje Adı
                {sort.field === "ad"
                  ? sort.dir === "asc" ? <span className="ml-1 text-primary text-xs">▲</span> : <span className="ml-1 text-primary text-xs">▼</span>
                  : <span className="ml-1 text-muted-foreground/50 text-xs">⇅</span>}
              </button>
            </TableHead>
            <TableHead>
              <button onClick={() => handleSort("firma")} className="flex items-center hover:text-foreground transition-colors">
                Firma
                {sort.field === "firma"
                  ? sort.dir === "asc" ? <span className="ml-1 text-primary text-xs">▲</span> : <span className="ml-1 text-primary text-xs">▼</span>
                  : <span className="ml-1 text-muted-foreground/50 text-xs">⇅</span>}
              </button>
            </TableHead>
            <TableHead>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Başlangıç
              </span>
            </TableHead>
            <TableHead>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Bitiş
              </span>
            </TableHead>
            <TableHead className="w-28 text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {yukleniyor ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: COL }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : projeler.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COL}>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                  <Building2 className="h-10 w-10 opacity-20" />
                  <p className="text-sm">
                    {arsiv ? "Arşivlenmiş proje bulunmuyor." : "Henüz aktif proje eklenmemiş."}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            siraliProjeler.map((proje, idx) => (
              <React.Fragment key={proje.id}>
                <TableRow className="text-sm hover:bg-muted/40 transition-colors">
                  <TableCell className="text-muted-foreground text-xs">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link
                        href={`/puantaj/projeler/${proje.id}`}
                        className="font-medium hover:text-primary hover:underline underline-offset-4 transition-colors w-fit"
                        id={`link-proje-detay-${proje.id}`}
                      >
                        {proje.ad}
                      </Link>
                      {proje.bolge && (
                        <span className="text-xs text-muted-foreground">{proje.bolge}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {proje.firma_adi ?? "—"}
                  </TableCell>
                  <TableCell className="tabular-nums text-xs">
                    {formatTarih(proje.baslangic_tarihi)}
                  </TableCell>
                  <TableCell className="tabular-nums text-xs text-muted-foreground">
                    {formatTarih(proje.bitis_tarihi)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => toggleDonemler(proje.id)}
                        id={`btn-donemler-${proje.id}`}
                        title="Dönem loglarını göster/gizle"
                      >
                        <History className="h-3.5 w-3.5" />
                        {acikProjeId === proje.id
                          ? <ChevronUp className="h-3 w-3" />
                          : <ChevronDown className="h-3 w-3" />}
                      </Button>
                      {!arsiv && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => onDuzenle(proje)}
                            id={`btn-proje-duzenle-${proje.id}`}
                            title="Düzenle"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-amber-600"
                            onClick={() => onArsivle(proje)}
                            id={`btn-proje-arsivle-${proje.id}`}
                            title="Arşive Al"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {arsiv && onAktivasyonu && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          onClick={() => onAktivasyonu(proje)}
                          id={`btn-proje-aktive-${proje.id}`}
                        >
                          <ArchiveRestore className="h-3.5 w-3.5" />
                          Aktive Et
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onSil(proje)}
                        id={`btn-proje-sil-${proje.id}`}
                        title="Kalıcı Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {/* Dönem Log Satırı — tam genişlik, proje satırının kardeşi */}
                {acikProjeId === proje.id && (
                  <TableRow>
                    <TableCell colSpan={COL} className="p-0">
                      <DonemLogPanel proje={proje} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ─────────────────────────────────────────────
// Ana View
// ─────────────────────────────────────────────
export function ProjelerView() {
  const { data: projeler = [], isLoading, isError } = useProjeler();
  const aktivasyon = useProjeAktivasyonu();
  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenecek, setDuzenlenecek] = useState<Proje | null>(null);
  const [arsivlenecek, setArsivlenecek] = useState<Proje | null>(null);
  const [silinecek, setSilinecek] = useState<Proje | null>(null);
  const [, startTransition] = useTransition();

  const aktifProjeler = projeler.filter((p) => p.durum === "aktif");
  const arsivProjeler = projeler.filter((p) => p.durum === "arsiv");

  function handleDuzenle(proje: Proje) {
    setDuzenlenecek(proje);
    setFormAcik(true);
  }

  function handleFormKapat() {
    setFormAcik(false);
    setDuzenlenecek(null);
  }

  function handleAktivasyon(proje: Proje) {
    startTransition(async () => {
      const sonuc = await aktivasyon.mutateAsync({ id: proje.id });
      if (sonuc?.hata) {
        toast.error(sonuc.hata);
        return;
      }
      toast.success(`"${proje.ad}" yeniden aktive edildi.`);
    });
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-16 text-destructive text-sm">
        Projeler yüklenirken bir hata oluştu.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Üst Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="gap-1">
            <FolderOpen className="h-3.5 w-3.5" />
            {aktifProjeler.length} Aktif
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <FolderCheck className="h-3.5 w-3.5" />
            {arsivProjeler.length} Arşiv
          </Badge>
        </div>
        <Button
          id="btn-proje-ekle"
          onClick={() => {
            setDuzenlenecek(null);
            setFormAcik(true);
          }}
          size="sm"
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Proje Ekle
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="aktif" id="tabs-projeler">
        <TabsList>
          <TabsTrigger value="aktif" id="tab-trigger-aktif">
            Aktif ({aktifProjeler.length})
          </TabsTrigger>
          <TabsTrigger value="arsiv" id="tab-trigger-arsiv">
            Arşiv ({arsivProjeler.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aktif" className="mt-4">
          <ProjeTablosu
            projeler={aktifProjeler}
            yukleniyor={isLoading}
            onDuzenle={handleDuzenle}
            onArsivle={(p) => setArsivlenecek(p)}
            onSil={(p) => setSilinecek(p)}
          />
        </TabsContent>

        <TabsContent value="arsiv" className="mt-4">
          <ProjeTablosu
            projeler={arsivProjeler}
            yukleniyor={isLoading}
            onDuzenle={handleDuzenle}
            onArsivle={(p) => setArsivlenecek(p)}
            onSil={(p) => setSilinecek(p)}
            onAktivasyonu={handleAktivasyon}
            arsiv
          />
        </TabsContent>
      </Tabs>

      {/* Dialoglar */}
      <ProjeFormDialog
        acik={formAcik}
        onKapat={handleFormKapat}
        duzenlenecekProje={duzenlenecek}
      />
      <ArsivDialog
        proje={arsivlenecek}
        onKapat={() => setArsivlenecek(null)}
      />
      <SilDialog
        proje={silinecek}
        onKapat={() => setSilinecek(null)}
      />
    </div>
  );
}
