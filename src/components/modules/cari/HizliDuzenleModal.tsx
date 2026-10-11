"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  FileText,
  Ship,
  Building2,
  Calendar,
  Hash,
  Loader2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useBelgeGuncelle, useFirmaList } from "@/hooks/useCari";
import type { BelgeListItem } from "@/types/cari";

interface HizliDuzenleModalProps {
  belge: BelgeListItem | null;
  acik: boolean;
  onKapat: () => void;
}

export function HizliDuzenleModal({
  belge,
  acik,
  onKapat,
}: HizliDuzenleModalProps) {
  const { mutateAsync: belgeGuncelle, isPending } = useBelgeGuncelle();
  const { data: firmalar = [], isLoading: firmaYukleniyor } = useFirmaList();

  const [belgeNo, setBelgeNo] = React.useState("");
  const [tarih, setTarih] = React.useState("");
  const [firmaId, setFirmaId] = React.useState<string>("yok");
  const [gemiAdi, setGemiAdi] = React.useState("");
  const [aciklama, setAciklama] = React.useState("");

  // Modal açıldığında veya seçili belge değiştiğinde form state'ini güncelle
  React.useEffect(() => {
    if (belge && acik) {
      setBelgeNo(belge.belge_no ?? "");
      setTarih(belge.tarih ?? "");
      setFirmaId(belge.firma_id ?? "yok");
      setGemiAdi(belge.gemi_adi ?? "");
      setAciklama(belge.aciklama ?? "");
    }
  }, [belge, acik]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!belge) return;

    if (!belgeNo.trim()) {
      toast.error("Belge numarası boş bırakılamaz.");
      return;
    }
    if (!tarih) {
      toast.error("Tarih boş bırakılamaz.");
      return;
    }
    if (!aciklama.trim()) {
      toast.error("Açıklama boş bırakılamaz.");
      return;
    }

    try {
      const payload = {
        belge_no: belgeNo.trim(),
        tarih,
        firma_id: firmaId !== "yok" ? firmaId : null,
        gemi_adi: gemiAdi.trim() || null,
        aciklama: aciklama.trim(),
      };

      const sonuc = await belgeGuncelle({
        id: belge.id,
        payload,
      });

      if (!sonuc.basarili) {
        toast.error(`Hata: ${sonuc.hata}`);
        return;
      }

      toast.success("Belge bilgileri başarıyla güncellendi.");
      onKapat();
    } catch (err) {
      toast.error("Güncelleme sırasında beklenmeyen bir hata oluştu.");
    }
  };

  return (
    <Dialog open={acik} onOpenChange={(open) => { if (!open) onKapat(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Hızlı Düzenle</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Sadece temel belge bilgilerini güncelleyin. Tutar ve bakiye değişmez.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1">
          {/* Belge No & Tarih */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                Belge No
                <span className="text-destructive">*</span>
              </Label>
              <Input
                value={belgeNo}
                onChange={(e) => setBelgeNo(e.target.value)}
                placeholder="Örn: FAT-2026-001"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Tarih
                <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={tarih}
                onChange={(e) => setTarih(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Firma */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              Firma
            </Label>
            <Select value={firmaId} onValueChange={(v) => setFirmaId(v ?? "yok")}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Firma seçin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yok">
                  <span className="text-muted-foreground">Firma seçilmedi</span>
                </SelectItem>
                {firmaYukleniyor ? (
                  <SelectItem value="__loading" disabled>Yükleniyor...</SelectItem>
                ) : (
                  firmalar.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.ad}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Gemi */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Ship className="h-3.5 w-3.5 text-muted-foreground" />
              Gemi Adı
            </Label>
            <Input
              value={gemiAdi}
              onChange={(e) => setGemiAdi(e.target.value)}
              placeholder="Örn: M/V Anadolu"
              className="h-9 text-xs"
            />
          </div>

          {/* Açıklama */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Açıklama
              <span className="text-destructive">*</span>
            </Label>
            <Input
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="Belge açıklaması..."
              required
              className="h-9 text-xs"
            />
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onKapat}
              disabled={isPending}
              className="h-8 text-xs"
            >
              İptal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-8 text-xs gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
