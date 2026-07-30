"use client";

import * as React from "react";
import { toast } from "sonner";
import { CreditCard, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { useTopluOdemeEkle } from "@/hooks/useCari";
import { paraFormat, bugunYYYYMMDD } from "@/lib/cari";
import type { BelgeListItem, ParaBirimi, OdemeYontem, TopluOdemePayload } from "@/types/cari";

interface TopluOdemeModalProps {
  belgeler: BelgeListItem[];
  acik: boolean;
  onKapat: () => void;
}

export function TopluOdemeModal({ belgeler, acik, onKapat }: TopluOdemeModalProps) {
  const { mutateAsync: topluOdeme, isPending } = useTopluOdemeEkle();

  // Ortak alanlar
  const [tarih, setTarih] = React.useState(bugunYYYYMMDD());
  const [paraBirimi, setParaBirimi] = React.useState<ParaBirimi>("TRY");
  const [kur, setKur] = React.useState("1");
  const [yontem, setYontem] = React.useState<OdemeYontem>("banka");
  const [aciklama, setAciklama] = React.useState("");

  // Her belge için ayrı tutar
  const [tutarlar, setTutarlar] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(belgeler.map((b) => [b.id, b.kalan.toFixed(2)]))
  );

  // Tümüne kalan tutarı uygula
  const tumunuUygula = () => {
    setTutarlar(Object.fromEntries(belgeler.map((b) => [b.id, b.kalan.toFixed(2)])));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const kalemler = belgeler
      .map((b) => ({
        belge_id: b.id,
        tutar: parseFloat(tutarlar[b.id] || "0"),
      }))
      .filter((k) => k.tutar > 0);

    if (kalemler.length === 0) {
      toast.error("En az bir belge için tutar giriniz.");
      return;
    }

    const payload: TopluOdemePayload = {
      tarih,
      para_birimi: paraBirimi,
      kur: parseFloat(kur) || 1,
      yontem,
      aciklama: aciklama || null,
      kalemler,
    };

    const sonuc = await topluOdeme(payload);
    if (!sonuc.basarili) {
      toast.error(`Hata: ${sonuc.hata}`);
      return;
    }

    toast.success(`${kalemler.length} belgeye ödeme eklendi.`);
    onKapat();
  };

  return (
    <Dialog open={acik} onOpenChange={(o) => !o && onKapat()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Toplu Ödeme Ekle
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ortak alanlar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="toplu-tarih" className="text-xs font-semibold">Tarih</Label>
              <Input
                id="toplu-tarih"
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="toplu-yontem" className="text-xs font-semibold">Yöntem</Label>
              <Select value={yontem} onValueChange={(v) => setYontem(v as OdemeYontem)}>
                <SelectTrigger id="toplu-yontem" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banka">Banka</SelectItem>
                  <SelectItem value="elden">Elden</SelectItem>
                  <SelectItem value="cek">Çek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="toplu-pb" className="text-xs font-semibold">Para Birimi</Label>
              <Select value={paraBirimi} onValueChange={(v) => setParaBirimi(v as ParaBirimi)}>
                <SelectTrigger id="toplu-pb" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY — Türk Lirası</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                  <SelectItem value="USD">USD — Dolar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="toplu-kur" className="text-xs font-semibold">
                Kur <span className="text-muted-foreground/60 font-normal">(TL karşılığı)</span>
              </Label>
              <Input
                id="toplu-kur"
                type="number"
                min="0.0001"
                step="0.0001"
                value={kur}
                onChange={(e) => setKur(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="toplu-aciklama" className="text-xs font-semibold">Açıklama</Label>
            <Input
              id="toplu-aciklama"
              placeholder="İsteğe bağlı…"
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Belge tutarları */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Belge Tutarları</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={tumunuUygula}
                className="text-xs h-7 text-primary"
              >
                Tümüne Kalan Tutarı Uygula
              </Button>
            </div>

            <div className="divide-y divide-border rounded-xl border overflow-hidden">
              {belgeler.map((belge) => (
                <div key={belge.id} className="flex items-center gap-3 px-3 py-2.5 bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold font-mono">{belge.belge_no}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{belge.aciklama}</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                      Kalan: {paraFormat(belge.kalan, belge.para_birimi)}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tutarlar[belge.id] ?? ""}
                    onChange={(e) =>
                      setTutarlar((prev) => ({ ...prev, [belge.id]: e.target.value }))
                    }
                    className="w-28 h-8 text-sm text-right tabular-nums"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
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
              {isPending ? "Kaydediliyor…" : `${belgeler.length} Belgeye Öde`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
