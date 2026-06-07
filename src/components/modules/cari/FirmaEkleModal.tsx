"use client";

import * as React from "react";
import { toast } from "sonner";
import { Building2, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { useFirmaEkle, useFirmaGuncelle } from "@/hooks/useCari";
import type { FirmaListItem } from "@/types/cari";

// ─── Yeni Firma Modal ─────────────────────────────────────────────────────────

interface FirmaEkleModalProps {
  acik: boolean;
  onKapat: () => void;
  /** Düzenleme modunda dolu gelir */
  mevcutFirma?: FirmaListItem;
}

export function FirmaEkleModal({ acik, onKapat, mevcutFirma }: FirmaEkleModalProps) {
  const duzenleme = !!mevcutFirma;
  const { mutateAsync: firmaEkle, isPending: ekleniyor } = useFirmaEkle();
  const { mutateAsync: firmaGuncelle, isPending: guncelleniyor } = useFirmaGuncelle();
  const isPending = ekleniyor || guncelleniyor;

  const [ad, setAd] = React.useState(mevcutFirma?.ad ?? "");
  const [notlar, setNotlar] = React.useState(mevcutFirma?.notlar ?? "");

  // Modal her açıldığında alanları sıfırla / doldur
  React.useEffect(() => {
    if (acik) {
      setAd(mevcutFirma?.ad ?? "");
      setNotlar(mevcutFirma?.notlar ?? "");
    }
  }, [acik, mevcutFirma]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad.trim()) { toast.error("Firma adı zorunludur."); return; }

    const payload = { ad: ad.trim(), notlar: notlar.trim() || null };

    if (duzenleme && mevcutFirma) {
      const sonuc = await firmaGuncelle({ id: mevcutFirma.id, payload });
      if (!sonuc.basarili) { toast.error(`Hata: ${sonuc.hata}`); return; }
      toast.success("Firma güncellendi.");
    } else {
      const sonuc = await firmaEkle(payload);
      if (!sonuc.basarili) { toast.error(`Hata: ${sonuc.hata}`); return; }
      toast.success("Firma eklendi.");
    }
    onKapat();
  };

  return (
    <Dialog open={acik} onOpenChange={(o) => !o && onKapat()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            {duzenleme ? "Firmayı Düzenle" : "Yeni Firma Ekle"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="firma-ad" className="text-xs font-semibold">
              Firma Adı <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firma-ad"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder="Acme Ltd."
              required
              className="h-9 text-sm"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="firma-notlar" className="text-xs font-semibold">
              Notlar{" "}
              <span className="text-muted-foreground/60 font-normal">(isteğe bağlı)</span>
            </Label>
            <Textarea
              id="firma-notlar"
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
              placeholder="Vergi numarası, iletişim, adres…"
              className="resize-none h-24 text-sm"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onKapat} disabled={isPending}>
              İptal
            </Button>
            <Button type="submit" disabled={isPending} className="gap-1.5">
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Building2 className="h-3.5 w-3.5" />
              )}
              {isPending ? "Kaydediliyor…" : duzenleme ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
