"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useIlgiliKisiList, useInvalidateCari } from "@/hooks/useCari";
import { ilgiliKisiEkle, ilgiliKisiSil } from "@/app/actions/cari";

export function IlgiliKisiPanel({ gemiId }: { gemiId: string }) {
  const [ekleAcik, setEkleAcik] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { data: kisiler = [], isLoading } = useIlgiliKisiList(gemiId);
  const { invalidateGemiDetay } = useInvalidateCari();

  function handleEkle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await ilgiliKisiEkle({
        gemi_id: gemiId,
        ad: (fd.get("ad") as string).trim(),
        iletisim: (fd.get("iletisim") as string).trim() || null,
      });
      if (res?.hata) toast.error(res.hata);
      else {
        toast.success("İlgili kişi eklendi.");
        invalidateGemiDetay(gemiId);
        setEkleAcik(false);
      }
    });
  }

  function handleSil(kisiId: string) {
    startTransition(async () => {
      const res = await ilgiliKisiSil(kisiId, gemiId);
      if (res?.hata) toast.error(res.hata);
      else {
        toast.success("Kişi silindi.");
        invalidateGemiDetay(gemiId);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          İlgili Kişiler
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          id="btn-kisi-ekle"
          onClick={() => setEkleAcik(true)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))
        ) : kisiler.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-3">
            Kişi eklenmemiş.
          </p>
        ) : (
          kisiler.map((k: any) => (
            <div
              key={k.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{k.ad}</p>
                {k.iletisim && (
                  <p className="text-xs text-muted-foreground">{k.iletisim}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => handleSil(k.id)}
                disabled={isPending}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={ekleAcik} onOpenChange={setEkleAcik}>
        <DialogContent className="sm:max-w-sm" id="dialog-kisi-ekle">
          <DialogHeader>
            <DialogTitle>İlgili Kişi Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEkle} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="kisi-ad">Ad Soyad *</Label>
              <Input id="kisi-ad" name="ad" required disabled={isPending} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kisi-iletisim">İletişim</Label>
              <Input
                id="kisi-iletisim"
                name="iletisim"
                placeholder="E-posta veya telefon"
                disabled={isPending}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEkleAcik(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={isPending} id="btn-kisi-kaydet">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
