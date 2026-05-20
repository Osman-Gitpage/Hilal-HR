"use client";

import { useState, useTransition } from "react";
import {
  Building2, Plus, Pencil, Trash2, Loader2, Phone, Mail, MapPin, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFirmaList, useInvalidateCari } from "@/hooks/useCari";
import { firmaEkle, firmaGuncelle, firmaSil } from "@/app/actions/cari";

// ─────────────────────────────────────────────
// Firma Formu (ekle / düzenle)
// ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FirmaFormDialog({
  firma,
  open,
  onClose,
}: {
  firma?: any;
  open: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { invalidateFirmaList, invalidateGemiList } = useInvalidateCari();
  const duzenleme = !!firma;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      ad: (fd.get("ad") as string).trim(),
      vergi_no: (fd.get("vergi_no") as string).trim() || null,
      adres: (fd.get("adres") as string).trim() || null,
      telefon: (fd.get("telefon") as string).trim() || null,
      email: (fd.get("email") as string).trim() || null,
      notlar: (fd.get("notlar") as string).trim() || null,
    };

    startTransition(async () => {
      const res = duzenleme
        ? await firmaGuncelle(firma.id, payload)
        : await firmaEkle(payload);

      if (res?.hata) { toast.error(res.hata); return; }
      toast.success(duzenleme ? "Firma güncellendi." : "Firma eklendi.");
      invalidateFirmaList();
      invalidateGemiList();
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" id="dialog-firma-form">
        <DialogHeader>
          <DialogTitle>{duzenleme ? "Firma Düzenle" : "Yeni Firma Ekle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="firma-ad">Firma Adı *</Label>
              <Input
                id="firma-ad"
                name="ad"
                required
                defaultValue={firma?.ad}
                disabled={isPending}
                placeholder="ör. ABC Denizcilik A.Ş."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="firma-vergi">Vergi No</Label>
              <Input
                id="firma-vergi"
                name="vergi_no"
                defaultValue={firma?.vergi_no}
                disabled={isPending}
                placeholder="1234567890"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="firma-telefon">Telefon</Label>
              <Input
                id="firma-telefon"
                name="telefon"
                defaultValue={firma?.telefon}
                disabled={isPending}
                placeholder="+90 212 000 00 00"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="firma-email">E-posta</Label>
              <Input
                id="firma-email"
                name="email"
                type="email"
                defaultValue={firma?.email}
                disabled={isPending}
                placeholder="info@firma.com"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="firma-adres">Adres</Label>
              <Textarea
                id="firma-adres"
                name="adres"
                rows={2}
                defaultValue={firma?.adres}
                disabled={isPending}
                placeholder="Tam adres..."
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="firma-notlar">Notlar</Label>
              <Textarea
                id="firma-notlar"
                name="notlar"
                rows={2}
                defaultValue={firma?.notlar}
                disabled={isPending}
                placeholder="İsteğe bağlı..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              İptal
            </Button>
            <Button type="submit" disabled={isPending} id="btn-firma-kaydet">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {duzenleme ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Ana View
// ─────────────────────────────────────────────
export function FirmaYonetimView() {
  const [formAcik, setFormAcik] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [duzenle, setDuzenle] = useState<any | null>(null);
  const [silId, setSilId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data: firmalar = [], isLoading } = useFirmaList();
  const { invalidateFirmaList, invalidateGemiList } = useInvalidateCari();

  function handleSil() {
    if (!silId) return;
    startTransition(async () => {
      const res = await firmaSil(silId);
      if (res?.hata) toast.error(res.hata);
      else {
        toast.success("Firma silindi.");
        invalidateFirmaList();
        invalidateGemiList();
      }
      setSilId(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Firma Yönetimi</h1>
          <p className="text-muted-foreground mt-1">
            Gemilere bağlı armatör ve acente firmalar.
          </p>
        </div>
        <Button id="btn-firma-ekle" onClick={() => { setDuzenle(null); setFormAcik(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Firma Ekle
        </Button>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : firmalar.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 gap-3">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Henüz firma kaydı yok.</p>
          <Button variant="outline" onClick={() => setFormAcik(true)}>Firma Ekle</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(firmalar as any[]).map((f: any) => (
            <Card key={f.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-blue-600 p-1.5">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-base">{f.ad}</CardTitle>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      id={`btn-firma-duzenle-${f.id}`}
                      onClick={() => { setDuzenle(f); setFormAcik(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      id={`btn-firma-sil-${f.id}`}
                      onClick={() => setSilId(f.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm text-muted-foreground">
                {f.vergi_no && (
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-mono">{f.vergi_no}</span>
                  </div>
                )}
                {f.telefon && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {f.telefon}
                  </div>
                )}
                {f.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {f.email}
                  </div>
                )}
                {f.adres && (
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{f.adres}</span>
                  </div>
                )}
                {!f.vergi_no && !f.telefon && !f.email && !f.adres && (
                  <Badge variant="secondary" className="text-xs">Bilgi girilmemiş</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <FirmaFormDialog
        firma={duzenle}
        open={formAcik}
        onClose={() => { setFormAcik(false); setDuzenle(null); }}
      />

      {/* Sil Onay */}
      <AlertDialog open={!!silId} onOpenChange={() => setSilId(null)}>
        <AlertDialogContent id="dialog-firma-sil">
          <AlertDialogHeader>
            <AlertDialogTitle>Firma silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Firmaya bağlı gemilerdeki firma bilgisi kaldırılacak, gemiler silinmeyecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>İptal</AlertDialogCancel>
            <AlertDialogAction
              id="btn-firma-sil-onayla"
              onClick={handleSil}
              disabled={isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
