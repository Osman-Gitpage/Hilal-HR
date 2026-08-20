"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Info, Wrench, X } from "lucide-react";

export type BroadcastMessagePayload = {
  id?: string;
  tip: "bilgi" | "uyari" | "bakim" | "guncelleme";
  baslik: string;
  mesaj: string;
  sure?: number;
  bakimModuAktif?: boolean;
  tarih?: string;
};

export function SystemNotificationListener() {
  const [aktifBakim, setAktifBakim] = useState<BroadcastMessagePayload | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("sistem_duyurulari")
      .on(
        "broadcast",
        { event: "CANLI_UYARI" },
        ({ payload }: { payload: BroadcastMessagePayload }) => {
          if (!payload) return;

          const sure = payload.sure ?? 12000;

          // Bakım modu tetiklendiyse üst barı aktif et
          if (payload.bakimModuAktif) {
            setAktifBakim(payload);
          } else if (payload.tip !== "bakim") {
            // Eğer bakım modu kapandıysa banner'ı temizle
            setAktifBakim(null);
          }

          // Bildirim tiplerine göre ikon ve toast stili
          if (payload.tip === "bakim") {
            toast.error(payload.baslik, {
              description: payload.mesaj,
              icon: <Wrench className="h-5 w-5 text-amber-500" />,
              duration: sure,
            });
          } else if (payload.tip === "uyari") {
            toast.warning(payload.baslik, {
              description: payload.mesaj,
              icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
              duration: sure,
            });
          } else if (payload.tip === "guncelleme") {
            toast.info(payload.baslik, {
              description: payload.mesaj,
              icon: <Info className="h-5 w-5 text-blue-500" />,
              duration: sure,
            });
          } else {
            toast(payload.baslik, {
              description: payload.mesaj,
              duration: sure,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!aktifBakim) return null;

  return (
    <div className="bg-amber-600 dark:bg-amber-700 text-white px-4 py-2.5 text-sm flex items-center justify-between shadow-md relative z-50 transition-all animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5 font-medium min-w-0">
        <Wrench className="h-4 w-4 shrink-0 animate-bounce text-amber-200" />
        <span className="truncate">
          <strong className="font-semibold">{aktifBakim.baslik}:</strong> {aktifBakim.mesaj}
        </span>
      </div>
      <button
        onClick={() => setAktifBakim(null)}
        className="p-1 hover:bg-amber-700 dark:hover:bg-amber-800 rounded text-white/80 hover:text-white transition-colors shrink-0 ml-2"
        aria-label="Kapat"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
