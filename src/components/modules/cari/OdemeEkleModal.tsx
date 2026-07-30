"use client";

import * as React from "react";
import { toast } from "sonner";
import { CreditCard, Loader2, X } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useOdemeEkle } from "@/hooks/useCari";
import { bugunYYYYMMDD } from "@/lib/cari";
import type { ParaBirimi, OdemeYontem, OdemePayload } from "@/types/cari";

interface OdemeEkleModalProps {
  belgeId: string;
  kalanTutar: number;
  belgePb: ParaBirimi;
  acik: boolean;
  onKapat: () => void;
}

export function OdemeEkleModal({
  belgeId,
  kalanTutar,
  belgePb,
  acik,
  onKapat,
}: OdemeEkleModalProps) {
  const { mutateAsync: odemeEkle, isPending } = useOdemeEkle();

  const [tarih, setTarih] = React.useState(bugunYYYYMMDD());
  // kalanTutar TL cinsinden gelir; TRY belgeler için doğrudan kullan,
  // dövizli belgeler için kullanıcı kendi tutarını girsin (TL karışıklığını önler)
  const [tutar, setTutar] = React.useState(
    belgePb === "TRY" ? kalanTutar.toFixed(2) : ""
  );
  const [paraBirimi, setParaBirimi] = React.useState<ParaBirimi>(belgePb);
  const [kur, setKur] = React.useState("1");
  const [yontem, setYontem] = React.useState<OdemeYontem>("banka");
  const [aciklama, setAciklama] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedTutar = parseFloat(tutar);
    if (!parsedTutar || parsedTutar <= 0) {
      toast.error("Geçerli bir tutar giriniz.");
      return;
    }

    const payload: OdemePayload = {
      belge_id: belgeId,
      tarih,
      tutar: parsedTutar,
      para_birimi: paraBirimi,
      kur: parseFloat(kur) || 1,
      yontem,
      aciklama: aciklama.trim() || null,
    };

    const sonuc = await odemeEkle(payload);
    if (!sonuc.basarili) {
      toast.error(`Hata: ${sonuc.hata}`);
      return;
    }

    toast.success("Ödeme eklendi.");
    onKapat();
  };

  return (
    <Dialog open={acik} onOpenChange={(o) => !o && onKapat()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Ödeme Ekle
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tarih + Yöntem */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="odeme-tarih" className="text-xs font-semibold">Tarih</Label>
              <Input
                id="odeme-tarih"
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="odeme-yontem" className="text-xs font-semibold">Yöntem</Label>
              <Select value={yontem} onValueChange={(v) => setYontem(v as OdemeYontem)}>
                <SelectTrigger id="odeme-yontem" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banka">Banka</SelectItem>
                  <SelectItem value="elden">Elden</SelectItem>
                  <SelectItem value="cek">Çek</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tutar + PB + Kur */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 space-y-1.5">
              <Label htmlFor="odeme-pb" className="text-xs font-semibold">Para Birimi</Label>
              <Select value={paraBirimi} onValueChange={(v) => setParaBirimi(v as ParaBirimi)}>
                <SelectTrigger id="odeme-pb" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 space-y-1.5">
              <Label htmlFor="odeme-tutar" className="text-xs font-semibold">Tutar</Label>
              <Input
                id="odeme-tutar"
                type="number"
                min="0.01"
                step="0.01"
                value={tutar}
                onChange={(e) => setTutar(e.target.value)}
                required
                className="h-9 text-sm text-right tabular-nums"
              />
            </div>
            <div className="col-span-1 space-y-1.5">
              <Label htmlFor="odeme-kur" className="text-xs font-semibold">
                Kur <span className="text-muted-foreground/60 font-normal text-[10px]">TL</span>
              </Label>
              <Input
                id="odeme-kur"
                type="number"
                min="0.0001"
                step="0.0001"
                value={kur}
                onChange={(e) => setKur(e.target.value)}
                className="h-9 text-sm text-right tabular-nums"
              />
            </div>
          </div>

          {/* Açıklama */}
          <div className="space-y-1.5">
            <Label htmlFor="odeme-aciklama" className="text-xs font-semibold">
              Açıklama <span className="text-muted-foreground/60 font-normal">(isteğe bağlı)</span>
            </Label>
            <Textarea
              id="odeme-aciklama"
              placeholder="Dekont no, açıklama…"
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              className="text-sm resize-none h-16"
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
                <CreditCard className="h-3.5 w-3.5" />
              )}
              {isPending ? "Kaydediliyor…" : "Ödemeyi Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
