"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { odemeEkle } from "@/app/actions/cari";
import { useInvalidateCari } from "@/hooks/useCari";
import type { ParaBirimi } from "@/types";

interface Props {
  belgeId: string | null;
  gemiId?: string | null;
  /** Belgenin kendi para birimi — çapraz kur tespiti için */
  belgePb?: ParaBirimi;
  onClose: () => void;
}

export function OdemeEkleModal({ belgeId, gemiId, belgePb, onClose }: Props) {
  const [pb, setPb] = useState<ParaBirimi>(belgePb ?? "USD");
  const [yontem, setYontem] = useState<"banka" | "elden">("banka");
  const [kur, setKur] = useState<string>("");
  const [tutar, setTutar] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const {
    invalidateBelgeList, invalidateOdemeList, invalidateKpi, invalidateGenel, invalidateTumBelgeList,
  } = useInvalidateCari();

  // belgePb değişince ödeme pb'yi sıfırla
  useEffect(() => {
    if (belgePb) setPb(belgePb);
  }, [belgePb]);

  // Çapraz kur gerekiyor mu?
  const kurGerekli = belgePb && pb !== belgePb;

  // Canlı baz_tutar önizleme
  const bazTutarOnizleme =
    kurGerekli && Number(kur) > 0 && Number(tutar) > 0
      ? Math.round(Number(tutar) * Number(kur) * 100) / 100
      : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!belgeId) return;
    const fd = new FormData(e.currentTarget);
    const tutarVal = Number(tutar);
    const tarih = fd.get("tarih") as string;
    const aciklama = (fd.get("aciklama") as string).trim() || null;
    const kurVal = kur ? Number(kur) : null;

    if (kurGerekli && (!kurVal || kurVal <= 0)) {
      toast.error("Farklı para birimi seçildi — kur girilmesi zorunludur.");
      return;
    }

    const bazTutar = kurGerekli && kurVal ? Math.round(tutarVal * kurVal * 100) / 100 : null;

    startTransition(async () => {
      const res = await odemeEkle({
        belge_id: belgeId,
        gemi_id: gemiId ?? null,
        tarih,
        tutar: tutarVal,
        para_birimi: pb,
        yontem,
        kur: kurVal,
        baz_tutar: bazTutar,
        baz_para_birimi: kurGerekli ? belgePb : null,
        aciklama,
      });
      if (res?.hata) {
        toast.error(res.hata);
        return;
      }
      toast.success("Ödeme kaydedildi.");
      invalidateOdemeList(belgeId);
      if (gemiId) invalidateBelgeList(gemiId);
      invalidateTumBelgeList();
      invalidateKpi();
      invalidateGenel();
      onClose();
    });
  }

  return (
    <Dialog open={!!belgeId} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" id="dialog-odeme-ekle">
        <DialogHeader>
          <DialogTitle>Ödeme Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="odeme-tarih">Tarih *</Label>
              <Input
                id="odeme-tarih"
                name="tarih"
                type="date"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ödeme Para Birimi</Label>
              <Select
                value={pb}
                onValueChange={(v) => { if (v) { setPb(v as ParaBirimi); setKur(""); } }}
              >
                <SelectTrigger id="odeme-pb">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY ₺</SelectItem>
                  <SelectItem value="EUR">EUR €</SelectItem>
                  <SelectItem value="USD">USD $</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="odeme-tutar">Tutar ({pb}) *</Label>
              <Input
                id="odeme-tutar"
                name="tutar"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={tutar}
                onChange={(e) => setTutar(e.target.value)}
                disabled={isPending}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ödeme Yöntemi</Label>
              <Select
                value={yontem}
                onValueChange={(v) => { if (v) setYontem(v as "banka" | "elden"); }}
              >
                <SelectTrigger id="odeme-yontem">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banka">Banka</SelectItem>
                  <SelectItem value="elden">Elden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Kur — sadece çapraz ödeme durumunda göster */}
          {kurGerekli && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 space-y-3">
              <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="text-xs">
                  Belge <strong>{belgePb}</strong> cinsinden, ancak ödeme{" "}
                  <strong>{pb}</strong> olarak girildi. Dönüşüm kuru giriniz.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="odeme-kur">
                  1 {pb} = ? {belgePb} (Kur) *
                </Label>
                <Input
                  id="odeme-kur"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  placeholder={`ör. ${belgePb === "TRY" ? "50.00" : "1.08"}`}
                  value={kur}
                  onChange={(e) => setKur(e.target.value)}
                  disabled={isPending}
                  className="font-mono"
                  required
                />
              </div>
              {bazTutarOnizleme != null && (
                <p className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-400">
                  = {belgePb} {bazTutarOnizleme.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  <span className="text-muted-foreground font-normal ml-1">({tutar} × {kur})</span>
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="odeme-aciklama">Açıklama</Label>
            <Textarea
              id="odeme-aciklama"
              name="aciklama"
              rows={2}
              placeholder="İsteğe bağlı..."
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              İptal
            </Button>
            <Button type="submit" disabled={isPending} id="btn-odeme-kaydet">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
