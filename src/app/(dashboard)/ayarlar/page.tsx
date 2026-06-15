import type { Metadata } from "next";
import { Suspense } from "react";
import { ayarlariGetir } from "@/app/actions/ayarlar";
import { AyarlarView } from "@/components/modules/ayarlar/AyarlarView";
import { AyarlarTabs } from "@/components/modules/ayarlar/AyarlarTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { VARSAYILAN_AYLIK_CALISMA_SAATI, VARSAYILAN_GUNLUK_CALISMA_SAATI } from "@/lib/constants";

export const metadata: Metadata = { title: "Ayarlar" };

async function AyarlarIcerik() {
  let ayarlar;
  try {
    ayarlar = await ayarlariGetir();
  } catch {
    // Hata durumunda varsayılanları kullan
    ayarlar = {
      gunluk_calisma_saati: VARSAYILAN_GUNLUK_CALISMA_SAATI,
      aylik_calisma_saati: VARSAYILAN_AYLIK_CALISMA_SAATI,
    };
  }

  return (
    <AyarlarTabs
      genelAyarlar={
        <AyarlarView
          gunlukSaat={Number(ayarlar.gunluk_calisma_saati)}
          aylikSaat={Number(ayarlar.aylik_calisma_saati)}
        />
      }
    />
  );
}

export default function AyarlarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted-foreground mt-1">
          Şirket ayarları, maaş hesaplama parametreleri ve evrak kategorileri.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="max-w-2xl space-y-4">
            <Skeleton className="h-10 w-72 rounded-lg" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        }
      >
        <AyarlarIcerik />
      </Suspense>
    </div>
  );
}

