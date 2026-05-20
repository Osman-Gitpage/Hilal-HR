"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { gemiEkle } from "@/app/actions/cari";
import { useInvalidateCari } from "@/hooks/useCari";
import { useFirmaList } from "@/hooks/useCari";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function GemiEkleModal({ open, onClose }: Props) {
  const [firmaId, setFirmaId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const { invalidateGemiList, invalidateKpi } = useInvalidateCari();
  const { data: firmalar = [] } = useFirmaList();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ad = (fd.get("ad") as string).trim();
    const imo_no = (fd.get("imo_no") as string).trim() || null;
    const notlar = (fd.get("notlar") as string).trim() || null;

    startTransition(async () => {
      const res = await gemiEkle({
        ad,
        imo_no,
        notlar,
        firma_id: firmaId || null,
      });
      if (res?.hata) {
        toast.error(res.hata);
        return;
      }
      toast.success("Gemi eklendi.");
      invalidateGemiList();
      invalidateKpi();
      setFirmaId("");
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" id="dialog-gemi-ekle">
        <DialogHeader>
          <DialogTitle>Yeni Gemi Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="gemi-ad">Gemi Adı *</Label>
            <Input
              id="gemi-ad"
              name="ad"
              placeholder="ör. MV HILAL"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gemi-imo">IMO Numarası</Label>
            <Input
              id="gemi-imo"
              name="imo_no"
              placeholder="ör. IMO 1234567"
              disabled={isPending}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ait Olduğu Firma</Label>
            <Select
              value={firmaId || undefined}
              onValueChange={(v) => setFirmaId(v ?? "")}
            >
              <SelectTrigger id="gemi-firma">
                <SelectValue placeholder={
                  firmalar.length
                    ? "Firma seçin (opsiyonel)"
                    : "Önce firma ekleyin"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">— Firma yok —</SelectItem>
                {firmalar.map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {f.ad}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gemi-notlar">Notlar</Label>
            <Textarea
              id="gemi-notlar"
              name="notlar"
              placeholder="İsteğe bağlı..."
              rows={3}
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              İptal
            </Button>
            <Button type="submit" disabled={isPending} id="btn-gemi-ekle-kaydet">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
