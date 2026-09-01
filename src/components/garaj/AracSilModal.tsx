"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Arac } from "./types";
import { aracSilAction } from "@/app/actions/garaj";
import { toast } from "sonner";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AracSilModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arac: Arac | null;
  onSilindi?: () => void;
}

export function AracSilModal({
  open,
  onOpenChange,
  arac,
  onSilindi,
}: AracSilModalProps) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const router = useRouter();

  if (!arac) return null;

  const handleSil = async () => {
    setYukleniyor(true);
    const res = await aracSilAction(arac.id);
    setYukleniyor(false);

    if (res.basarili) {
      toast.success(`${arac.marka} ${arac.model} (${arac.plaka}) filodan silindi.`);
      onOpenChange(false);
      if (onSilindi) onSilindi();
      router.refresh();
    } else {
      toast.error(res.hata || "Araç silinemedi.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[94vw] sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Aracı Filodan Sil
            </DialogTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {arac.marka} {arac.model} ({arac.plaka})
              </span>{" "}
              aracını filodan kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-2">
          <Button
            type="button"
            variant="outline"
            disabled={yukleniyor}
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs h-9 px-4"
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={yukleniyor}
            onClick={handleSil}
            className="rounded-xl text-xs h-9 px-5 gap-1.5 font-semibold bg-red-600 hover:bg-red-700 text-white"
          >
            {yukleniyor ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Evet, Aracı Sil
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
